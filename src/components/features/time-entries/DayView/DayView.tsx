import { useDayEntrance } from '@/components/features/time-entries/useDayEntrance';
import { cn } from '@/lib/utils';
import { Clock3 } from 'lucide-react';
import { expectedMinutesOn } from '@/lib/availability';
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
import { useUpdateTimeEntry } from '@/components/features/time-entries/useUpdateTimeEntry';
import { TimerLogsDialog } from '@/components/features/timer/TimerLogsDialog/TimerLogsDialog';
import { useTimeEntries } from '@/components/features/time-entries/useTimeEntries';
import { ActivityBanner } from '@/components/features/timer/ActivityBanner/ActivityBanner';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { useWeekTotals } from '@/components/features/week/useWeekTotals';
import { useExpectedHours } from '@/components/features/week/useExpectedHours';
import { WeekStrip } from '@/components/features/week/WeekStrip/WeekStrip';
import { useHotkeys } from '@/components/shared/useHotkeys';
import { addDays, formatDayShort, todayIso } from '@/lib/date';
import { formatDuration } from '@/lib/duration';
import type { Session } from '@/lib/storage';

function PlusIcon() {
	return (
		<svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true" className="flex-none md:size-4">
			<path d="M9 3.6h2v5.4h5.4v2H11v5.4H9V11H3.6V9H9V3.6Z" fill="currentColor" />
		</svg>
	);
}

/** The day view: the selected date, the week around it, and what was logged on it. Lifted out of
 * `/day/$date` so `/entries/new` can render it behind its dialog; the route still owns the date
 * guard and the prefetch. */
