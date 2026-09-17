import { queryOptions, useQuery } from '@tanstack/react-query';
import { labelServices, listServices } from '@/api/services';
import type { Service } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/** An hour: the trackable-services list is organization configuration, not a person's data. */
const SERVICES_STALE_TIME = 60 * 60 * 1000;

/** `/services` is organization-wide - `filter[person_id]` is silently ignored - so this cannot be
 * "the services this person can track on". The key still carries the person ID because a
 * different person means a different session; the token never appears in it. */
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
	/** Separate from `service === null` on purpose: "we could not read the list" and "this
	 * organization tracks nothing" need different words, and a create path that cannot tell them
	 * apart would report a network failure as an empty account. */
	isError: boolean;
}

/** One service's "Company · Project · Service" label, including the deal-ID suffix when two would
 * read alike - which is why the whole list is labelled. Falls back to the service's own name, so the
 * line is never empty while the list loads and never wrong if the service was since untracked. */
export function useServiceLabel(session: Session, service: Service | null): string | null {
	const { data } = useQuery(servicesQueryOptions(session));

	if (service === null) return null;

	const match = labelServices(data ?? []).find((candidate) => candidate.service.id === service.id);

	return match?.label ?? service.name;
}

/** The service a new entry is logged against. The API requires one on create but the form has three
 * fields, so the app picks: the chosen default, else the first by name. Sorted client-side because
 * `/services` guarantees no ordering and the pick has to be stable across sessions. */
export function useDefaultService(session: Session): DefaultService {
	const { data, isPending, isError } = useQuery(servicesQueryOptions(session));

	if (data === undefined) return { service: null, label: null, isPending, isError };

	const labelled = labelServices([...data].sort((left, right) => left.name.localeCompare(right.name)));
	const chosen = labelled.find((entry) => entry.service.id === session.defaultServiceId) ?? labelled[0];

	if (chosen === undefined) return { service: null, label: null, isPending: false, isError: false };

	return { service: chosen.service, label: chosen.label, isPending: false, isError: false };
}
