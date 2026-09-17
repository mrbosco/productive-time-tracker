import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/__tests__/test-utils';
import { DatePicker } from './DatePicker';

function renderPicker(value = '2026-09-15', onSelect = vi.fn()) {
	return renderWithProviders(
		<DatePicker value={value} onSelect={onSelect}>
			<button type="button">Open the calendar</button>
		</DatePicker>
	);
}

describe('DatePicker', () => {
	it('opens on the month of the selected day, not the current one', async () => {
		const user = userEvent.setup();
		await renderPicker('2026-03-04');

		await user.click(screen.getByRole('button', { name: 'Open the calendar' }));

		expect(await screen.findByText('March 2026')).toBeInTheDocument();
	});

	it('reports the picked day as an ISO date', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderPicker('2026-09-15', onSelect);

		await user.click(screen.getByRole('button', { name: 'Open the calendar' }));
		await user.click(await screen.findByRole('button', { name: 'Thursday, September 10th, 2026' }));

		expect(onSelect).toHaveBeenCalledWith('2026-09-10');
	});

	it('closes on Escape and returns focus to the trigger', async () => {
		const user = userEvent.setup();
		await renderPicker();

		const trigger = screen.getByRole('button', { name: 'Open the calendar' });
		await user.click(trigger);
		await screen.findByRole('grid');

		await user.keyboard('{Escape}');

		await waitFor(() => {
			expect(trigger).toHaveFocus();
		});
	});
});
