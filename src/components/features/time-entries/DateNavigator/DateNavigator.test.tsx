import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { DateNavigator } from './DateNavigator';

const TODAY = '2026-09-15';

describe('DateNavigator', () => {
	/** `__root.tsx` focuses `h1[tabindex="-1"]` after every navigation. */
	it('names the day in words, on a heading that can be focused programmatically', async () => {
		await renderWithProviders(<DateNavigator date="2026-09-14" onSelect={vi.fn()} today={TODAY} />);

		const heading = screen.getByRole('heading', { level: 1, name: /Yesterday, Mon 14 Sep/ });

		expect(heading).toHaveAttribute('tabindex', '-1');
	});

	it('steps a day at a time, in both directions', async () => {
		const onSelect = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<DateNavigator date="2026-09-01" onSelect={onSelect} today={TODAY} />);

		await user.click(screen.getByRole('button', { name: 'Previous day' }));
		expect(onSelect).toHaveBeenCalledWith('2026-08-31');

		await user.click(screen.getByRole('button', { name: 'Next day' }));
		expect(onSelect).toHaveBeenCalledWith('2026-09-02');
	});
});
