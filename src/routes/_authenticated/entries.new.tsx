import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DayView } from '@/components/features/time-entries/DayView/DayView';
import { TimeEntryForm } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm';
import { timeEntriesQueryOptions } from '@/components/features/time-entries/useTimeEntries';
import { weekTotalsQueryOptions } from '@/components/features/week/useWeekTotals';
import { isoDateSchema, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/entries/new')({
	// A-5: the day being logged travels in the search param, so the form opens on the date the
	// user was looking at. Validated here for the same reason `/day/$date` validates its param.
	validateSearch: z.object({ date: isoDateSchema.catch(todayIso) }),

	// The same two requests the day route starts, because the same day is rendered underneath the
	// form. Arriving here from the day view they are already cached; opening the URL directly is
	// what this covers.
	loaderDeps: ({ search }) => ({ date: search.date }),
	loader: ({ context, deps }) => {
		void context.queryClient.prefetchQuery(timeEntriesQueryOptions(context.session, deps.date));
		void context.queryClient.prefetchQuery(weekTotalsQueryOptions(context.session, deps.date));
	},

	component: NewEntryRoute,
});

/**
 * Adding an entry (US-2, R-9).
 *
 * The day renders underneath rather than being replaced: on desktop the design puts the form in a
 * dialog over it, and on mobile the same dialog fills the screen, so the day is there to return to
 * the moment it closes. Radix hides it from assistive technology while the form is open, so what
 * is behind is decoration in both senses.
 */
function NewEntryRoute() {
	const { session } = Route.useRouteContext();
	const { date } = Route.useSearch();

	return (
		<>
			<DayView session={session} date={date} />
			<TimeEntryForm session={session} date={date} />
		</>
	);
}
