import type { TimeEntry } from '@/api/types';
import { formatDuration } from '@/lib/duration';
import { calculateDayTotal } from '../totals.utils';

/** Entry-list heading with the day's logged time and entry count. */
export function DaySummary({ entries }: { entries: TimeEntry[] }) {
	const total = formatDuration(calculateDayTotal(entries));
	const count = entries.length;

	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<div className="flex items-center gap-2.5">
				<h2 className="text-base font-semibold tracking-tight">Time entries</h2>
				<span className="rounded-pill bg-subtle px-2.5 py-1 text-caption text-muted">
					{count === 1 ? '1 entry' : `${String(count)} entries`}
				</span>
			</div>
			<p className="text-label text-muted">
				<span className="font-semibold text-ink tabular-nums">{total}</span> logged
			</p>
		</div>
	);
}
