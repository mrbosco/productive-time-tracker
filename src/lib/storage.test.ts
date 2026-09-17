import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testSession } from '@/__tests__/test-utils';
import {
	clearSession,
	clearTimerState,
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

	it('reads back what it wrote', () => {
		writeSession(session);

		expect(readSession()).toEqual(session);
	});

	it('keeps the default service when one is set', () => {
		writeSession({ ...session, defaultServiceId: '16887825' });

		expect(readSession()?.defaultServiceId).toBe('16887825');
	});

	it('reads no session when nothing is stored', () => {
		expect(readSession()).toBeNull();
	});

	it('reads no session when the stored value is not JSON', () => {
		window.localStorage.setItem(SESSION_STORAGE_KEY, 'not json');

		expect(readSession()).toBeNull();
	});

	it('reads no session when a field is missing', () => {
		window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'test-token' }));

		expect(readSession()).toBeNull();
	});

	it('reads no session when the token is empty', () => {
		window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, token: '' }));

		expect(readSession()).toBeNull();
	});

	it('reads no session when storage throws', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('storage disabled');
		});

		expect(readSession()).toBeNull();
	});

	it('clears the stored session', () => {
		writeSession(session);

		clearSession();

		expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
	});
});

/** X-4: so a refresh shows the running pill before `['timer', personId]` has answered. */
describe('timer storage', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	const timer = { timerId: '14335645', startedAt: '2026-09-16T11:54:45.000+02:00', entryId: '163018789' };

	it('reads back what it wrote', () => {
		writeTimerState(timer);

		expect(readTimerState()).toEqual(timer);
	});

	/** There is one window where the timer is known and its entry is not (api-client rule 10). */
	it('accepts a timer whose entry is not known yet', () => {
		writeTimerState({ timerId: timer.timerId, startedAt: timer.startedAt });

		expect(readTimerState()?.entryId).toBeUndefined();
	});

	it('reads nothing when nothing was stored', () => {
		expect(readTimerState()).toBeNull();
	});

	/** Whatever is in the browser, including an older shape - "no timer" beats a crash on boot. */
	it.each([['not json'], ['{}'], ['{"timerId":""}'], ['[]']])('reads %s as no timer', (raw) => {
		window.localStorage.setItem(TIMER_STORAGE_KEY, raw);

		expect(readTimerState()).toBeNull();
	});

	it('forgets the timer on request', () => {
		writeTimerState(timer);

		clearTimerState();

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

	it('survives storage being unavailable', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('denied');
		});

		expect(readTimerState()).toBeNull();
	});
});
