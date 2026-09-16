import type { TimeEntry } from '@/api/types';
import { formatDuration } from '@/lib/duration';
import { calculateDayTotal } from '../totals.utils';

/**
 * `3h 45m logged · 3 entries` (design brief 3.2).
 *
 * X-1 adds the totals-grouped-by-service card beside it on desktop; until then this one line is
 * the whole summary, which is why the day view is single-column at every width.
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
