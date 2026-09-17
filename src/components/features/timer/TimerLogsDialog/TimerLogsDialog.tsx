import { useQuery } from '@tanstack/react-query';
import { listTimersForEntry } from '@/api/timers';
import type { TimeEntry } from '@/api/types';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/core/Dialog';
import { toAuth } from '@/components/features/auth/useSession';
import { formatTimeOfDay } from '@/lib/date';
import { formatDuration } from '@/lib/duration';
import type { Session } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { toTimerLog } from './TimerLogsDialog.utils';

/**
 * How an entry's minutes were arrived at (UI-9).
 *
 * Read-only, and the footer is the point of it: tracked by the clock, corrected by hand, and the
 * number that was actually logged. Which matters the moment somebody disputes an invoice - until
 * now the card showed the result and nothing about where it came from.
 */
export function TimerLogsDialog({
	session,
	entry,
	onOpenChange,
}: {
	session: Session;
	/** The entry whose runs to show. Null closes the dialog, as the delete dialog is driven. */
	entry: TimeEntry | null;
	onOpenChange: (open: boolean) => void;
}) {
	const entryId = entry?.id ?? null;
	const { data, isPending, isError } = useQuery({
		queryKey: ['timer-logs', session.personId, entryId],
		queryFn: () => listTimersForEntry(toAuth(session), entryId ?? ''),
		enabled: entryId !== null,
	});

	if (entry === null) return null;

	const log = toTimerLog(data ?? [], entry.minutes);

	return (
		<Dialog open onOpenChange={onOpenChange}>
			{/* Positioned like the confirm dialog, which is the only other centred one in the app. */}
			<DialogContent
				aria-describedby={undefined}
				className="top-1/2 left-1/2 w-[min(440px,calc(100%-40px))] -translate-x-1/2 -translate-y-1/2 rounded-entry p-6 shadow-dialog"
			>
				<DialogTitle>Timer logs</DialogTitle>
				<p className="mt-1 text-caption text-muted">
					{[entry.service?.projectName, entry.service?.name].filter(Boolean).join(' · ')}
				</p>

				{isPending ? (
					<p className="mt-5 text-meta text-muted">Reading the runs…</p>
				) : isError ? (
					<p role="alert" className="mt-5 text-meta text-danger">
						Could not read this entry&apos;s timer runs.
					</p>
				) : (
					<>
						<table className="mt-5 w-full text-label">
							<thead>
								<tr className="text-caption text-muted">
									<th scope="col" className="pb-2 text-left font-medium">
										Started
									</th>
									<th scope="col" className="pb-2 text-left font-medium">
										Stopped
									</th>
									<th scope="col" className="pb-2 text-right font-medium">
										Timer
									</th>
									<th scope="col" className="pb-2 text-right font-medium">
										Running
									</th>
								</tr>
							</thead>
							<tbody>
								{log.runs.length === 0 ? (
									<tr>
										<td colSpan={4} className="border-t border-line py-3 text-meta text-muted">
											No timer has ever run on this entry.
										</td>
									</tr>
								) : (
									log.runs.map((run) => (
										<tr key={run.id} className="border-t border-line tabular-nums">
											<td className="py-2">{formatTimeOfDay(run.startedAt)}</td>
											{/* A dash means that run is still going, not that it is missing. */}
											<td className="py-2">{run.stoppedAt === null ? '—' : formatTimeOfDay(run.stoppedAt)}</td>
											<td className="py-2 text-right">{formatDuration(run.minutes)}</td>
											<td className="py-2 text-right font-medium">{formatDuration(run.runningMinutes)}</td>
										</tr>
									))
								)}
							</tbody>
						</table>

						<dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3.5 text-meta">
							<Total label="Tracked by timer" minutes={log.trackedMinutes} />
							{log.correctionMinutes !== 0 && (
								<Total label="Manual correction" minutes={log.correctionMinutes} signed />
							)}
							<Total label="Logged" minutes={log.loggedMinutes} strong />
						</dl>
					</>
				)}

				<DialogClose className="duration-ui mt-5 h-11 w-full rounded-pill border border-line text-list font-medium transition-colors ease-ui hover:bg-subtle">
					Close
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
}

function Total({
	label,
	minutes,
	signed = false,
	strong = false,
}: {
	label: string;
	minutes: number;
	signed?: boolean;
	strong?: boolean;
}) {
	return (
		<div className={cn('flex items-baseline justify-between gap-4', strong && 'pt-1.5 font-bold')}>
			<dt className={cn(!strong && 'text-muted')}>{label}</dt>
			<dd className="tabular-nums">
				{signed ? `${minutes < 0 ? '− ' : '+ '}${formatDuration(Math.abs(minutes))}` : formatDuration(minutes)}
			</dd>
		</div>
	);
}
