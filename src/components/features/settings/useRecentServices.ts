import { useQuery } from '@tanstack/react-query';
import { listRecentServiceIds } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import { addDays, todayIso } from '@/lib/date';
import type { Session } from '@/lib/storage';

const RECENT_DAYS = 30;
const RECENT_STALE_TIME = 5 * 60 * 1000;

/** The services this person has logged against in the last thirty days, which is how the picker
 * decides what to put near the top. Only fetched while the sheet is open: it is a second request,
 * and the day view has to render on one. */
export function useRecentServiceIds(session: Session, enabled: boolean): Set<string> {
	const to = todayIso();
	const from = addDays(to, -RECENT_DAYS);
	const { data } = useQuery({
		queryKey: ['recent-services', session.personId, from, to],
		queryFn: () => listRecentServiceIds(toAuth(session), session.personId, from, to),
		staleTime: RECENT_STALE_TIME,
		enabled,
	});

	return new Set(data ?? []);
}
