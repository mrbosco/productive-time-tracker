import { useEffect, useRef, useState } from 'react';
import { type ActivitySample, looksSynthetic } from '@/lib/activity';

/**
 * X-5's thresholds, in one place (guidebook 13, ADR-0008: "thresholds exposed as configuration,
 * defaults conservative").
 *
 * `detectSyntheticInput` is **off**, and that is a product decision rather than an oversight:
 * Harvest and Toggl both advertise that they do not watch your input, and this is a client-facing
 * tool. The heuristic is built and tested so the decision is reversible and so the interview
 * question has an answer; flipping this to `true` is the whole of turning it on. The README says so.
 */
export interface ActivityMonitorConfig {
	idleMinutes: number;
	detectSyntheticInput: boolean;
	cvThreshold: number;
	displacementPx: number;
	windowSize: number;
	minimumSamples: number;
	checkIntervalMs: number;
}

export const ACTIVITY_MONITOR: ActivityMonitorConfig = {
	idleMinutes: 15,
	detectSyntheticInput: false,
	cvThreshold: 0.15,
	displacementPx: 3,
	windowSize: 60,
	minimumSamples: 12,
	checkIntervalMs: 30_000,
};

/** What the banner needs to know, and nothing that would let it report anything anywhere. */
export interface ActivityConcern {
	reason: 'idle' | 'synthetic';
	/** Whole minutes since the last sign of a person, which is what would be discarded. */
	minutes: number;
}

/** The events worth counting as a person being here. */
const WATCHED = ['pointermove', 'keydown', 'wheel', 'click'] as const;

/**
 * Watches for the timer running on its own (SPEC 10, X-5).
 *
 * Listeners go on `window` only while a timer runs and come off with it (ADR-0008) - there is no
 * monitoring happening when there is nothing being timed, which is the point.
 *
 * Gated on `document.visibilityState === 'visible'`, and that gate is load-bearing rather than
 * polite: a background tab receives no input events at all, so counting idleness while hidden would
 * accuse everyone who switched windows. Time spent hidden is not counted as idle - the clock is
 * pushed forward when the tab comes back, so what is measured is inactivity while someone was
 * actually looking at this.
 *
 * Nothing here reaches the network and nothing here stops a timer. It raises a concern; the person
 * decides.
 */
export function useActivityMonitor(
	isRunning: boolean,
	config: ActivityMonitorConfig = ACTIVITY_MONITOR
): { concern: ActivityConcern | null; acknowledge: () => void } {
	/*
	 * Destructured, and the effect below depends on these rather than on `config` itself. An object
	 * identity in that array means a caller passing a literal tears the watch down and rebuilds it on
	 * every render - which empties the sample window each time, so the synthetic heuristic could
	 * never accumulate enough to judge. Accurate deps, not a memo on every caller (guidebook 9, 11).
	 */
	const { idleMinutes, detectSyntheticInput, cvThreshold, displacementPx, windowSize, minimumSamples } = config;
	const { checkIntervalMs } = config;
	const [concern, setConcern] = useState<ActivityConcern | null>(null);
	// Zero rather than `Date.now()`: reading the clock during render is a side effect, and the
	// effect below sets it to the moment the watch actually starts, which is the honest reading.
	const lastActivity = useRef(0);
	const samples = useRef<ActivitySample[]>([]);

	useEffect(() => {
		if (!isRunning) return;

		// A timer that has just started has by definition just been interacted with.
		lastActivity.current = Date.now();
		samples.current = [];

		/*
		 * Records the activity and restarts the clock, but deliberately does **not** clear a concern
		 * that is already raised.
		 *
		 * Clearing it here made the banner unreachable: moving the mouse towards it is a
		 * `pointermove`, so it vanished under the cursor on the way to the button. And it would have
		 * been the wrong thing even if it had worked - "we have not seen activity for fifteen
		 * minutes" is a statement about the past, and being here now does not make it untrue. The
		 * question stays until it is answered, which is one click either way.
		 */
		function record(event: Event) {
			lastActivity.current = Date.now();

			const pointer = event instanceof PointerEvent ? event : null;
			samples.current = [
				...samples.current.slice(-(windowSize - 1)),
				{
					at: lastActivity.current,
					x: pointer?.clientX ?? 0,
					y: pointer?.clientY ?? 0,
					isPointer: event.type === 'pointermove',
				},
			];
		}

		/*
		 * Coming back to the tab is not activity, but time spent away is not idleness either - so
		 * the clock is pushed forward rather than the concern being raised for the minutes nobody
		 * was here for.
		 */
		function onVisibilityChange() {
			if (document.visibilityState === 'visible') lastActivity.current = Date.now();
		}

		for (const type of WATCHED) window.addEventListener(type, record, { passive: true });
		document.addEventListener('visibilitychange', onVisibilityChange);

		const check = setInterval(() => {
			if (document.visibilityState !== 'visible') return;

			const minutes = Math.floor((Date.now() - lastActivity.current) / 60_000);
			if (minutes >= idleMinutes) {
				setConcern({ reason: 'idle', minutes });

				return;
			}

			if (
				detectSyntheticInput &&
				looksSynthetic(samples.current, { cvThreshold, displacementPx, windowSize, minimumSamples })
			) {
				setConcern({ reason: 'synthetic', minutes });
			}
		}, checkIntervalMs);

		return () => {
			for (const type of WATCHED) window.removeEventListener(type, record);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			clearInterval(check);
			// Nothing is being timed any more, so there is nothing left to be concerned about.
			setConcern(null);
		};
	}, [
		isRunning,
		idleMinutes,
		detectSyntheticInput,
		cvThreshold,
		displacementPx,
		windowSize,
		minimumSamples,
		checkIntervalMs,
	]);

	return {
		// Guarded as well as cleared on teardown: the render in which the timer stops happens before
		// the cleanup that clears it, and a banner about a timer that is no longer running is worse
		// than one frame of nothing.
		concern: isRunning ? concern : null,
		/** `Keep running`, and the dismiss icon: the answer is "I am here", so the clock restarts. */
		acknowledge: () => {
			lastActivity.current = Date.now();
			samples.current = [];
			setConcern(null);
		},
	};
}
