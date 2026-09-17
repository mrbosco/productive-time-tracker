import { ChartNoAxesCombined, Clock3 } from 'lucide-react';
import type { TimeEntry } from '@/api/types';
import { calculateDayTotal } from '@/components/features/time-entries/totals.utils';
import type { WeekTotals } from '@/components/features/week/useWeekTotals';
import { formatDuration } from '@/lib/duration';
import { groupMinutesByService } from './ServiceTotals.utils';

const SERVICE_COLORS = ['var(--color-accent)', 'var(--color-chart-teal)', 'var(--color-chart-blue)'];

/** A visual summary of the same logged time shown in the entry list. */
export function ServiceTotals({
	entries,
	weekTotals,
	isWeekError = false,
	expectedMinutes = null,
}: {
	entries: TimeEntry[];
	weekTotals: WeekTotals | undefined;
	isWeekError?: boolean;
	expectedMinutes?: number | null;
}) {
	const byService = groupMinutesByService(entries);
	const total = calculateDayTotal(entries);
	const weekTotal = Object.values(weekTotals ?? {}).reduce((sum, minutes) => sum + minutes, 0);
	const hasTarget = expectedMinutes !== null && expectedMinutes > 0;
	const progress = hasTarget ? Math.min(100, (total / expectedMinutes) * 100) : 0;

	return (
		<aside className="flex flex-col gap-5">
			<section
				aria-label="Day overview"
				className="relative overflow-hidden rounded-entry bg-raised p-6 text-white shadow-card"
			>
				<div className="flex items-center justify-between text-label text-white/70">
					<span className="flex items-center gap-2">
						<Clock3 size={16} aria-hidden="true" />
						Day overview
					</span>
					<span className="rounded-pill border border-white/15 px-2.5 py-1 text-micro">
						{entries.length} {entries.length === 1 ? 'entry' : 'entries'}
					</span>
				</div>
				<div className="mt-7 flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-label text-white/65">Day total</p>
						<p className="mt-1 text-[38px] leading-tight font-semibold tracking-[-.055em] tabular-nums">
							{formatDuration(total)}
						</p>
						<p className="mt-2 text-caption text-white/65">
							{hasTarget ? `of ${formatDuration(expectedMinutes)} expected` : 'Time logged for this day'}
						</p>
					</div>
					{hasTarget && (
						<svg aria-hidden="true" viewBox="0 0 100 100" className="size-20 shrink-0 -rotate-90">
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="none"
								stroke="currentColor"
								strokeWidth="5"
								className="text-white/10"
							/>
							<circle
								cx="50"
								cy="50"
								r="40"
								pathLength="100"
								fill="none"
								stroke="#b8a2ff"
								strokeWidth="5"
								strokeLinecap="round"
								strokeDasharray={`${progress} 100`}
								className="transition-[stroke-dasharray] duration-500 ease-ui"
							/>
						</svg>
					)}
				</div>
				{hasTarget && (
					<p className="mt-6 border-t border-white/15 pt-4 text-label text-white/80">
						{total >= expectedMinutes
							? 'Expected hours complete'
							: `${formatDuration(expectedMinutes - total)} left to log`}
					</p>
				)}
				<div className="mt-5 flex items-center justify-between rounded-control bg-white/7 px-3.5 py-3">
					<span className="flex items-center gap-2 text-label text-white/70">
						<ChartNoAxesCombined size={16} aria-hidden="true" />
						Week total
					</span>
					<span className="text-meta font-semibold tabular-nums">
						{isWeekError || weekTotals === undefined ? 'unavailable' : formatDuration(weekTotal)}
					</span>
				</div>
			</section>

			<section aria-labelledby="service-totals" className="rounded-entry border border-line bg-surface p-6 shadow-card">
				<div className="mb-5 flex items-center justify-between">
					<h2 id="service-totals" className="text-meta font-semibold">
						Totals by service
					</h2>
					<ChartNoAxesCombined size={17} aria-hidden="true" className="text-muted" />
				</div>
				{byService.length === 0 ? (
					<p className="text-label leading-relaxed text-muted">
						Your service breakdown will appear here as you log time.
					</p>
				) : (
					<div className="flex flex-col gap-5">
						{byService.map(({ name, minutes }, index) => (
							<div key={name}>
								<div className="mb-2.5 flex items-baseline justify-between gap-3 text-label">
									<span className="min-w-0 text-muted">{name}</span>
									<span className="shrink-0 font-semibold tabular-nums">{formatDuration(minutes)}</span>
								</div>
								<div aria-hidden="true" className="h-1.5 overflow-hidden rounded-pill bg-subtle">
									<div
										className="h-full rounded-pill transition-[width] duration-500 ease-ui"
										style={{
											width: `${total === 0 ? 0 : (minutes / total) * 100}%`,
											backgroundColor: SERVICE_COLORS[index % SERVICE_COLORS.length],
										}}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</aside>
	);
}
