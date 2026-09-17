import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { ShortcutsSheet } from './ShortcutsSheet';

describe('ShortcutsSheet', () => {
	it('lists every key the day view binds (X-2)', async () => {
		await renderWithProviders(<ShortcutsSheet open onOpenChange={() => undefined} />);

		for (const action of [
			'New entry',
			'Previous / next day',
			'Today',
			'Move between entries',
			'Edit focused entry',
			'Delete focused entry',
			'This sheet',
			'Close',
		]) {
			expect(screen.getByText(action)).toBeInTheDocument();
		}
	});

	/** X-4 is what gives `s` something to stop; teaching it earlier would teach a key that does nothing. */
	it('leaves the timer key out until there is a timer (X-4)', async () => {
		await renderWithProviders(<ShortcutsSheet open onOpenChange={() => undefined} />);

		expect(screen.queryByText('Stop timer')).not.toBeInTheDocument();
	});

	it('closes from its own close button', async () => {
		const onOpenChange = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<ShortcutsSheet open onOpenChange={onOpenChange} />);

		await user.click(screen.getByRole('button', { name: 'Close' }));

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('is not in the document while closed', async () => {
		await renderWithProviders(<ShortcutsSheet open={false} onOpenChange={() => undefined} />);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
