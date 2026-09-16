import { queryOptions, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Auth } from '@/api/client';
import { listOrganizationMemberships } from '@/api/organization-memberships';
import { clearSession, readSession, type Session, writeSession } from '@/lib/storage';

export interface AuthContextValue {
	session: Session | null;
	login: (session: Session) => void;
	logout: () => void;
}

const SessionContext = createContext<AuthContextValue | null>(null);

/** The credentials, in the shape `src/api` takes them. */
export function toAuth(session: Session): Auth {
	return { token: session.token, organizationId: session.organizationId };
}

/**
 * Re-validates a stored session against the API on app start (ADR-0004): a token can be revoked
 * or the person removed from the organization between visits, and the stored session would
 * otherwise keep letting them in until the first day request failed.
 *
 * `staleTime: Infinity` because this is checked once per app load, not per navigation - the route
 * loader awaits it, and every later navigation reads the cache. The query key holds the person ID
 * and never the token (api-client rule 7): keys end up in devtools and in error reports.
 */
export function sessionQueryOptions(session: Session) {
	return queryOptions({
		queryKey: ['session', session.personId],
		queryFn: () => listOrganizationMemberships(toAuth(session)),
		staleTime: Infinity,
		gcTime: Infinity,
		// A revoked token is not a transient failure; retrying delays the login screen.
		retry: false,
	});
}

export function SessionProvider({ children }: { children: ReactNode }) {
	// Lazy initialiser: reading storage once at mount, not on every render.
	const [session, setSession] = useState(readSession);
	const queryClient = useQueryClient();

	const login = useCallback((next: Session) => {
		writeSession(next);
		// `flushSync` so React has re-rendered - and `RouterProvider` has pushed the new context
		// into the router - before the caller navigates. Without it the next `beforeLoad` still
		// sees `session: null` and bounces straight back to /login.
		flushSync(() => {
			setSession(next);
		});
	}, []);

	const logout = useCallback(() => {
		clearSession();
		// Everything cached was fetched for this person with this token (ADR-0004).
		queryClient.clear();
		flushSync(() => {
			setSession(null);
		});
	}, [queryClient]);

	const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);

	return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): AuthContextValue {
	const value = useContext(SessionContext);
	if (value === null) throw new Error('useSession must be used inside a SessionProvider');

	return value;
}

/**
 * Logging out, from anywhere inside the router.
 *
 * Dropping the session does not move anyone: the router only re-runs its guards on navigation, so
 * a caller that merely cleared it would leave the person sitting on a guarded URL with no session.
 * The navigation belongs with the clearing, not with each caller - `SessionProvider` cannot do it
 * itself because it sits above the router.
 */
export function useLogout(): () => void {
	const { logout } = useSession();
	const navigate = useNavigate();

	return useCallback(() => {
		logout();
		void navigate({ to: '/login' });
	}, [logout, navigate]);
}
