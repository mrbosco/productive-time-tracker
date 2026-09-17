import { queryOptions, useQuery } from '@tanstack/react-query';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import type { Session } from '@/lib/storage';

/** Minutes logged per ISO date, for the seven days of one week. */
export type WeekTotals = Record<string, number>;

function groupByDate(entries: { date: string; minutes: number }[]): WeekTotals {
	const totals: WeekTotals = {};
	for (const entry of entries) {
		totals[entry.date] = (totals[entry.date] ?? 0) + entry.minutes;
	}

	return totals;
}

/**
 * One week of totals from a single request (SPEC 10, X-1): `filter[after]`/`filter[before]` take a
 * range, so seven days cost the same one call a single day does.
 *
 * A `select` over the week's entries rather than a query of its own. The grid (UI-7) needs those
 * entries and the strip needs these sums, and fetching the same range twice to answer both would
 * be a second request for arithmetic that can be done here.
 */
export function weekTotalsQueryOptions(session: Session, date: string) {
	return queryOptions({ ...weekEntriesQueryOptions(session, date), select: groupByDate });
}

export function useWeekTotals(session: Session, date: string) {
	return useQuery(weekTotalsQueryOptions(session, date));
}
