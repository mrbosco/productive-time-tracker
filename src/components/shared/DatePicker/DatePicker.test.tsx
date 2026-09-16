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
	it('keeps the calendar closed until the trigger is used', async () => {
		await renderPicker();

		expect(screen.queryByRole('grid')).not.toBeInTheDocument();
	});

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

	it('closes once a day is picked', async () => {
		const user = userEvent.setup();
		await renderPicker();

		await user.click(screen.getByRole('button', { name: 'Open the calendar' }));
		await user.click(await screen.findByRole('button', { name: 'Thursday, September 10th, 2026' }));

		await waitFor(() => {
			expect(screen.queryByRole('grid')).not.toBeInTheDocument();
		});
	});

	/**
	 * A-6: the selected day is the calendar day in the URL, never an instant shifted through UTC.
	 * A picker that round-tripped through `toISOString` would highlight the 14th here.
	 */
	it('marks the day the value names as selected', async () => {
		const user = userEvent.setup();
		await renderPicker('2026-09-15');

		await user.click(screen.getByRole('button', { name: 'Open the calendar' }));
		await screen.findByRole('grid');

		// react-day-picker carries the state on the cell, and says so in the day's own label.
		expect(document.querySelector('[data-day="2026-09-15"]')).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('button', { name: /September 15th, 2026, selected/ })).toBeInTheDocument();
	});

	/**
	 * Asserting a class is normally the wrong test, but this one guards a real defect: the
	 * generated calendar styles the selected day with `data-selected-single:*` on the day button,
	 * and react-day-picker v10 puts `data-selected` on the cell instead, so the classes never fire
	 * and the selection is announced but invisible. `css: false` in the runner leaves no other way
	 * to catch it short of a screenshot.
	 */
	it('paints the selected day rather than leaving it looking like every other one', async () => {
		const user = userEvent.setup();
		await renderPicker('2026-09-15');

		await user.click(screen.getByRole('button', { name: 'Open the calendar' }));
		await screen.findByRole('grid');

		expect(document.querySelector('[data-day="2026-09-15"]')).toHaveClass('bg-accent');
		expect(document.querySelector('[data-day="2026-09-14"]')).not.toHaveClass('bg-accent');
	});

	it('starts the week on Monday, as the design draws it', async () => {
		const user = userEvent.setup();
		await renderPicker();

		await user.click(screen.getByRole('button', { name: 'Open the calendar' }));

		await screen.findByRole('grid');
		const headers = [...document.querySelectorAll('th')];

		expect(headers.map((header) => header.textContent)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
		// The single letters repeat; the full name stays on each column for a screen reader.
		expect(headers.map((header) => header.getAttribute('aria-label'))).toEqual([
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
			'Sunday',
		]);
	});

	it('closes on Escape and returns focus to the trigger (guidebook 18)', async () => {
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
