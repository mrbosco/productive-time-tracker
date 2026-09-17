import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { useWeekTotals, weekTotalsQueryOptions } from './useWeekTotals';

describe('weekTotalsQueryOptions', () => {
	/** Keyed on the Monday so every day of a week shares one cached result, and never on the token. */
	it('keys on the week, not the day', () => {
		const tuesday = weekTotalsQueryOptions(testSession, '2026-09-15').queryKey;
		const friday = weekTotalsQueryOptions(testSession, '2026-09-18').queryKey;

		expect(tuesday).toEqual(['week-entries', testSession.personId, '2026-09-14']);
		expect(friday).toEqual(tuesday);
		expect(JSON.stringify(tuesday)).not.toContain(testSession.token);
	});
});

describe('useWeekTotals', () => {
	/** The whole point of the week strip: seven days cost one request, not seven. */
	it('asks for Monday to Sunday in a single request', async () => {
		const asked: URLSearchParams[] = [];
		server.use(
			http.get('*/time_entries', ({ request }) => {
				asked.push(new URL(request.url).searchParams);

				return HttpResponse.json({ data: [], meta: { current_page: 1, total_pages: 0 } });
			})
		);

		const { result } = renderHookWithProviders(() => useWeekTotals(testSession, '2026-09-16'));

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(asked).toHaveLength(1);
		expect(asked[0].get('filter[after]')).toBe('2026-09-14');
		expect(asked[0].get('filter[before]')).toBe('2026-09-20');
		expect(asked[0].get('filter[person_id]')).toBe(testSession.personId);
	});

	it('totals the minutes of each day it got back', async () => {
		const { result } = renderHookWithProviders(() => useWeekTotals(testSession, '2026-09-15'));

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// The recorded week holds one day: 0 + 0 + 300 minutes on the 15th. Two of the three are
		// zero-minute rows, which is what the account actually held when it was recorded.
		expect(result.current.data).toEqual({ '2026-09-15': 300 });
	});
});
