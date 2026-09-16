import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import type { TimeEntry } from '@/api/types';
import { Toast } from '@/components/core/Toast';
import { QuickAddInput } from '@/components/features/quick-add/QuickAddInput';
import { DateNavigator } from '@/components/features/time-entries/DateNavigator/DateNavigator';
import { DaySummary } from '@/components/features/time-entries/DaySummary/DaySummary';
import { TimeEntryDeleteDialog } from '@/components/features/time-entries/TimeEntryDeleteDialog/TimeEntryDeleteDialog';
import { ServiceTotals } from '@/components/features/time-entries/ServiceTotals/ServiceTotals';
import { TimeEntryList } from '@/components/features/time-entries/TimeEntryList/TimeEntryList';
import { useDeleteTimeEntry } from '@/components/features/time-entries/useDeleteTimeEntry';
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
	const deleteEntry = useDeleteTimeEntry(session);

	/** The entry the confirm dialog is asking about, and the only thing that opens it (R-12). */
	const [entryPendingDelete, setEntryPendingDelete] = useState<TimeEntry | null>(null);
	/**
	 * Raised here rather than handed over in history state, because a delete does not navigate: the
	 * design keeps it on the day behind the dialog (design brief 5). The route's own toast, which
	 * announces a save arriving from the form, is a different delivery path and is left alone - the
	 * two would have to overlap inside one 2.6 s window to collide, which takes opening a menu and
	 * confirming a dialog in it.
	 */
	const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

	const hasEntries = entries !== undefined && entries.length > 0;

	/**
	 * Where focus goes once the card it was on is gone (guidebook 18).
	 *
	 * The dialog was opened from that card's kebab, so Radix hands focus back to it on close - and
	 * the optimistic removal then unmounts the element holding it, dropping focus to the document.
	 * A keyboard or screen-reader user loses their place on the one path this story is about, and
	 * the failure path loses it too, because the row is unmounted and remounted there as well.
	 *
	 * ponytail: the day's own primary control, which is rendered at every width and on an emptied
	 * day too. The better target is the next card's own menu - "the same place in the list" - and
	 * X-2 is what makes that cheap, because its roving tabindex owns focus inside the list already.
	 */
	const addEntryRef = useRef<HTMLAnchorElement>(null);

	async function confirmDelete(entry: TimeEntry) {
		// Closed first: the row is already gone from the cache by the time the request is sent
		// (SPEC 4.2), so leaving the dialog up to spin would be asking the user to wait for
		// something that has visibly happened.
		setEntryPendingDelete(null);

		try {
			await deleteEntry.mutateAsync({ id: entry.id, date: entry.date, minutes: entry.minutes });
			setToast({ message: 'Entry deleted', variant: 'success' });
		} catch {
			// The row is back already - the hook restores it - so this only has to say why.
			setToast({ message: 'Could not delete the entry.', variant: 'error' });
		} finally {
			// After either outcome, and after the await: the row is unmounted on the way through
			// both, so moving focus any earlier would only be undone.
			addEntryRef.current?.focus();
		}
	}

	return (
		<>
			{/*
			 * `pb-24` on mobile: the Add entry FAB is `fixed` at the bottom right, so without room
			 * reserved for it the last card of a scrolling day sits under an opaque 56px circle (N-4).
			 */}
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
						ref={addEntryRef}
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
							onRequestDelete={setEntryPendingDelete}
						/>
					</div>

					{hasEntries && (
						<div className="hidden md:block">
							<ServiceTotals entries={entries} weekTotals={weekTotals} isWeekError={isWeekError} />
						</div>
					)}
				</div>
			</main>

			{/*
			 * Rendered from the entry rather than kept mounted and fed props, so the dialog holds
			 * the values it was opened with for as long as it is on screen: a background refetch
			 * that removed the row would otherwise leave a question about nothing.
			 */}
			<TimeEntryDeleteDialog
				entry={entryPendingDelete}
				onOpenChange={(next) => {
					if (!next) setEntryPendingDelete(null);
				}}
				onConfirm={(entry) => {
					void confirmDelete(entry);
				}}
			/>

			{toast !== null && (
				<Toast
					variant={toast.variant}
					onDismiss={() => {
						setToast(null);
					}}
				>
					{toast.message}
				</Toast>
			)}
		</>
	);
}
