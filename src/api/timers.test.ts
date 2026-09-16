import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import timersRunning from '../../docs/api/samples/timers-running.json';
import { server } from '../mocks/node';
import { getRunningTimer } from './timers';

const auth = { token: 'test-token', organizationId: '999999' };

describe('getRunningTimer', () => {
	it('reads the running timer, resolving person_id from the plain attribute', async () => {
		const timer = await getRunningTimer(auth, '1448639');

		expect(timer).toMatchObject({ id: '14325906', personId: '1448639', stoppedAt: null });
		expect(timer?.timeEntryId).toBe('162921872');
	});

	it('narrows the payload instead of pulling the whole linked time entry', async () => {
		let params: URLSearchParams | undefined;
		server.use(
			http.get('*/timers', ({ request }) => {
				params = new URL(request.url).searchParams;

				return HttpResponse.json(timersRunning);
			})
		);

		await getRunningTimer(auth, '1448639');

		expect(params?.get('fields[timers]')).toContain('stopped_at');
		expect(params?.get('page[size]')).toBe('1');
	});

	it('reports no running timer when the filter hands back a stopped one', async () => {
		// The recorded timer with stopped_at set: `filter[stopped_at][eq]=` is unverified, and an
		// ignored filter would return an arbitrary timer that this must not call running.
		const stopped = {
			...timersRunning,
			data: [
				{
					...timersRunning.data[0],
					attributes: { ...timersRunning.data[0].attributes, stopped_at: '2026-09-15T18:00:00.000+02:00' },
				},
			],
		};
		server.use(http.get('*/timers', () => HttpResponse.json(stopped)));

		await expect(getRunningTimer(auth, '1448639')).resolves.toBeNull();
	});

	it('reports no running timer when the collection is empty', async () => {
		server.use(http.get('*/timers', () => HttpResponse.json({ data: [], meta: { total_pages: 0 } })));

		await expect(getRunningTimer(auth, '1448639')).resolves.toBeNull();
	});
});
