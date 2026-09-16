import { useEffect, useId, useRef, useState } from 'react';
import type { TimeEntry } from '@/api/types';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/core/DropdownMenu';
import { formatDuration } from '@/lib/duration';
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

/**
 * One logged entry (R-6): duration, the description, and the service it was tracked against.
 *
 * The date is not repeated here. Every card on the screen is the same day, and that day is the
 * page's heading right above the list - printing it twenty times would be noise, not information.
 *
 * The card is focusable because X-2 moves between cards with the arrow keys; until then the focus
 * ring is the only thing that arrives, which is harmless and is what the design draws.
 */
export function TimeEntryCard({ entry }: { entry: TimeEntry }) {
	const note = toPlainText(entry.note);

	return (
		// Not focusable yet. The design gives cards a focus ring because X-2 moves between them with
		// the arrow keys; until that lands, `tabIndex={0}` would only add a tab stop to an element
		// with nothing to activate. X-2 brings it back as a roving tabindex.
		<article className="relative flex items-start gap-3 rounded-entry border border-line bg-surface p-4 md:gap-5 md:px-5 md:py-[18px]">
			{/*
			 * Tabular numerals so a column of durations lines up on the digits rather than
			 * shifting with each glyph width (design brief 2).
			 */}
			<p className="min-w-[70px] flex-none text-duration leading-[120%] font-medium tracking-[-.01em] tabular-nums md:min-w-[84px]">
				{formatDuration(entry.minutes)}
			</p>

			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				{note === '' ? <p className="text-list text-muted italic">No description</p> : <ClampedNote note={note} />}

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
				 * Every item here belongs to a later story - edit and delete to US-3 and US-4,
				 * continue and duplicate to X-4 and X-3. The menu is drawn because the design puts
				 * it on the card, but the items are `disabled` and say which story wires them: a
				 * `Delete` that reads as destructive, takes focus and then does nothing is worse
				 * than one that is visibly not ready (guidebook 18).
				 */}
				<DropdownMenuContent align="end" className="w-[210px]">
					<DropdownMenuItem disabled>Edit (US-3)</DropdownMenuItem>
					<DropdownMenuItem disabled>Continue timer (X-4)</DropdownMenuItem>
					<DropdownMenuItem disabled>Duplicate (X-3)</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem disabled variant="destructive">
						Delete (US-4)
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
	const noteRef = useRef<HTMLParagraphElement>(null);
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
			 * `whitespace-pre-line` is what preserves the line breaks `toPlainText` kept (A-9).
			 * `line-clamp-3` is written out rather than built from a constant: Tailwind scans
			 * source for whole class names, and an interpolated one is never generated.
			 */}
			<p
				id={noteId}
				ref={noteRef}
				className={cn('text-list leading-[145%] whitespace-pre-line', !isExpanded && 'line-clamp-3')}
			>
				{note}
			</p>

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
