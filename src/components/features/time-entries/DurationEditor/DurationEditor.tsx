import { useRef, useState } from 'react';
import { readDuration } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm.utils';
import { formatDuration, parseDuration } from '@/lib/duration';
import { cn } from '@/lib/utils';

const NUDGES = [-15, 15, 60];

function PencilIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
			<path d="M3 14.1 13.1 4l2.9 2.9L5.9 17H3v-2.9Zm11.5-11.5 1.4-1.4 2.9 2.9-1.4 1.4-2.9-2.9Z" fill="currentColor" />
		</svg>
	);
}

/** The duration on a row, editable where it is written, under the entry form's own rules
 * (`readDuration`). It touches the duration and nothing else, which is why there is no confirm step. */
export function DurationEditor({
	minutes,
	onSave,
	isRevealed,
	isTracking = false,
	isEditing,
	onEditingChange,
}: {
	minutes: number;
	onSave: (minutes: number) => Promise<void>;
	isRevealed?: string;
	isTracking?: boolean;
	/** Open is the row's to decide, not the field's: the design's `Enter` opens this from the focused
	 * row, and the row hides its play button while it is open. What has been typed stays here. */
	isEditing: boolean;
	onEditingChange: (isEditing: boolean) => void;
}) {
	const [typed, setTyped] = useState<string | null>(null);
	const draft = typed ?? formatDuration(minutes);
	const close = () => {
		setTyped(null);
		onEditingChange(false);
	};
	const [isSaving, setIsSaving] = useState(false);
	/* Enter submits and the blur that follows commits again, which wrote the same value twice. A
	 * ref rather than `isSaving`, because the blur lands before a state update does. */
	const isCommitting = useRef(false);

	async function write() {
		const current = readDuration(draft);
		// Never saves an unparseable value and never silently rounds one: an invalid draft stays
		// open with its message, because closing it would throw away what was typed.
		if ('error' in current) return;
		if (current.minutes === minutes) {
			close();

			return;
		}

		setIsSaving(true);
		try {
			await onSave(current.minutes);
			close();
		} catch {
			// Left open with what was typed; the screen has already raised the toast.
		} finally {
			setIsSaving(false);
		}
	}

	async function commit() {
		if (!isEditing || isCommitting.current) return;
		isCommitting.current = true;
		try {
			await write();
		} finally {
			isCommitting.current = false;
		}
	}

	if (!isEditing) {
		return (
			<button
				type="button"
				disabled={isTracking}
				aria-label={`Edit logged time, ${formatDuration(minutes)}`}
				onClick={() => {
					onEditingChange(true);
				}}
				className={cn(
					'duration-ui ml-auto flex h-10 flex-none items-center gap-[7px] rounded-control px-3 text-duration leading-none font-medium tabular-nums transition-colors ease-ui md:ml-0',
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
		<div className="relative ml-auto flex-none md:ml-0">
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
					setTyped(event.target.value);
				}}
				onBlur={() => void commit()}
				onKeyDown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						void commit();
					}
					if (event.key === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
						isCommitting.current = true;
						close();
						isCommitting.current = false;
					}
				}}
				className={cn(
					'h-10 w-[112px] rounded-[10px] border-2 px-3 text-right text-base font-medium tabular-nums outline-hidden',
					isValid ? 'border-accent' : 'border-danger'
				)}
			/>

			<div className="absolute top-12 right-0 z-10 flex w-[238px] flex-col gap-2.5 rounded-input border border-line bg-surface p-3 shadow-menu">
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
								setTyped(formatDuration(Math.max(0, (parsed ?? minutes) + nudge)));
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
