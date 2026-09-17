import { useRef, useState } from 'react';
import { readDuration } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm.utils';
import { formatDuration, parseDuration } from '@/lib/duration';
import { cn } from '@/lib/utils';

/** The corrections worth a button. They act on what is typed, not on what is stored. */
const NUDGES = [-15, 15, 60];

function PencilIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
			<path d="M3 14.1 13.1 4l2.9 2.9L5.9 17H3v-2.9Zm11.5-11.5 1.4-1.4 2.9 2.9-1.4 1.4-2.9-2.9Z" fill="currentColor" />
		</svg>
	);
}

/**
 * The duration on a row, editable where it is written (`Card Actions.dc.html`).
 *
 * The number is the target rather than a pencil beside it: a dedicated edit icon would be a third
 * control in a row that already has two, and it would point at the thing it sits next to. Clicking
 * turns it into a field of the same size in the same place, so the edit happens where the eye
 * already was.
 *
 * The rules are the entry form's own (`readDuration`), so this rejects what the form rejects and
 * says the same sentence. It touches the duration and nothing else - not the description, the date
 * or the service - which is what makes it safe without a confirm step.
 */
export function DurationEditor({
	minutes,
	onSave,
	isRevealed,
	isTracking = false,
	onEditingChange,
}: {
	minutes: number;
	/** Resolves when the write settles, so a failure can keep the field open and what was typed. */
	onSave: (minutes: number) => Promise<void>;
	/** Hover on a pointer. The class comes in so the row decides when its controls appear. */
	isRevealed?: string;
	/** A moving number has nothing stable to type over, so the field never opens on one. */
	isTracking?: boolean;
	/** The row hides its play button while the field is open, as the design draws it. */
	onEditingChange?: (isEditing: boolean) => void;
}) {
	const [draft, setDraft] = useState<string | null>(null);
	const open = (value: string | null) => {
		setDraft(value);
		onEditingChange?.(value !== null);
	};
	const [isSaving, setIsSaving] = useState(false);
	/*
	 * Enter submits and the blur that follows commits again, which wrote the same value twice. A
	 * ref rather than `isSaving`, because the blur lands before a state update does.
	 */
	const isCommitting = useRef(false);

	async function write() {
		if (draft === null) return;

		const current = readDuration(draft);
		// Never saves an unparseable value and never silently rounds one: an invalid draft stays
		// open with its message, because closing it would throw away what was typed.
		if ('error' in current) return;
		if (current.minutes === minutes) {
			open(null);

			return;
		}

		setIsSaving(true);
		try {
			await onSave(current.minutes);
			open(null);
		} finally {
			setIsSaving(false);
		}
	}

	async function commit() {
		if (draft === null || isCommitting.current) return;
		isCommitting.current = true;
		try {
			await write();
		} finally {
			isCommitting.current = false;
		}
	}

	if (draft === null) {
		return (
			<button
				type="button"
				disabled={isTracking}
				aria-label={`Edit logged time, ${formatDuration(minutes)}`}
				onClick={() => {
					open(formatDuration(minutes));
				}}
				className={cn(
					'duration-ui flex h-10 flex-none items-center gap-[7px] rounded-pill px-3 text-duration leading-none font-medium tabular-nums transition-colors ease-ui',
					// Filled when the *row* is hovered, not only when the number is: the design shows
					// the whole row waking up at once, and a pill that appears under the pointer
					// alone reads as a second, later affordance.
					isTracking ? 'text-accent-dark' : 'group-hover:bg-subtle'
				)}
			>
				{formatDuration(minutes)}
				{!isTracking && (
					<span aria-hidden="true" className={cn('text-muted', isRevealed)}>
						<PencilIcon />
					</span>
				)}
			</button>
		);
	}

	const parsed = parseDuration(draft);
	const read = readDuration(draft);
	const isValid = !('error' in read);

	return (
		<div className="relative flex-none">
			<input
				autoFocus
				aria-label="Duration"
				aria-invalid={!isValid}
				value={draft}
				disabled={isSaving}
				// Selected on open, so typing replaces rather than appends - which is what makes a
				// seeded `0h` a hint rather than something to delete first.
				onFocus={(event) => {
					event.target.select();
				}}
				onChange={(event) => {
					setDraft(event.target.value);
				}}
				onBlur={() => void commit()}
				onKeyDown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						void commit();
					}
					// Restores the original and closes, which is the only way out that changes nothing.
					if (event.key === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
						isCommitting.current = true;
						open(null);
						isCommitting.current = false;
					}
				}}
				className={cn(
					'h-10 w-[112px] rounded-[10px] border-2 px-3 text-right text-base font-medium tabular-nums outline-hidden',
					isValid ? 'border-accent' : 'border-danger'
				)}
			/>

			{/* Below the field and right-aligned with it, so it never covers the note beside it. */}
			<div className="absolute top-12 right-0 z-10 flex w-[238px] flex-col gap-2.5 rounded-input border border-line bg-surface p-3 shadow-menu">
				{/*
				 * Side by side while valid, stacked while not: the form's message is a sentence, and
				 * a sentence sharing a line with the key hint wrapped into a two-word column. The
				 * wording is the form's rather than the design's shorter copy, because two sources
				 * for "what counts as a duration" is the drift the page's own build note warns about.
				 */}
				{isValid ? (
					<div className="flex items-baseline justify-between gap-2.5">
						<span className="text-label font-medium text-accent tabular-nums">= {formatDuration(read.minutes)}</span>
						<span className="flex-none text-micro whitespace-nowrap text-muted">Enter saves · Esc cancels</span>
					</div>
				) : (
					<div className="flex flex-col gap-1">
						<span className="text-label leading-[145%] text-danger">{read.error}</span>
						<span className="text-micro text-muted">Esc restores {formatDuration(minutes)}</span>
					</div>
				)}

				<div className="flex gap-1.5">
					{NUDGES.map((nudge) => (
						<button
							key={nudge}
							type="button"
							// `onMouseDown` rather than `onClick`: the field's blur would otherwise
							// commit and close the editor before the chip's click ever landed.
							onMouseDown={(event) => {
								event.preventDefault();
								setDraft(formatDuration(Math.max(0, (parsed ?? minutes) + nudge)));
							}}
							className="duration-ui h-[30px] flex-none rounded-pill bg-subtle px-2.5 text-caption font-medium tabular-nums transition-colors ease-ui hover:bg-selection hover:text-accent-dark"
						>
							{nudge < 0 ? '−' : '+'}
							{formatDuration(Math.abs(nudge))}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
