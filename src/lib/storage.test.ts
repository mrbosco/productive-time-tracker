import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, readSession, SESSION_STORAGE_KEY, type Session, writeSession } from './storage';

const session: Session = {
	token: 'test-token',
	organizationId: '999999',
	personId: '1448639',
	personName: 'Ada Lovelace',
};

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
