import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import type { TimeEntry } from '@/api/types';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/core/DropdownMenu';
import { todayIso } from '@/lib/date';
import { formatDuration } from '@/lib/duration';
import { Note } from '@/components/features/time-entries/Note/Note';
import { toPlainText } from '@/lib/note';
import { cn } from '@/lib/utils';

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
}: TimeEntryCardProps) {
	const cardRef = useRef<HTMLElement>(null);
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
			// No focus classes: `styles/index.css` draws one accent ring on `:focus-visible`
			// everywhere, which is the ring the design brief asks cards to have.
			className="relative flex items-start gap-3 rounded-entry border border-line bg-surface p-4 md:gap-5 md:px-5 md:py-[18px]"
		>
			{/*
			 * Tabular numerals so a column of durations lines up on the digits rather than
			 * shifting with each glyph width (design brief 2).
			 */}
			<p className="min-w-[70px] flex-none text-duration leading-[120%] font-medium tracking-[-.01em] tabular-nums md:min-w-[84px]">
				{formatDuration(entry.minutes)}
			</p>

			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				{hasNote ? (
					<ClampedNote note={entry.note ?? ''} />
				) : (
					<p className="text-list text-muted italic">No description</p>
				)}

				<p className="text-caption font-medium text-muted">
					{entry.service?.name ?? 'Unknown service'}
					{/*
					 * Productive's own draft flag, and read from nothing else (A-8). It is
					 * independent of the duration: the recorded zero-minute entry is `draft:
					 * false`, and a running timer is a zero-minute entry too, so deriving the
					 * label from `minutes === 0` would mislabel both.
					 */}
					{entry.draft && <span className="ml-2">Draft</span>}
				</p>
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Entry actions"
					className="duration-ui -mt-2.5 -mr-2.5 grid size-11 flex-none place-items-center rounded-pill text-muted transition-colors ease-ui hover:bg-subtle hover:text-ink md:-mt-2 md:-mr-2"
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
					<DropdownMenuItem disabled>Continue timer (X-4)</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to="/entries/new" search={{ date: todayIso(), duplicate: entry.id }}>
							Duplicate
						</Link>
					</DropdownMenuItem>
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
