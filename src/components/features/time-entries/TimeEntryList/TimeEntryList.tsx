import { useDayEntrance } from '@/components/features/time-entries/useDayEntrance';
import { addDays, formatDayShort } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Clock3, Copy, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { TimeEntry } from '@/api/types';
import { Button } from '@/components/core/Button';
import { TimeEntryCard } from '@/components/features/time-entries/TimeEntryCard/TimeEntryCard';
import { LoadFailedIllustration } from '@/components/shared/Illustration/Illustration';

interface TimeEntryListProps {
	entries: TimeEntry[] | undefined;
	isPending: boolean;
	isRetrying?: boolean;
	onRetry: () => void;
	date: string;
	/** Asks the day view to confirm a delete. The dialog and the toast belong to the screen. */
	onRequestDelete: (entry: TimeEntry) => void;
	/** The card the arrow keys are standing on, or `null` before they have been used. The day view
	 * owns it, because the keys are bound there. */
	focusedEntryId?: string | null;
	onFocusEntry?: (id: string) => void;
	/** Fills an empty day from an earlier one. The day view owns the copy, the day it picked and the
	 * toast that reports it; the offer only has to name it. */
	onCopyFromDay?: () => void;
	copyFrom?: string;
	isCopying?: boolean;
	/** Starts a timer on that entry, which the stop then adds to. */
	onContinueTimer?: (entry: TimeEntry) => void;
	/** Writes a corrected duration from the card. The day view owns the write and the toast. */
	onSaveDuration?: (entry: TimeEntry, minutes: number) => Promise<void>;
	/** Opens the timer logs for one entry. */
	onShowTimerLogs?: (entry: TimeEntry) => void;
	trackingEntryId?: string | null;
	trackingSince?: string | null;
	onStopTimer?: () => void;
}

function CardSkeleton() {
	return (
		<div
			aria-hidden="true"
			className="relative flex min-h-22 gap-3.5 overflow-hidden rounded-entry border border-line bg-surface p-4 md:px-5 md:py-5"
		>
			<div className="size-10 flex-none rounded-control bg-subtle" />
			<div className="flex flex-1 flex-col gap-2">
				<div className="h-3.5 rounded-md bg-subtle" />
				<div className="h-3.5 w-[70%] rounded-md bg-subtle" />
				<div className="h-3 w-[45%] rounded-md bg-subtle" />
			</div>
			<div className="h-5 w-10 flex-none rounded-md bg-subtle" />
			<span className="pointer-events-none absolute inset-0 animate-skeleton-sweep bg-linear-to-r from-transparent via-surface/70 to-transparent" />
		</div>
	);
}

/**
 * The day's entries, and the three ways there are none to show. ponytail: empty and error are states
 * of this component rather than components of their own - the edit route's not-found is a bare
 * sentence and a link, so the two share no shape. Extract when something wants *this* one.
 */
