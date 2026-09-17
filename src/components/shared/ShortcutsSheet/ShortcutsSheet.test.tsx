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
			'Stop timer',
			'This sheet',
			'Close',
		]) {
			expect(screen.getByText(action)).toBeInTheDocument();
		}
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
