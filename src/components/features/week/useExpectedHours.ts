import { useQuery } from '@tanstack/react-query';
import { findMembershipForOrganization } from '@/api/organization-memberships';
import { sessionQueryOptions } from '@/components/features/auth/useSession';
import { type AvailabilityPeriod, parseAvailabilities } from '@/lib/availability';
import type { Session } from '@/lib/storage';

/**
 * The person's expected working hours (UI-6).
 *
 * No request of its own: `availabilities` rides the membership call login already makes, so this
 * reads the cache that is already there. Returns an empty list until it lands, and for an account
 * that has never had working hours set - which UI-6 treats as "nothing to say" rather than as zero.
 */
export function useExpectedHours(session: Session): AvailabilityPeriod[] {
	const { data } = useQuery(sessionQueryOptions(session));
	const membership = findMembershipForOrganization(data ?? [], session.organizationId);

	return parseAvailabilities(membership?.person?.availabilities ?? null);
}
