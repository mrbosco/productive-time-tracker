import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import timersRunning from '../../docs/api/samples/timers-running.json';
import { server } from '../mocks/node';
import timerStop from '../../docs/api/samples/timer-stop.json';
import { getRunningTimer, stopTimer } from './timers';

const auth = { token: 'test-token', organizationId: '999999' };

describe('getRunningTimer', () => {
	/**
	 * The recorded document, installed rather than left to the shared handler: that one answers from
	 * whatever this run has started, and a session that has started nothing has no timer.
	 */
	it('reads the running timer, resolving person_id from the plain attribute', async () => {
		server.use(http.get('*/timers', () => HttpResponse.json(timersRunning)));

		const timer = await getRunningTimer(auth, '1448639');

		expect(timer).toMatchObject({ id: '14335645', personId: '1448639', stoppedAt: null });
		// Starting a timer auto-creates this entry, which is why it is linked while still running.
		expect(timer?.timeEntryId).toBe('163018789');
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
});

describe('stopTimer', () => {
	it('stops with PUT, which is the only verb this path accepts', async () => {
		let method: string | undefined;
		server.use(
			http.put('*/timers/:id/stop', ({ request }) => {
				method = request.method;

				return HttpResponse.json(timerStop);
			})
		);

		const timer = await stopTimer(auth, '14335645');

		expect(method).toBe('PUT');
		expect(timer.stoppedAt).not.toBeNull();
		// Elapsed whole minutes, which the API also writes onto the linked time entry.
		expect(timer.totalTime).toBe(1);
	});

	it('surfaces a second stop as a 409 rather than pretending it worked', async () => {
		server.use(
			http.put('*/timers/:id/stop', () =>
				HttpResponse.json({ errors: [{ status: '409', code: 'timer_already_stopped' }] }, { status: 409 })
			)
		);

		await expect(stopTimer(auth, '14335645')).rejects.toMatchObject({ status: 409, code: 'timer_already_stopped' });
	});
});
