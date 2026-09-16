import { queryOptions, useQuery } from '@tanstack/react-query';
import { listTimeEntriesInRange } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import { startOfWeek, weekDays } from '@/lib/date';
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
 * range, so seven days cost the same one call a single day does, and the grouping happens here.
 *
 * Keyed on the week's Monday rather than the selected date (SPEC 6.3), so stepping between days
 * inside a week reuses the cache instead of refetching the same seven days.
 */
export function weekTotalsQueryOptions(session: Session, date: string) {
	const monday = startOfWeek(date);
	const days = weekDays(date);

	return queryOptions({
		queryKey: ['week-totals', session.personId, monday],
		queryFn: async () => {
			const entries = await listTimeEntriesInRange(toAuth(session), session.personId, monday, days[6]);

			return groupByDate(entries);
		},
	});
}

export function useWeekTotals(session: Session, date: string) {
	return useQuery(weekTotalsQueryOptions(session, date));
}
