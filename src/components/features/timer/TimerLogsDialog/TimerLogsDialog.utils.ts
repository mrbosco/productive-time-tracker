import type { Timer } from '@/api/types';

export interface TimerRun {
	id: string;
	startedAt: string;
	stoppedAt: string | null;
	minutes: number;
	runningMinutes: number;
}

export interface TimerLog {
	runs: TimerRun[];
	trackedMinutes: number;
	/** What was typed by hand on top of that. Negative when time was taken off. */
	correctionMinutes: number;
	loggedMinutes: number;
}

/** How an entry's minutes were arrived at. A timer's `total_time` is the linked entry's **cumulative**
 * minutes after that run, not the run's own length - three runs on one entry read 2, 26, 26 against
 * an entry holding 26 (`timers-for-entry.json`). So a run is the step up from the one before it, and
 * anything between the last running total and what the entry holds was typed by hand. */
export function toTimerLog(timers: Timer[], loggedMinutes: number): TimerLog {
	let previous = 0;
	const runs = timers.map((timer) => {
		const run = {
			id: timer.id,
			startedAt: timer.startedAt,
			stoppedAt: timer.stoppedAt,
			minutes: Math.max(0, timer.totalTime - previous),
			runningMinutes: timer.totalTime,
		};
		previous = timer.totalTime;

		return run;
	});

	const trackedMinutes = runs.at(-1)?.runningMinutes ?? 0;

	return { runs, trackedMinutes, correctionMinutes: loggedMinutes - trackedMinutes, loggedMinutes };
}
