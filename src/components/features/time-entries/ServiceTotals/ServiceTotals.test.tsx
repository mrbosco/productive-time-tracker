import { describe, expect, it } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { render, screen, within } from '@/__tests__/test-utils';
import { ServiceTotals } from './ServiceTotals';
import { groupMinutesByService } from './ServiceTotals.utils';

function buildEntry(id: string, minutes: number, serviceName: string | null): TimeEntry {
	return {
		id,
		date: '2026-09-15',
		minutes,
		note: null,
		draft: false,
		serviceId: serviceName,
		service:
			serviceName === null
				? null
				: { id: serviceName, name: serviceName, dealName: null, dealId: null, companyName: null },
		createdAt: '2026-09-15T16:08:26.527+02:00',
	};
}

describe('groupMinutesByService', () => {
	it('adds up the entries of one service', () => {
		expect(groupMinutesByService([buildEntry('a', 60, 'Development'), buildEntry('b', 45, 'Development')])).toEqual([
			{ name: 'Development', minutes: 105 },
		]);
	});

	it('puts the biggest first, so the card reads as where the day went', () => {
		const grouped = groupMinutesByService([
			buildEntry('a', 30, 'Admin'),
			buildEntry('b', 120, 'Development'),
			buildEntry('c', 60, 'Design'),
		]);

		expect(grouped.map((row) => row.name)).toEqual(['Development', 'Design', 'Admin']);
	});

	it('names an entry with no service rather than dropping it from the totals', () => {
		expect(groupMinutesByService([buildEntry('a', 60, null)])).toEqual([{ name: 'Unknown service', minutes: 60 }]);
	});

	it('is empty for a day with nothing on it', () => {
		expect(groupMinutesByService([])).toEqual([]);
	});
});

describe('ServiceTotals', () => {
	const entries = [buildEntry('a', 120, 'Administrative work'), buildEntry('b', 105, 'Development')];

	it('lists each service with its own total', () => {
		render(<ServiceTotals entries={entries} weekTotals={{ '2026-09-15': 225 }} />);
		const card = screen.getByRole('region', { name: 'Totals by service' });

		expect(within(card).getByText('Administrative work')).toBeInTheDocument();
		expect(within(card).getByText('2h')).toBeInTheDocument();
		expect(within(card).getByText('1h 45m')).toBeInTheDocument();
	});

	it('totals the day from the entries and the week from the week query', () => {
		render(<ServiceTotals entries={entries} weekTotals={{ '2026-09-14': 375, '2026-09-15': 225 }} />);

		expect(screen.getByText('Day total').parentElement).toHaveTextContent('3h 45m');
		expect(screen.getByText('Week total').parentElement).toHaveTextContent('10h');
	});

	/** A week that failed to load is not a week of zero hours. */
	it('leaves the week total blank rather than reporting 0h when the week failed', () => {
		render(<ServiceTotals entries={entries} weekTotals={undefined} isWeekError />);

		expect(screen.getByText('Week total').parentElement).toHaveTextContent('unavailable');
		expect(screen.getByText('Week total').parentElement).not.toHaveTextContent('0h');
	});
});
