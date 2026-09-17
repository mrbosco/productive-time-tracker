import { useEffect } from 'react';
import { useElapsedSeconds, type RunningTimer } from '@/components/features/timer/useTimer';
import { formatElapsed } from '@/lib/duration';

function PlayIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" className="text-accent">
			<path d="M6 3.6 16 10 6 16.4V3.6Z" fill="currentColor" />
		</svg>
	);
}

function StopIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true" className="text-accent-dark">
			<rect x="4" y="4" width="12" height="12" rx="1.5" fill="currentColor" />
		</svg>
	);
}

/**
 * The timer control in the app bar (SPEC 10, X-4; `02-day-desktop-timer.png`).
 *
 * Two states, one control: a `Start timer` pill when nothing is running, and a tinted pill with a
 * pulsing dot, the elapsed clock and a stop square when something is. One button either way, so the
 * bar does not reflow as it changes and there is only ever one timer control in the accessibility
 * tree.
 *
 * The elapsed time is mirrored into `document.title` so a timer left running in a background tab is
 * visible from the tab strip - the one place a browser will show it without being looked at. That
 * is the whole of the competitive analysis's finding here: all three products make the running
 * state visible from wherever you are.
 */
export function TimerControl({
	running,
	isBusy,
	onStart,
	onStop,
}: {
	running: RunningTimer | null;
	isBusy: boolean;
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
				className="duration-ui flex h-10 flex-none items-center gap-[7px] rounded-pill border border-line bg-surface px-3.5 text-label font-medium transition-colors ease-ui hover:bg-subtle disabled:opacity-60 disabled:hover:bg-surface md:gap-2 md:px-4"
			>
				<PlayIcon />
				Start timer
			</button>
		);
	}

	return (
		<button
			type="button"
			disabled={isBusy}
			onClick={onStop}
			// The clock is in the name rather than left as text beside it: "Stop timer" alone would
			// not say what is running, and a screen reader would never reach the elapsed time.
			aria-label={`Stop timer, ${elapsed} elapsed`}
			className="duration-ui flex h-10 flex-none items-center gap-2.5 rounded-pill bg-selection px-3.5 text-label font-medium text-accent-dark transition-opacity ease-ui hover:opacity-85 disabled:opacity-60 md:px-4"
		>
			{/* Decoration: the pulse says "running" to someone looking, and the name says it to
			    everyone else. */}
			<span aria-hidden="true" className="size-2 flex-none animate-pulse rounded-pill bg-accent" />
			<span aria-hidden="true" className="tabular-nums">
				{elapsed}
			</span>
			<StopIcon />
		</button>
	);
}
