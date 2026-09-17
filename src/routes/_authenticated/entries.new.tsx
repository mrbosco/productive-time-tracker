import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DayView } from '@/components/features/time-entries/DayView/DayView';
import { TimeEntryForm } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import { timeEntriesQueryOptions } from '@/components/features/time-entries/useTimeEntries';
import { weekTotalsQueryOptions } from '@/components/features/week/useWeekTotals';
import { isoDateSchema, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/entries/new')({
	/*
	 * A-5: the day being logged travels in the search param, so the form opens on the date the
	 * user was looking at. Validated here for the same reason `/day/$date` validates its param.
	 *
	 * `duplicate` is X-3's: the entry whose duration and description this one starts from. An ID in
	 * the URL rather than the values themselves, because a note is a document - putting it in a
	 * query string would put someone's writing in their history, in any link they shared, and in
	 * whatever length limit the browser has.
	 */
	validateSearch: z.object({ date: isoDateSchema.catch(todayIso), duplicate: z.string().optional() }),

	// The same two requests the day route starts, because the same day is rendered underneath the
	// form. Arriving here from the day view they are already cached; opening the URL directly is
	// what this covers.
	loaderDeps: ({ search }) => ({ date: search.date, duplicate: search.duplicate }),
	loader: async ({ context, deps }) => {
		void context.queryClient.prefetchQuery(timeEntriesQueryOptions(context.session, deps.date));
		void context.queryClient.prefetchQuery(weekTotalsQueryOptions(context.session, deps.date));

		if (deps.duplicate === undefined) return { prefill: null };

		/*
		 * Awaited, unlike the two above, for the reason the edit route awaits its own: a form
		 * cannot open half-prefilled, and this one is being opened *because* of those values.
		 *
		 * Swallowed rather than thrown, unlike the edit route's. There the entry is the screen, so
		 * "this entry no longer exists" is the whole answer; here it is a starting point, and an
		 * error page in place of a blank New entry form would be refusing to let someone log time
		 * because the thing they wanted to copy is gone.
		 */
		const source = await context.queryClient
			.ensureQueryData(timeEntryQueryOptions(context.session, deps.duplicate))
			.catch(() => null);

		return { prefill: source === null ? null : { minutes: source.minutes, note: source.note } };
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
	const { prefill } = Route.useLoaderData();

	return (
		<>
			<DayView session={session} date={date} />
			<TimeEntryForm session={session} date={date} prefill={prefill} />
		</>
	);
}
