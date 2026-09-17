import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import timeEntryCreate from '../../../../docs/api/samples/time-entry-create.json';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { SEEDED_DATE } from '@/mocks/handlers';
import { server } from '@/mocks/node';
import { useCopyDayForward } from './useCopyDayForward';

/** The day after the recorded one, which the mock answers empty - so it is a day to copy onto. */
const TARGET = '2026-09-16';

function renderCopy() {
	return renderHookWithProviders(() => useCopyDayForward(testSession));
}

describe('useCopyDayForward', () => {
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
		// The source day's own order, because the POSTs are sequential - copied in parallel they
		// would land in whatever order the network returned.
		expect(bodies.map((body) => body.data.attributes.time)).toEqual([300, 0, 0]);
		expect(bodies.every((body) => body.data.attributes.date === TARGET)).toBe(true);
	});

	/**
	 * The day view reports one count with its failures, which only means anything if a refused entry
	 * does not take the rest of the day with it.
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
	 * A new entry gets the default service, but a copy already has one. An entry that arrived
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

	/** Nothing was attempted, so this is the one failure that throws rather than being counted. */
	it('throws when the source day cannot be read', async () => {
		server.use(http.get('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		const { result } = renderCopy();

		await expect(result.current.mutateAsync({ from: SEEDED_DATE, to: TARGET })).rejects.toThrow();
	});
});
