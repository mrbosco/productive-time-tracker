import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { useCreateTimeEntry } from './useCreateTimeEntry';

const DATE = '2026-09-17';
/** The Monday of the week `2026-09-17` falls in - the key the week strip is cached under. */
const MONDAY = '2026-09-14';

describe('useCreateTimeEntry', () => {
	it('sends the logged-in person rather than anything typed (R-10)', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const { result } = renderHookWithProviders(() => useCreateTimeEntry(testSession));

		await result.current.mutateAsync({ date: DATE, minutes: 90, note: 'Pairing', serviceId: '16887825' });

		const [, init] = fetchSpy.mock.calls.at(-1) ?? [];
		const body = JSON.parse(init?.body as string) as {
			data: { relationships: { person: { data: { id: string } } } };
		};

		expect(body.data.relationships.person.data.id).toBe(testSession.personId);
	});

	/**
	 * Two keys, not one. SPEC 4.2 names only the day, but X-1 landed with US-1, so the week strip
	 * and the desktop totals card both read `['week-totals', personId, monday]` - leaving that
	 * stale would show a week total that disagrees with the list right under it.
	 */
	it('leaves the day and the week the entry lands in needing a refetch', async () => {
		const dayKey = ['time-entries', testSession.personId, DATE];
		const weekKey = ['week-totals', testSession.personId, MONDAY];
		const { result, queryClient } = renderHookWithProviders(() => useCreateTimeEntry(testSession));

		// Both keys hold something fresh before the create, so "stale afterwards" is a change
		// rather than the state they were already in.
		queryClient.setQueryData(dayKey, []);
		queryClient.setQueryData(weekKey, {});

		await result.current.mutateAsync({ date: DATE, minutes: 30, note: null, serviceId: '16887825' });

		await waitFor(() => {
			expect(queryClient.getQueryState(dayKey)?.isInvalidated).toBe(true);
		});
		expect(queryClient.getQueryState(weekKey)?.isInvalidated).toBe(true);
	});

	it('throws when the API rejects the entry, so the form can show why', async () => {
		server.use(http.post('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		const { result } = renderHookWithProviders(() => useCreateTimeEntry(testSession));

		await expect(
			result.current.mutateAsync({ date: DATE, minutes: 30, note: null, serviceId: '16887825' })
		).rejects.toBeInstanceOf(ApiError);
	});
});
