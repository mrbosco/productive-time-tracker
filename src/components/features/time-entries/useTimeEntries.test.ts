import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import error401 from '@/../docs/api/samples/error-401.json';
import { server } from '@/mocks/node';
import { timeEntriesQueryOptions, useTimeEntries } from './useTimeEntries';

const SEEDED_DATE = '2026-09-15';

describe('timeEntriesQueryOptions', () => {
	it('keys the cache on the person and the date (SPEC 6.3)', () => {
		expect(timeEntriesQueryOptions(testSession, SEEDED_DATE).queryKey).toEqual([
			'time-entries',
			'1448639',
			SEEDED_DATE,
		]);
	});

	/** ADR-0004: keys end up in devtools and error reports, so the token never goes in one. */
	it('keeps the token out of the key', () => {
		expect(JSON.stringify(timeEntriesQueryOptions(testSession, SEEDED_DATE).queryKey)).not.toContain(testSession.token);
	});

	it('gives two dates two cache entries', () => {
		const first = timeEntriesQueryOptions(testSession, SEEDED_DATE).queryKey;
		const second = timeEntriesQueryOptions(testSession, '2026-09-14').queryKey;

		expect(first).not.toEqual(second);
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
	it('returns the day sorted by when each entry was logged (A-7)', async () => {
		const { result } = renderHookWithProviders(() => useTimeEntries(testSession, SEEDED_DATE));

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Newest first (A-7, amended). The fixture's own order is neither, so this is the client-side
		// sort at work rather than the response being passed through.
		expect(result.current.data?.map((entry) => entry.id)).toEqual(['163073474', '162921848', '162903873']);
	});

	it('filters by the session person, so another person is never in the response (R-4)', async () => {
		const requested = await recordDayRequest();

		expect(requested.get('filter[person_id]')).toBe(testSession.personId);
	});

	it('asks for exactly the selected day, both bounds inclusive', async () => {
		const requested = await recordDayRequest();

		expect(requested.get('filter[after]')).toBe(SEEDED_DATE);
		expect(requested.get('filter[before]')).toBe(SEEDED_DATE);
	});

	it('is empty, not failed, for a day with nothing logged', async () => {
		const { result } = renderHookWithProviders(() => useTimeEntries(testSession, '2026-09-02'));

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual([]);
	});

	it('reports a rejected request as an error (R-8)', async () => {
		server.use(http.get('*/time_entries', () => HttpResponse.json(error401, { status: 401 })));

		const { result } = renderHookWithProviders(() => useTimeEntries(testSession, SEEDED_DATE));

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});
	});
});
