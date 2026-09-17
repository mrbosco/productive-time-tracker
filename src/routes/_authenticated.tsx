import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router';
import { ApiError } from '@/api/client';
import { findMembershipForOrganization } from '@/api/organization-memberships';
import { Button } from '@/components/core/Button';
import { sessionQueryOptions, useLogout } from '@/components/features/auth/useSession';
import { AppLayout } from '@/components/shared/layouts/AppLayout';

/** The auth boundary: a pathless layout route, so every route nested under it is guarded by
 * existing and a new one cannot forget (ADR-0007). */
export const Route = createFileRoute('/_authenticated')({
	beforeLoad: ({ context }) => {
		const { session } = context.auth;
		if (session === null) throw redirect({ to: '/login' });

		// Returned into the child context, where it is a `Session` rather than `Session | null`.
		return { session };
	},

	loader: async ({ context, preload }) => {
		const { session, auth, queryClient } = context;

		/** A stored session the API will not stand behind, dropped here rather than letting every later
		 * request fail on its own (ADR-0004). Never during a preload - hovering a link must not log
		 * anyone out - so the failure is reported and the real navigation deals with it. */
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

		// The response is checked, not just awaited: the organization has to be matched here rather
		// than trusted to the header, which does not scope this collection.
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
		// `role="status"` so the wait is announced: without a live region the check happens in
		// silence for anyone not watching the spinner.
		<div role="status" className="flex min-h-dvh items-center justify-center">
			<span className="size-6 animate-spinner rounded-pill border-2 border-line border-t-accent" />
			<span className="sr-only">Checking your saved credentials</span>
		</div>
	);
}

/** The re-validation failed for a reason that is not "these credentials are no good". Without this
 * the router's own error screen takes over, and it offers no way to retry or drop the session. */
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
