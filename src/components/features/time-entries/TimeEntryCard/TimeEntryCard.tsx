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
import { todayIso } from '@/lib/date';
import { StopTimerButton, TimerDot } from '@/components/features/timer/TimerControl/TimerControl';
import { useElapsedSeconds } from '@/components/features/timer/useTimer';
import { formatDuration } from '@/lib/duration';
import { Note } from '@/components/features/time-entries/Note/Note';
import { ServiceContext } from '@/components/features/time-entries/ServiceContext/ServiceContext';
import { toPlainText } from '@/lib/note';
import { useHasHover } from '@/components/shared/useHasHover';
import { cn } from '@/lib/utils';

/**
 * Revealed by hovering the card on a pointer, and always there on a touch screen, where hover is
 * not something that exists and a control nobody can reveal is a control nobody has (UI-4).
 * `focus-within` so the keyboard reaches them without a pointer.
 */
const REVEALED = 'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100';

/** How long the row says so after an inline correction lands (`Card Actions.dc.html`). */
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
	/** The card the arrow keys are standing on (X-2). It pulls focus to itself when it becomes so. */
	isFocused?: boolean;
	/**
	 * The list's single tab stop. Separate from `isFocused` because before any arrow key has been
	 * pressed no card is chosen, and the list still has to be reachable by Tab.
	 *
	 * Defaults to true, which is what a card rendered on its own is: the roving part of a roving
	 * tabindex belongs to the list, and a card outside one has nothing to rove against.
	 */
	isTabStop?: boolean;
	/** The card took focus on its own - a click or a Tab - so the list can follow it. */
	onTakeFocus?: () => void;
	/** Starts a timer on this entry (X-4, UI-4). Absent hides the play button - one at a time. */
	onContinueTimer?: () => void;
	/** Writes a corrected duration (UI-4). Absent leaves the duration as plain text. */
	onSaveDuration?: (minutes: number) => Promise<void>;
	/** Opens UI-9's read-only account of how this entry's minutes were arrived at. */
	onShowTimerLogs?: () => void;
	/**
	 * A timer is running against this entry (X-4). The card says so and carries a stop control of
	 * its own, because the app bar can be scrolled a long way from the row it belongs to.
	 */
	trackingSince?: string | null;
	onStopTimer?: () => void;
}

