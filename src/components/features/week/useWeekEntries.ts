import { queryOptions, useQuery } from '@tanstack/react-query';
import { listTimeEntriesInRange } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import { startOfWeek, weekDays } from '@/lib/date';
import type { Session } from '@/lib/storage';

/**
 * The one key a week lives under. Exported because five mutations invalidate it, and a week that
 * two of them spelled differently would leave the strip and the grid disagreeing.
 */
export function weekQueryKey(session: Session, date: string) {
	return ['week-entries', session.personId, startOfWeek(date)] as const;
}

/**
 * Every entry in the week a date falls in - one request, keyed on its Monday, so stepping between
 * days inside a week reuses the cache (SPEC 6.3).
 *
 * The same query the week strip reads: `useWeekTotals` is this with a `select` over it. They were
 * briefly two keys over identical requests, which made the timesheet fetch the week twice and gave
 * every mutation a second thing to remember to invalidate.
 */
export function weekEntriesQueryOptions(session: Session, date: string) {
	const days = weekDays(date);
	const [from = date] = days;
	const to = days.at(-1) ?? date;

	return queryOptions({
		queryKey: weekQueryKey(session, date),
		queryFn: () => listTimeEntriesInRange(toAuth(session), session.personId, from, to),
	});
}

export function useWeekEntries(session: Session, date: string) {
	return useQuery(weekEntriesQueryOptions(session, date));
}
