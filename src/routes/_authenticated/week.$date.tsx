import { createFileRoute, redirect } from '@tanstack/react-router';
import { TimesheetView } from '@/components/features/week/Timesheet/TimesheetView';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import { isIsoDate, startOfWeek, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/week/$date')({
	/** Validated and normalised at the boundary, like `/day/$date` (ADR-0007). Normalised as well as
	 * validated: a week is identified by its Monday, so `/week/2026-09-17` redirects to
	 * `/week/2026-09-14` rather than leaving seven URLs that all render the same grid and split its
	 * cache seven ways. */
	beforeLoad: ({ params }) => {
		if (!isIsoDate(params.date)) {
			throw redirect({ to: '/week/$date', params: { date: startOfWeek(todayIso()) }, replace: true });
		}

		const monday = startOfWeek(params.date);
		if (monday !== params.date) {
			throw redirect({ to: '/week/$date', params: { date: monday }, replace: true });
		}
	},

	// Started, not awaited, for the reason the day route gives: the grid draws its own skeleton
	// under a usable header rather than holding a blank screen.
	loader: ({ context, params }) => {
		void context.queryClient.prefetchQuery(weekEntriesQueryOptions(context.session, params.date));
	},

	component: WeekRoute,
});

function WeekRoute() {
	const { session } = Route.useRouteContext();
	const { date } = Route.useParams();

	return <TimesheetView session={session} date={date} />;
}
