import { createFileRoute, redirect, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { Toast } from '@/components/core/Toast';
import { DayView } from '@/components/features/time-entries/DayView/DayView';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import { isIsoDate, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/day/$date')({
	/** Validated once, here (ADR-0007), so everything below can take `params.date` as a real day. */
	beforeLoad: ({ params }) => {
		if (!isIsoDate(params.date)) {
			throw redirect({ to: '/day/$date', params: { date: todayIso() }, replace: true });
		}
	},

	/** Started, not awaited: awaiting would hold the route blank and hand a failure to the router's
	 * error boundary, where a skeleton under a usable date navigator belongs. Firing them here still
	 * starts the requests on navigation rather than after mount (ADR-0007). */
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(weekEntriesQueryOptions(context.session, params.date));
	},

	component: DayRoute,
});

/** The day, plus whatever the navigation that landed here wants confirmed. A write that redirects
 * cannot raise its own toast, so it hands the message over in history state rather than the URL. */
function DayRoute() {
	const { session } = Route.useRouteContext();
	const { date } = Route.useParams();
	const historyState = useRouterState({ select: (state) => state.location.state });

	/** Derived, not copied in by an effect. What is remembered is which navigation was dismissed, and
	 * each carries a fresh state object, so saving twice in a row confirms twice. */
	const [dismissed, setDismissed] = useState<object | null>(null);
	const toast = historyState !== dismissed ? historyState.toast : undefined;

	return (
		<>
			<DayView session={session} date={date} />
			{toast !== undefined && (
				<Toast
					onDismiss={() => {
						setDismissed(historyState);
						/* Spend the message: history state outlives the page, so without this a reload
						 * would announce a save from minutes ago. */
						window.history.replaceState({ ...window.history.state, toast: undefined }, '');
					}}
				>
					{toast}
				</Toast>
			)}
		</>
	);
}
