import { Clock3, Copy, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { TimeEntry } from '@/api/types';
import { Button } from '@/components/core/Button';
import { TimeEntryCard } from '@/components/features/time-entries/TimeEntryCard/TimeEntryCard';
import { LoadFailedIllustration } from '@/components/shared/Illustration/Illustration';

interface TimeEntryListProps {
	entries: TimeEntry[] | undefined;
	isPending: boolean;
	/** A retry already in flight, so the button says so instead of looking inert. */
	isRetrying?: boolean;
	onRetry: () => void;
	/** The day being shown, so the empty state's `Add entry` lands on the right date. */
	date: string;
	/** Asks the day view to confirm a delete (R-12). The dialog and the toast belong to the screen. */
	onRequestDelete: (entry: TimeEntry) => void;
	/**
	 * The card the arrow keys are standing on (X-2), or `null` before they have been used. The day
	 * view owns it because the keys are bound there and because `e` and `Delete` act on it.
	 */
	focusedEntryId?: string | null;
	onFocusEntry?: (id: string) => void;
	/** X-3: fills an empty day from the one before it. The day view owns the copy and its toast. */
	onCopyFromYesterday?: () => void;
	isCopying?: boolean;
	/** X-4: starts a timer on that entry, which the stop then adds to. */
	onContinueTimer?: (entry: TimeEntry) => void;
	/** Writes a corrected duration from the card (UI-4). The day view owns the write and the toast. */
	onSaveDuration?: (entry: TimeEntry, minutes: number) => Promise<void>;
	/** Opens UI-9's timer logs for one entry. */
	onShowTimerLogs?: (entry: TimeEntry) => void;
	/** The entry a timer is running against, and when it started (X-4). */
	trackingEntryId?: string | null;
	trackingSince?: string | null;
	onStopTimer?: () => void;
}

/** The card the empty and error states share, so the list never collapses to nothing. */
function ListState({ children, role }: { children: ReactNode; role?: 'alert' }) {
	return (
		<div
			role={role}
			className="flex animate-entry-in flex-col items-center gap-4 rounded-entry border border-line bg-surface px-5 py-10 text-center md:py-14"
		>
			{children}
		</div>
	);
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
 * The day's entries, and the three ways there are none to show.
 *
 * ponytail: `empty` and `error` are states of this component rather than `shared/EmptyState` and
 * `shared/ErrorState`, which SPEC 6.1 names - the design's own component sheet captions them
 * `TimeEntryList · empty / error / loading`, and each would have exactly one caller today.
 *
 * US-3 was expected to be the second caller and turned out not to be. Its "this entry no longer
 * exists" is a bare centred sentence and a link on the page background
 * (`04-edit-entry-mobile-notfound.png`), where these are a bordered card with an illustration, a
 * sentence and a button - sharing a component between them would mean a prop for every part that
 * differs, which is all of them. It stays here until something wants *this* shape.
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
	onCopyFromYesterday,
	isCopying = false,
	onContinueTimer,
	onSaveDuration,
	onShowTimerLogs,
	trackingEntryId = null,
	trackingSince = null,
	onStopTimer,
}: TimeEntryListProps) {
	if (isPending) {
		return (
			<div key={date} className="flex animate-day-in flex-col gap-2.5">
				{/*
				 * `role="status"` so the wait is announced: a screen-reader user gets silence
				 * otherwise, because skeletons are decoration and carry no text.
				 */}
				<span role="status" className="sr-only">
					Loading entries
				</span>

				{[0, 1, 2].map((index) => (
					<CardSkeleton key={index} />
				))}
			</div>
		);
	}

	/*
	 * R-8. The list reports its own failure and offers a way out, rather than the route's error
	 * boundary replacing the whole screen - the date navigator above stays usable, so another day
	 * is one tap away even while this one is failing.
	 *
	 * The condition is "nothing to show", not "the query reports an error". A refetch that fails
	 * after a successful load leaves the day's entries in the cache, and replacing a list the user
	 * can still read with an error card loses more than it explains.
	 *
	 * `role="alert"` because this replaces the `role="status"` of the loading branch. Without it
	 * the live region simply unmounts and the failure is inserted as static text, so a screen
	 * reader announces nothing at all.
	 */
	if (entries === undefined) {
		return (
			<ListState key={date} role="alert">
				<LoadFailedIllustration />
				<p className="text-base leading-[140%]">Could not load entries.</p>
				<Button variant="outline" disabled={isRetrying} onClick={onRetry}>
					{isRetrying ? 'Retrying...' : 'Retry'}
				</Button>
			</ListState>
		);
	}

	if (entries.length === 0) {
		return (
			<div
				key={date}
				className="flex animate-entry-in flex-col items-center rounded-entry border border-line bg-surface px-6 py-10 text-center shadow-card md:py-12"
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
				<p className="max-w-80 text-meta leading-relaxed text-muted">Add an entry or copy yesterday's work.</p>
				<div className="mt-6 flex flex-wrap justify-center gap-2.5">
					<Button asChild size="sm">
						<Link to="/entries/new" search={{ date }}>
							<Plus size={16} aria-hidden="true" />
							Add entry
						</Link>
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={onCopyFromYesterday === undefined || isCopying}
						onClick={onCopyFromYesterday}
					>
						<Copy size={15} aria-hidden="true" />
						{isCopying ? 'Copying...' : 'Copy from yesterday'}
					</Button>
				</div>
				<p className="mt-5 hidden items-center gap-1.5 text-caption text-muted md:flex">
					Press <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 font-sans text-[10px]">N</kbd> to add
					an entry
				</p>
			</div>
		);
	}

	/*
	 * A roving tabindex needs exactly one tab stop, and before any arrow key has been pressed there
	 * is no chosen card - so the first one stands in. Without this the whole list is skipped by Tab
	 * and there is no way in from the keyboard at all (guidebook 18).
	 */
	const tabStopId = focusedEntryId ?? entries[0]?.id;

	return (
		// Replay only on a different day or a newly inserted entry, never on timer ticks/refetches.
		<ul key={date} className="flex flex-col rounded-entry border border-line bg-surface p-2 shadow-card">
			{entries.map((entry, index) => (
				<li
					key={entry.id}
					className="animate-entry-in border-b border-line/70 last:border-b-0"
					style={{ animationDelay: `${Math.min(index, 4) * 40}ms` }}
				>
					<TimeEntryCard
						entry={entry}
						// Only a card the day view has actually chosen pulls focus to itself; the
						// stand-in above is a tab stop and nothing more.
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
