import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { useUpdateTimeEntry } from './useUpdateTimeEntry';

const ENTRY_ID = '162903873';
const DATE = '2026-09-17';

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
	 * `invalidateQueries` only refetches what something is watching. Invalidating here left the
	 * entry in the cache stale, `ensureQueryData` handed the stale copy to the next open, and saving
	 * that form reverted the edit this one had just made. Dropping the key is what stops that.
	 */
	it('does not hand the pre-edit entry to the next open', async () => {
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
