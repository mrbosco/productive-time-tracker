import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor, within } from '@/__tests__/test-utils';
import { SESSION_STORAGE_KEY } from '@/lib/storage';
import { AppLayout } from './AppLayout';

const session = testSession;

describe('AppLayout', () => {
	it('names the person in the account menu', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));

		// Inside the menu, not just anywhere: the trigger names the person too on a wide screen, so
		// an unscoped query would pass on the bar alone and never open the menu at all.
		expect(await within(await screen.findByRole('menu')).findByText('Ada Lovelace')).toBeInTheDocument();
	});

	it('opens the default-service sheet from the account menu', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Default service...' }));

		expect(await screen.findByRole('dialog', { name: 'Default service' })).toBeInTheDocument();
	});

	/**
	 * The button is desktop-only, as the design draws it, so the key is the only way in on a narrow
	 * window - and it is registered here rather than on the day view because the sheet is reachable
	 * from every authenticated route.
	 */
	it('opens the shortcuts sheet with the ? key on any route', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.keyboard('?');

		expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
	});

	/** Idle until something is running: one control, two states, on every authenticated screen. */
	it('carries the timer control on every authenticated screen', async () => {
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		expect(await screen.findByRole('button', { name: 'Start timer' })).toBeEnabled();
	});

	/** The stop opens the sheet that turns the tracked time into a described entry. */
	it('stops a timer and asks what the time was for', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(await screen.findByRole('button', { name: 'Start timer' }));
		await user.click(await screen.findByRole('button', { name: /^Stop timer/ }));

		// The bar itself is `aria-hidden` behind the sheet, as it is behind every modal here, so what
		// the pill says next is a question for after it closes - `StopTimerSheet` owns that.
		expect(await screen.findByRole('dialog', { name: 'Save tracked time' })).toBeInTheDocument();
	});

	it('clears the stored session and the cache on logout', async () => {
		const user = userEvent.setup();
		const { queryClient, router } = await renderWithProviders(<AppLayout session={session}>content</AppLayout>, {
			session,
		});
		/*
		 * A key nothing on screen is subscribed to. The timer provider observes `['services', ...]`
		 * for the default service, and an observed key is refetched the moment the cache is
		 * cleared - in the app that never happens, because logging out unmounts this whole tree,
		 * but the test router keeps rendering it.
		 */
		queryClient.setQueryData(['time-entries', '1448639', '2026-09-15'], []);

		await user.click(screen.getByRole('button', { name: 'Account menu' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/login');
		});
		expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
		expect(queryClient.getQueryData(['time-entries', '1448639', '2026-09-15'])).toBeUndefined();
	});
});
