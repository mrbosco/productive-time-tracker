import { Button } from '@/components/core/Button';
import type { ActivityConcern } from '@/components/features/timer/useActivityMonitor';
import { formatDuration } from '@/lib/duration';

function WarningIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="mt-px flex-none text-warning-fg">
			<path d="M10 2.2 18.6 17H1.4L10 2.2Z" fill="currentColor" />
			<path d="M9.2 7.4h1.6v4.6H9.2zM9.2 13.2h1.6v1.6H9.2z" className="fill-warning-bg" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M5.6 4.2 10 8.6l4.4-4.4 1.4 1.4L11.4 10l4.4 4.4-1.4 1.4L10 11.4l-4.4 4.4-1.4-1.4L8.6 10 4.2 5.6 5.6 4.2Z"
				fill="currentColor"
			/>
		</svg>
	);
}

/** The idle-timer banner, above the day's list. It offers a choice rather than acting: nothing has
 * been sent and no timer stopped by the time this is read. Amber, not red. */
export function ActivityBanner({
	concern,
	onDiscard,
	onKeepRunning,
}: {
	concern: ActivityConcern;
	onDiscard: () => void;
	onKeepRunning: () => void;
}) {
	const elapsed = formatDuration(concern.minutes);

	return (
		// `role="status"`, not `alert`: `alert` interrupts whatever a screen reader was mid-sentence on.
		<div
			role="status"
			className="flex items-start gap-3 rounded-entry border border-warning-border bg-warning-bg px-4 py-3.5"
		>
			<WarningIcon />

			<div className="flex min-w-0 flex-1 flex-col items-start gap-3">
				<p className="text-meta leading-[1.45] text-warning-ink">
					{concern.reason === 'idle'
						? `The timer is running but we have not seen activity for ${elapsed}.`
						: `The timer is running, and for the last ${elapsed} the only activity has looked automated.`}
				</p>

				<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
					<Button size="sm" onClick={onDiscard}>
						Pause and discard idle time
					</Button>
					<button
						type="button"
						onClick={onKeepRunning}
						className="rounded-input text-meta font-medium text-warning-ink underline underline-offset-[3px]"
					>
						Keep running
					</button>
				</div>
			</div>

			<button
				type="button"
				aria-label="Dismiss"
				onClick={onKeepRunning}
				className="duration-ui -mt-1 -mr-1.5 grid size-9 flex-none place-items-center rounded-pill text-warning-fg transition-colors ease-ui hover:bg-warning-border/40"
			>
				<CloseIcon />
			</button>
		</div>
	);
}
