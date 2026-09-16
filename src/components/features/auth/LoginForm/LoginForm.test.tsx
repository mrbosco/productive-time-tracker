import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import error401 from '../../../../../docs/api/samples/error-401.json';
import error403 from '../../../../../docs/api/samples/error-403.json';
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
		await renderWithProviders(<LoginForm />);

		expect(screen.getByLabelText('API token')).toBeInTheDocument();
		expect(screen.getByLabelText('Organization ID')).toBeInTheDocument();
	});

	it('keeps the submit button disabled until both fields are filled', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();

		await user.type(screen.getByLabelText('API token'), 'test-token');
		expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();

		await user.type(screen.getByLabelText('Organization ID'), '999999');
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
		});
	});

	it('keeps only the digits typed into the organization ID', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		await user.type(screen.getByLabelText('Organization ID'), '12ab34');

		expect(screen.getByLabelText('Organization ID')).toHaveValue('1234');
	});

	it('will not submit an empty organization ID', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		await user.type(screen.getByLabelText('API token'), 'test-token');
		await user.type(screen.getByLabelText('Organization ID'), 'acme');

		expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
	});

	it('hides the token until the show toggle is pressed', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		expect(screen.getByLabelText('API token')).toHaveAttribute('type', 'password');

		await user.click(screen.getByRole('button', { name: 'Show token' }));

		expect(screen.getByLabelText('API token')).toHaveAttribute('type', 'text');
		expect(screen.getByRole('button', { name: 'Hide token' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('stores the session and navigates home on success', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<LoginForm />);

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
		const { queryClient } = await renderWithProviders(<LoginForm />);

		await logIn(user);

		await waitFor(() => {
			expect(queryClient.getQueryData(['services', '1448639'])).toBeDefined();
		});
	});

	it('reports a rejected token', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(error401, { status: 401 })));
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		await logIn(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('Invalid API token.');
		expect(readStoredSession()).toBeNull();
	});

	it('reports a token that has no person in the organization', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.json(error403, { status: 403 })));
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		await logIn(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('This token is not a member of organization 999999.');
	});

	it('reports a failed connection', async () => {
		server.use(http.get('*/organization_memberships', () => HttpResponse.error()));
		const user = userEvent.setup();
		await renderWithProviders(<LoginForm />);

		await logIn(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('Network error. Try again.');
	});
});
