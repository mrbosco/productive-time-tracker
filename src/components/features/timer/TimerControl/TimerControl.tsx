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

/**
 * The status light of a running timer (`Timer.dc.html`, "The dot breathes").
 *
 * A hard blink reads as an alert; a 2.4s scale-and-fade reads as alive, which is what a running
 * timer is. It is decoration and has no hit area at all - the design's central point here is that
 * the pill should have exactly one thing that looks pressable, and this is not it.
 *
 * `withHalo` marks the arrival: the dot scales in with one expanding ring 200ms behind it, then
 * hands over to the breathing loop inside the same declaration. It is skipped for a timer restored
 * from a reload, which did not just start and should simply be found already running.
 */
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

/**
 * The stop control: the one raised, filled, obviously-pressable thing in a running timer
 * (`Timer.dc.html`, "One pressable thing").
 *
 * The same 34px circle wherever a timer can be stopped - the app bar and the tracking card - so it
 * is learned once. Its accessible name is fixed at "Stop timer" rather than carrying the elapsed
 * time: a name that changed every second would be re-announced every second, and the design asks
 * for the running state to be announced once instead.
 */
export function StopTimerButton({
	onStop,
	disabled = false,
	label,
	className,
}: {
	onStop: () => void;
	disabled?: boolean;
	/** Renders the word beside the square, which the design does where there is room for it. */
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

/**
 * The timer control in the app bar (SPEC 10, X-4; `Timer.dc.html`).
 *
 * Idle is a button. Running is **not**: it is a pill of text with one button inside it, because
 * the two flat glyphs it used to carry - a dot and a square, both ink, both the same weight - left
 * nothing reading as the control and made the whole pill clickable by accident. Status sits on the
 * left, the action on the right, and only the action has a background of its own.
 *
 * The elapsed time is mirrored into `document.title` so a timer left running in a background tab
 * is visible from the tab strip, which is the one place a browser shows it without being looked at.
 *
 * ponytail: the design also animates the pill's *width* between two measured values on start, so
 * the eye follows one object rather than registering two. That needs measuring the running label
 * at its widest and holding it, and the entrance below already carries the transition; the width
 * still snaps. `Timer.dc.html`'s build note has the recipe if the snap ever grates.
 */
export function TimerControl({
	running,
	isBusy,
	justStarted = false,
	onStart,
	onStop,
}: {
	running: RunningTimer | null;
	isBusy: boolean;
	/**
	 * This timer was started in this session, rather than restored from a reload: play the arrival.
	 * Defaults to false, which is a timer simply found running - the state, without the entrance.
	 */
	justStarted?: boolean;
	onStart: () => void;
	onStop: () => void;
}) {
	const seconds = useElapsedSeconds(running === null ? null : running.startedAt);
	const elapsed = formatElapsed(seconds);

	useEffect(() => {
		if (running === null) return;

		// Captured rather than hardcoded, so this restores whatever the document was called rather
		// than asserting a name of its own.
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
				className="duration-ui flex h-11 flex-none items-center gap-[9px] rounded-pill border border-line bg-surface pr-5 pl-[18px] text-label font-medium transition-colors ease-ui hover:border-muted hover:bg-subtle disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-surface"
			>
				<PlayIcon />
				Start timer
			</button>
		);
	}

	return (
		<div className="flex h-11 flex-none items-center gap-[11px] rounded-pill bg-selection pr-1.5 pl-4">
			<TimerDot withHalo={justStarted} />
			{/*
			 * Not in the stop button's name: this changes every second, and a name that changes is
			 * announced again every time it does. The running state is announced once, below.
			 */}
			<span
				aria-hidden="true"
				className={cn('text-list font-medium text-accent-dark tabular-nums', justStarted && 'animate-timer-digits-in')}
			>
				{elapsed}
			</span>
			<StopTimerButton onStop={onStop} disabled={isBusy} className={cn(justStarted && 'animate-timer-stop-in')} />

			{/*
			 * Announced once, when the timer starts, rather than on every tick (`Timer.dc.html`
			 * build notes). The clock itself is `aria-hidden` for the same reason.
			 */}
			<span role="status" className="sr-only">
				Timer running
			</span>
		</div>
	);
}
