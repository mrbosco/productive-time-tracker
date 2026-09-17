import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { useUpdateTimeEntry } from './useUpdateTimeEntry';

const ENTRY_ID = '162903873';
/** A Thursday, and the Monday its week is cached under. */
const DATE = '2026-09-17';
const MONDAY = '2026-09-14';
/** The Tuesday of the following week, so moving here crosses a week boundary too. */
const MOVED_DATE = '2026-09-22';
const MOVED_MONDAY = '2026-09-21';

function dayKey(date: string) {
	return ['time-entries', testSession.personId, date];
}

function weekKey(monday: string) {
	return ['week-entries', testSession.personId, monday];
}

describe('useUpdateTimeEntry', () => {
	/**
	 * A-1: edit keeps the entry's existing service. The body must carry the three attributes this
	 * form owns and no `service` relationship at all - sending the default service would silently
	 * move an entry logged against something else.
	 */
	/**
	 * SPEC 4.1 is "Only changed attributes", so a duration-only edit sends a duration and nothing
	 * else - not the date and note it was loaded with, dressed up as edits.
	 */
	it('patches only what changed, and never the service (SPEC 4.1, A-1)', async () => {
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
	 * SPEC 4.2: "cache invalidated ... for that date (and the old date if the date was changed on
	 * edit)". X-1's week strip doubles that again - an entry that moved across a week boundary is
	 * counted in two weeks until both Mondays refetch.
	 */
	it('leaves both the day it left and the day it landed on needing a refetch', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));

		// Seeded so "stale afterwards" is a change rather than the state they were already in.
		for (const key of [dayKey(DATE), dayKey(MOVED_DATE)]) queryClient.setQueryData(key, []);
		for (const key of [weekKey(MONDAY), weekKey(MOVED_MONDAY)]) queryClient.setQueryData(key, {});

		await result.current.mutateAsync({
			id: ENTRY_ID,
			previousDate: DATE,
			date: MOVED_DATE,
			changes: { date: MOVED_DATE },
		});

		await waitFor(() => {
			expect(queryClient.getQueryState(dayKey(DATE))?.isInvalidated).toBe(true);
		});
		expect(queryClient.getQueryState(dayKey(MOVED_DATE))?.isInvalidated).toBe(true);
		expect(queryClient.getQueryState(weekKey(MONDAY))?.isInvalidated).toBe(true);
		expect(queryClient.getQueryState(weekKey(MOVED_MONDAY))?.isInvalidated).toBe(true);
	});

	/**
	 * The ordinary edit - a duration fixed, the date untouched - must still cost what the create
	 * costs. Deduplicating here is what keeps the common case from refetching the same day twice.
	 */
	it('asks for one day and one week when the date did not move', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));
		const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

		await result.current.mutateAsync({ id: ENTRY_ID, previousDate: DATE, date: DATE, changes: { minutes: 45 } });

		const keys = invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey));

		expect(keys).toHaveLength(2);
		expect(new Set(keys).size).toBe(2);
		expect(keys).toContain(JSON.stringify(dayKey(DATE)));
		expect(keys).toContain(JSON.stringify(weekKey(MONDAY)));
	});

	/**
	 * The edit route reads its entry from a loader, so nothing observes `['time-entry', id]` - and
	 * `invalidateQueries` only refetches what something is watching. Invalidating here left the
	 * entry in the cache stale, `ensureQueryData` handed the stale copy to the next open, and saving
	 * that form reverted the edit this one had just made. Dropping the key is what stops that.
	 */
	it('does not hand the pre-edit entry to the next open (R-11)', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));

		const before = await queryClient.ensureQueryData(timeEntryQueryOptions(testSession, ENTRY_ID));
		expect(before.minutes).toBe(300);

		await result.current.mutateAsync({
			id: ENTRY_ID,
			previousDate: before.date,
			date: before.date,
			changes: { minutes: 120 },
		});

		const reopened = await queryClient.ensureQueryData(timeEntryQueryOptions(testSession, ENTRY_ID));

		expect(reopened.minutes).toBe(120);
	});

	it('throws when the API rejects the edit, so the form can show why', async () => {
		server.use(http.patch('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const { result } = renderHookWithProviders(() => useUpdateTimeEntry(testSession));

		await expect(
			result.current.mutateAsync({ id: ENTRY_ID, previousDate: DATE, date: DATE, changes: { minutes: 45 } })
		).rejects.toBeInstanceOf(ApiError);
	});
});
