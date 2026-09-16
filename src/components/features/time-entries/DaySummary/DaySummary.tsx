import type { TimeEntry } from '@/api/types';
import { formatDuration } from '@/lib/duration';
import { calculateDayTotal } from '../totals.utils';

/**
 * `3h 45m logged · 3 entries` (design brief 3.2).
 *
 * This one line is the whole summary on mobile. X-1's `ServiceTotals` carries the same total, and
 * the breakdown by service with it, in the right-hand column from `md` - where the two are not a
 * repetition because one is the list's own caption and the other is the day read as a whole.
 */
export function DaySummary({ entries }: { entries: TimeEntry[] }) {
	const total = formatDuration(calculateDayTotal(entries));
	const count = entries.length;

	return (
		<p className="text-meta text-muted">
			<span className="font-semibold text-ink tabular-nums">{total}</span> logged &middot;{' '}
			{count === 1 ? '1 entry' : `${String(count)} entries`}
		</p>
	);
}
