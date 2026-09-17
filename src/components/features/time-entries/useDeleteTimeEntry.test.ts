import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import type { TimeEntry } from '@/api/types';
import { buildService, renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { useDeleteTimeEntry } from './useDeleteTimeEntry';

const ENTRY_ID = '162903873';
/** A Thursday, and the Monday its week is cached under. */
const DATE = '2026-09-17';
const MONDAY = '2026-09-14';

function weekKey(monday: string) {
	return ['week-entries', testSession.personId, monday];
}

function buildEntry(id: string, minutes: number): TimeEntry {
	return {
		id,
		date: DATE,
		minutes,
		note: null,
		draft: false,
		serviceId: '16887825',
		service: buildService(),
		createdAt: '2026-09-17T09:00:00.000+02:00',
	};
}

/**
 * Two entries on one day, in the week cache that holds them. The week is entries rather than sums,
 * and the day list is a `select` over the same array - so one cache entry answers the list, the
 * strip and the totals, and the optimistic write has one place to touch.
 */
function seed(queryClient: { setQueryData: (key: unknown[], data: unknown) => unknown }) {
	queryClient.setQueryData(weekKey(MONDAY), [buildEntry(ENTRY_ID, 90), buildEntry('162903874', 30)]);
}

/** What the strip would draw for that day, which is what the optimistic write has to move. */
function weekMinutesOn(entries: TimeEntry[] | undefined, date: string) {
	return (entries ?? []).filter((entry) => entry.date === date).reduce((sum, entry) => sum + entry.minutes, 0);
}

describe('useDeleteTimeEntry', () => {
	/**
	 * The optimistic delete is only meaningful before the request settles: asserting after it would
	 * pass on an invalidation that merely refetched.
	 */
	it('takes the row off the day before the request lands', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		const deleted = result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		await waitFor(() => {
			expect(queryClient.getQueryData<TimeEntry[]>(weekKey(MONDAY))).toHaveLength(1);
		});

		await deleted;
	});

	/**
	 * The week strip cell for this day sits directly above the summary the list drives, so moving
	 * one without the other prints two different day totals a centimetre apart.
	 */
	it('takes the minutes off the week total at the same time', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		const deleted = result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		await waitFor(() => {
			expect(weekMinutesOn(queryClient.getQueryData<TimeEntry[]>(weekKey(MONDAY)), DATE)).toBe(30);
		});

		await deleted;
	});

	it('puts the entry and the total back when the delete fails', async () => {
		server.use(http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		await expect(result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 })).rejects.toBeInstanceOf(
			ApiError
		);

		expect(queryClient.getQueryData<TimeEntry[]>(weekKey(MONDAY))).toHaveLength(2);
		expect(weekMinutesOn(queryClient.getQueryData<TimeEntry[]>(weekKey(MONDAY)), DATE)).toBe(120);
	});

	/**
	 * The edit route reads its entry through `ensureQueryData`, so an invalidated copy left in the
	 * cache would be handed straight back - opening a form on an entry that no longer exists.
	 */
	it('drops the deleted entry from the cache rather than leaving it stale', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		queryClient.setQueryData(['time-entry', ENTRY_ID], buildEntry(ENTRY_ID, 90));

		await result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		expect(queryClient.getQueryData(['time-entry', ENTRY_ID])).toBeUndefined();
	});
});
