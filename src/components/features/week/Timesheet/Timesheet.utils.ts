import type { TimeEntry } from '@/api/types';

export interface TimesheetCell {
	date: string;
	minutes: number;
	/** Every entry behind this cell, newest first. Editing adjusts the first of them. */
	entries: TimeEntry[];
}

export interface TimesheetRow {
	serviceId: string;
	project: string;
	service: string;
	companyName: string | null;
	companyAvatarUrl: string | null;
	cells: TimesheetCell[];
	total: number;
}

export interface Timesheet {
	rows: TimesheetRow[];
	dailyTotals: number[];
	total: number;
}

/** A week of entries as one row per project-and-service, one cell per day. A cell holds the **sum**
 * for that pair, so editing one is ambiguous: the edit adjusts the most recent entry behind it. An
 * empty row added by hand is carried in `extraServiceIds` so it does not vanish when created. */
export function toTimesheet(entries: TimeEntry[], days: string[], extraServiceIds: string[] = []): Timesheet {
	const byService = new Map<string, TimeEntry[]>();
	for (const id of extraServiceIds) byService.set(id, byService.get(id) ?? []);
	for (const entry of entries) {
		if (entry.serviceId === null) continue;
		byService.set(entry.serviceId, [...(byService.get(entry.serviceId) ?? []), entry]);
	}

	const rows = [...byService.entries()]
		.map(([serviceId, owned]) => {
			const service = owned.find((entry) => entry.service !== null)?.service ?? null;
			const cells = days.map((date) => {
				const onDay = owned
					.filter((entry) => entry.date === date)
					.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

				return { date, minutes: onDay.reduce((sum, entry) => sum + entry.minutes, 0), entries: onDay };
			});

			return {
				serviceId,
				project: service?.projectName ?? service?.dealName ?? '',
				service: service?.name ?? 'Unknown service',
				companyName: service?.companyName ?? null,
				companyAvatarUrl: service?.companyAvatarUrl ?? null,
				cells,
				total: cells.reduce((sum, cell) => sum + cell.minutes, 0),
			};
		})
		.sort((left, right) => left.project.localeCompare(right.project) || left.service.localeCompare(right.service));

	const dailyTotals = days.map((_, index) => rows.reduce((sum, row) => sum + (row.cells[index]?.minutes ?? 0), 0));

	return { rows, dailyTotals, total: dailyTotals.reduce((sum, minutes) => sum + minutes, 0) };
}
