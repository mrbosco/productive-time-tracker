import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import error401 from '@/../docs/api/samples/error-401.json';
import { server } from '@/mocks/node';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { timeEntriesQueryOptions, useTimeEntries } from './useTimeEntries';

const SEEDED_DATE = '2026-09-15';

describe('timeEntriesQueryOptions', () => {
	/**
	 * A day is a selection over the week it falls in, so it shares the week's key rather than
	 * holding one of its own - which is what makes stepping between days inside a week free. Keys
	 * end up in devtools and error reports, so the token never goes in one (ADR-0004).
	 */
	it('shares the key of the week the day falls in, and never carries the token', () => {
		const { queryKey } = timeEntriesQueryOptions(testSession, SEEDED_DATE);

		// The Monday of the week containing Tue 15 Sep 2026.
		expect(queryKey).toEqual(['week-entries', '1448639', '2026-09-14']);
		expect(queryKey).toEqual(weekQueryKey(testSession, SEEDED_DATE));
		expect(JSON.stringify(queryKey)).not.toContain(testSession.token);
	});

	/** Two days in one week are one cache entry; a day in the next week is a different one. */
	it('gives every day of a week the same key, and the next week a different one', () => {
		const monday = timeEntriesQueryOptions(testSession, '2026-09-14').queryKey;
		const friday = timeEntriesQueryOptions(testSession, '2026-09-18').queryKey;
		const nextMonday = timeEntriesQueryOptions(testSession, '2026-09-21').queryKey;

		expect(friday).toEqual(monday);
		expect(nextMonday).not.toEqual(monday);
	});
});

/**
 * Answers one empty day and hands back the query string it was asked with. Collected into an array
 * rather than a reassigned variable: a `let` written inside the handler still reads as its initial
 * value to the type checker at the assertion.
 */
async function recordDayRequest(date = SEEDED_DATE): Promise<URLSearchParams> {
	const asked: URLSearchParams[] = [];
	server.use(
		http.get('*/time_entries', ({ request }) => {
			asked.push(new URL(request.url).searchParams);

			return HttpResponse.json({ data: [], meta: { current_page: 1, total_pages: 0 } });
		})
	);

	const { result } = renderHookWithProviders(() => useTimeEntries(testSession, date));

	await waitFor(() => {
		expect(result.current.isSuccess).toBe(true);
	});

	expect(asked).toHaveLength(1);

	return asked[0];
}

describe('useTimeEntries', () => {
	it('returns the day sorted by when each entry was logged', async () => {
		const { result } = renderHookWithProviders(() => useTimeEntries(testSession, SEEDED_DATE));

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Newest first. The fixture's own order is neither, so this is the client-side sort at work
		// rather than the response being passed through.
		expect(result.current.data?.map((entry) => entry.id)).toEqual(['163073474', '162921848', '162903873']);
	});

	/**
	 * The person filter is the one that keeps a day to its owner, so it is asserted on the wire
	 * rather than trusted. The range is the whole week the day falls in - one request answers every
	 * day of it, and the day is filtered out of the result rather than out of the request.
	 */
	it('filters by the session person and asks for the whole week the day falls in', async () => {
		const requested = await recordDayRequest();

		expect(requested.get('filter[person_id]')).toBe(testSession.personId);
		expect(requested.get('filter[after]')).toBe('2026-09-14');
		expect(requested.get('filter[before]')).toBe('2026-09-20');
	});

	/** The point of the shared key: the second day is served from the first day's response. */
	it('serves another day of the same week without a second request', async () => {
		const asked: string[] = [];
		server.use(
			http.get('*/time_entries', ({ request }) => {
				asked.push(request.url);

				return HttpResponse.json({ data: [], meta: { current_page: 1, total_pages: 0 } });
			})
		);

		const { result, rerender } = renderHookWithProviders(
			({ date }: { date: string }) => useTimeEntries(testSession, date),
			{ initialProps: { date: '2026-09-15' } }
		);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		rerender({ date: '2026-09-17' });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(asked).toHaveLength(1);
	});

	it('reports a rejected request as an error', async () => {
		server.use(http.get('*/time_entries', () => HttpResponse.json(error401, { status: 401 })));

		const { result } = renderHookWithProviders(() => useTimeEntries(testSession, SEEDED_DATE));

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});
	});
});
