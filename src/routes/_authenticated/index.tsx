import { createFileRoute } from '@tanstack/react-router';
import { useDefaultService } from '@/components/features/settings/useDefaultService';

export const Route = createFileRoute('/_authenticated/')({
	component: HomeRoute,
});

/**
 * Placeholder. US-1 replaces this with the redirect to `/day/$date` for today.
 *
 * It renders what login resolved - the person and the default service (A-1) - so both are visible
 * and testable before any screen consumes them.
 */
function HomeRoute() {
	const { session } = Route.useRouteContext();
	const { label, isPending, isError } = useDefaultService(session);

	const defaultService = isPending ? 'resolving...' : isError ? 'could not be loaded' : (label ?? 'none available');

	return (
		<main className="mx-4 flex flex-col items-start gap-3 py-12 md:mx-12">
			<h1 tabIndex={-1} className="text-title font-bold tracking-tight md:text-display">
				Time Tracker
			</h1>
			<p className="text-list text-muted">Logged in as {session.personName}</p>
			<p className="text-list text-muted">Default service: {defaultService}</p>
		</main>
	);
}
