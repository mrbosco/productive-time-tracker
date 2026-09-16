import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import type { TimeEntry } from '@/api/types';
import type { WeekTotals } from '@/components/features/week/useWeekTotals';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { useDeleteTimeEntry } from './useDeleteTimeEntry';

const ENTRY_ID = '162903873';
/** A Thursday, and the Monday its week is cached under. */
const DATE = '2026-09-17';
const MONDAY = '2026-09-14';

function dayKey(date: string) {
	return ['time-entries', testSession.personId, date];
}

function weekKey(monday: string) {
	return ['week-totals', testSession.personId, monday];
}

function buildEntry(id: string, minutes: number): TimeEntry {
	return {
		id,
		date: DATE,
		minutes,
		note: null,
		draft: false,
		serviceId: '16887825',
		service: { id: '16887825', name: 'Administrative work', dealName: null, dealId: null, companyName: null },
		createdAt: '2026-09-17T09:00:00.000+02:00',
	};
}

/** A day of two entries and the week total they add up to, as the day view would have them. */
function seed(queryClient: { setQueryData: (key: unknown[], data: unknown) => unknown }) {
	queryClient.setQueryData(dayKey(DATE), [buildEntry(ENTRY_ID, 90), buildEntry('162903874', 30)]);
	queryClient.setQueryData(weekKey(MONDAY), { [DATE]: 120, '2026-09-16': 60 } satisfies WeekTotals);
}

describe('useDeleteTimeEntry', () => {
	it('deletes the entry (R-12)', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const { result } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));

		await result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		// `fetch` is called with a URL string here; narrowed rather than stringified, because a
		// `Request` would stringify to `[object Object]` and the assertion would quietly pass.
		const [input, init] = fetchSpy.mock.calls.at(-1) ?? [];

		expect(init?.method).toBe('DELETE');
		expect(typeof input).toBe('string');
		expect(input as string).toContain(`/time_entries/${ENTRY_ID}`);
	});

	/**
	 * SPEC 4.2's "optimistic update on delete", which is only meaningful before the request settles:
	 * asserting after it would pass on an invalidation that merely refetched.
	 */
	it('takes the row off the day before the request lands (SPEC 4.2)', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		const deleted = result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		await waitFor(() => {
			expect(queryClient.getQueryData<TimeEntry[]>(dayKey(DATE))).toHaveLength(1);
		});

		await deleted;
	});

	/**
	 * The week strip cell for this day sits directly above the summary the list drives, so moving
	 * one without the other prints two different day totals a centimetre apart.
	 */
	it('takes the minutes off the week total at the same time (X-1)', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		const deleted = result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		await waitFor(() => {
			expect(queryClient.getQueryData<WeekTotals>(weekKey(MONDAY))?.[DATE]).toBe(30);
		});

		await deleted;
	});

	/** SPEC 4.2: "on failure the entry is restored". */
	it('puts the entry and the total back when the delete fails (SPEC 4.2)', async () => {
		server.use(http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		await expect(result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 })).rejects.toBeInstanceOf(
			ApiError
		);

		expect(queryClient.getQueryData<TimeEntry[]>(dayKey(DATE))).toHaveLength(2);
		expect(queryClient.getQueryData<WeekTotals>(weekKey(MONDAY))?.[DATE]).toBe(120);
	});

	/** So the caller can say why, rather than reporting a delete that did not happen. */
	it('throws when the API refuses the delete', async () => {
		server.use(http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 403 })));
		const { result } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));

		await expect(result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 })).rejects.toBeInstanceOf(
			ApiError
		);
	});

	it('leaves the day and its week needing a refetch (SPEC 4.2)', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		seed(queryClient);

		await result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		expect(queryClient.getQueryState(dayKey(DATE))?.isInvalidated).toBe(true);
		expect(queryClient.getQueryState(weekKey(MONDAY))?.isInvalidated).toBe(true);
	});

	/**
	 * The edit route reads its entry through `ensureQueryData`, so an invalidated copy left in the
	 * cache would be handed straight back - opening a form on an entry that no longer exists.
	 */
	it('drops the deleted entry from the cache rather than leaving it stale (R-11, R-12)', async () => {
		const { result, queryClient } = renderHookWithProviders(() => useDeleteTimeEntry(testSession));
		queryClient.setQueryData(['time-entry', ENTRY_ID], buildEntry(ENTRY_ID, 90));

		await result.current.mutateAsync({ id: ENTRY_ID, date: DATE, minutes: 90 });

		expect(queryClient.getQueryData(['time-entry', ENTRY_ID])).toBeUndefined();
	});
});
