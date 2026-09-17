import { parseIsoDate, startOfWeek } from './date';

/**
 * How much work is expected of a person on a given day, from `people.availabilities`.
 *
 * The API hands that over as an **attribute holding a JSON string**, not as a nested object, so it
 * needs a second parse. Inside is one entry per period:
 *
 *     [["2026-09-15", null, [8, 8, 8, 8, 8, 0, 0, 8, 8, 8, 8, 8, 0, 0], 65416]]
 *
 * `[startDate, endDate, hours, id]`, where `endDate` is null while the period is open-ended.
 *
 * `hours` is **fourteen** numbers rather than seven: a fortnight, Monday to Sunday twice, so a
 * schedule that alternates week to week can be expressed. Index 0 is Monday - the recorded period
 * begins on a Tuesday and still reads `8,8,8,8,8,0,0`, which only lines up Monday-based.
 *
 * Both weeks are identical in every account this was recorded against, so **the alternation itself
 * is untested against real data**; reading the second half is correct for a fortnightly schedule
 * and indistinguishable from ignoring it here.
 *
 * A zero is a non-working day, which is a better answer than "is it a weekend" - it catches a
 * four-day week, and it is what the week strip hatches on.
 */
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

/**
 * The period covering a date, or undefined. The last match wins, so a period added later overrides
 * an older open-ended one that never got an end date.
 */
function periodFor(periods: AvailabilityPeriod[], iso: string): AvailabilityPeriod | undefined {
	return periods.findLast((period) => iso >= period.startDate && (period.endDate === null || iso <= period.endDate));
}

/**
 * Expected minutes for one day, or null when nothing says - which is not the same as zero, and is
 * why UI-6 hides its numbers rather than printing `0h expected` for everybody.
 */
export function expectedMinutesOn(periods: AvailabilityPeriod[], iso: string): number | null {
	const period = periodFor(periods, iso);
	if (period === undefined || period.hours.length === 0) return null;

	const weekday = (parseIsoDate(iso).getDay() + 6) % 7;
	// Which half of the fortnight this week falls in, counted from the period's own first week so
	// the pattern stays put as the weeks go by.
	const weeksIn = Math.floor(
		(parseIsoDate(startOfWeek(iso)).getTime() - parseIsoDate(startOfWeek(period.startDate)).getTime()) /
			(7 * 24 * 60 * 60 * 1000)
	);
	const half = period.hours.length > 7 && Math.abs(weeksIn % 2) === 1 ? 7 : 0;

	return (period.hours[half + weekday] ?? period.hours[weekday] ?? 0) * 60;
}
