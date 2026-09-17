import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor, within } from '@/__tests__/test-utils';
import { SESSION_STORAGE_KEY } from '@/lib/storage';
import { AppLayout } from './AppLayout';

const session = testSession;

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
	 * UI-8: which organization is being logged into, visible before anything is logged. Both the
	 * name and the ID, because the ID is what was typed at login and the name is what it means.
	 */
	it('names the organization and its ID in the account menu', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));

		expect(await screen.findByText('Example Organization · org 999999')).toBeInTheDocument();
	});

	/**
	 * The badge on the avatar is the answer while the menu is shut. The recorded organization has a
	 * logo and the recorded person does not, so this covers both halves of the fallback at once -
	 * and the button keeps its own name either way, because both are decoration over the menu.
	 */
	it('wears the organization logo on the avatar, without naming it twice', async () => {
		await renderWithProviders(<AppLayout session={session}>content</AppLayout>, { session });

		const trigger = await screen.findByRole('button', { name: 'Account menu' });
		await waitFor(() => {
			expect(within(trigger).getByRole('presentation')).toHaveAttribute('src', 'https://example.com/avatar.png');
		});
		// The person has no avatar of their own in the recording, so their initials stand in.
		expect(trigger).toHaveTextContent('AL');
	});

	/**
	 * A membership the app cannot find is not a reason to draw a badge with no letters in it. The
	 * ID was typed at login and is always known, so the menu falls back to naming that alone.
	 */
	it('still names the organization ID when the membership is not among the ones returned', async () => {
		const user = userEvent.setup();
		const unknown = { ...session, organizationId: '1234' };
		await renderWithProviders(<AppLayout session={unknown}>content</AppLayout>, { session: unknown });

		await user.click(screen.getByRole('button', { name: 'Account menu' }));

		expect(await screen.findByText('Organization 1234')).toBeInTheDocument();
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