export function TimeEntryList({
	entries,
	isPending,
	isRetrying = false,
	onRetry,
	date,
	onRequestDelete,
	focusedEntryId = null,
	onFocusEntry,
	onCopyFromDay,
	/* Defaulted so the list stays renderable on its own; the day view passes the day it resolved. */
	copyFrom = addDays(date, -1),
	isCopying = false,
	onContinueTimer,
	onSaveDuration,
	onShowTimerLogs,
	trackingEntryId = null,
	trackingSince = null,
	onStopTimer,
}: TimeEntryListProps) {
	/* Gates every animation below. The day's own arrival is what earns one; a remount on the same
	 * day - which is what opening the entry form is - does not. Told when the day is really on
	 * screen, so the skeleton does not spend the entrance the rows it stands in for want. */
	const isEntering = useDayEntrance(date, !isPending);

	if (isPending) {
		return (
			<div key={date} className={cn('flex flex-col gap-2.5', isEntering && 'animate-day-in')}>
				<span role="status" className="sr-only">
					Loading entries
				</span>

				{[0, 1, 2].map((index) => (
					<CardSkeleton key={index} />
				))}
			</div>
		);
	}

	/* The list reports its own failure rather than letting the route's error boundary replace the
	 * screen. The condition is "nothing to show", not "the query errored" - a refetch that fails
	 * after a successful load still has entries worth reading. `role="alert"` because this replaces
	 * the loading branch's `role="status"`, which would otherwise unmount and announce nothing. */
	if (entries === undefined) {
		return (
			<div
				key={date}
				role="alert"
				className={cn(
					'flex flex-col items-center gap-4 rounded-entry border border-line bg-surface px-5 py-10 text-center md:py-14',
					isEntering && 'animate-entry-in'
				)}
			>
				<LoadFailedIllustration />
				<p className="text-base leading-[140%]">Could not load entries.</p>
				<Button variant="outline" disabled={isRetrying} onClick={onRetry}>
					{isRetrying ? 'Retrying...' : 'Retry'}
				</Button>
			</div>
		);
	}

	if (entries.length === 0) {
		return (
			<div
				key={date}
				className={cn(
					'flex flex-col items-center rounded-entry border border-line bg-surface px-6 py-10 text-center shadow-card md:py-12',
					isEntering && 'animate-entry-in'
				)}
			>
				<div
					aria-hidden="true"
					className="relative mb-5 grid size-14 place-items-center rounded-[17px] border border-accent/10 bg-selection text-accent"
				>
					<Clock3 size={27} strokeWidth={1.5} />
					<span className="absolute -right-1.5 -bottom-1 grid size-6 place-items-center rounded-lg border-[3px] border-surface bg-accent text-white">
						<Plus size={12} />
					</span>
				</div>
				<h2 className="text-title font-semibold tracking-tight">Ready when you are</h2>
				<p className="mt-2 max-w-80 text-meta leading-relaxed text-muted">Nothing logged for this day yet.</p>
				<p className="max-w-80 text-meta leading-relaxed text-muted">Add an entry or copy a day you logged.</p>
				<div className="mt-6 flex flex-wrap justify-center gap-2.5">
					<Button asChild size="sm">
						<Link to="/entries/new" search={{ date }} resetScroll={false}>
							<Plus size={16} aria-hidden="true" />
							Add entry
						</Link>
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={onCopyFromDay === undefined || isCopying}
						onClick={onCopyFromDay}
					>
						<Copy size={15} aria-hidden="true" />
						{isCopying ? 'Copying...' : `Copy from ${formatDayShort(copyFrom)}`}
					</Button>
				</div>
				<p className="mt-5 hidden items-center gap-1.5 text-caption text-muted md:flex">
					Press <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 font-sans text-[10px]">N</kbd> to add
					an entry
				</p>
			</div>
		);
	}

	/* A roving tabindex needs exactly one tab stop, and before any arrow key none is chosen - so the
	 * first stands in. Without it Tab skips the list entirely. */
	const tabStopId = focusedEntryId ?? entries[0]?.id;

	return (
		<ul
			key={date}
			className="flex flex-col gap-3 md:gap-0 md:rounded-entry md:border md:border-line md:bg-surface md:p-2 md:shadow-card"
		>
			{entries.map((entry, index) => (
				<li
					key={entry.id}
					className={cn('md:border-b md:border-line/70 md:last:border-b-0', isEntering && 'animate-entry-in')}
					style={{ animationDelay: `${Math.min(index, 4) * 40}ms` }}
				>
					<TimeEntryCard
						entry={entry}
						isFocused={entry.id === focusedEntryId}
						isTabStop={entry.id === tabStopId}
						onTakeFocus={() => {
							onFocusEntry?.(entry.id);
						}}
						onRequestDelete={() => {
							onRequestDelete(entry);
						}}
						onContinueTimer={
							onContinueTimer === undefined
								? undefined
								: () => {
										onContinueTimer(entry);
									}
						}
						onSaveDuration={onSaveDuration === undefined ? undefined : (minutes) => onSaveDuration(entry, minutes)}
						onShowTimerLogs={
							onShowTimerLogs === undefined
								? undefined
								: () => {
										onShowTimerLogs(entry);
									}
						}
						trackingSince={entry.id === trackingEntryId ? trackingSince : null}
						onStopTimer={onStopTimer}
					/>
				</li>
			))}
		</ul>
	);
}
