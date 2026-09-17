import { describe, expect, it } from 'vitest';
import type { Timer } from '@/api/types';
import { toTimerLog } from './TimerLogsDialog.utils';

function run(id: string, totalTime: number, stoppedAt: string | null = '2026-09-17T10:00:00+02:00'): Timer {
	return { id, personId: '1', startedAt: '2026-09-17T09:00:00+02:00', stoppedAt, totalTime, timeEntryId: 'e1' };
}

describe('toTimerLog', () => {
	/**
	 * The whole point: `total_time` is cumulative, so a run is the step up from the one before it.
	 * These are the recorded numbers from `timers-for-entry.json`.
	 */
	it('reads each run as the step up from the previous running total', () => {
		const log = toTimerLog([run('a', 2), run('b', 26), run('c', 26)], 26);

		expect(log.runs.map((each) => each.minutes)).toEqual([2, 24, 0]);
		expect(log.runs.map((each) => each.runningMinutes)).toEqual([2, 26, 26]);
		expect(log.trackedMinutes).toBe(26);
		expect(log.correctionMinutes).toBe(0);
	});

	it('shows what was typed by hand on top of the clock, in either direction', () => {
		expect(toTimerLog([run('a', 78)], 77).correctionMinutes).toBe(-1);
		expect(toTimerLog([run('a', 78)], 90).correctionMinutes).toBe(12);
	});

	it('treats an entry with no runs as entirely hand-typed', () => {
		const log = toTimerLog([], 45);

		expect(log).toMatchObject({ runs: [], trackedMinutes: 0, correctionMinutes: 45, loggedMinutes: 45 });
	});
});
