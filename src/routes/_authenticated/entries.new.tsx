import { createFileRoute, useRouterState } from '@tanstack/react-router';
import { z } from 'zod';
import { DayView } from '@/components/features/time-entries/DayView/DayView';
import { TimeEntryForm } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import { isoDateSchema, todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/entries/new')({
	/* The day being logged travels in the search param, so the form opens on the date the user was
	 * looking at. `duplicate` is the entry this one starts from - an ID rather than the values
	 * themselves, because a note is a document, and a query string ends up in someone's history,
	 * in any link they share, and inside whatever length limit the browser has. */
	validateSearch: z.object({ date: isoDateSchema.catch(todayIso), duplicate: z.string().optional() }),

	// The same two requests the day route starts, because the same day is rendered underneath the
	// form. Arriving here from the day view they are already cached; opening the URL directly is
	// what this covers.
	loaderDeps: ({ search }) => ({ date: search.date, duplicate: search.duplicate }),
	loader: async ({ context, deps }) => {
		void context.queryClient.prefetchQuery(weekEntriesQueryOptions(context.session, deps.date));

		if (deps.duplicate === undefined) return { prefill: null };

		/* Awaited, unlike the two above: a form cannot open half-prefilled, and this one is opened
		 * *because* of those values. Swallowed rather than thrown - here the source is a starting
		 * point, and an error page would refuse to let someone log time because the entry they
		 * wanted to copy is gone. */
		const source = await context.queryClient
			.ensureQueryData(timeEntryQueryOptions(context.session, deps.duplicate))
			.catch(() => null);

		return { prefill: source === null ? null : { minutes: source.minutes, note: source.note } };
	},

	component: NewEntryRoute,
});

/** Adding an entry. The day renders underneath rather than being replaced, so it is there to return
 * to the moment the form closes; Radix hides it from assistive technology while the form is open. */
function NewEntryRoute() {
	const { session } = Route.useRouteContext();
	const { date } = Route.useSearch();
	const { prefill } = Route.useLoaderData();
	/* The words typed into the quick-add line, carried in history state rather than the search
	 * params for the reason `duplicate` is an ID. Lost on a reload, which is right for a draft
	 * nobody has saved. */
	const quickAddNote = useRouterState({ select: (state) => state.location.state.quickAddNote });

	return (
		<>
			<DayView session={session} date={date} />
			<TimeEntryForm
				session={session}
				date={date}
				prefill={prefill ?? (quickAddNote === undefined ? null : { minutes: null, note: quickAddNote })}
			/>
		</>
	);
}

declare module '@tanstack/react-router' {
	interface HistoryState {
		/** What the quick-add line was carrying when `Log time` was pressed. */
		quickAddNote?: string;
	}
}
