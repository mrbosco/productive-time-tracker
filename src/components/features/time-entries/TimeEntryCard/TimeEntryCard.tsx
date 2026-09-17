import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import type { TimeEntry } from '@/api/types';
import { Avatar } from '@/components/core/Avatar';
import { DurationEditor } from '@/components/features/time-entries/DurationEditor/DurationEditor';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/core/DropdownMenu';
import { formatDayShort, todayIso } from '@/lib/date';
import { StopTimerButton, TimerDot } from '@/components/features/timer/TimerControl/TimerControl';
import { useElapsedSeconds } from '@/components/features/timer/useTimer';
import { formatDuration } from '@/lib/duration';
import { Note } from '@/components/features/time-entries/Note/Note';
import { ServiceContext } from '@/components/features/time-entries/ServiceContext/ServiceContext';
import { toPlainText } from '@/lib/note';
import { useHasHover } from '@/components/shared/useHasHover';
import { cn } from '@/lib/utils';

const REVEALED = 'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

const SAVED_MARKER_MS = 2600;

function PlayIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
			<path d="M6 3.6 16 10 6 16.4V3.6Z" fill="currentColor" />
		</svg>
	);
}

function KebabIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
			<circle cx="10" cy="4.2" r="1.7" fill="currentColor" />
			<circle cx="10" cy="10" r="1.7" fill="currentColor" />
			<circle cx="10" cy="15.8" r="1.7" fill="currentColor" />
		</svg>
	);
}

interface TimeEntryCardProps {
	entry: TimeEntry;
	onRequestDelete: () => void;
	isFocused?: boolean;
	/** The list's single tab stop. Separate from `isFocused`: before any arrow key no card is chosen
	 * and the list still has to be reachable by Tab. A card outside a list is always one. */
	isTabStop?: boolean;
	onTakeFocus?: () => void;
	/** Starts a timer on this entry. Absent hides the play button - one timer at a time. */
	onContinueTimer?: () => void;
	onSaveDuration?: (minutes: number) => Promise<void>;
	onShowTimerLogs?: () => void;
	trackingSince?: string | null;
	onStopTimer?: () => void;
}

/** One logged entry. A tab stop only while it is the focused one - a roving tabindex, so Tab does
 * not walk through twenty cards to reach what is below the list. */
