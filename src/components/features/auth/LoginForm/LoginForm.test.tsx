import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import error401 from '../../../../../docs/api/samples/error-401.json';
import error403 from '../../../../../docs/api/samples/error-403.json';
import unknownOrganization from '../../../../../docs/api/samples/organization-memberships-unknown-organization.json';
import { renderWithProviders, screen, userEvent, waitFor } from '@/__tests__/test-utils';
import { SESSION_STORAGE_KEY } from '@/lib/storage';
import { server } from '@/mocks/node';
import { LoginForm } from './LoginForm';

/** Fills both fields and submits, as a person would. */
async function logIn(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('API token'), 'test-token');
	await user.type(screen.getByLabelText('Organization ID'), '999999');
	await user.click(screen.getByRole('button', { name: 'Log in' }));
}

function readStoredSession(): Record<string, string> | null {
	const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

	return raw === null ? null : (JSON.parse(raw) as Record<string, string>);
}

describe('LoginForm', () => {
	it('labels both credential fields', async () => {
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		expect(screen.getByLabelText('API token')).toBeInTheDocument();
		expect(screen.getByLabelText('Organization ID')).toBeInTheDocument();
	});

	it('keeps the submit button disabled until both fields are filled', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();

		await user.type(screen.getByLabelText('API token'), 'test-token');
		expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();

		await user.type(screen.getByRole('textbox', { name: 'Organization ID' }), '999999');
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
		});
	});

	it('keeps only the digits typed into the organization ID', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await user.type(screen.getByLabelText('Organization ID'), '12ab34');

		expect(screen.getByLabelText('Organization ID')).toHaveValue('1234');
	});

	it('will not submit an empty organization ID', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await user.type(screen.getByLabelText('API token'), 'test-token');
		await user.type(screen.getByLabelText('Organization ID'), 'acme');

		expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
	});

	it('hides the token until the show toggle is pressed', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		expect(screen.getByLabelText('API token')).toHaveAttribute('type', 'password');

		await user.click(screen.getByRole('button', { name: 'Show token' }));

		expect(screen.getByLabelText('API token')).toHaveAttribute('type', 'text');
		expect(screen.getByRole('button', { name: 'Hide token' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('stores the session and navigates home on success', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await logIn(user);

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/');
		});
		expect(readStoredSession()).toMatchObject({
			token: 'test-token',
			organizationId: '999999',
			personId: '1448639',
			personName: 'Ada Lovelace',
		});
	});

	it('prefetches the services list so the first entry does not wait for it', async () => {
		const user = userEvent.setup();
		const { queryClient } = await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await logIn(user);

		await waitFor(() => {
			expect(queryClient.getQueryData(['services', '1448639'])).toBeDefined();
		});
	});

	it('reports a rejected token', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(error401, { status: 401 })));
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await logIn(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('Invalid API token.');
		expect(readStoredSession()).toBeNull();
	});

	it('reports a token that has no person in the organization', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(error403, { status: 403 })));
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await logIn(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('This token is not a member of organization 999999.');
	});

	it('refuses an organization the token is not a member of', async () => {
		// Recorded live: an unknown organization comes back 200 with the token's own memberships
		// rather than 403, so nothing upstream of this rejects it.
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(unknownOrganization)));
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await user.type(screen.getByLabelText('API token'), 'test-token');
		await user.type(screen.getByLabelText('Organization ID'), '1234');
		await user.click(screen.getByRole('button', { name: 'Log in' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('This token is not a member of organization 1234.');
		expect(readStoredSession()).toBeNull();
		expect(router.state.location.pathname).toBe('/login');
	});

	it('signs in against the organization that was entered, not the first one returned', async () => {
		server.use(
			http.get('*/organization_memberships', () =>
				HttpResponse.json({
					...unknownOrganization,
					data: [
						{
							id: '2000001',
							type: 'organization_memberships',
							relationships: {
								organization: { data: { type: 'organizations', id: '555555' } },
								person: { data: { type: 'people', id: '2000002' } },
							},
						},
						...unknownOrganization.data,
					],
					included: [
						{
							id: '2000002',
							type: 'people',
							attributes: { email: 'g@example.com', first_name: 'Grace', last_name: 'Hopper' },
						},
						...unknownOrganization.included,
					],
				})
			)
		);
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await logIn(user);

		// 999999 was typed, and its membership is the second one in the response.
		await waitFor(() => {
			expect(readStoredSession()).toMatchObject({ personName: 'Ada Lovelace', organizationId: '999999' });
		});
	});

	it('reports a failed connection', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.error()));
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />, { initialEntry: '/login' });

		await logIn(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('Network error. Try again.');
	});
});
