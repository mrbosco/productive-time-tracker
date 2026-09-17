import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import timeEntryCreate from '../../../../docs/api/samples/time-entry-create.json';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { SEEDED_DATE } from '@/mocks/handlers';
import { server } from '@/mocks/node';
import { useCopyDayForward } from './useCopyDayForward';

/** The day after the recorded one, which the mock answers empty - so it is a day to copy onto. */
const TARGET = '2026-09-16';
/** The Monday both days share, and the key X-1's week strip is cached under. */
const MONDAY = '2026-09-14';

function renderCopy() {
	return renderHookWithProviders(() => useCopyDayForward(testSession));
}

describe('useCopyDayForward', () => {
	it('copies every entry of the source day onto the target (X-3)', async () => {
		const { result } = renderCopy();

		const outcome = await result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET });

		expect(outcome).toEqual({ copied: 3, failed: 0 });
	});

	/** The copy carries the duration and the note, unlike Harvest's, which copies rows only. */
	it('carries each entry duration, note and service onto the new day', async () => {
		const bodies: { data: { attributes: Record<string, unknown> } }[] = [];
		server.use(
			http.post('*/time_entries', async ({ request }) => {
				bodies.push((await request.json()) as { data: { attributes: Record<string, unknown> } });

				return HttpResponse.json(timeEntryCreate, { status: 201 });
			})
		);
		const { result } = renderCopy();

		await result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET });

		expect(bodies).toHaveLength(3);
		// The source day's own order (A-7 sorts it by `created_at`), because the POSTs are
		// sequential - copied in parallel they would land in whatever order the network returned.
		expect(bodies.map((body) => body.data.attributes.time)).toEqual([300, 0, 0]);
		expect(bodies.every((body) => body.data.attributes.date === TARGET)).toBe(true);
	});

	/**
	 * SPEC 10 asks for "one toast with count and failures", which only means anything if a refused
	 * entry does not take the rest of the day with it.
	 */
	it('counts a refused entry and keeps going', async () => {
		let attempt = 0;
		server.use(
			http.post('*/time_entries', () => {
				attempt += 1;

				return attempt === 1
					? new HttpResponse(null, { status: 500 })
					: HttpResponse.json(timeEntryCreate, { status: 201 });
			})
		);
		const { result } = renderCopy();

		const outcome = await result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET });

		expect(outcome).toEqual({ copied: 2, failed: 1 });
	});

	/**
	 * A-1 chooses the service for a new entry, but a copy already has one. An entry that arrived
	 * without its service relationship has nothing to copy onto, and rewriting it to the default
	 * would log someone's time against work they did not do - so it is counted, not guessed at.
	 *
	 * The source is the recorded create response, whose `service` really is un-included, wrapped as
	 * a collection: that is the shape the wire produces, not one invented for the test.
	 */
	it('counts an entry with no service rather than guessing one', async () => {
		server.use(
			http.get('*/time_entries', () =>
				HttpResponse.json({
					data: [timeEntryCreate.data],
					meta: { current_page: 1, total_pages: 1, total_count: 1, page_size: 200 },
				})
			)
		);
		const { result } = renderCopy();

		const outcome = await result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET });

		expect(outcome).toEqual({ copied: 0, failed: 1 });
	});

	it('copies nothing from a day with nothing on it', async () => {
		const { result } = renderCopy();

		const outcome = await result.current.mutateAsync({ from: '2026-09-18', to: TARGET });

		expect(outcome).toEqual({ copied: 0, failed: 0 });
	});

	/** Nothing was attempted, so this is the one failure that throws rather than being counted. */
	it('throws when the source day cannot be read', async () => {
		server.use(http.get('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		const { result } = renderCopy();

		await expect(result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET })).rejects.toThrow();
	});

	/**
	 * The reason this is a mutation rather than a loop over `useCreateTimeEntry`: that hook
	 * invalidates on every success, so three entries would refetch the list three times while it
	 * was still being written to.
	 */
	it('invalidates the day and its week once, after all of them', async () => {
		const { result, queryClient } = renderCopy();
		const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

		await result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET });

		await waitFor(() => {
			expect(invalidate).toHaveBeenCalledTimes(2);
		});
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['time-entries', testSession.personId, TARGET] });
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['week-totals', testSession.personId, MONDAY] });
	});

	/** Nothing landed, so there is nothing to refetch and no reason to make the network say so. */
	it('invalidates nothing when every entry was refused', async () => {
		server.use(http.post('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		const { result, queryClient } = renderCopy();
		const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

		await result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET });

		expect(invalidate).not.toHaveBeenCalled();
	});
});
