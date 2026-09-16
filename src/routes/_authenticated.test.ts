import { QueryClient } from '@tanstack/react-query';
import { isRedirect } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import error401 from '../../docs/api/samples/error-401.json';
import error403 from '../../docs/api/samples/error-403.json';
import memberships from '../../docs/api/samples/organization-memberships-include-person.json';
import type { Session } from '@/lib/storage';
import { server } from '@/mocks/node';
import { Route } from './_authenticated';

const session: Session = {
	token: 'test-token',
	organizationId: '999999',
	personId: '1448639',
	personName: 'Ada Lovelace',
};

/**
 * The loader is called directly rather than through a rendered router: what matters is the
 * contract at the route boundary - revalidate, and on a rejected session drop it and redirect -
 * and driving it through navigation would test the router rather than that.
 */
function runLoader({ preload = false, stored = session } = {}) {
	const login = vi.fn();
	const logout = vi.fn();
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const context = { queryClient, session: stored, auth: { session: stored, login, logout } };

	// The loader reads only these; the rest of the router's loader argument is irrelevant here.
	const loader = Route.options.loader as (args: unknown) => Promise<void>;

	return { login, logout, result: loader({ context, preload }) };
}

describe('the authenticated layout loader', () => {
	it('revalidates a stored session and keeps it', async () => {
		const { logout, result } = runLoader();

		await expect(result).resolves.toBeUndefined();
		expect(logout).not.toHaveBeenCalled();
	});

	it.each([
		['a revoked token', 401, error401],
		['a person removed from the organization', 403, error403],
	])('logs out and redirects on %s', async (_name, status, body) => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(body, { status })));
		const { logout, result } = runLoader();

		await expect(result).rejects.toSatisfy(isRedirect);
		expect(logout).toHaveBeenCalledTimes(1);
	});

	it('does not log anyone out when the failure happens during a preload', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(error401, { status: 401 })));
		const { logout, result } = runLoader({ preload: true });

		await expect(result).rejects.toThrow();
		expect(logout).not.toHaveBeenCalled();
	});

	it('rejects a session naming a person the token does not resolve to', async () => {
		const { logout, result } = runLoader({ stored: { ...session, personId: 'someone-else' } });

		await expect(result).rejects.toSatisfy(isRedirect);
		expect(logout).toHaveBeenCalledTimes(1);
	});

	it('refreshes a name that changed since the session was stored', async () => {
		const { login, logout, result } = runLoader({ stored: { ...session, personName: 'Ada Byron' } });

		await expect(result).resolves.toBeUndefined();
		expect(login).toHaveBeenCalledWith(expect.objectContaining({ personName: 'Ada Lovelace' }));
		expect(logout).not.toHaveBeenCalled();
	});

	it('leaves an unchanged name alone', async () => {
		const { login, result } = runLoader();

		await expect(result).resolves.toBeUndefined();
		expect(login).not.toHaveBeenCalled();
	});

	it('rejects a response carrying no person at all', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json({ ...memberships, included: [] })));
		const { logout, result } = runLoader();

		await expect(result).rejects.toSatisfy(isRedirect);
		expect(logout).toHaveBeenCalledTimes(1);
	});
});
