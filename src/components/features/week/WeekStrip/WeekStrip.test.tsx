import { describe, expect, it } from 'vitest';
import { cleanup, renderWithProviders, screen } from '@/__tests__/test-utils';
import { WeekStrip } from './WeekStrip';

const TODAY = '2026-09-16';
const TOTALS = { '2026-09-14': 375, '2026-09-15': 225 };

function renderStrip(date = '2026-09-15', overrides: Partial<Parameters<typeof WeekStrip>[0]> = {}) {
	return renderWithProviders(
		<WeekStrip date={date} weekTotals={TOTALS} isPending={false} today={TODAY} {...overrides} />
	);
}

describe('WeekStrip', () => {
	it('shows the seven days of the selected week plus the week total', async () => {
		await renderStrip();

		expect(screen.getAllByRole('link')).toHaveLength(7);
		expect(screen.getByText('Week')).toBeInTheDocument();
	});

	/**
	 * Rendered twice rather than re-rendered: `renderWithProviders` puts the router above the
	 * component under test, and RTL's `rerender` replaces that whole tree, so a `<Link>` would
	 * find no router the second time.
	 */
	it('shows the same week whichever of its days is selected', async () => {
		await renderStrip('2026-09-14');
		const fromMonday = screen.getAllByRole('link').map((link) => link.getAttribute('href'));

		cleanup();
		await renderStrip('2026-09-20');

		expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(fromMonday);
	});

	it('totals the week from the days it was given', async () => {
		await renderStrip();

		// 375 + 225 = 600 minutes.
		expect(screen.getByText('10h')).toBeInTheDocument();
	});

	it('shows what was logged on a day that has entries', async () => {
		await renderStrip();

		expect(screen.getByText('6h 15m')).toBeInTheDocument();
		expect(screen.getByText('3h 45m')).toBeInTheDocument();
	});

	/** A past workday with nothing on it is worth noticing; today, a weekend or a future day is not. */
	it('dashes a past workday with nothing logged, and zeroes today, a weekend or a future day', async () => {
		await renderStrip('2026-09-17');

		// Mon 14 and Tue 15 have totals. Wed 16 is today and empty, and is not called out for it.
		expect(screen.getByRole('link', { name: /^Wed 16 Sep/ })).toHaveTextContent('0h');
		// Thu 17 has not happened yet and Sat 19 is the weekend; neither is worth a dash.
		expect(screen.getByRole('link', { name: /^Thu 17 Sep/ })).toHaveTextContent('0h');
		expect(screen.getByRole('link', { name: /^Sat 19 Sep/ })).toHaveTextContent('0h');
	});

	it('dashes a workday that is genuinely past', async () => {
		await renderStrip('2026-09-15', { today: '2026-09-20' });

		expect(screen.getByRole('link', { name: /^Wed 16 Sep/ })).toHaveTextContent('—');
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

	/**
	 * The visible text is two labels, one per breakpoint, and reads as "M 14 6h 15m" when
	 * concatenated. The cell carries its own name instead.
	 */
	it('names each cell in full rather than leaving the split visible labels to be read out', async () => {
		await renderStrip();

		expect(screen.getByRole('link', { name: 'Mon 14 Sep, 6h 15m logged' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Thu 17 Sep, nothing logged' })).toBeInTheDocument();
	});

	/** The router marks its own active link, so the rule under the cell is not the only signal. */
	it('marks the day being shown for assistive technology, not only with a rule', async () => {
		await renderWithProviders(<WeekStrip date="2026-09-15" weekTotals={TOTALS} isPending={false} today={TODAY} />, {
			initialEntry: '/day/2026-09-15',
		});

		expect(screen.getByRole('link', { name: /^Tue 15 Sep/ })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: /^Mon 14 Sep/ })).not.toHaveAttribute('aria-current');
	});

	it('links each day to its own day view (R-5)', async () => {
		await renderStrip();

		expect(screen.getByRole('link', { name: /^Mon 14 Sep/ })).toHaveAttribute('href', '/day/2026-09-14');
	});

	it('shows no totals while the week is loading, rather than stale ones', async () => {
		await renderStrip('2026-09-15', { isPending: true, weekTotals: undefined });

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.queryByText('6h 15m')).not.toBeInTheDocument();
	});

	it('keeps every day reachable when the totals could not be loaded', async () => {
		await renderStrip('2026-09-15', { weekTotals: undefined, isError: true });

		expect(screen.getAllByRole('link')).toHaveLength(7);
	});

	it('is a landmark, not a loose run of links between the heading and the list', async () => {
		await renderStrip();

		expect(screen.getByRole('navigation', { name: 'Week' })).toBeInTheDocument();
	});
});
