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
import { useCopyDayForward } from '@/components/features/time-entries/useCopyDayForward';
import { useDeleteTimeEntry } from '@/components/features/time-entries/useDeleteTimeEntry';
import { useTimeEntries } from '@/components/features/time-entries/useTimeEntries';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { useWeekTotals } from '@/components/features/week/useWeekTotals';
import { WeekStrip } from '@/components/features/week/WeekStrip/WeekStrip';
import { useHotkeys } from '@/components/shared/useHotkeys';
import { addDays, todayIso } from '@/lib/date';
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
	const copyDay = useCopyDayForward(session);
	const timer = useTimerContext();

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

	/** The card the arrow keys are standing on, and what `e` and `Delete` act on (X-2). */
	const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
	const focusedEntry = entries?.find((entry) => entry.id === focusedEntryId) ?? null;

	function goToDay(next: string) {
		void navigate({ to: '/day/$date', params: { date: next } });
	}

	/**
	 * Moves the chosen card by one, and clamps rather than wrapping: a list that jumps from the last
	 * entry back to the first reads as a bug the first time it happens, and there are never enough
	 * entries in a day for wrapping to save anyone a keystroke.
	 *
	 * With nothing chosen yet, `↓` starts at the top and `↑` at the bottom, which is what every
	 * roving list does.
	 */
	function moveFocus(step: number) {
		if (entries === undefined || entries.length === 0) return;

		const current = entries.findIndex((entry) => entry.id === focusedEntryId);
		const next =
			current === -1 ? (step > 0 ? 0 : entries.length - 1) : Math.min(Math.max(current + step, 0), entries.length - 1);

		setFocusedEntryId(entries[next].id);
	}

	/*
	 * The day's own shortcuts (SPEC 10, X-2). `useHotkeys` drops every one of them while an input,
	 * the rich-text editor, a dialog or an open menu has focus - which is also what keeps them quiet
	 * on `/entries/new` and `/entries/$id/edit`, where this screen renders behind a modal.
	 *
	 * `Backspace` alongside `Delete` because a Mac keyboard has no Delete key to speak of, and both
	 * mean the same thing in every list that takes them.
	 */
	useHotkeys({
		n: () => {
			void navigate({ to: '/entries/new', search: { date } });
		},
		ArrowLeft: () => {
			goToDay(addDays(date, -1));
		},
		ArrowRight: () => {
			goToDay(addDays(date, 1));
		},
		t: () => {
			goToDay(todayIso());
		},
		ArrowUp: () => {
			moveFocus(-1);
		},
		ArrowDown: () => {
			moveFocus(1);
		},
		e: () => {
			if (focusedEntry === null) return;
			void navigate({ to: '/entries/$id/edit', params: { id: focusedEntry.id } });
		},
		Delete: () => {
			if (focusedEntry !== null) setEntryPendingDelete(focusedEntry);
		},
		Backspace: () => {
			if (focusedEntry !== null) setEntryPendingDelete(focusedEntry);
		},
	});

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

	/**
	 * X-3's `Copy from yesterday`, reported in one toast whatever happened (SPEC 10: "one toast with
	 * count and failures").
	 *
	 * Four outcomes, because they are four different things to be told: nothing to copy, everything
	 * copied, some copied, and the source day unreadable. Only the last is an error - a partial copy
	 * put real entries on the day, and colouring it red would suggest they need undoing.
	 */
	async function copyFromYesterday() {
		try {
			const { copied, failed } = await copyDay.mutateAsync({ from: addDays(date, -1), to: date });

			if (copied === 0 && failed === 0) {
				setToast({ message: 'Nothing was logged yesterday.', variant: 'success' });

				return;
			}

			const entries = copied === 1 ? '1 entry' : `${String(copied)} entries`;
			setToast({
				message: failed === 0 ? `${entries} copied from yesterday` : `${entries} copied, ${String(failed)} failed`,
				variant: failed === 0 ? 'success' : 'error',
			});
		} catch {
			setToast({ message: "Could not read yesterday's entries.", variant: 'error' });
		}
	}

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
							focusedEntryId={focusedEntryId}
							onFocusEntry={setFocusedEntryId}
							onCopyFromYesterday={() => {
								void copyFromYesterday();
							}}
							isCopying={copyDay.isPending}
							/*
							 * X-4. The day view passes it down rather than the card reaching for the
							 * context itself, so a card stays renderable on its own - the same reason
							 * `onRequestDelete` is a prop.
							 */
							/*
							 * One timer at a time: with one running there is nothing to continue, and
							 * an item that silently started a second one would be worse than a
							 * disabled one. `TimeEntryCard` greys it out when this is absent.
							 */
							/*
							 * The timer attaches to the entry rather than making a new one (SPEC 11,
							 * finding 4), so the row that was clicked is the row that starts counting
							 * - on whatever day it is on. Nothing navigates, and nothing is copied.
							 */
							onContinueTimer={
								timer.running === null
									? (entry) => {
											timer.continueEntry(entry.id, entry.minutes);
										}
									: undefined
							}
							/*
							 * The row a timer is running against says so, and carries a stop of its
							 * own: the app bar's pill can be scrolled a long way from it on a full
							 * day (`Timer.dc.html`). Both drive the same timer.
							 */
							trackingEntryId={timer.running?.entryId ?? null}
							trackingSince={timer.running?.startedAt ?? null}
							onStopTimer={timer.stop}
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
