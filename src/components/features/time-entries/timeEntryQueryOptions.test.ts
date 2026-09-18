import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import error404 from '../../../../docs/api/samples/error-404.json';
import { ApiError } from '@/api/client';
import { testSession } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { timeEntryQueryOptions } from './timeEntryQueryOptions';

/** One of the three entries recorded in `time-entries-day.json`. */
const ENTRY_ID = '162903873';

/** A client, not a rendered hook: a loader is how the two form routes use these, not a subscription. */
function createClient() {
	return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('timeEntryQueryOptions', () => {
	it('reads one entry by ID, so the edit route works from a cold URL', async () => {
		const entry = await createClient().fetchQuery(timeEntryQueryOptions(testSession, ENTRY_ID));

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