/**
 * One logged entry (R-6): duration, the description, and the service it was tracked against.
 *
 * The date is not repeated here. Every card on the screen is the same day, and that day is the
 * page's heading right above the list - printing it twenty times would be noise, not information.
 *
 * The card is focusable, and is a tab stop only while it is the focused one: X-2 moves between
 * cards with the arrow keys, and a roving tabindex is what keeps Tab from walking through twenty
 * of them to reach whatever is below the list (guidebook 18).
 */
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
	/*
	 * The quiet marker the design puts on the meta line for 2.6s after a correction. The toast says
	 * the same thing at the corner of the screen; this says it on the row that changed, which is
	 * where the eye already is when the field closes.
	 */
	const [hasJustSaved, setHasJustSaved] = useState(false);
	const trackedSeconds = useElapsedSeconds(trackingSince);
	const isTracking = trackingSince !== null;
	/*
	 * The entry's real total, not the timer's: what is stored plus what is running. They are the
	 * same number for a timer started from the bar, whose entry begins at zero - but an entry that
	 * already had minutes on it would otherwise appear to have lost them while being tracked
	 * (`Timer.dc.html`, "the number on the card is always the entry's real total").
	 */
	const minutes = isTracking ? entry.minutes + Math.floor(trackedSeconds / 60) : entry.minutes;
	// `toPlainText` only to decide whether there is anything to show: a note that is all markup
	// and no words - `<p></p>` - should read as no description rather than as an empty box. What
	// is rendered is the markup itself (ADR-0010).
	const hasNote = toPlainText(entry.note).trim() !== '';

	/*
	 * Focus follows the list's choice, because the arrow keys change which card is chosen and
	 * nothing else would move the caret there. Focusing a card that already has it is a no-op, so
	 * the click path - where `onTakeFocus` reports focus that has already landed - costs nothing.
	 */
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
			/*
			 * `Enter` opens the duration field on the focused row, which is the one key in the
			 * design's table that cannot live with the others in the day's `useHotkeys`: it is this
			 * row's field that opens, and only the row knows it has one. Narrowed to the row itself
			 * so an Enter inside the field, the menu or the `More` toggle is not this one.
			 */
			onKeyDown={(event) => {
				if (event.target !== event.currentTarget) return;
				if (event.key !== 'Enter' || !hasHover || onSaveDuration === undefined || isTracking) return;

				event.preventDefault();
				setIsEditingDuration(true);
			}}
			// No focus classes: `styles/index.css` draws one accent ring on `:focus-visible`
			// everywhere, which is the ring the design brief asks cards to have.
			className={cn(
				'group relative flex min-h-[76px] items-start gap-3.5 rounded-entry border bg-surface p-4 md:items-center md:gap-[18px] md:px-5 md:py-[18px]',
				/*
				 * The indigo edge the design gives a tracking row, so it is findable down a long
				 * day - drawn as a thick left border rather than an absolutely positioned bar. A
				 * bar is a rectangle and the card is not: its square ends stuck out past the
				 * rounded corners and read as a rendering fault. A border follows the radius. The
				 * three extra pixels come back out of the padding so nothing shifts when a timer
				 * starts.
				 */
				isTracking ? 'border-l-4 border-accent pl-[13px] md:pl-[17px]' : 'border-line'
			)}
		>
			{/*
			 * The company the service is billed to, which is what the row used to lead with in
			 * Productive's own UI and what UI-1 puts back. Its logo when there is one, its initials
			 * when there is not, and a building when the service has no company at all - which is
			 * the state an entry on a since-archived deal lands in, not a rendering fault.
			 */}
			<Avatar
				name={entry.service?.companyName ?? ''}
				src={entry.service?.companyAvatarUrl}
				// `start`, not `edges`: an organisation is named by its first two words and the rest
				// is usually a legal suffix, so "Vela Studio Group" is VS rather than VG.
				initialsFrom="start"
				// Contained and padded rather than cropped - a brand mark filled to the edges of a
				// square is a brand mark with its corners cut off.
				className="size-10 flex-none rounded-[10px] object-contain p-1.5"
				fallbackClassName={cn(
					'text-micro font-bold tracking-[.02em]',
					entry.service?.companyName === null || entry.service?.companyName === undefined
						? 'border border-line bg-subtle text-muted'
						: 'bg-selection text-accent-dark'
				)}
			/>

			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				{hasNote ? (
					<ClampedNote note={entry.note ?? ''} />
				) : (
					<p className="text-list text-muted italic">No description</p>
				)}

				<div className="flex flex-wrap items-center gap-2">
					{/* `project · service`, and everything behind the project name (UI-2). */}
					<ServiceContext service={entry.service} />
					{/*
					 * After the service rather than before it, which is where `Card Actions.dc.html`
					 * puts it: the meta line reads left to right as what this is, then what it is
					 * doing. On the meta line at all widths so the row does not change height when a
					 * timer starts on it.
					 */}
					{isTracking && (
						<>
							<span aria-hidden="true" className="hidden h-[11px] w-px bg-line md:block" />
							<span className="flex items-center gap-1.5 text-micro font-bold tracking-[.06em] text-accent uppercase">
								Tracking
								<TimerDot className="size-[7px]" />
							</span>
						</>
					)}
					{hasJustSaved && (
						<>
							<span aria-hidden="true" className="hidden h-[11px] w-px bg-line md:block" />
							{/* Not announced: the screen's toast already says it once, politely. */}
							<span aria-hidden="true" className="text-micro font-medium text-accent-dark">
								Saved
							</span>
						</>
					)}
					{/*
					 * Productive's own draft flag, and read from nothing else (A-8). It is
					 * independent of the duration: the recorded zero-minute entry is `draft:
					 * false`, and a running timer is a zero-minute entry too, so deriving the
					 * label from `minutes === 0` would mislabel both.
					 */}
					{entry.draft && <span className="text-caption font-medium text-muted">Draft</span>}
				</div>
			</div>

			{/*
			 * Tabular numerals so a column of durations lines up on the digits rather than shifting
			 * with each glyph width (design brief 2). It sits at the trailing edge now: the leading
			 * slot is the company's, and the space this leaves is what UI-4's play button goes in.
			 *
			 * No reserved width any more. A right-aligned column lines up on its own edge, which is
			 * what the 70px was buying when the column was on the left.
			 */}
			{/*
			 * Editable in place on a pointer only (`Card Actions.dc.html`): a 112px field and a chip
			 * row do not fit beside a 15px note at 390, and there is no hover to reveal a pencil, so
			 * touch keeps `Edit` in the kebab instead.
			 */}
			{/*
			 * Before the duration rather than after it, which is where `Card Actions.dc.html` draws
			 * it. Its width is reserved whether or not it is painted - otherwise the list twitches
			 * as the pointer runs down it - and on the trailing side that reservation is a visible
			 * hole between the number and the kebab. On the leading side it is absorbed by the gap
			 * the note column already leaves.
			 */}
			{hasHover &&
				(isTracking ? null : isEditingDuration || onContinueTimer === undefined ? (
					<span aria-hidden="true" className="size-9 flex-none" />
				) : (
					<button
						type="button"
						aria-label="Continue timer on this entry"
						title="Continue timer"
						onClick={onContinueTimer}
						className={cn(
							'duration-ui grid size-9 flex-none place-items-center rounded-pill border border-line text-accent transition-colors ease-ui hover:border-transparent hover:bg-selection',
							REVEALED
						)}
					>
						<PlayIcon />
					</button>
				))}

			{/*
			 * The same control as the app bar's, so it is learned once - a square on mobile where
			 * space is short, and the word beside it on desktop where there is room. Both drive the
			 * one timer and open the one stop sheet; the bar keeps its pill either way, because this
			 * card can scroll out of sight.
			 */}
			{isTracking && onStopTimer !== undefined && (
				<StopTimerButton onStop={onStopTimer} label="Stop" className="flex-none" />
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
						'flex-none pt-0.5 text-duration leading-[120%] font-medium tracking-[-.01em] tabular-nums md:pt-0',
						isTracking && 'text-accent-dark'
					)}
				>
					{formatDuration(minutes)}
				</p>
			)}

			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Entry actions"
					className="duration-ui -mt-2.5 -mr-2.5 grid size-11 flex-none place-items-center rounded-pill text-muted transition-colors ease-ui hover:bg-subtle hover:text-ink md:-mt-0 md:-mr-1 md:size-9"
				>
					<KebabIcon />
				</DropdownMenuTrigger>

				{/*
				 * `Edit` is live from US-3 and `Delete` from US-4; the two between them belong to
				 * later stories and stay `disabled` saying so - an item that reads as live, takes
				 * focus and then does nothing is worse than one visibly not ready (guidebook 18).
				 *
				 * `Edit` is a `Link`, never an import of the form. ADR-0010 measured TipTap at 404 kB
				 * raw and `autoCodeSplitting` keeps it out of the day's chunk; pulling the form in
				 * here to open it would drag the whole ProseMirror tree onto the screen SPEC 4.2
				 * requires to render on one request.
				 *
				 * `Continue timer` has left this menu for a play button on the row itself (UI-4),
				 * one tap instead of two. It still starts a timer **on this entry** (X-4): `POST
				 * /timers` with a `time_entry` relationship attaches to one that already exists
				 * rather than creating another, and the stop adds the elapsed minutes to what it
				 * holds (`docs/api/samples/timer-continue-entry-probe.txt`).
				 *
				 * `Duplicate` lands on **today**, not on the day the source entry is from (X-3, Toggl's
				 * continue pattern): copying yesterday's standup is almost always about logging today's,
				 * and the source date is one tap away in the picker if it was not. It carries the entry's
				 * ID rather than its values - the form reads them back - so nobody's description ends up
				 * in a URL.
				 *
				 * `Delete` is a handler rather than a link for the same reason read the other way:
				 * it asks its question on this screen and stays here (design brief 5), so there is
				 * no route to send anyone to. The dialog it opens lives on the day view, not on this
				 * card - the toast that follows belongs to the screen, and X-2's Delete key will
				 * want the same opening from the list rather than from a menu.
				 */}
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
					{/* Where `Continue timer` used to be, so the menu did not grow (UI-9). */}
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

