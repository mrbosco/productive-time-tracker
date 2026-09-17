import { useEffect } from 'react';
import { useElapsedSeconds, type RunningTimer } from '@/components/features/timer/useTimer';
import { formatElapsed } from '@/lib/duration';
import { cn } from '@/lib/utils';

function PlayIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" className="flex-none text-accent">
			<path d="M6 3.6 16 10 6 16.4V3.6Z" fill="currentColor" />
		</svg>
	);
}

export function StopIcon({ className }: { className?: string }) {
	return (
		<svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true" className={cn('flex-none', className)}>
			<rect x="4" y="4" width="12" height="12" rx="2.5" fill="currentColor" />
		</svg>
	);
}

/** The status light of a running timer. Decoration with no hit area: the pill should have exactly
 * one pressable thing in it, which is the stop button. */
export function TimerDot({ className, withHalo = false }: { className?: string; withHalo?: boolean }) {
	return (
		<span aria-hidden="true" className={cn('relative block size-2 flex-none', className)}>
			<span
				// Read by the reduced-motion rule in `styles/index.css`, which pins the dot back to
				// full opacity - `animation: none` alone would freeze it wherever the keyframe was.
				data-timer-dot
				className={cn(
					'absolute inset-0 rounded-pill bg-accent',
					withHalo ? 'animate-timer-dot-arrive' : 'animate-timer-dot-breathe'
				)}
			/>
			{withHalo && <span className="absolute inset-0 animate-timer-halo rounded-pill bg-accent" />}
		</span>
	);
}

/** The stop control, the same 34px circle wherever a timer can be stopped. Its accessible name is
 * fixed at "Stop timer" rather than carrying the elapsed time: a name that changed every second
 * would be re-announced every second. */
export function StopTimerButton({
	onStop,
	disabled = false,
	label,
	className,
}: {
	onStop: () => void;
	disabled?: boolean;
	label?: string;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onStop}
			disabled={disabled}
			aria-label="Stop timer"
			title="Stop timer"
			className={cn(
				'duration-ui grid h-[34px] flex-none place-items-center rounded-pill bg-accent-dark text-on-accent transition-transform ease-ui hover:scale-[1.07] disabled:opacity-60 disabled:hover:scale-100',
				label === undefined ? 'w-[34px]' : 'flex items-center gap-[7px] px-3.5 pl-[11px] text-caption font-medium',
				className
			)}
		>
			<StopIcon />
			{label}
		</button>
	);
}

/** The timer control in the app bar. Idle is a button; running is **not** - a pill of text with one
 * button inside it. The elapsed time is mirrored into `document.title` for background tabs. */
export function TimerControl({
	running,
	isBusy,
	justStarted = false,
	onStart,
	onStop,
}: {
	running: RunningTimer | null;
	isBusy: boolean;
	justStarted?: boolean;
	onStart: () => void;
	onStop: () => void;
}) {
	const seconds = useElapsedSeconds(running === null ? null : running.startedAt);
	const elapsed = formatElapsed(seconds);

	useEffect(() => {
		if (running === null) return;

		const original = document.title;
		document.title = `${elapsed} · ${original}`;

		return () => {
			document.title = original;
		};
	}, [running, elapsed]);

	if (running === null) {
		return (
			<button
				type="button"
				disabled={isBusy}
				onClick={onStart}
				className="duration-ui flex h-11 flex-none items-center gap-[9px] rounded-control border border-line bg-surface pr-5 pl-[18px] text-label font-medium transition-colors ease-ui hover:border-muted hover:bg-subtle disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-surface"
			>
				<PlayIcon />
				Start timer
			</button>
		);
	}

	return (
		<div className="flex h-11 flex-none items-center gap-[11px] rounded-pill bg-selection pr-1.5 pl-4">
			<TimerDot withHalo={justStarted} />
			{/* Readable, but not part of the stop button's name: a name that changes is announced again every
						     time it does, and this changes every second. */}
			<span
				className={cn('text-list font-medium text-accent-dark tabular-nums', justStarted && 'animate-timer-digits-in')}
			>
				{elapsed}
			</span>
			<StopTimerButton onStop={onStop} disabled={isBusy} className={cn(justStarted && 'animate-timer-stop-in')} />

			{/* Announced once, when the timer starts, rather than on every tick. The clock itself is
			     `aria-hidden` for the same reason. */}
			<span role="status" className="sr-only">
				Timer running
			</span>
		</div>
	);
}
