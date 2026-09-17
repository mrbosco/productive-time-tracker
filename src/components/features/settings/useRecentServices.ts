import { useQuery } from '@tanstack/react-query';
import { listTimeEntriesInRange } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import { addDays, todayIso } from '@/lib/date';
import type { Session } from '@/lib/storage';

const RECENT_DAYS = 30;
/** Five minutes: what was logged recently changes slowly, and only while the picker is open. */
const RECENT_STALE_TIME = 5 * 60 * 1000;

/**
 * The services this person has logged against in the last thirty days, which is how the picker
 * decides what to put near the top and what to mark `Recent`.
 *
 * Only fetched while the sheet is open. It is a second request, which is why it is not made on the
 * day view's behalf: opening a picker is a deliberate act and one that can afford it, whereas the
 * day has to render on one request (SPEC 4.2).
 */
export function useRecentServiceIds(session: Session, enabled: boolean): Set<string> {
	const to = todayIso();
	const from = addDays(to, -RECENT_DAYS);
	const { data } = useQuery({
		queryKey: ['recent-services', session.personId, from, to],
		queryFn: () => listTimeEntriesInRange(toAuth(session), session.personId, from, to),
		staleTime: RECENT_STALE_TIME,
		enabled,
	});

	return new Set((data ?? []).map((entry) => entry.serviceId).filter((id) => id !== null));
}
