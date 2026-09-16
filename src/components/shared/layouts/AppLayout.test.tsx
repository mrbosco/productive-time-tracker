import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { SESSION_STORAGE_KEY } from '@/lib/storage';
import { AppLayout, toInitials } from './AppLayout';

const session = testSession;

describe('toInitials', () => {
	it('takes the first and last word', () => {
		expect(toInitials('Ada Lovelace')).toBe('AL');
		expect(toInitials('Ada Byron King Lovelace')).toBe('AL');
	});

	it('takes one letter from a single name', () => {
		expect(toInitials('Ada')).toBe('A');
	});

	it('returns nothing for an empty name', () => {
		expect(toInitials('')).toBe('');
	});
});

describe('AppLayout', () => {
	it('shows the account menu as the person initials', async () => {
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		expect(screen.getByRole('button', { name: 'Account menu' })).toHaveTextContent('AL');
	});

	it('names the person in the account menu', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));

		expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
	});

	it('clears the stored session and the cache on logout', async () => {
		const user = userEvent.setup();
		const { queryClient, router } = await renderWithProviders(<AppLayout session={session}>content</AppLayout>, {
			session,
		});
		queryClient.setQueryData(['services', '1448639'], []);

		await user.click(screen.getByRole('button', { name: 'Account menu' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/login');
		});
		expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
		expect(queryClient.getQueryData(['services', '1448639'])).toBeUndefined();
	});
});
