import { Link, useNavigate } from '@tanstack/react-router';
import { QuickAddInput } from '@/components/features/quick-add/QuickAddInput';
import { DateNavigator } from '@/components/features/time-entries/DateNavigator/DateNavigator';
import { DaySummary } from '@/components/features/time-entries/DaySummary/DaySummary';
import { ServiceTotals } from '@/components/features/time-entries/ServiceTotals/ServiceTotals';
import { TimeEntryList } from '@/components/features/time-entries/TimeEntryList/TimeEntryList';
import { useTimeEntries } from '@/components/features/time-entries/useTimeEntries';
import { useWeekTotals } from '@/components/features/week/useWeekTotals';
import { WeekStrip } from '@/components/features/week/WeekStrip/WeekStrip';
import type { Session } from '@/lib/storage';

function PlusIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true" className="flex-none md:size-4">
			<path d="M9 3.6h2v5.4h5.4v2H11v5.4H9V11H3.6V9H9V3.6Z" fill="currentColor" />
		</svg>
	);
}

/**
 * The day view: the selected date, the week around it, and what was logged on it (R-3).
 *
 * Lifted out of `/day/$date` so that `/entries/new` can render it too. On desktop the entry form is
 * a dialog over the day rather than a page of its own - "adding time is never worth a page change
 * on desktop" - so the day has to be renderable from both routes. Pure extraction: the route still
 * owns the date guard and the prefetch.
 *
 * It composes three features rather than one, which would put it in `shared/` by guidebook 1. It
 * stays here because it is the time-entries day screen, not a reusable piece: `features/week` and
 * `features/quick-add` are bands the design draws on this screen and nowhere else.
 */
export function DayView({ session, date }: { session: Session; date: string }) {
	const navigate = useNavigate();
	const { data: entries, isPending, isFetching, refetch } = useTimeEntries(session, date);
	const { data: weekTotals, isPending: isWeekPending, isError: isWeekError } = useWeekTotals(session, date);

	const hasEntries = entries !== undefined && entries.length > 0;

	return (
		/*
		 * `pb-24` on mobile: the Add entry FAB is `fixed` at the bottom right, so without room
		 * reserved for it the last card of a scrolling day sits under an opaque 56px circle (N-4).
		 */
		<main className="mx-4 flex flex-col gap-3 pt-3.5 pb-24 md:mx-12 md:gap-5 md:pt-7 md:pb-14">
			<div className="flex items-center gap-4">
				<DateNavigator
					date={date}
					onSelect={(next) => {
						void navigate({ to: '/day/$date', params: { date: next } });
					}}
				/>

				{/*
				 * One element that restyles across the breakpoint - a bottom-right FAB on mobile,
				 * a header button on desktop - rather than two with `hidden md:flex`, which is CSS
				 * only and would leave both in the accessibility tree at every width.
				 *
				 * It does share its name with the empty state's button on a day with nothing on
				 * it. That is the design (`02-day-mobile-empty.png`): two routes to the same
				 * action, which is ordinary, and not the same thing as one control listed twice.
				 */}
				<Link
					to="/entries/new"
					search={{ date }}
					className="duration-ui fixed right-4 bottom-7 z-10 inline-flex size-14 items-center justify-center gap-2 rounded-pill bg-accent text-on-accent shadow-fab transition-colors ease-ui hover:bg-accent-dark md:static md:ml-auto md:h-11 md:w-auto md:px-5 md:shadow-none"
				>
					<PlusIcon />
					<span className="sr-only md:not-sr-only md:text-meta md:font-medium">Add entry</span>
				</Link>
			</div>

			<WeekStrip date={date} weekTotals={weekTotals} isPending={isWeekPending} isError={isWeekError} />

			<div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_340px] md:gap-8">
				<div className="flex flex-col gap-3 md:gap-3.5">
					{/*
					 * Only once there is something to summarise. `0h logged · 0 entries` would be
					 * a lie while the day is loading or failing, and on a genuinely empty day it
					 * only restates the sentence in the empty state below it.
					 */}
					{hasEntries && <DaySummary entries={entries} />}

					{/* P-1, drawn but inert. Absent while loading or failing, as the design has it. */}
					{entries !== undefined && <QuickAddInput date={date} />}

					<TimeEntryList
						entries={entries}
						isPending={isPending}
						isRetrying={isFetching}
						date={date}
						onRetry={() => {
							void refetch();
						}}
					/>
				</div>

				{hasEntries && (
					<div className="hidden md:block">
						<ServiceTotals entries={entries} weekTotals={weekTotals} isWeekError={isWeekError} />
					</div>
				)}
			</div>
		</main>
	);
}
