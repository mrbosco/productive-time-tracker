import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import { buildService, renderHookWithProviders, testSession, waitFor } from '@/__tests__/test-utils';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import type { TimeEntry } from '@/api/types';
import { server } from '@/mocks/node';
import { useUpdateTimeEntry } from './useUpdateTimeEntry';

const ENTRY_ID = '162903873';
/** Any other row on the same day: what the rollback must not touch. */
const OTHER_ENTRY_ID = '162903874';
const DATE = '2026-09-17';

function buildEntry(overrides: Partial<TimeEntry>): TimeEntry {
	return {
		id: ENTRY_ID,
		date: DATE,
		minutes: 60,
		note: null,
		draft: false,
		serviceId: '16887825',
		service: buildService(),
		createdAt: '2026-09-17T16:08:26.527+02:00',
		...overrides,
	};
}

describe('useUpdateTimeEntry', () => {
	/**
	 * Only changed attributes go out, so a duration-only edit sends a duration and nothing else -
	 * not the date and note it was loaded with, dressed up as edits, and never a `service`
	 * relationship, which would silently move an entry logged against something else.
	 */
	it('patches only what changed, and never the service', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const { result } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));

		await result.current.mutateAsync({
			id: ENTRY_ID,
			previousDate: DATE,
			date: DATE,
			changes: { minutes: 120 },
		});

		const [, init] = fetchSpy.mock.calls.at(-1) ?? [];
		const body = JSON.parse(init?.body as string) as {
			data: { id: string; attributes: Record<string, unknown>; relationships?: unknown };
		};

		expect(init?.method).toBe('PATCH');
		expect(body.data.id).toBe(ENTRY_ID);
		expect(body.data.attributes).toEqual({ time: 120 });
		expect(body.data.relationships).toBeUndefined();
	});

	/**
	 * The edit route reads its entry from a loader, so nothing observes `['time-entry', id]` - and
	 * `invalidateQueries` only refetches what something is watching. Invalidating here left the entry
	 * in the cache young enough for the next open to be handed it, and saving that form reverted the
	 * edit this one had just made. Dropping the key is what stops that.
	 *
	 * `fetchQuery` on both sides because that is what the loader calls; within the client's staleness
	 * it answers from the cache, which is exactly the hand-back being guarded against.
	 */
	it('does not hand the pre-edit entry to the next open', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));

		const before = await queryClient.fetchQuery(timeEntryQueryOptions(testSession, ENTRY_ID));
		expect(before.minutes).toBe(300);

		await result.current.mutateAsync({
			id: ENTRY_ID,
			previousDate: before.date,
			date: before.date,
			changes: { minutes: 120 },
		});

		const reopened = await queryClient.fetchQuery(timeEntryQueryOptions(testSession, ENTRY_ID));

		expect(reopened.minutes).toBe(120);
	});

	/**
	 * The optimistic path, and the reason its rollback is one entry rather than the week it snapshot:
	 * a delete that lands while a failing PATCH is in flight must not be undone by that PATCH's
	 * rollback. The week is written directly here - what is under test is the cache arithmetic, not
	 * how the row got there.
	 */
	it('rolls back only the entry it changed when the edit fails', async () => {
		/* Held open rather than answered at once: the PATCH has to still be in flight while the other
		 * row is dropped, and MSW answers faster than anything could happen in between. */
		let refuse = (): void => undefined;
		const held = new Promise<void>((resolve) => {
			refuse = resolve;
		});
		server.use(
			http.patch('*/time_entries/:id', async () => {
				await held;

				return new HttpResponse(null, { status: 500 });
			})
		);
		const { result, queryClient } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));
		const weekKey = weekQueryKey(testSession, DATE);
		queryClient.setQueryData<TimeEntry[]>(weekKey, [
			buildEntry({ id: ENTRY_ID, minutes: 300 }),
			buildEntry({ id: OTHER_ENTRY_ID, minutes: 60 }),
		]);

		const failing = result.current
			.mutateAsync({ id: ENTRY_ID, previousDate: DATE, date: DATE, changes: { minutes: 45 } })
			.catch((error: unknown) => error);

		await waitFor(() => {
			expect(queryClient.getQueryData<TimeEntry[]>(weekKey)?.[0].minutes).toBe(45);
		});

		// What a delete landing mid-flight does to the same array.
		queryClient.setQueryData<TimeEntry[]>(weekKey, (entries) => entries?.filter((entry) => entry.id === ENTRY_ID));
		refuse();

		expect(await failing).toBeInstanceOf(ApiError);
		// The duration is back, and the row the delete took is still gone.
		expect(queryClient.getQueryData<TimeEntry[]>(weekKey)?.map((entry) => entry.minutes)).toEqual([300]);
	});

	/**
	 * `onMutate` cancels the week fetch before it writes, and a cancel reverts rather than resumes -
	 * so a first fetch dropped there leaves nothing to finish it. Invalidating on success alone left
	 * the day behind a failed save on its skeleton, and left the duration `onError` restored sitting
	 * at an unknown age. `useDeleteTimeEntry` has settled both outcomes since it was written.
	 */
	it('makes the week readable again after a failed edit, not only a successful one', async () => {
		server.use(http.patch('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const { result, queryClient } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));
		const weekKey = weekQueryKey(testSession, DATE);
		queryClient.setQueryData<TimeEntry[]>(weekKey, [buildEntry({ id: ENTRY_ID, minutes: 300 })]);

		await result.current
			.mutateAsync({ id: ENTRY_ID, previousDate: DATE, date: DATE, changes: { minutes: 45 } })
			.catch(() => null);

		expect(queryClient.getQueryState(weekKey)?.isInvalidated).toBe(true);
	});

	it('throws when the API rejects the edit, so the form can show why', async () => {
		server.use(http.patch('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const { result } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));

		await expect(
			result.current.mutateAsync({ id: ENTRY_ID, previousDate: DATE, date: DATE, changes: { minutes: 45 } })
		).rejects.toBeInstanceOf(ApiError);
	});
});
