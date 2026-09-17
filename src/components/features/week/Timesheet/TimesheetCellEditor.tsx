import { useRef, useState } from 'react';
import { readDuration } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm.utils';
import { formatDayShort } from '@/lib/date';
import { formatDuration } from '@/lib/duration';
import { cn } from '@/lib/utils';
import type { TimesheetCell } from './Timesheet.utils';

function StopIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
			<rect x="5" y="5" width="10" height="10" rx="2" fill="currentColor" />
		</svg>
	);
}

/**
 * One cell of the grid: a sum you can type over (UI-7).
 *
 * Empty cells stay blank rather than showing `0h`, so the eye finds real time; a hover offers a
 * `+`. Editing borrows the entry form's own rules through `readDuration`, so the grid accepts
 * `1h 30m`, `1:30`, `1.5h` or `90` and refuses what the form refuses.
 *
 * A cell with a timer running in it is the one filled cell in the grid and is never editable -
 * the number is climbing, so there is nothing stable to type over. It shows the timer's elapsed
 * rather than the day's sum, which is what the app bar and the header pill show too. Clicking it
 * stops the timer and the cell settles into an ordinary total.
 */
export function TimesheetCellEditor({
	cell,
	elapsed,
	rowName,
	isNonWorking,
	isTracking,
	onStopTimer,
	onSave,
}: {
	cell: TimesheetCell;
	/** The running timer's own count, already formatted, so every cell reads from one clock. */
	elapsed: string;
	/** For the accessible name, since a bare number in a grid says nothing on its own. */
	rowName: string;
	isNonWorking: boolean;
	isTracking: boolean;
	onStopTimer: () => void;
	onSave: (minutes: number) => Promise<void>;
}) {
	const [draft, setDraft] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	/*
	 * Enter submits the form and the blur that follows it commits again, which wrote the same cell
	 * twice - one `1h 30m` became 3h. A ref rather than `isSaving`, because the blur arrives in the
	 * same tick and a state update has not landed by then.
	 */
	const isCommitting = useRef(false);

	if (isTracking) {
		return (
			<div className="grid h-full place-items-center px-1.5 py-3">
				<button
					type="button"
					aria-label={`Stop the timer on ${rowName}`}
					onClick={onStopTimer}
					className="flex h-[34px] items-center gap-[7px] rounded-pill bg-accent px-2.5 text-meta font-medium text-on-accent tabular-nums"
				>
					<StopIcon />
					{elapsed}
				</button>
			</div>
		);
	}

	if (isNonWorking && cell.minutes === 0) {
		return <div className="grid h-full place-items-center px-1.5 py-3 text-meta text-muted">—</div>;
	}

	if (draft !== null) {
		return (
			<form
				className="grid h-full place-items-center px-2.5 py-3"
				onSubmit={(event) => {
					event.preventDefault();
					void commit();
				}}
			>
				<input
					autoFocus
					aria-label={`Time on ${rowName}, ${formatDayShort(cell.date)}`}
					value={draft}
					disabled={isSaving}
					onChange={(event) => {
						setDraft(event.target.value);
					}}
					onBlur={() => void commit()}
					onKeyDown={(event) => {
						if (event.key === 'Escape') setDraft(null);
					}}
					className="h-[38px] w-full rounded-[9px] border-2 border-accent px-2.5 text-meta font-medium tabular-nums outline-hidden"
				/>
			</form>
		);
	}

	return (
		<button
			type="button"
			aria-label={`${cell.minutes === 0 ? 'Add time' : formatDuration(cell.minutes)} on ${rowName}, ${formatDayShort(cell.date)}`}
			onClick={() => {
				setDraft(cell.minutes === 0 ? '' : formatDuration(cell.minutes));
			}}
			className={cn(
				'duration-ui group grid h-full w-full place-items-center px-1.5 py-3 text-meta font-medium tabular-nums transition-colors ease-ui hover:bg-subtle'
			)}
		>
			{cell.minutes === 0 ? (
				<span aria-hidden="true" className="text-muted opacity-0 group-hover:opacity-100">
					+
				</span>
			) : (
				/*
				 * The sum, and only the sum. A tally of the entries behind it sat beside a duration
				 * and read as a multiplier - "8h 21m ×4" looks like four times the time rather than
				 * four entries - so what it was there to warn about is said in the toast instead.
				 */
				formatDuration(cell.minutes)
			)}
		</button>
	);

	async function commit() {
		if (draft === null || isCommitting.current) return;
		isCommitting.current = true;
		try {
			await write();
		} finally {
			isCommitting.current = false;
		}
	}

	async function write() {
		if (draft === null) return;

		const trimmed = draft.trim();
		// Blank means "leave it alone", not "set it to zero": the form rejects 0 and a grid should
		// not be a way around that.
		if (trimmed === '') {
			setDraft(null);

			return;
		}

		const read = readDuration(trimmed);
		if ('error' in read || read.minutes === cell.minutes) {
			setDraft(null);

			return;
		}

		setIsSaving(true);
		try {
			await onSave(read.minutes);
			setDraft(null);
		} catch {
			// Left open with what was typed: the view raised the toast, and retyping it would be
			// the only alternative.
		} finally {
			setIsSaving(false);
		}
	}
}
