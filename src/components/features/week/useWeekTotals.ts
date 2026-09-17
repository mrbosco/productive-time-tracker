import { queryOptions, useQuery } from '@tanstack/react-query';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import type { Session } from '@/lib/storage';

export type WeekTotals = Record<string, number>;

function groupByDate(entries: { date: string; minutes: number }[]): WeekTotals {
	const totals: WeekTotals = {};
	for (const entry of entries) {
		totals[entry.date] = (totals[entry.date] ?? 0) + entry.minutes;
	}

	return totals;
}

/** One week of totals from a single request: `filter[after]`/`filter[before]` take a range, so seven
 * days cost the same one call a single day does. A `select` over the week's entries rather than a
 * query of its own - the grid needs the entries and the strip needs these sums. */
export function weekTotalsQueryOptions(session: Session, date: string) {
	return queryOptions({ ...weekEntriesQueryOptions(session, date), select: groupByDate });
}

export function useWeekTotals(session: Session, date: string) {
	return useQuery(weekTotalsQueryOptions(session, date));
}
