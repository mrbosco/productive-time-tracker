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

	/**
	 * Read from the membership the session was already re-validated against, rather than stored as
	 * another field on the session.
	 */
	it('shows the person email in the account menu', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));

		expect(await screen.findByText('ada.lovelace@example.com')).toBeInTheDocument();
	});

	it('opens the default-service sheet from the account menu (A-1)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Default service...' }));

		expect(await screen.findByRole('dialog', { name: 'Default service' })).toBeInTheDocument();
	});

	it('opens the shortcuts sheet from the app bar (X-2)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));

		expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
	});

	/**
	 * The button is desktop-only, as the design draws it, so the key is the only way in on a narrow
	 * window - and it is registered here rather than on the day view because the sheet is reachable
	 * from every authenticated route (X-2).
	 */
	it('opens the shortcuts sheet with the ? key on any route (X-2)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.keyboard('?');

		expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
	});

	/** Idle until something is running: one control, two states, on every authenticated screen (X-4). */
	it('carries the timer control on every authenticated screen (X-4)', async () => {
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		expect(await screen.findByRole('button', { name: 'Start timer' })).toBeEnabled();
	});

	/**
	 * Starting one is a `POST /timers`, which also creates the entry it will be written onto
	 * (SPEC 11) - so the pill swapping to a running clock is the whole visible outcome here.
	 */
	it('starts a timer from the app bar and shows it running (X-4)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(await screen.findByRole('button', { name: 'Start timer' }));

		expect(await screen.findByRole('button', { name: /^Stop timer/ })).toBeInTheDocument();
	});

	/** The stop opens the sheet that turns the tracked time into a described entry (X-4). */
	it('stops a timer and asks what the time was for (X-4)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(await screen.findByRole('button', { name: 'Start timer' }));
		await user.click(await screen.findByRole('button', { name: /^Stop timer/ }));

		// The bar itself is `aria-hidden` behind the sheet, as it is behind every modal here, so what
		// the pill says next is a question for after it closes - `StopTimerSheet` owns that.
		expect(await screen.findByRole('dialog', { name: 'Save tracked time' })).toBeInTheDocument();
	});

	/** X-2 lists `s`; X-4 is what gives it something to stop, and it works on every route. */
	it('stops the running timer with the s key (X-2, X-4)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(await screen.findByRole('button', { name: 'Start timer' }));
		await user.keyboard('s');

		expect(await screen.findByRole('dialog', { name: 'Save tracked time' })).toBeInTheDocument();
	});

	it('keeps logging out working', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));

		expect(await screen.findByRole('menuitem', { name: 'Log out' })).not.toHaveAttribute('aria-disabled');
	});

	it('clears the stored session and the cache on logout', async () => {
		const user = userEvent.setup();
		const { queryClient, router } = await renderWithProviders(<AppLayout session={session}>content</AppLayout>, {
			session,
		});
		/*
		 * A key nothing on screen is subscribed to. The timer provider observes `['services', ...]`
		 * for the default service (A-1), and an observed key is refetched the moment the cache is
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
