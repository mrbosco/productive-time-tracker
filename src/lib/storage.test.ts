import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testSession } from '@/__tests__/test-utils';
import {
	clearSession,
	readSession,
	readTimerState,
	SESSION_STORAGE_KEY,
	TIMER_STORAGE_KEY,
	writeSession,
	writeTimerState,
} from './storage';

const session = testSession;

describe('session storage', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('reads back what it wrote, default service and all', () => {
		writeSession({ ...session, defaultServiceId: '16887825' });

		expect(readSession()).toEqual({ ...session, defaultServiceId: '16887825' });
	});

	it.each(['not json', JSON.stringify({ token: 'test-token' })])('reads no session from %s', (stored) => {
		window.localStorage.setItem(SESSION_STORAGE_KEY, stored);

		expect(readSession()).toBeNull();
	});

	it('reads no session when storage throws', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('storage disabled');
		});

		expect(readSession()).toBeNull();
	});
});

/** So a refresh shows the running pill before `['timer', personId]` has answered. */
describe('timer storage', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	const timer = { timerId: '14335645', startedAt: '2026-09-16T11:54:45.000+02:00', entryId: '163018789' };

	it('reads back the timer it wrote', () => {
		writeTimerState(timer);

		expect(readTimerState()).toEqual(timer);
	});

	/** Whatever is in the browser, including an older shape - "no timer" beats a crash on boot. */
	it.each([['not json'], ['{"timerId":""}']])('reads %s as no timer', (raw) => {
		window.localStorage.setItem(TIMER_STORAGE_KEY, raw);

		expect(readTimerState()).toBeNull();
	});

	/**
	 * A timer belongs to the person who started it. Without this the next person to log in on this
	 * browser opens with someone else's timer running in the bar.
	 */
	it('is cleared by logging out, along with the session', () => {
		writeSession(session);
		writeTimerState(timer);

		clearSession();

		expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
		expect(readTimerState()).toBeNull();
	});
});
