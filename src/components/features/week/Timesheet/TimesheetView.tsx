import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Toast } from '@/components/core/Toast';
import { TimerDot } from '@/components/features/timer/TimerControl/TimerControl';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { useElapsedSeconds } from '@/components/features/timer/useTimer';
import { useCreateTimeEntry } from '@/components/features/time-entries/useCreateTimeEntry';
import { useUpdateTimeEntry } from '@/components/features/time-entries/useUpdateTimeEntry';
import { useExpectedHours } from '@/components/features/week/useExpectedHours';
import { useWeekEntries } from '@/components/features/week/useWeekEntries';
import { expectedMinutesOn } from '@/lib/availability';
import { addDays, dayOfMonth, formatDayShort, formatWeekdayAndDay, isWeekend, todayIso, weekDays } from '@/lib/date';
import { formatDuration, formatElapsed } from '@/lib/duration';
import type { Session } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { TimesheetCellEditor } from './TimesheetCellEditor';
import { type TimesheetCell, toTimesheet } from './Timesheet.utils';

/** `Mon 14 – Sun 20 Sep`, or `This week` when it is. */
function describeWeek(monday: string, today: string): string {
	const sunday = addDays(monday, 6);
	const span = `${formatWeekdayAndDay(monday)} – ${formatDayShort(sunday)}`;

	return weekDays(today).includes(monday) ? `This week, ${span}` : span;
}

function ChevronIcon({ back = false }: { back?: boolean }) {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d={
					back
						? 'M12.6 3.4 6 10l6.6 6.6 1.7-1.7L9.4 10l4.9-4.9-1.7-1.7Z'
						: 'M7.4 3.4 5.7 5.1 10.6 10l-4.9 4.9 1.7 1.7L14 10 7.4 3.4Z'
				}
				fill="currentColor"
			/>
		</svg>
	);
}

/*
 * `min-content` rather than 0 on the day columns: a tracking cell holds a pill wide enough for
 * `1h 9m 20s`, and a column allowed to squeeze below that clipped it against the next border.
 * Below the width where seven of those fit, the table scrolls sideways instead of collapsing.
 */
const GRID = 'grid grid-cols-[minmax(220px,340px)_repeat(7,minmax(min-content,1fr))_120px]';

/**
 * A week of logged time as a grid: one row per project and service, one column per day (UI-7).
 *
 * The day view answers "what did I do today"; this answers "is my week filled in", which is a
 * different question and a worse fit for a list. Rows are the pairs the week already has entries
 * for, plus anything added by hand.
 *
 * Desktop only, which is the design's call and not a shortcut: nine columns do not survive 390px,
 * and the day view is the mobile answer to the same question.
 */
