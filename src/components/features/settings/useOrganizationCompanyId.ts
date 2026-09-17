import { useQuery } from '@tanstack/react-query';
import { findMembershipForOrganization } from '@/api/organization-memberships';
import { sessionQueryOptions } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/** The company behind the organization this session is in, which is how the service picker knows
 * which group leads the list. No request of its own: it reads the membership fetched at login. */
export function useOrganizationCompanyId(session: Session): string | null {
	const { data } = useQuery(sessionQueryOptions(session));

	return findMembershipForOrganization(data ?? [], session.organizationId)?.organizationCompanyId ?? null;
}
