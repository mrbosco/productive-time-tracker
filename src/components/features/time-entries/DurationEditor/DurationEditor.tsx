import { useId, useState } from 'react';
import { Input } from '@/components/core/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/Popover';
import { readDuration } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm.utils';
import { formatDuration, parseDuration } from '@/lib/duration';
import { cn } from '@/lib/utils';

/** The corrections worth a button. Anything else is typed. */
const NUDGES = [-15, 15, 60];

function PencilIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
			<path d="M3 14.1 13.1 4l2.9 2.9L5.9 17H3v-2.9Zm11.5-11.5 1.4-1.4 2.9 2.9-1.4 1.4-2.9-2.9Z" fill="currentColor" />
		</svg>
	);
}

/**
 * The duration on a card, editable where it is written (UI-4).
 *
 * Correcting logged time is the most common edit there is, and it cost a trip to the edit screen
 * and back for a number that is already on the row. The rules are the entry form's own
 * (`readDuration`), so this rejects what that rejects and says the same four sentences - two
 * parsers would drift and the wording is the design's.
 *
 * The card owns neither the write nor the toast; the day view does, exactly as it does for delete.
 */
export function DurationEditor({
	minutes,
	onSave,
	isRevealed,
}: {
	minutes: number;
	/** Resolves when the write settles, so the editor can stay open and say so if it fails. */
	onSave: (minutes: number) => Promise<void>;
	/** Hover on a pointer, always on a touch screen. The class comes in so the card decides. */
	isRevealed?: string;
}) {
	const fieldId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [value, setValue] = useState(() => formatDuration(minutes));
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const preview = parseDuration(value);

	async function save() {
		const read = readDuration(value);

		if ('error' in read) {
			setError(read.error);

			return;
		}
		if (read.minutes === minutes) {
			setIsOpen(false);

			return;
		}

		setIsSaving(true);
		try {
			await onSave(read.minutes);
			setIsOpen(false);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Popover
			open={isOpen}
			// Seeded on the way open rather than in an effect, so reopening shows what the entry
			// holds now instead of what was typed and abandoned last time - and follows the number
			// when a timer or another edit moves it underneath.
			onOpenChange={(open) => {
				if (open) {
					setValue(formatDuration(minutes));
					setError(null);
				}
				setIsOpen(open);
			}}
		>
			<PopoverTrigger
				aria-label={`Edit duration, ${formatDuration(minutes)}`}
				className={cn(
					'duration-ui flex flex-none items-center gap-1.5 rounded-input px-1.5 py-0.5 text-duration leading-[120%] font-medium tracking-[-.01em] tabular-nums transition-colors ease-ui hover:bg-subtle'
				)}
			>
				{formatDuration(minutes)}
				<span aria-hidden="true" className={cn('text-muted', isRevealed)}>
					<PencilIcon />
				</span>
			</PopoverTrigger>

			<PopoverContent align="end" className="w-[248px] p-3">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void save();
					}}
					className="flex flex-col gap-2.5"
				>
					<Input
						autoFocus
						id={fieldId}
						aria-label="Duration"
						aria-invalid={error !== null}
						aria-describedby={`${fieldId}-hint`}
						value={value}
						disabled={isSaving}
						onChange={(event) => {
							setValue(event.target.value);
							setError(null);
						}}
						// Saving on blur as well as on Enter, which is what "no dialog, no
						// navigation" has to mean: clicking back onto the day is a way of finishing.
						onBlur={() => {
							if (isOpen) void save();
						}}
						className="h-10 text-list tabular-nums"
					/>

					<div className="flex gap-1.5">
						{NUDGES.map((nudge) => (
							<button
								key={nudge}
								type="button"
								// Off what is typed rather than off what is stored, so two taps of
								// `+15m` add half an hour.
								onClick={() => {
									setValue(formatDuration(Math.max(0, (parseDuration(value) ?? minutes) + nudge)));
									setError(null);
								}}
								className="duration-ui flex-1 rounded-input border border-line py-1 text-label font-medium tabular-nums transition-colors ease-ui hover:bg-subtle"
							>
								{nudge < 0 ? '−' : '+'}
								{formatDuration(Math.abs(nudge))}
							</button>
						))}
					</div>

					<p id={`${fieldId}-hint`} className={cn('text-caption', error === null ? 'text-muted' : 'text-danger')}>
						{error ??
							(preview !== null && preview > 0
								? `= ${formatDuration(preview)} · Enter saves, Esc cancels`
								: 'Enter saves, Esc cancels')}
					</p>
				</form>
			</PopoverContent>
		</Popover>
	);
}
