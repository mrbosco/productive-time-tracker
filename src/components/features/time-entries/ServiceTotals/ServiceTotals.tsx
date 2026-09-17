import type { TimeEntry } from '@/api/types';
import { calculateDayTotal } from '@/components/features/time-entries/totals.utils';
import type { WeekTotals } from '@/components/features/week/useWeekTotals';
import { formatDuration } from '@/lib/duration';
import { groupMinutesByService } from './ServiceTotals.utils';

/**
 * The desktop right-hand card: what the day went on, then the day and week totals (SPEC 10, X-1).
 *
 * Desktop only, because on mobile the same information would push the list itself below the fold
 * on a 390px screen - which is why the design puts a one-line `DaySummary` there instead.
 */
export function ServiceTotals({
	entries,
	weekTotals,
	isWeekError = false,
}: {
	entries: TimeEntry[];
	weekTotals: WeekTotals | undefined;
	/** The week could not be read, so its total is left blank rather than reported as `0h`. */
	isWeekError?: boolean;
}) {
	const byService = groupMinutesByService(entries);
	const weekTotal = Object.values(weekTotals ?? {}).reduce((sum, minutes) => sum + minutes, 0);

	return (
		// Labelled by the heading rather than by an `aria-label` repeating it, so the name is not
		// declared twice.
		<section
			aria-labelledby="service-totals"
			className="flex flex-col gap-4 rounded-entry border border-line bg-surface p-5"
		>
			<h2 id="service-totals" className="text-meta font-semibold text-ink">
				Totals by service
			</h2>

			<div className="flex flex-col gap-4">
				{byService.map(({ name, minutes }) => (
					<div key={name} className="flex items-baseline gap-3">
						<span className="min-w-0 flex-1 text-label leading-relaxed text-muted">{name}</span>
						<span className="shrink-0 text-label font-medium tabular-nums">{formatDuration(minutes)}</span>
					</div>
				))}
			</div>

			<div className="-mx-5 h-px bg-line" />

			<div className="flex items-baseline gap-3">
				<span className="flex-1 text-meta font-medium">Day total</span>
				<span className="text-title font-semibold tracking-tight tabular-nums">
					{formatDuration(calculateDayTotal(entries))}
				</span>
			</div>

			<div className="flex items-baseline gap-3">
				<span className="flex-1 text-label text-muted">Week total</span>
				<span className="text-meta font-semibold text-ink tabular-nums">
					{isWeekError ? 'unavailable' : formatDuration(weekTotal)}
				</span>
			</div>
		</section>
	);
}
