import { createFileRoute, redirect, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { Toast } from '@/components/core/Toast';
import { DayView } from '@/components/features/time-entries/DayView/DayView';
import { timeEntriesQueryOptions } from '@/components/features/time-entries/useTimeEntries';
import { weekTotalsQueryOptions } from '@/components/features/week/useWeekTotals';
import { isIsoDate, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/day/$date')({
	/**
	 * The date is validated once, here (ADR-0007). A component that had to cope with
	 * `/day/yesterday` would have to cope with it in every component; redirecting at the boundary
	 * means everything below this line can take `params.date` as a real calendar day.
	 */
	beforeLoad: ({ params }) => {
		if (!isIsoDate(params.date)) {
			throw redirect({ to: '/day/$date', params: { date: todayIso() }, replace: true });
		}
	},

	/**
	 * Started, not awaited. Awaiting would hold the route on a blank screen until the requests
	 * landed and would hand a failure to the router's error boundary, replacing the whole page -
	 * where the design puts a skeleton under a usable date navigator, and an inline `Retry`
	 * (`02-day-mobile-loading.png`, `02-day-mobile-error.png`). Firing them here still starts the
	 * requests on navigation rather than after mount, which is what ADR-0007 wanted from a loader.
	 *
	 * Two requests, not eight: the day, and the week the strip draws. Stepping within one week
	 * re-runs only the first, because the week is keyed on its Monday.
	 */
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(timeEntriesQueryOptions(context.session, params.date));
		void context.queryClient.prefetchQuery(weekTotalsQueryOptions(context.session, params.date));
	},

	component: DayRoute,
});

/**
 * The day, plus whatever the navigation that landed here wants confirmed.
 *
 * A write that redirects - creating an entry (US-2), and later editing one - cannot raise its own
 * toast, because the screen it would appear on is the one it is leaving. So it hands the message
 * over in history state and this screen shows it, which keeps it out of the URL and out of any
 * link the user shares.
 */
function DayRoute() {
	const { session } = Route.useRouteContext();
	const { date } = Route.useParams();
	const historyState = useRouterState({ select: (state) => state.location.state });

	/**
	 * Derived, not copied into state by an effect. What is remembered is which navigation has been
	 * dismissed, and every navigation carries a fresh state object - so saving twice in a row
	 * confirms twice, and dismissing hides only the one on screen.
	 */
	const [dismissed, setDismissed] = useState<object | null>(null);
	const toast = historyState !== dismissed ? historyState.toast : undefined;

	return (
		<>
			<DayView session={session} date={date} />
			{toast !== undefined && (
				<Toast
					onDismiss={() => {
						setDismissed(historyState);
						/*
						 * Spend the message, so it cannot be shown twice.
						 *
						 * History state outlives the page - the browser restores it on reload -
						 * while `dismissed` is React state that does not. Without this, refreshing
						 * the day would announce a save that happened minutes ago. Rewriting what
						 * the browser holds is a side effect of dismissing, not of rendering, so
						 * it belongs here rather than in an effect that would spend the message
						 * before it had been read.
						 */
						window.history.replaceState({ ...window.history.state, toast: undefined }, '');
					}}
				>
					{toast}
				</Toast>
			)}
		</>
	);
}
