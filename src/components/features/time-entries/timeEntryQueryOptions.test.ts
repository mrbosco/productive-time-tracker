import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import error404 from '../../../../docs/api/samples/error-404.json';
import { ApiError } from '@/api/client';
import type { TimeEntry } from '@/api/types';
import { testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { timeEntryQueryOptions } from './timeEntryQueryOptions';

/** One of the three entries recorded in `time-entries-day.json`. */
const ENTRY_ID = '162903873';

/** A client, not a rendered hook: a loader is how the two form routes use these, not a subscription. */
function createClient() {
	// The app's staleness, because the freshness test below is about exactly that boundary.
	return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
}

describe('timeEntryQueryOptions', () => {
	it('reads one entry by ID, so the edit route works from a cold URL', async () => {
		const entry = await createClient().fetchQuery(timeEntryQueryOptions(testSession, ENTRY_ID));

		expect(entry).toMatchObject({ id: ENTRY_ID, date: '2026-09-15' });
	});

	/**
	 * The reason both form loaders call `fetchQuery` rather than `ensureQueryData`. `ensureQueryData`
	 * hands back whatever is cached at any age, so an entry changed in Productive itself, or in
	 * another tab, opened the form on the values from before that change (ADR-0007, 2026-09-18).
	 * Seeded past the client's staleness, so the difference between the two calls is the assertion.
	 */
	it('reads an entry again once the cached copy has gone stale', async () => {
		const client = createClient();
		const key = timeEntryQueryOptions(testSession, ENTRY_ID).queryKey;
		const stale: TimeEntry = {
			id: ENTRY_ID,
			date: '2026-09-15',
			minutes: 1,
			note: null,
			draft: false,
			serviceId: '16887825',
			service: null,
			createdAt: '2026-09-15T16:08:26.527+02:00',
		};
		client.setQueryData(key, stale, { updatedAt: Date.now() - 31_000 });

		const entry = await client.fetchQuery(timeEntryQueryOptions(testSession, ENTRY_ID));

		expect(entry.minutes).not.toBe(1);
		expect(entry).toMatchObject({ id: ENTRY_ID, date: '2026-09-15' });
	});

	/** What the route's error component reads to tell "deleted elsewhere" from "server fell over". */
	it('surfaces a 404 as an ApiError carrying the status', async () => {
		server.use(http.get('*/time_entries/:id', () => HttpResponse.json(error404, { status: 404 })));

		const failure = createClient().fetchQuery(timeEntryQueryOptions(testSession, '999999999'));

		await expect(failure).rejects.toBeInstanceOf(ApiError);
		await expect(failure).rejects.toMatchObject({ status: 404 });
	});
});
