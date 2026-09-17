import { queryOptions, useQuery } from '@tanstack/react-query';
import type { TimeEntry } from '@/api/types';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import type { Session } from '@/lib/storage';

/**
 * One day's entries, selected out of the week they fall in.
 *
 * The day and the week were two queries against the same endpoint with the same `fields` and
 * `include`, differing only in the range - so the day was always a subset of a request already
 * being made. Selecting from the one cached week means stepping between days inside a week costs
 * no request at all, and a write invalidates one key instead of two.
 *
 * The API returns a range sorted newest-first, and filtering preserves that order, so the day reads
 * exactly as it did when it was fetched on its own.
 */
export function timeEntriesQueryOptions(session: Session, date: string) {
	return queryOptions({
		...weekEntriesQueryOptions(session, date),
		select: (entries: TimeEntry[]) => entries.filter((entry) => entry.date === date),
	});
}

export function useTimeEntries(session: Session, date: string) {
	return useQuery(timeEntriesQueryOptions(session, date));
}