export function TimesheetView({ session, date }: { session: Session; date: string }) {
	const navigate = useNavigate();
	const today = todayIso();
	const days = weekDays(date);

	const { data: entries, isPending, isError, refetch } = useWeekEntries(session, date);
	const availability = useExpectedHours(session);
	const timer = useTimerContext();
	const createEntry = useCreateTimeEntry(session);
	const updateEntry = useUpdateTimeEntry(session);

	const [toast, setToast] = useState<string | null>(null);

	const sheet = toTimesheet(entries ?? [], days);
	const expected = days.reduce<number | null>((sum, day) => {
		const minutes = expectedMinutesOn(availability, day);

		return minutes === null ? sum : (sum ?? 0) + minutes;
	}, null);
	/** Which row the timer is running on, for the pill that names it beside the week's numbers. */
	const trackingRow = sheet.rows.find((row) =>
		row.cells.some((cell) => cell.entries.some((entry) => entry.id === timer.running?.entryId))
	);
	/*
	 * One number in all three places the design puts a running timer - the app bar, this pill and
	 * the cell - and it is the timer's own elapsed, not anything summed from the grid. They used to
	 * disagree: the pill showed the entry's stored total and the cell showed the day's, so a screen
	 * with a timer on it printed three different durations and left the reader to guess which was
	 * the clock.
	 */
	const elapsed = formatElapsed(useElapsedSeconds(timer.running?.startedAt ?? null));

	const isNonWorking = (day: string) => {
		const minutes = expectedMinutesOn(availability, day);

		return minutes === null ? isWeekend(day) : minutes === 0;
	};

	/**
	 * A cell is a sum, so writing one back is only unambiguous when it holds nothing or one entry.
	 * With several the design's own answer applies: adjust the most recent. Which one moved is said
	 * in the toast rather than marked on the cell - a count next to a duration read as a multiplier.
	 */
	async function saveCell(serviceId: string, cell: TimesheetCell, minutes: number) {
		const [newest] = cell.entries;

		try {
			if (newest === undefined) {
				await createEntry.mutateAsync({ date: cell.date, minutes, note: null, serviceId });
			} else {
				const rest = cell.entries.slice(1).reduce((sum, entry) => sum + entry.minutes, 0);
				await updateEntry.mutateAsync({
					id: newest.id,
					previousDate: newest.date,
					date: newest.date,
					changes: { minutes: Math.max(0, minutes - rest) },
				});
			}
			setToast(
				cell.entries.length > 1
					? `Entry saved · the most recent of ${String(cell.entries.length)} on that day`
					: 'Entry saved'
			);
		} catch {
			setToast('Could not save that cell.');
			throw new Error('save failed');
		}
	}

	return (
		<>
			{/* Below `md` the grid is unreadable rather than cramped, so it is not drawn at all. */}
			<main className="mx-auto flex w-full max-w-[1376px] flex-col gap-6 px-4 pt-6 pb-14 md:px-8 md:pt-8 xl:px-12">
				<div className="rounded-entry border border-line bg-surface p-6 text-center md:hidden">
					<p className="text-list">The timesheet needs a wider screen. Rotate, or use the day view.</p>
					<button
						type="button"
						onClick={() => void navigate({ to: '/day/$date', params: { date: today } })}
						className="duration-ui mt-3.5 h-11 rounded-control border border-line px-4.5 text-meta font-medium transition-colors ease-ui hover:bg-subtle"
					>
						Go to the day view
					</button>
				</div>

				<div className="hidden items-center gap-2 md:flex">
					<button
						type="button"
						aria-label="Previous week"
						onClick={() => void navigate({ to: '/week/$date', params: { date: addDays(date, -7) } })}
						className="duration-ui grid size-11 flex-none place-items-center rounded-control border border-line bg-surface text-muted transition-colors ease-ui hover:bg-subtle"
					>
						<ChevronIcon back />
					</button>
					<button
						type="button"
						aria-label="Next week"
						onClick={() => void navigate({ to: '/week/$date', params: { date: addDays(date, 7) } })}
						className="duration-ui grid size-11 flex-none place-items-center rounded-control border border-line bg-surface text-muted transition-colors ease-ui hover:bg-subtle"
					>
						<ChevronIcon />
					</button>
					<h1 className="px-1.5 text-title font-bold tracking-[-.02em]" tabIndex={-1}>
						{describeWeek(date, today)}
					</h1>
					{!weekDays(today).includes(date) && (
						<button
							type="button"
							onClick={() => void navigate({ to: '/week/$date', params: { date: todayIso() } })}
							className="duration-ui h-9 flex-none rounded-control border border-line bg-surface px-3.5 text-label font-medium transition-colors ease-ui hover:bg-subtle"
						>
							This week
						</button>
					)}

					<span className="flex-1" />

					{timer.running !== null && (
						<span className="flex h-9 flex-none items-center gap-2 rounded-pill bg-selection px-3.5 text-label font-medium whitespace-nowrap text-accent-dark">
							<TimerDot className="size-1.5" />
							<span className="tabular-nums">{elapsed}</span>
							{trackingRow !== undefined && <span className="opacity-72">{trackingRow.project}</span>}
						</span>
					)}
					<span className="text-meta whitespace-nowrap text-muted">
						<span className="font-medium text-ink tabular-nums">{formatDuration(sheet.total)}</span>
						{expected === null ? ' logged' : ` of ${formatDuration(expected)} expected`}
					</span>
				</div>

				<div className="hidden overflow-x-auto rounded-entry border border-line bg-surface md:block">
					{isError ? (
						<div role="alert" className="flex flex-col items-center gap-3.5 px-5 py-12 text-center">
							<p className="text-list">Could not load this week.</p>
							<button
								type="button"
								onClick={() => void refetch()}
								className="duration-ui h-11 rounded-control border border-line px-4.5 text-meta font-medium transition-colors ease-ui hover:bg-subtle"
							>
								Retry
							</button>
						</div>
					) : (
						<table className="w-full border-collapse">
							<caption className="sr-only">Logged time for {describeWeek(date, today)}</caption>
							<thead>
								<tr className={cn(GRID, 'border-b border-line bg-canvas')}>
									<th scope="col" className="px-5 py-3.5 text-left text-caption font-medium text-muted">
										Project · service
									</th>
									{days.map((day) => (
										<th
											key={day}
											scope="col"
											className={cn(
												'flex flex-col items-center gap-0.5 border-l border-line px-2 py-2.5',
												day === today && 'bg-selection',
												isNonWorking(day) && 'hatched'
											)}
										>
											<span
												className={cn('text-caption font-medium', day === today ? 'text-accent-dark' : 'text-muted')}
											>
												{formatWeekdayAndDay(day).split(' ')[0]}
											</span>
											<span
												className={cn(
													'text-meta font-medium tabular-nums',
													day === today && 'font-bold text-accent-dark',
													isNonWorking(day) && day !== today && 'text-muted'
												)}
											>
												{dayOfMonth(day)}
											</span>
										</th>
									))}
									<th
										scope="col"
										className="border-l border-line px-5 py-3.5 text-right text-caption font-medium text-muted"
									>
										Total
									</th>
								</tr>
							</thead>

							<tbody>
								{isPending
									? [0, 1, 2, 3].map((row) => (
											<tr key={row} className={cn(GRID, 'border-b border-line')} aria-hidden="true">
												<td className="px-5 py-4">
													<span className="block h-8 animate-pulse rounded-input bg-subtle" />
												</td>
												{days.map((day) => (
													<td key={day} className="border-l border-line px-2 py-4">
														<span className="block h-5 animate-pulse rounded-[5px] bg-subtle" />
													</td>
												))}
												<td className="border-l border-line px-5 py-4" />
											</tr>
										))
									: sheet.rows.map((row) => (
											<tr
												key={row.serviceId}
												className={cn(GRID, 'items-stretch border-b border-line hover:bg-canvas/60')}
											>
												<th scope="row" className="flex min-w-0 flex-col justify-center px-5 py-3.5 text-left">
													<span className="block truncate text-meta font-medium">{row.project}</span>
													<span className="block truncate text-caption font-normal text-muted">{row.service}</span>
												</th>
												{row.cells.map((cell) => (
													<td
														key={cell.date}
														className={cn('border-l border-line p-0', isNonWorking(cell.date) && 'hatched')}
													>
														<TimesheetCellEditor
															cell={cell}
															elapsed={elapsed}
															rowName={`${row.project} ${row.service}`}
															isNonWorking={isNonWorking(cell.date)}
															isTracking={
																timer.running?.entryId !== undefined &&
																cell.entries.some((entry) => entry.id === timer.running?.entryId)
															}
															onStopTimer={timer.stop}
															onSave={(minutes) => saveCell(row.serviceId, cell, minutes)}
														/>
													</td>
												))}
												<td className="flex items-center justify-end border-l border-line px-5 text-meta font-medium tabular-nums">
													{row.total === 0 ? '' : formatDuration(row.total)}
												</td>
											</tr>
										))}
							</tbody>

							<tfoot>
								<tr className={cn(GRID, 'bg-selection text-accent-dark')}>
									<th scope="row" className="flex items-center px-5 py-4 text-left text-meta font-bold">
										Daily total
									</th>
									{sheet.dailyTotals.map((minutes, index) => (
										<td
											key={days[index]}
											className="flex items-center justify-center border-l border-accent-dark/12 px-2 py-4 text-meta font-bold tabular-nums"
										>
											{minutes === 0 ? '—' : formatDuration(minutes)}
										</td>
									))}
									<td className="flex items-center justify-end border-l border-accent-dark/12 px-5 py-4 text-base font-bold whitespace-nowrap tabular-nums">
										= {formatDuration(sheet.total)}
									</td>
								</tr>
							</tfoot>
						</table>
					)}
				</div>
			</main>

			{toast !== null && (
				<Toast
					variant={toast.startsWith('Entry saved') ? 'success' : 'error'}
					onDismiss={() => {
						setToast(null);
					}}
				>
					{toast}
				</Toast>
			)}
		</>
	);
}
