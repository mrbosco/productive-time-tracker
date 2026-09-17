import { parseIsoDate, startOfWeek } from './date';

/** How much work is expected of a person on a given day. The API hands `people.availabilities` over
 * as an **attribute holding a JSON string**, one `[startDate, endDate, hours, id]` per period, e.g.
 * `[["2026-09-15", null, [8,8,8,8,8,0,0, 8,8,8,8,8,0,0], 65416]]`. `hours` is **fourteen** numbers,
 * a fortnight, Monday first; a zero is a non-working day. */
export interface AvailabilityPeriod {
	startDate: string;
	endDate: string | null;
	/** Hours per day, Monday first, two weeks long. */
	hours: number[];
}

/** Returns an empty list for anything that is not the shape above, including null and bad JSON. */
export function parseAvailabilities(raw: string | null): AvailabilityPeriod[] {
	if (raw === null) return [];

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}

	if (!Array.isArray(parsed)) return [];

	return parsed.flatMap((entry): AvailabilityPeriod[] => {
		if (!Array.isArray(entry)) return [];
		const [startDate, endDate, hours] = entry as unknown[];
		if (typeof startDate !== 'string') return [];
		if (!Array.isArray(hours) || !hours.every((hour) => typeof hour === 'number')) return [];

		return [{ startDate, endDate: typeof endDate === 'string' ? endDate : null, hours: hours }];
	});
}

/** Last match wins, so a period added later overrides an older open-ended one. */
function periodFor(periods: AvailabilityPeriod[], iso: string): AvailabilityPeriod | undefined {
	return periods.findLast((period) => iso >= period.startDate && (period.endDate === null || iso <= period.endDate));
}

/** Expected minutes for one day, or null when nothing says - which is not the same as zero. */
export function expectedMinutesOn(periods: AvailabilityPeriod[], iso: string): number | null {
	const period = periodFor(periods, iso);
	if (period === undefined || period.hours.length === 0) return null;

	const weekday = (parseIsoDate(iso).getDay() + 6) % 7;
	// Which half of the fortnight this week falls in, counted from the period's own first week.
	const weeksIn = Math.floor(
		(parseIsoDate(startOfWeek(iso)).getTime() - parseIsoDate(startOfWeek(period.startDate)).getTime()) /
			(7 * 24 * 60 * 60 * 1000)
	);
	const half = period.hours.length > 7 && Math.abs(weeksIn % 2) === 1 ? 7 : 0;

	return (period.hours[half + weekday] ?? period.hours[weekday] ?? 0) * 60;
}
