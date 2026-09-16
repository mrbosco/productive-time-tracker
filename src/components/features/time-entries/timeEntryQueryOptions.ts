import { queryOptions } from '@tanstack/react-query';
import { getTimeEntry } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/**
 * One entry by ID, for the edit route (R-11).
 *
 * The key is `['time-entry', id]` (SPEC 6.3) and carries no person, unlike every other key in the
 * app. That is safe rather than inconsistent: an entry ID is unique across Productive, and
 * `useSession`'s `logout` calls `queryClient.clear()`, so nothing fetched for one person survives
 * into the next session. The token is never part of a key (api-client rule 7, ADR-0004).
 *
 * The day list cannot seed this. It is cached under `['time-entries', personId, date]`, and reading
 * an entry out of it would leave the edit form working only when arrived at from the day it belongs
 * to - a deep link or a refresh would still have to fetch. One key, one path, always correct.
 *
 * Options and no hook, unlike `useTimeEntries`: the only caller is the edit route's loader, which
 * awaits `ensureQueryData` (ADR-0007) and hands the entry to the form as loader data. A subscription
 * would re-seed a form someone is typing in, so there is deliberately nothing here to subscribe with.
 */
export function timeEntryQueryOptions(session: Session, id: string) {
	return queryOptions({
		queryKey: ['time-entry', id],
		queryFn: () => getTimeEntry(toAuth(session), id),
	});
}
