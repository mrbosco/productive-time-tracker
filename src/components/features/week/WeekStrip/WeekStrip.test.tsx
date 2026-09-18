import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/__tests__/test-utils';
import { WeekStrip } from './WeekStrip';

const TODAY = '2026-09-16';
const TOTALS = { '2026-09-14': 375, '2026-09-15': 225 };

function renderStrip(date = '2026-09-15', overrides: Partial<Parameters<typeof WeekStrip>[0]> = {}) {
	return renderWithProviders(
		<WeekStrip date={date} weekTotals={TOTALS} isPending={false} today={TODAY} {...overrides} />
	);
}

describe('WeekStrip', () => {
	/**
	 * By the panel's accessible name rather than its visible text. The total is rendered twice - in
	 * the strip for a wide screen and in a row beneath it for a phone - and CSS decides which one is
	 * shown, which jsdom does not evaluate (`css: false`). The name is unique, and it carries the
	 * figure, so this asserts more than the text match it replaces. The phone row is covered where
	 * viewports are real, in `e2e/day.spec.ts`.
	 */
	it('shows the seven days of the selected week plus the week total', async () => {
		await renderStrip();

		expect(screen.getAllByRole('link')).toHaveLength(7);
		expect(screen.getByLabelText('Weekly total, 10h')).toBeInTheDocument();
	});

	it('shows what was logged on a day that has entries', async () => {
		await renderStrip();

		expect(screen.getByText('6h 15m')).toBeInTheDocument();
		expect(screen.getByText('3h 45m')).toBeInTheDocument();
	});

	/**
	 * A week that could not be read is not a week of zero hours. Every cell would otherwise fall
	 * through to `0h` or a dash and announce "nothing logged" for days that may hold hours.
	 */
	it('shows no totals at all when the week failed to load', async () => {
		await renderStrip('2026-09-15', { weekTotals: undefined, isError: true });

		expect(screen.getByRole('link', { name: 'Mon 14 Sep, total unavailable' })).toBeInTheDocument();
		expect(screen.queryByText('0h')).not.toBeInTheDocument();
		expect(screen.queryByText('—')).not.toBeInTheDocument();
	});

	it('links each day to its own day view', async () => {
		await renderStrip();

		expect(screen.getByRole('link', { name: /^Mon 14 Sep/ })).toHaveAttribute('href', '/day/2026-09-14');
	});

	it('keeps every day reachable when the totals could not be loaded', async () => {
		await renderStrip('2026-09-15', { weekTotals: undefined, isError: true });

		expect(screen.getAllByRole('link')).toHaveLength(7);
	});
});