export function TimeEntryCard({
	entry,
	onRequestDelete,
	isFocused = false,
	isTabStop = true,
	onTakeFocus,
	onContinueTimer,
	onSaveDuration,
	onShowTimerLogs,
	trackingSince = null,
	onStopTimer,
}: TimeEntryCardProps) {
	const cardRef = useRef<HTMLElement>(null);
	const hasHover = useHasHover();
	// The play button gives way to its own reserved space while the field is open, so the row does
	// not offer to start a timer on a number somebody is halfway through changing.
	const [isEditingDuration, setIsEditingDuration] = useState(false);
	const [hasJustSaved, setHasJustSaved] = useState(false);
	const trackedSeconds = useElapsedSeconds(trackingSince);
	const isTracking = trackingSince !== null;
	/* The entry's real total: what is stored plus what is running. An entry that already had minutes
	 * would otherwise appear to have lost them while being tracked. */
	const minutes = isTracking ? entry.minutes + Math.floor(trackedSeconds / 60) : entry.minutes;
	// `toPlainText` only to decide whether there is anything to show: a note that is all markup and
	// no words - `<p></p>` - should read as no description. What is rendered is the markup itself.
	const hasNote = toPlainText(entry.note).trim() !== '';

	useEffect(() => {
		if (isFocused) cardRef.current?.focus();
	}, [isFocused]);

	useEffect(() => {
		if (!hasJustSaved) return;

		const marker = setTimeout(() => {
			setHasJustSaved(false);
		}, SAVED_MARKER_MS);

		return () => {
			clearTimeout(marker);
		};
	}, [hasJustSaved]);

	return (
		<article
			ref={cardRef}
			tabIndex={isTabStop ? 0 : -1}
			// Narrowed to the card itself: focus events bubble, so without this, clicking the kebab
			// would report the card as focused, the effect above would pull focus back out of the
			// menu trigger, and the menu would never open.
			onFocus={(event) => {
				if (event.target === event.currentTarget) onTakeFocus?.();
			}}
			/* `Enter` opens this row's duration field, which is why it cannot live with the day's other
			 * hotkeys. Narrowed to the row so an Enter inside the field or menu is not this one. */
			onKeyDown={(event) => {
				if (event.target !== event.currentTarget) return;
				if (event.key !== 'Enter' || !hasHover || onSaveDuration === undefined || isTracking) return;

				event.preventDefault();
				setIsEditingDuration(true);
			}}
			className={cn(
				'duration-ui group relative flex min-h-[76px] flex-wrap items-start gap-3.5 rounded-input border bg-surface p-3 transition-colors md:flex-nowrap md:items-center md:gap-4 md:px-4 md:py-6',
				isTracking ? 'border-transparent bg-selection/65' : 'border-transparent hover:bg-canvas/80'
			)}
		>
			{isTracking && (
				<span aria-hidden="true" className="absolute top-5 bottom-5 left-0 w-[3px] rounded-pill bg-accent/65" />
			)}
			<Avatar
				name={entry.service?.companyName ?? ''}
				src={entry.service?.companyAvatarUrl}
				initialsFrom="start"
				className="size-11 flex-none rounded-[13px] object-contain p-2"
				fallbackClassName={cn(
					'text-micro font-bold tracking-[.02em]',
					entry.service?.companyName === null || entry.service?.companyName === undefined
						? 'border border-line bg-subtle text-muted'
						: 'bg-selection text-accent-dark'
				)}
			/>

			<div className="order-last flex min-w-0 flex-1 basis-full flex-col gap-1.5 md:order-none md:basis-auto">
				<div className="flex flex-wrap items-center gap-2">
					<ServiceContext service={entry.service} />
					<time dateTime={entry.date} className="text-caption leading-[140%] text-muted">
						{formatDayShort(entry.date)}
					</time>
					{isTracking && (
						<>
							<span aria-hidden="true" className="hidden h-[11px] w-px bg-line md:block" />
							<span className="flex items-center gap-1.5 rounded-pill bg-surface/80 px-2.5 py-1 text-micro font-medium text-accent-dark">
								<TimerDot className="size-[6px]" />
								Tracking
							</span>
						</>
					)}
					{hasJustSaved && (
						<>
							<span aria-hidden="true" className="hidden h-[11px] w-px bg-line md:block" />
							<span aria-hidden="true" className="text-micro font-medium text-accent-dark">
								Saved
							</span>
						</>
					)}
					{/* Productive's own draft flag, independent of the duration: a recorded zero-minute
					     entry is `draft: false`, so deriving this from `minutes === 0` mislabels it. */}
					{entry.draft && <span className="text-caption font-medium text-muted">Draft</span>}
				</div>
				{hasNote ? <ClampedNote note={entry.note ?? ''} /> : <p className="text-label text-muted">No description</p>}
			</div>

			{hasHover &&
				(isTracking ? null : isEditingDuration || onContinueTimer === undefined ? (
					<span aria-hidden="true" className="hidden size-9 flex-none md:block" />
				) : (
					<button
						type="button"
						aria-label="Continue timer on this entry"
						title="Continue timer"
						onClick={onContinueTimer}
						className={cn(
							'duration-ui ml-auto grid size-9 flex-none place-items-center rounded-control border border-line text-accent transition-colors ease-ui hover:border-transparent hover:bg-selection md:ml-0',
							REVEALED
						)}
					>
						<PlayIcon />
					</button>
				))}

			{isTracking && onStopTimer !== undefined && (
				<StopTimerButton
					onStop={onStopTimer}
					label="Stop"
					className="ml-auto h-9 flex-none rounded-[10px] border border-accent/15 bg-surface text-accent-dark shadow-control transition-colors hover:scale-100 hover:bg-selection md:ml-0"
				/>
			)}

			{hasHover && onSaveDuration !== undefined ? (
				<DurationEditor
					minutes={minutes}
					isTracking={isTracking}
					onSave={async (next) => {
						await onSaveDuration(next);
						setHasJustSaved(true);
					}}
					isEditing={isEditingDuration}
					onEditingChange={setIsEditingDuration}
					isRevealed={REVEALED}
				/>
			) : (
				<p
					className={cn(
						'ml-auto flex-none pt-0.5 text-duration leading-[120%] font-medium tracking-[-.01em] tabular-nums md:ml-0 md:pt-0',
						isTracking && 'text-accent-dark'
					)}
				>
					{formatDuration(minutes)}
				</p>
			)}

			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Entry actions"
					className="duration-ui -mr-2.5 grid size-11 flex-none place-items-center rounded-control text-muted transition-colors ease-ui hover:bg-subtle hover:text-ink md:-mt-0 md:-mr-1 md:size-9"
				>
					<KebabIcon />
				</DropdownMenuTrigger>

				{/* `Edit` is a `Link`, never an import of the form: TipTap is 404 kB raw and
				     `autoCodeSplitting` keeps it out of the day's chunk. `Duplicate` carries the entry's
				     ID rather than its values, so nobody's description ends up in a URL. */}
				<DropdownMenuContent align="end" className="w-[210px]">
					<DropdownMenuItem asChild>
						<Link to="/entries/$id/edit" params={{ id: entry.id }}>
							Edit
						</Link>
					</DropdownMenuItem>
					{!hasHover && (
						<DropdownMenuItem disabled={isTracking || onContinueTimer === undefined} onSelect={onContinueTimer}>
							Continue timer
						</DropdownMenuItem>
					)}
					<DropdownMenuItem asChild>
						<Link to="/entries/new" search={{ date: todayIso(), duplicate: entry.id }}>
							Duplicate
						</Link>
					</DropdownMenuItem>
					{onShowTimerLogs !== undefined && <DropdownMenuItem onSelect={onShowTimerLogs}>Timer logs</DropdownMenuItem>}
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive" onSelect={onRequestDelete}>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</article>
	);
}

