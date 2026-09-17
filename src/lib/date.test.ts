import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	addDays,
	dayOfMonth,
	formatDayLabel,
	formatWeekdayAndDay,
	formatWeekdayInitial,
	formatDayShort,
	formatDayWithYear,
	isIsoDate,
	isWeekend,
	parseIsoDate,
	startOfWeek,
	todayIso,
	toIsoDate,
	weekDays,
} from './date';

afterEach(() => {
	vi.useRealTimers();
});

describe('toIsoDate', () => {
	it('pads single-digit months and days', () => {
		expect(toIsoDate(new Date(2026, 0, 3))).toBe('2026-01-03');
	});

	/**
	 * The reason this module exists. `toISOString()` on a local midnight west of Greenwich reports
	 * the previous day, which would silently show yesterday's entries.
	 */
	it('reports the local calendar day even at a time that is another day in UTC', () => {
		expect(toIsoDate(new Date(2026, 8, 15, 23, 30))).toBe('2026-09-15');
		expect(toIsoDate(new Date(2026, 8, 15, 0, 30))).toBe('2026-09-15');
	});
});

describe('parseIsoDate', () => {
	it('builds local midnight on that calendar day and round-trips', () => {
		const date = parseIsoDate('2026-09-15');

		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(8);
		expect(date.getDate()).toBe(15);
		expect(date.getHours()).toBe(0);
		expect(toIsoDate(date)).toBe('2026-09-15');
	});
});

describe('todayIso', () => {
	it('reads the clock as a local calendar date', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 15, 22, 0));

		expect(todayIso()).toBe('2026-09-15');
	});
});

describe('addDays', () => {
	it.each<[string, number, string]>([
		['2026-09-15', 1, '2026-09-16'],
		['2026-12-31', 1, '2027-01-01'],
		['2026-10-01', -1, '2026-09-30'],
	])('steps %s by %d to %s, across month and year boundaries', (iso, delta, expected) => {
		expect(addDays(iso, delta)).toBe(expected);
	});
});

describe('isIsoDate', () => {
	it('accepts a real calendar date', () => {
		expect(isIsoDate('2026-09-15')).toBe(true);
	});

	it.each(['2026-02-30', '2026-09-15T10:00:00Z'])(
		'rejects %s, which is not a calendar date in the expected shape',
		(value) => {
			expect(isIsoDate(value)).toBe(false);
		}
	);
});

describe('formatDayShort and formatDayWithYear', () => {
	it('uses the design order, a three-letter month and an unpadded day', () => {
		expect(formatDayShort('2026-09-03')).toBe('Thu 3 Sep');
		expect(formatDayWithYear('2026-09-10')).toBe('Thu 10 Sep 2026');
	});
});

describe('formatDayLabel', () => {
	it.each([
		['2026-09-15', '2026-09-15', 'Today, Tue 15 Sep'],
		['2026-08-31', '2026-09-01', 'Yesterday, Mon 31 Aug'],
	])('names %s, seen from %s, as %s', (iso, today, expected) => {
		expect(formatDayLabel(iso, today)).toBe(expected);
	});

	it('falls back to the dated form for any other day, including tomorrow', () => {
		expect(formatDayLabel('2026-09-10', '2026-09-15')).toBe('Thu 10 Sep 2026');
		expect(formatDayLabel('2026-09-16', '2026-09-15')).toBe('Wed 16 Sep 2026');
	});
});

describe('startOfWeek and weekDays', () => {
	/** `getDay()` is 0 for Sunday, so Sunday is the one that goes six days back, not one forward. */
	it.each([
		['2026-09-15', '2026-09-14'],
		['2026-09-20', '2026-09-14'],
	])('puts %s in the week beginning Monday %s', (iso, expected) => {
		expect(startOfWeek(iso)).toBe(expected);
	});

	it('lists Monday to Sunday of the week the date falls in', () => {
		expect(weekDays('2026-09-16')).toEqual([
			'2026-09-14',
			'2026-09-15',
			'2026-09-16',
			'2026-09-17',
			'2026-09-18',
			'2026-09-19',
			'2026-09-20',
		]);
	});
});

describe('isWeekend', () => {
	it('tells a Sunday from a Friday', () => {
		expect(isWeekend('2026-09-20')).toBe(true);
		expect(isWeekend('2026-09-18')).toBe(false);
	});
});

describe('the week strip cell labels', () => {
	it('names the weekday and day for desktop, an initial for mobile, and the bare day number', () => {
		expect(formatWeekdayAndDay('2026-09-14')).toBe('Mon 14');
		expect(formatWeekdayInitial('2026-09-14')).toBe('M');
		expect(formatWeekdayInitial('2026-09-20')).toBe('S');
		expect(dayOfMonth('2026-09-02')).toBe(2);
	});
});
