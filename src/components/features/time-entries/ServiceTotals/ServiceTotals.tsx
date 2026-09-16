import type { TimeEntry } from '@/api/types';
import { calculateDayTotal } from '@/components/features/time-entries/DaySummary/DaySummary.utils';
import type { WeekTotals } from '@/components/features/week/useWeekTotals';
import { formatDuration } from '@/lib/duration';
import { groupMinutesByService } from './ServiceTotals.utils';

/**
 * The desktop right-hand card: what the day went on, then the day and week totals (SPEC 10, X-1).
 *
 * Desktop only, because on mobile the same information would push the list itself below the fold
 * on a 390px screen - which is why the design puts a one-line `DaySummary` there instead.
 */
export function ServiceTotals({ entries, weekMinutes }: { entries: TimeEntry[]; weekMinutes: WeekTotals | undefined }) {
	const byService = groupMinutesByService(entries);
	const weekTotal = Object.values(weekMinutes ?? {}).reduce((sum, minutes) => sum + minutes, 0);

	return (
		<section
			aria-label="Totals by service"
			className="flex flex-col gap-3.5 rounded-entry border border-line bg-surface p-5"
		>
			<h2 className="text-label font-medium text-muted">Totals by service</h2>

			<div className="flex flex-col gap-3">
				{byService.map(({ name, minutes }) => (
					<div key={name} className="flex items-baseline gap-3">
						<span className="flex-1 text-meta leading-[140%]">{name}</span>
						<span className="text-meta font-medium tabular-nums">{formatDuration(minutes)}</span>
					</div>
				))}
			</div>

			<div className="h-px bg-line" />

			<div className="flex items-baseline gap-3">
				<span className="flex-1 text-meta font-medium">Day total</span>
				<span className="text-duration font-medium tabular-nums">{formatDuration(calculateDayTotal(entries))}</span>
			</div>

			<div className="flex items-baseline gap-3">
				<span className="flex-1 text-label text-muted">Week total</span>
				<span className="text-label font-medium text-muted tabular-nums">{formatDuration(weekTotal)}</span>
			</div>
		</section>
	);
}
