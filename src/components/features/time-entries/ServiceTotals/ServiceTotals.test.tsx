import { describe, expect, it } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { buildService, render, screen } from '@/__tests__/test-utils';
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
		service: serviceName === null ? null : buildService({ id: serviceName, name: serviceName }),
		createdAt: '2026-09-15T16:08:26.527+02:00',
	};
}

describe('groupMinutesByService', () => {
	it('adds each service up and puts the biggest first, so the card reads as where the day went', () => {
		const grouped = groupMinutesByService([
			buildEntry('a', 30, 'Admin'),
			buildEntry('b', 60, 'Development'),
			buildEntry('c', 60, 'Design'),
			buildEntry('d', 45, 'Development'),
		]);

		expect(grouped).toEqual([
			{ name: 'Development', minutes: 105 },
			{ name: 'Design', minutes: 60 },
			{ name: 'Admin', minutes: 30 },
		]);
	});

	it('names an entry with no service rather than dropping it from the totals', () => {
		expect(groupMinutesByService([buildEntry('a', 60, null)])).toEqual([{ name: 'Unknown service', minutes: 60 }]);
	});
});

describe('ServiceTotals', () => {
	const entries = [buildEntry('a', 120, 'Administrative work'), buildEntry('b', 105, 'Development')];

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
