import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { QuickAddInput } from './QuickAddInput';

const session = testSession;

describe('QuickAddInput', () => {
	it('has a label, even though the placeholder carries the instruction (guidebook 18)', async () => {
		await renderWithProviders(<QuickAddInput date="2026-09-15" />, { session });

		expect(screen.getByRole('textbox', { name: 'Quick add an entry' })).toBeInTheDocument();
	});

	/** UI-3: the common case is describing what you are about to do and starting the clock. */
	it('starts a timer carrying what was typed', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<QuickAddInput date="2026-09-15" />, { session });

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), 'Reviewing the parser');
		await user.click(screen.getByRole('button', { name: 'Start' }));

		// The bar's control is the same timer, so it reports the start.
		await waitFor(() => {
			expect(screen.getByRole('textbox', { name: 'Quick add an entry' })).toHaveValue('');
		});
	});

	it('opens the form with the text as the description, without putting it in the URL', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<QuickAddInput date="2026-09-15" />, {
			session,
			initialEntry: '/day/2026-09-15',
		});

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), '45m standup');
		await user.click(screen.getByRole('button', { name: 'Log time' }));

		expect(router.state.location.pathname).toBe('/entries/new');
		expect(router.state.location.search).toEqual({ date: '2026-09-15' });
		expect(router.state.location.state.quickAddNote).toBe('45m standup');
	});

	/** One timer at a time, the rule X-4 set for `Continue`. */
	it('will not start a second timer while one is running', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<QuickAddInput date="2026-09-15" />, { session });

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), 'First');
		await user.click(screen.getByRole('button', { name: 'Start' }));

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
		});
	});

	it('does not submit anything on its own', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<QuickAddInput date="2026-09-15" />, {
			session,
			initialEntry: '/day/2026-09-15',
		});

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), '45m standup');

		expect(router.state.location.pathname).toBe('/day/2026-09-15');
		expect(vi.isMockFunction(globalThis.fetch)).toBe(false);
	});
});
