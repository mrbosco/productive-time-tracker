import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { todayIso } from '@/lib/date';
import { QuickAddInput } from './QuickAddInput';

const session = testSession;
/** The timer only runs on today, so the tracking test has to be standing on it. */
const TODAY = todayIso();

describe('QuickAddInput', () => {
	/** The common case is describing what you are about to do and starting the clock. */
	it('starts a timer carrying what was typed', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<QuickAddInput date={TODAY} />, { session });

		const fetchSpy = vi.spyOn(globalThis, 'fetch');

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), 'Reviewing the parser');
		await user.click(screen.getByRole('button', { name: 'Start' }));

		// `POST /timers` takes relationships and nothing else, so the words become a second write
		// onto the entry the timer just made. Clearing the field is not evidence that they arrived.
		await waitFor(() => {
			const patch = fetchSpy.mock.calls.find((call) => call[1]?.method === 'PATCH');
			expect(patch).toBeDefined();

			const body = JSON.parse(patch?.[1]?.body as string) as { data: { attributes: { note?: string } } };
			expect(body.data.attributes.note).toBe('Reviewing the parser');
		});
		expect(screen.getByRole('textbox', { name: 'Quick add an entry' })).toHaveValue('');
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

	/**
	 * A timer runs now. Offering to start one against yesterday asked to track work that is over,
	 * and answered by navigating away to today, where the entry it made had landed.
	 */
	it('offers only Log time on a day that is not today', async () => {
		await renderWithProviders(<QuickAddInput date="2026-09-15" />, { session });

		expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Log time' })).toBeInTheDocument();
	});
});
