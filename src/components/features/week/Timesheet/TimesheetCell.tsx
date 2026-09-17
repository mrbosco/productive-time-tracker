import { Link } from '@tanstack/react-router';
import { formatDayShort } from '@/lib/date';
import { formatDuration } from '@/lib/duration';
import type { TimesheetCell as Cell } from './Timesheet.utils';

function StopIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
			<rect x="5" y="5" width="10" height="10" rx="2" fill="currentColor" />
		</svg>
	);
}

/**
 * One cell of the grid: the sum logged against a service on a day, and a way into the day it came
 * from.
 *
 * Read-only on purpose. A cell is a total over however many entries share that service and day, so
 * typing `10h` over `8h 40m` has no answer to "onto which entry?" - it could grow one, split the
 * difference, or make a new one, and each is a different thing to have meant. The day view is where
 * entries are individually editable, so the cell goes there instead of guessing.
 *
 * A running timer keeps its stop button: that one is unambiguous, because a timer runs against
 * exactly one entry.
 */
export function TimesheetCell({
	cell,
	elapsed,
	rowName,
	isNonWorking,
	isTracking,
	onStopTimer,
}: {
	cell: Cell;
	elapsed: string;
	rowName: string;
	isNonWorking: boolean;
	isTracking: boolean;
	onStopTimer: () => void;
}) {
	if (isTracking) {
		return (
			<div className="grid h-full place-items-center px-1.5 py-3">
				<button
					type="button"
					aria-label={`Stop the timer on ${rowName}`}
					onClick={onStopTimer}
					className="flex h-[34px] items-center gap-[7px] rounded-control bg-accent px-2.5 text-meta font-medium text-on-accent tabular-nums"
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

	const label =
		cell.minutes === 0
			? `Open ${formatDayShort(cell.date)}`
			: `${formatDuration(cell.minutes)} on ${rowName}, ${formatDayShort(cell.date)} - open that day`;

	return (
		<Link
			to="/day/$date"
			params={{ date: cell.date }}
			aria-label={label}
			className="duration-ui grid h-full w-full place-items-center px-1.5 py-3 text-meta font-medium tabular-nums transition-colors ease-ui hover:bg-selection/65 focus-visible:bg-selection/65"
		>
			{cell.minutes === 0 ? <span aria-hidden="true" className="text-muted/50"></span> : formatDuration(cell.minutes)}
		</Link>
	);
}
