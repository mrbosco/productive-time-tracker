import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { DateNavigator } from './DateNavigator';

const TODAY = '2026-09-15';

describe('DateNavigator', () => {
	it('names today in words (A-3)', async () => {
		await renderWithProviders(<DateNavigator date={TODAY} onSelect={vi.fn()} today={TODAY} />);

		expect(screen.getByRole('heading', { level: 1, name: /Today, Tue 15 Sep/ })).toBeInTheDocument();
	});

	it('names yesterday in words', async () => {
		await renderWithProviders(<DateNavigator date="2026-09-14" onSelect={vi.fn()} today={TODAY} />);

		expect(screen.getByRole('heading', { level: 1, name: /Yesterday, Mon 14 Sep/ })).toBeInTheDocument();
	});

	it('dates any other day', async () => {
		await renderWithProviders(<DateNavigator date="2026-09-10" onSelect={vi.fn()} today={TODAY} />);

		expect(screen.getByRole('heading', { level: 1, name: /Thu 10 Sep 2026/ })).toBeInTheDocument();
	});

	/** __root.tsx focuses `h1[tabindex="-1"]` after every navigation (guidebook 18). */
	it('makes the heading programmatically focusable', async () => {
		await renderWithProviders(<DateNavigator date={TODAY} onSelect={vi.fn()} today={TODAY} />);

		expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
	});

	it('steps back a day (R-5)', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date={TODAY} onSelect={onSelect} today={TODAY} />);

		await user.click(screen.getByRole('button', { name: 'Previous day' }));

		expect(onSelect).toHaveBeenCalledWith('2026-09-14');
	});

	it('steps forward a day', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date={TODAY} onSelect={onSelect} today={TODAY} />);

		await user.click(screen.getByRole('button', { name: 'Next day' }));

		expect(onSelect).toHaveBeenCalledWith('2026-09-16');
	});

	it('steps across a month boundary', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date="2026-09-01" onSelect={onSelect} today={TODAY} />);

		await user.click(screen.getByRole('button', { name: 'Previous day' }));

		expect(onSelect).toHaveBeenCalledWith('2026-08-31');
	});

	it('offers Today only when another day is selected', async () => {
		const { rerender } = await renderWithProviders(<DateNavigator date={TODAY} onSelect={vi.fn()} today={TODAY} />);

		expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument();

		rerender(<DateNavigator date="2026-09-10" onSelect={vi.fn()} today={TODAY} />);

		expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
	});

	it('jumps back to today', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date="2026-09-10" onSelect={onSelect} today={TODAY} />);

		await user.click(screen.getByRole('button', { name: 'Today' }));

		expect(onSelect).toHaveBeenCalledWith(TODAY);
	});

	it('picks a date from the calendar the label opens', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date={TODAY} onSelect={onSelect} today={TODAY} />);

		await user.click(screen.getByRole('button', { name: /Today, Tue 15 Sep/ }));

		await user.click(await screen.findByRole('button', { name: 'Thursday, September 10th, 2026' }));

		expect(onSelect).toHaveBeenCalledWith('2026-09-10');
	});

	it('is operable from the keyboard alone (R-5, SPEC 7)', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date={TODAY} onSelect={onSelect} today={TODAY} />);

		await user.tab();
		expect(screen.getByRole('button', { name: 'Previous day' })).toHaveFocus();

		await user.keyboard('{Enter}');
		expect(onSelect).toHaveBeenCalledWith('2026-09-14');
	});
});
