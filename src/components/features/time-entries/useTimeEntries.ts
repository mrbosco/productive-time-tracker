import { queryOptions, useQuery } from '@tanstack/react-query';
import { listTimeEntries } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/**
 * One day's entries for the logged-in person (R-3, R-4).
 *
 * The key is `['time-entries', personId, date]` (SPEC 6.3): per-person because logging out and
 * back in as someone else must not reuse the cache, and per-date because that is the unit the API
 * is asked for and the unit a create or delete invalidates (SPEC 4.2). The token is never part of
 * a key (api-client rule 7, ADR-0004).
 *
 * `personId` comes from the session rather than from user input - the assignment's "for the sake
 * of simplicity, set it dynamically" (R-10) - and is what makes R-4 true on the wire rather than
 * by filtering after the fact.
 */
export function timeEntriesQueryOptions(session: Session, date: string) {
	return queryOptions({
		queryKey: ['time-entries', session.personId, date],
		queryFn: () => listTimeEntries(toAuth(session), session.personId, date),
	});
}

export function useTimeEntries(session: Session, date: string) {
	return useQuery(timeEntriesQueryOptions(session, date));
}
