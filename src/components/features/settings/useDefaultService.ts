import { queryOptions, useQuery } from '@tanstack/react-query';
import { labelServices, listServices } from '@/api/services';
import type { Service } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/** An hour: the trackable-services list is organization configuration, not a person's data. */
const SERVICES_STALE_TIME = 60 * 60 * 1000;

/**
 * `/services` is organization-wide - `filter[person_id]` is silently ignored - so this cannot be
 * "the services this person can track on" (A-1). The key still carries the person ID because a
 * different person means a different session; the token never appears in it (api-client rule 7).
 */
export function servicesQueryOptions(session: Session) {
	return queryOptions({
		queryKey: ['services', session.personId],
		queryFn: () => listServices(toAuth(session)),
		staleTime: SERVICES_STALE_TIME,
	});
}

export interface DefaultService {
	service: Service | null;
	/** "Company · Project · Service", disambiguated by deal ID where that form still collides. */
	label: string | null;
	isPending: boolean;
	/**
	 * Separate from `service === null` on purpose: "we could not read the list" and "this
	 * organization tracks nothing" need different words, and a create path that cannot tell them
	 * apart would report a network failure as an empty account.
	 */
	isError: boolean;
}

/**
 * The service a new entry is logged against (A-1). The API requires one on create but the form has
 * only three fields, so the app picks: the person's chosen default, else the first service by name.
 * Sorting is client-side and by name because the pick has to be stable across sessions, and
 * `/services` guarantees no ordering.
 *
 * The session is a parameter rather than a `useSession()` call because every caller sits behind the
 * auth guard and already holds a non-null one - taking it here would mean handling a null that
 * cannot happen.
 */
export function useDefaultService(session: Session): DefaultService {
	const { data, isPending, isError } = useQuery(servicesQueryOptions(session));

	if (data === undefined) return { service: null, label: null, isPending, isError };

	const labelled = labelServices([...data].sort((left, right) => left.name.localeCompare(right.name)));
	const chosen = labelled.find((entry) => entry.service.id === session.defaultServiceId) ?? labelled[0];

	if (chosen === undefined) return { service: null, label: null, isPending: false, isError: false };

	return { service: chosen.service, label: chosen.label, isPending: false, isError: false };
}