/**
 * The note, clamped to three lines behind a `More` toggle (design brief 3.2).
 *
 * The toggle only appears when the text actually overflows, and CSS has no selector for "is this
 * clamped", so it has to be measured.
 *
 * ponytail: measured once after render. It does not re-measure on resize, so rotating a phone
 * while a borderline note is on screen can leave the toggle showing when it is no longer needed.
 * A `ResizeObserver` is the upgrade if that ever matters.
 */
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
			{/*
			 * `whitespace-pre-line` preserves the line breaks in a plain-text note, which is what
			 * `Note` returns when there is no markup to render (A-9). `line-clamp-3` is written
			 * out rather than built from a constant: Tailwind scans source for whole class names,
			 * and an interpolated one is never generated.
			 *
			 * A `div`, not a `p`: a note written as a list renders `<ul>`, and a list inside a
			 * paragraph is invalid HTML that the browser silently reparents - which breaks both
			 * the clamp and the measurement below.
			 */}
			<div
				id={noteId}
				ref={noteRef}
				className={cn(
					// Block layout, not flex: `line-clamp-3` works by switching `display` to
					// `-webkit-box`, so a `flex` on the same element silently wins or loses
					// depending on stylesheet order and the clamp stops being measurable. Blocks
					// stack on their own; the sibling margin is all the spacing a note needs.
					'text-list leading-[145%] whitespace-pre-line [&>*+*]:mt-1',
					!isExpanded && 'line-clamp-3'
				)}
			>
				<Note note={note} />
			</div>

			{isOverflowing && (
				<button
					type="button"
					// The toggle changes how much of the note is shown, so it says which state it
					// is in and what it controls, rather than leaving that to the visible word.
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
