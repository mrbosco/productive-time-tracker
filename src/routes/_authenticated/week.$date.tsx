import { createFileRoute, redirect } from '@tanstack/react-router';
import { TimesheetView } from '@/components/features/week/Timesheet/TimesheetView';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import { isIsoDate, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/week/$date')({
	/** Validated at the boundary, like `/day/$date` (ADR-0007), but deliberately not normalised to
	 * the week's Monday. Any day of the week names the same week and the cache key is the Monday
	 * either way, so seven URLs cost nothing - and keeping the day is what lets switching to the
	 * timesheet and back land on the day you left rather than on Monday. */
	beforeLoad: ({ params }) => {
		if (!isIsoDate(params.date)) {
			throw redirect({ to: '/week/$date', params: { date: todayIso() }, replace: true });
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