/** The note, clamped to three lines behind a `More` toggle. CSS has no selector for "is this
 * clamped", so the overflow is measured - once, after render. ponytail: it does not re-measure on
 * resize, so rotating a phone can leave the toggle showing. `ResizeObserver` is the upgrade. */
function ClampedNote({ note }: { note: string }) {
	const noteId = useId();
	const noteRef = useRef<HTMLDivElement>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);

	useEffect(() => {
		const element = noteRef.current;
		if (element === null) return;

		setIsOverflowing(element.scrollHeight > element.clientHeight);
	}, [note]);

	return (
		<>
			{/* `whitespace-pre-line` preserves the line breaks in a plain-text note, which is what `Note`
			     returns without markup. A `div`, not a `p`: a list inside a paragraph is invalid HTML
			     the browser silently reparents, breaking the clamp and the measurement above. */}
			<div
				id={noteId}
				ref={noteRef}
				className={cn(
					// Block layout, not flex: `line-clamp-3` switches `display` to `-webkit-box`, so a
					// `flex` here would fight it depending on stylesheet order.
					'text-list leading-[145%] whitespace-pre-line [&>*+*]:mt-1',
					!isExpanded && 'line-clamp-3'
				)}
			>
				<Note note={note} />
			</div>

			{isOverflowing && (
				<button
					type="button"
					aria-expanded={isExpanded}
					aria-controls={noteId}
					className="self-start rounded-input text-label font-medium text-accent hover:underline"
					onClick={() => {
						setIsExpanded((wasExpanded) => !wasExpanded);
					}}
				>
					{isExpanded ? 'Less' : 'More'}
				</button>
			)}
		</>
	);
}
