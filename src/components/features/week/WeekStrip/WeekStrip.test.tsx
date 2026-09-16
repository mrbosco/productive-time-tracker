import { describe, expect, it } from 'vitest';
import { cleanup, renderWithProviders, screen } from '@/__tests__/test-utils';
import { WeekStrip } from './WeekStrip';

const TODAY = '2026-09-16';
const TOTALS = { '2026-09-14': 375, '2026-09-15': 225 };

function renderStrip(date = '2026-09-15', overrides: Partial<Parameters<typeof WeekStrip>[0]> = {}) {
	return renderWithProviders(<WeekStrip date={date} totals={TOTALS} isPending={false} today={TODAY} {...overrides} />);
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

	/** A past workday with nothing on it is worth noticing; a weekend or a future day is not. */
	it('dashes a past workday with nothing logged, and zeroes a weekend or a future day', async () => {
		const { container } = await renderStrip();
		const cellText = (name: string) =>
			container.querySelector(`[aria-label^="${name}"]`)?.textContent?.replace(/\s+/g, ' ') ?? '';

		// Wed 16 is today and has nothing on it, so the absence is called out.
		expect(cellText('Wed 16 Sep')).toContain('—');
		// Thu 17 has not happened yet and Sat 19 is the weekend; neither is worth a dash.
		expect(cellText('Thu 17 Sep')).toContain('0h');
		expect(cellText('Sat 19 Sep')).toContain('0h');
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
		await renderWithProviders(<WeekStrip date="2026-09-15" totals={TOTALS} isPending={false} today={TODAY} />, {
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
		await renderStrip('2026-09-15', { isPending: true, totals: undefined });

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.queryByText('6h 15m')).not.toBeInTheDocument();
	});

	it('still renders the week when the totals could not be loaded', async () => {
		await renderStrip('2026-09-15', { totals: undefined });

		expect(screen.getAllByRole('link')).toHaveLength(7);
	});
});
