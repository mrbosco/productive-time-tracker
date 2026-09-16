import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router';
import { ApiError } from '@/api/client';
import { findMembershipForOrganization } from '@/api/organization-memberships';
import { Button } from '@/components/core/Button';
import { sessionQueryOptions, useLogout } from '@/components/features/auth/useSession';
import { AppLayout } from '@/components/shared/layouts/AppLayout';

/**
 * The auth boundary. A pathless layout route rather than a check in each page: every route nested
 * under it is guarded by existing, and a new one cannot forget (ADR-0007).
 */
export const Route = createFileRoute('/_authenticated')({
	beforeLoad: ({ context }) => {
		const { session } = context.auth;
		if (session === null) throw redirect({ to: '/login' });

		// Returned into the child context, where it is a `Session` rather than `Session | null`.
		return { session };
	},

	loader: async ({ context, preload }) => {
		const { session, auth, queryClient } = context;

		/**
		 * A stored session the API will not stand behind. Dropping it here is the point of the
		 * re-validation (ADR-0004) - otherwise every later request fails on its own, one at a
		 * time, with no way back to the login screen.
		 *
		 * Never during a preload: hovering a link must not log anyone out. The failure is
		 * reported so the preload is discarded, and the real navigation deals with it.
		 */
		function rejectSession(reason: string): never {
			if (preload) throw new Error(reason);

			auth.logout();
			throw redirect({ to: '/login' });
		}

		let memberships;
		try {
			memberships = await queryClient.ensureQueryData(sessionQueryOptions(session));
		} catch (error) {
			if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
				rejectSession('The stored credentials were rejected.');
			}

			throw error;
		}

		// The response is checked, not just awaited. Both halves of the stored session are read
		// back out of the browser on every load: the organization goes out as a header on every
		// request, and the person is what filters the day list (R-4). The organization has to be
		// matched here rather than trusted to the header, which does not scope this collection.
		const membership = findMembershipForOrganization(memberships, session.organizationId);
		if (membership === undefined) {
			rejectSession('The stored credentials are not a member of that organization.');
		}
		if (membership.person?.id !== session.personId) {
			rejectSession('The stored session does not match the person this token belongs to.');
		}

		// Names change. Rewriting only on a difference keeps this from re-entering itself.
		const personName = `${membership.person.firstName} ${membership.person.lastName}`.trim();
		if (personName !== session.personName) auth.login({ ...session, personName });
	},

	component: AuthenticatedLayout,
	pendingComponent: RevalidatingSession,
	errorComponent: SessionCheckFailed,
});

function AuthenticatedLayout() {
	const { session } = Route.useRouteContext();

	return (
		<AppLayout session={session}>
			<Outlet />
		</AppLayout>
	);
}

/** Shown only while a stored session is re-checked on a cold load, so never after a navigation. */
function RevalidatingSession() {
	return (
		<div className="flex min-h-dvh items-center justify-center">
			<span className="size-6 animate-spinner rounded-pill border-2 border-line border-t-accent" />
			<span className="sr-only">Checking your saved credentials</span>
		</div>
	);
}

/**
 * The re-validation failed for a reason that is not "these credentials are no good" - the API is
 * unreachable or broken. Without this the router's own error screen takes over, which offers no
 * way out: the session cannot be retried and cannot be dropped, on every route at once.
 */
function SessionCheckFailed() {
	const router = useRouter();
	const logout = useLogout();

	return (
		<main className="mx-4 flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
			<h1 tabIndex={-1} className="text-title font-bold tracking-tight">
				Could not reach Productive
			</h1>
			<p className="max-w-prose text-list text-muted">
				Your credentials are still saved. Check your connection and try again.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<Button
					onClick={() => {
						void router.invalidate();
					}}
				>
					Try again
				</Button>
				<Button variant="outline" onClick={logout}>
					Log out
				</Button>
			</div>
		</main>
	);
}
