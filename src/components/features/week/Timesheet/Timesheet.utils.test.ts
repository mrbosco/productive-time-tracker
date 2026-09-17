import { describe, expect, it } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { buildService } from '@/__tests__/test-utils';
import { toTimesheet } from './Timesheet.utils';

const DAYS = ['2026-09-14', '2026-09-15', '2026-09-16'];

function entry(id: string, date: string, minutes: number, serviceId: string, createdAt: string): TimeEntry {
	return {
		id,
		date,
		minutes,
		note: null,
		draft: false,
		serviceId,
		service: buildService({ id: serviceId, name: `Service ${serviceId}`, projectName: `Project ${serviceId}` }),
		createdAt,
	};
}

describe('toTimesheet', () => {
	it('sums a day into one cell and totals the row and the week', () => {
		const sheet = toTimesheet(
			[
				entry('1', '2026-09-14', 60, 'a', '2026-09-14T09:00:00Z'),
				entry('2', '2026-09-14', 30, 'a', '2026-09-14T11:00:00Z'),
				entry('3', '2026-09-16', 45, 'b', '2026-09-16T09:00:00Z'),
			],
			DAYS
		);

		expect(sheet.rows.map((row) => row.cells.map((cell) => cell.minutes))).toEqual([
			[90, 0, 0],
			[0, 0, 45],
		]);
		expect(sheet.rows.map((row) => row.total)).toEqual([90, 45]);
		expect(sheet.dailyTotals).toEqual([90, 0, 45]);
		expect(sheet.total).toBe(135);
	});

	/** Editing a cell adjusts the most recent entry behind it, so the order it hands back matters. */
	it('puts the newest entry first in a cell that holds several', () => {
		const sheet = toTimesheet(
			[
				entry('older', '2026-09-14', 60, 'a', '2026-09-14T09:00:00Z'),
				entry('newer', '2026-09-14', 30, 'a', '2026-09-14T15:00:00Z'),
			],
			DAYS
		);

		expect(sheet.rows[0]?.cells[0]?.entries.map((each) => each.id)).toEqual(['newer', 'older']);
	});

	/** A row added by hand has nothing logged on it yet and must not vanish the moment it appears. */
	it('keeps a row that was added but never filled in', () => {
		const sheet = toTimesheet([], DAYS, ['a']);

		expect(sheet.rows).toHaveLength(1);
		expect(sheet.rows[0]?.total).toBe(0);
	});
});
