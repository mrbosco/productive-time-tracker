import { describe, expect, it } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { render, screen } from '@/__tests__/test-utils';
import { DaySummary } from './DaySummary';
import { calculateDayTotal } from '../totals.utils';

function buildEntry(minutes: number, id: string): TimeEntry {
	return {
		id,
		date: '2026-09-15',
		minutes,
		note: null,
		draft: false,
		serviceId: '16887825',
		service: null,
		createdAt: '2026-09-15T16:08:26.527+02:00',
	};
}

describe('calculateDayTotal', () => {
	it('sums the minutes', () => {
		expect(calculateDayTotal([buildEntry(240, 'a'), buildEntry(0, 'b'), buildEntry(300, 'c')])).toBe(540);
	});

	it('is zero for a day with nothing on it', () => {
		expect(calculateDayTotal([])).toBe(0);
	});
});

describe('DaySummary', () => {
	it('shows the day total and the count', () => {
		render(<DaySummary entries={[buildEntry(240, 'a'), buildEntry(0, 'b'), buildEntry(300, 'c')]} />);

		expect(screen.getByText('9h')).toBeInTheDocument();
		expect(screen.getByText(/3 entries/)).toBeInTheDocument();
	});

	it('counts one entry in the singular', () => {
		render(<DaySummary entries={[buildEntry(90, 'a')]} />);

		expect(screen.getByText(/1 entry/)).toBeInTheDocument();
		expect(screen.queryByText(/1 entries/)).not.toBeInTheDocument();
	});

	it('counts a zero-minute entry towards the total count but not the time', () => {
		render(<DaySummary entries={[buildEntry(0, 'a'), buildEntry(0, 'b')]} />);

		expect(screen.getByText('0h')).toBeInTheDocument();
		expect(screen.getByText(/2 entries/)).toBeInTheDocument();
	});
});
