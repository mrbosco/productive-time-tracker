import { queryOptions } from '@tanstack/react-query';
import { getTimeEntry } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/** One entry by ID, for the edit route. The key carries no person, unlike every other: an entry ID is
 * unique and `logout` clears the cache (ADR-0004). Options and no hook, because a subscription would
 * re-seed a form someone is typing in. */
export function timeEntryQueryOptions(session: Session, id: string) {
	return queryOptions({
		queryKey: ['time-entry', id],
		queryFn: () => getTimeEntry(toAuth(session), id),
	});
}
