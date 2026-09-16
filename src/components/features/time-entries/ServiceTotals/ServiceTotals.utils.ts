import type { TimeEntry } from '@/api/types';

export interface ServiceMinutes {
	name: string;
	minutes: number;
}

/**
 * Minutes per service, largest first, so the card reads as "where the day went" rather than as the
 * order the entries happen to have been logged in.
 *
 * Grouped by service name rather than by ID: two services can share a name, and merging them under
 * one row is closer to what someone reading a total wants than two identical rows would be.
 */
export function groupMinutesByService(entries: TimeEntry[]): ServiceMinutes[] {
	const totals = new Map<string, number>();

	for (const entry of entries) {
		const name = entry.service?.name ?? 'Unknown service';
		totals.set(name, (totals.get(name) ?? 0) + entry.minutes);
	}

	return [...totals]
		.map(([name, minutes]) => ({ name, minutes }))
		.sort((left, right) => right.minutes - left.minutes || left.name.localeCompare(right.name));
}
