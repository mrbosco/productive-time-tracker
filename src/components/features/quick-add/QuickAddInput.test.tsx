import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { QuickAddInput } from './QuickAddInput';

describe('QuickAddInput', () => {
	it('has a label, even though the placeholder carries the instruction (guidebook 18)', async () => {
		await renderWithProviders(<QuickAddInput date="2026-09-15" />);

		expect(screen.getByRole('textbox', { name: 'Quick add an entry' })).toBeInTheDocument();
	});

	it('opens the entry form for the day being shown', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<QuickAddInput date="2026-09-15" />, {
			initialEntry: '/day/2026-09-15',
		});

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), '1.5h client call{Enter}');

		expect(router.state.location.pathname).toBe('/entries/new');
		expect(router.state.location.search).toEqual({ date: '2026-09-15' });
	});

	/** It never posts an entry itself: P-1 opens the form, and the form is what saves. */
	it('does not submit anything on its own', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<QuickAddInput date="2026-09-15" />, {
			initialEntry: '/day/2026-09-15',
		});

		await user.type(screen.getByRole('textbox', { name: 'Quick add an entry' }), '45m standup');

		expect(router.state.location.pathname).toBe('/day/2026-09-15');
	});
});