export function DayView({ session, date }: { session: Session; date: string }) {
	const entrance = useDayEntrance(date) ? 'animate-day-in' : '';
	const navigate = useNavigate();
	const { data: entries, isPending, isFetching, refetch } = useTimeEntries(session, date);
	const { data: weekTotals, isPending: isWeekPending, isError: isWeekError } = useWeekTotals(session, date);
	const availability = useExpectedHours(session);
	const deleteEntry = useDeleteTimeEntry(session);
	const updateEntry = useUpdateTimeEntry(session);
	const copyDay = useCopyDayForward(session);
	const timer = useTimerContext();
	/* Today-only, one at a time: the timer attaches to the entry rather than making a new one, so
	 * playing yesterday's row would start a clock counting into yesterday. */
	const canContinue = timer.running === null && date === todayIso();

	const [entryPendingDelete, setEntryPendingDelete] = useState<TimeEntry | null>(null);
	const [entryShowingLogs, setEntryShowingLogs] = useState<TimeEntry | null>(null);
	/** Raised here rather than in history state, because a delete does not navigate. The route's own
	 * toast, for a save arriving from the form, is a separate path. */
	const [toast, setToast] = useState<{
		message: string;
		variant: 'success' | 'error';
		action?: { label: string; onAction: () => void };
	} | null>(null);

	const timerError = timer.error;

	const hasEntries = entries !== undefined && entries.length > 0;

	const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
	const focusedEntry = entries?.find((entry) => entry.id === focusedEntryId) ?? null;

	function goToDay(next: string) {
		void navigate({ to: '/day/$date', params: { date: next } });
	}

	/** Moves the chosen card by one. Clamps rather than wrapping - a jump from last back to first
	 * reads as a bug. */
	function moveFocus(step: number) {
		if (entries === undefined || entries.length === 0) return;

		const current = entries.findIndex((entry) => entry.id === focusedEntryId);
		if (current === -1) return;

		setFocusedEntryId(entries[Math.min(Math.max(current + step, 0), entries.length - 1)].id);
	}

	/* `useHotkeys` drops these while an input, editor, dialog or open menu has focus, which is what
	 * keeps them quiet behind a modal. `Backspace` alongside `Delete` for Mac keyboards. */
	useHotkeys({
		n: () => {
			void navigate({ to: '/entries/new', search: { date }, resetScroll: false });
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
		/* Bound only once a card has focus: unconditionally they took `preventDefault` with them and
		 * killed arrow-key scrolling on the whole day for anyone not inside the list. */
		...(focusedEntry === null
			? {}
			: {
					ArrowUp: () => {
						moveFocus(-1);
					},
					ArrowDown: () => {
						moveFocus(1);
					},
					e: () => {
						void navigate({ to: '/entries/$id/edit', params: { id: focusedEntry.id }, resetScroll: false });
					},
					p: () => {
						if (canContinue) continueTimerOn(focusedEntry);
					},
					Delete: () => {
						setEntryPendingDelete(focusedEntry);
					},
					Backspace: () => {
						setEntryPendingDelete(focusedEntry);
					},
				}),
	});

	/**
	 * Where focus goes once the card it was on is gone: Radix hands it back to the kebab, and the
	 * optimistic removal unmounts that. ponytail: the better target is the next card's own menu,
	 * which the list's roving tabindex makes cheap.
	 */
	const addEntryRef = useRef<HTMLAnchorElement>(null);

	/** One toast over four outcomes. Only an unreadable source day is an error: a partial copy put
	 * real entries on the day, and colouring it red would suggest they need undoing. */
	async function copyFromYesterday() {
		const from = addDays(date, -1);
		const named = formatDayShort(from);

		try {
			const { copied, failed } = await copyDay.mutateAsync({ from, to: date });

			if (copied === 0 && failed === 0) {
				setToast({ message: `Nothing was logged on ${named}.`, variant: 'success' });

				return;
			}

			const entries = copied === 1 ? '1 entry' : `${String(copied)} entries`;
			setToast({
				message: failed === 0 ? `${entries} copied from ${named}` : `${entries} copied, ${String(failed)} failed`,
				variant: failed === 0 ? 'success' : 'error',
			});
		} catch {
			setToast({ message: `Could not read the entries for ${named}.`, variant: 'error' });
		}
	}

	/** The inline duration correction, here rather than on the card because the toast belongs to the
	 * screen. Awaited, so the editor stays open with what was typed if the write fails. */
	async function saveDuration(entry: TimeEntry, minutes: number) {
		const previousMinutes = entry.minutes;

		try {
			await updateEntry.mutateAsync({
				id: entry.id,
				previousDate: entry.date,
				date: entry.date,
				changes: { minutes },
			});
			/* Undo rather than a confirm: a dialog on every fifteen-minute correction would cost
			 * more than the trip to the edit screen it replaces. */
			setToast({
				message: 'Entry saved',
				variant: 'success',
				action: {
					label: 'Undo',
					onAction: () => {
						void restoreDuration(entry, previousMinutes);
					},
				},
			});
		} catch {
			setToast({ message: 'Could not save the duration.', variant: 'error' });
			throw new Error('save failed');
		}
	}

	function continueTimerOn(entry: TimeEntry) {
		timer.continueEntry(entry.id, entry.minutes);
	}

	/** The way back from an inline correction. No Undo of its own, or there would be no way out. */
	async function restoreDuration(entry: TimeEntry, minutes: number) {
		try {
			await updateEntry.mutateAsync({
				id: entry.id,
				previousDate: entry.date,
				date: entry.date,
				changes: { minutes },
			});
			setToast({ message: `Restored to ${formatDuration(minutes)}`, variant: 'success' });
		} catch {
			setToast({ message: 'Could not undo that change.', variant: 'error' });
		}
	}

	async function confirmDelete(entry: TimeEntry) {
		// Closed first: the delete is optimistic, so the row is already gone by the time the request
		// is sent and a spinning dialog would be waiting on something that visibly happened.
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
			<main className="mx-auto flex w-full max-w-[1376px] flex-col gap-4 px-4 pt-4 pb-24 md:gap-7 md:px-8 md:pt-9 md:pb-14 xl:px-12">
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0 flex-1">
						<p className="mb-2 flex items-center gap-2 text-meta font-medium text-muted">
							<Clock3 size={16} aria-hidden="true" />
							Time tracking
						</p>
						<DateNavigator
							date={date}
							onSelect={(next) => {
								void navigate({ to: '/day/$date', params: { date: next } });
							}}
						/>
					</div>
					<Link
						ref={addEntryRef}
						to="/entries/new"
						resetScroll={false}
						search={{ date }}
						className="duration-ui fixed right-4 bottom-7 z-10 inline-flex size-14 items-center justify-center gap-2 rounded-pill bg-accent text-on-accent shadow-fab transition-colors ease-ui hover:bg-accent-dark md:static md:ml-auto md:h-12 md:w-auto md:rounded-control md:px-5 md:shadow-fab"
					>
						<PlusIcon />
						<span className="sr-only md:not-sr-only md:text-meta md:font-medium">Add entry</span>
					</Link>
				</div>

				<WeekStrip
					date={date}
					weekTotals={weekTotals}
					isPending={isWeekPending}
					isError={isWeekError}
					availability={availability}
				/>

				<div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
					<div className="flex min-w-0 flex-col gap-5">
						{isPending ? (
							<span aria-hidden="true" className="h-5 w-40 animate-pulse rounded-[5px] bg-subtle" />
						) : (
							hasEntries && (
								<div key={date} className={entrance}>
									<DaySummary entries={entries} />
								</div>
							)
						)}

						{timer.concern !== null && (
							<ActivityBanner
								concern={timer.concern}
								onDiscard={timer.pauseAndDiscardIdle}
								onKeepRunning={timer.keepRunning}
							/>
						)}

						<QuickAddInput date={date} />

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
							onSaveDuration={saveDuration}
							onShowTimerLogs={setEntryShowingLogs}
							/* Passed down rather than read from context by the card, so a card stays
							 * renderable on its own. Absent greys the control out. */
							onContinueTimer={canContinue ? continueTimerOn : undefined}
							/* The tracked row carries a stop of its own: the app bar's pill can be
							 * scrolled a long way from it on a full day. Both drive the same timer. */
							trackingEntryId={timer.running?.entryId ?? null}
							trackingSince={timer.running?.startedAt ?? null}
							onStopTimer={timer.stop}
						/>
					</div>

					{entries !== undefined && (
						<div key={date} className={cn('hidden lg:block', entrance)}>
							<ServiceTotals
								entries={entries}
								weekTotals={weekTotals}
								isWeekError={isWeekError}
								expectedMinutes={expectedMinutesOn(availability, date)}
							/>
						</div>
					)}
				</div>
			</main>

			<TimerLogsDialog
				session={session}
				entry={entryShowingLogs}
				onOpenChange={(open) => {
					if (!open) setEntryShowingLogs(null);
				}}
			/>
			<TimeEntryDeleteDialog
				entry={entryPendingDelete}
				onOpenChange={(next) => {
					if (!next) setEntryPendingDelete(null);
				}}
				onConfirm={(entry) => {
					void confirmDelete(entry);
				}}
			/>

			{timerError !== null && (
				<Toast variant="error" onDismiss={timer.dismissError}>
					{timerError}
				</Toast>
			)}

			{toast !== null && (
				<Toast
					variant={toast.variant}
					action={toast.action}
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
