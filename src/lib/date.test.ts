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
	isoDateSchema,
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
	it('formats a local date without going through UTC', () => {
		expect(toIsoDate(new Date(2026, 8, 15))).toBe('2026-09-15');
	});

	it('pads single-digit months and days', () => {
		expect(toIsoDate(new Date(2026, 0, 3))).toBe('2026-01-03');
	});

	/**
	 * The reason this module exists (A-6). `toISOString()` on a local midnight west of Greenwich
	 * reports the previous day, which would silently show yesterday's entries.
	 */
	it('reports the local calendar day even at a time that is another day in UTC', () => {
		expect(toIsoDate(new Date(2026, 8, 15, 23, 30))).toBe('2026-09-15');
		expect(toIsoDate(new Date(2026, 8, 15, 0, 30))).toBe('2026-09-15');
	});
});

describe('parseIsoDate', () => {
	it('builds local midnight on that calendar day', () => {
		const date = parseIsoDate('2026-09-15');

		expect(date.getFullYear()).toBe(2026);
		expect(date.getMonth()).toBe(8);
		expect(date.getDate()).toBe(15);
		expect(date.getHours()).toBe(0);
	});

	it('round-trips with toIsoDate', () => {
		expect(toIsoDate(parseIsoDate('2026-01-01'))).toBe('2026-01-01');
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
	it('steps forward and back', () => {
		expect(addDays('2026-09-15', 1)).toBe('2026-09-16');
		expect(addDays('2026-09-15', -1)).toBe('2026-09-14');
	});

	it('crosses a month boundary', () => {
		expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
		expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
	});

	it('crosses a year boundary', () => {
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
	});

	it('handles a leap day', () => {
		expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
		expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
	});
});

describe('isoDateSchema', () => {
	it('accepts a real calendar date', () => {
		expect(isIsoDate('2026-09-15')).toBe(true);
	});

	it.each(['2026-13-45', '2026-02-30', '2027-02-29'])('rejects %s, which is not a calendar date', (value) => {
		expect(isIsoDate(value)).toBe(false);
	});

	it.each(['', 'today', '2026-9-15', '15-09-2026', '2026-09-15T10:00:00Z'])('rejects the shape %s', (value) => {
		expect(isIsoDate(value)).toBe(false);
	});

	it('parses to the same string it validated', () => {
		expect(isoDateSchema.parse('2026-09-15')).toBe('2026-09-15');
	});
});

describe('formatDayShort and formatDayWithYear', () => {
	it('orders the parts as the design does, with a three-letter month', () => {
		expect(formatDayShort('2026-09-15')).toBe('Tue 15 Sep');
		expect(formatDayWithYear('2026-09-10')).toBe('Thu 10 Sep 2026');
	});

	it('does not pad the day number', () => {
		expect(formatDayShort('2026-09-03')).toBe('Thu 3 Sep');
	});
});

describe('formatDayLabel', () => {
	it('names today', () => {
		expect(formatDayLabel('2026-09-15', '2026-09-15')).toBe('Today, Tue 15 Sep');
	});

	it('names yesterday', () => {
		expect(formatDayLabel('2026-09-14', '2026-09-15')).toBe('Yesterday, Mon 14 Sep');
	});

	it('names yesterday across a month boundary', () => {
		expect(formatDayLabel('2026-08-31', '2026-09-01')).toBe('Yesterday, Mon 31 Aug');
	});

	it('falls back to the dated form for any other day, including tomorrow', () => {
		expect(formatDayLabel('2026-09-10', '2026-09-15')).toBe('Thu 10 Sep 2026');
		expect(formatDayLabel('2026-09-16', '2026-09-15')).toBe('Wed 16 Sep 2026');
	});

	it('defaults to the real clock', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 15, 9, 0));

		expect(formatDayLabel('2026-09-15')).toBe('Today, Tue 15 Sep');
	});
});

describe('startOfWeek', () => {
	it('is the Monday of that week', () => {
		// Tue 15 Sep 2026 -> Mon 14.
		expect(startOfWeek('2026-09-15')).toBe('2026-09-14');
	});

	it('leaves a Monday where it is', () => {
		expect(startOfWeek('2026-09-14')).toBe('2026-09-14');
	});

	/** `getDay()` is 0 for Sunday, so Sunday is the one that goes six days back, not one forward. */
	it('puts Sunday at the end of its own week, not the start of the next', () => {
		expect(startOfWeek('2026-09-20')).toBe('2026-09-14');
	});

	it('crosses a month boundary', () => {
		expect(startOfWeek('2026-09-02')).toBe('2026-08-31');
	});
});

describe('weekDays', () => {
	it('is Monday to Sunday of the week the date falls in', () => {
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

	it('is the same seven days whichever day of that week it is asked about', () => {
		expect(weekDays('2026-09-14')).toEqual(weekDays('2026-09-20'));
	});
});

describe('isWeekend', () => {
	it.each([
		['2026-09-19', true],
		['2026-09-20', true],
		['2026-09-18', false],
		['2026-09-14', false],
	])('says %s is a weekend: %s', (iso, expected) => {
		expect(isWeekend(iso)).toBe(expected);
	});
});

describe('the week strip cell labels', () => {
	it('names the weekday and day for desktop', () => {
		expect(formatWeekdayAndDay('2026-09-14')).toBe('Mon 14');
	});

	it('gives a single initial for mobile', () => {
		expect(formatWeekdayInitial('2026-09-14')).toBe('M');
		expect(formatWeekdayInitial('2026-09-20')).toBe('S');
	});

	it('gives the day number on its own', () => {
		expect(dayOfMonth('2026-09-02')).toBe(2);
	});
});
