import { createContext, type ReactNode, useContext, useState } from 'react';
import { useUpdateTimeEntry } from '@/components/features/time-entries/useUpdateTimeEntry';
import { todayIso } from '@/lib/date';
import { useDefaultService } from '@/components/features/settings/useDefaultService';
import {
	ACTIVITY_MONITOR,
	type ActivityConcern,
	useActivityMonitor,
} from '@/components/features/timer/useActivityMonitor';
import { type RunningTimer, type StoppedTimer, useTimer } from '@/components/features/timer/useTimer';
import type { Session } from '@/lib/storage';

interface TimerContextValue {
	running: RunningTimer | null;
	justStarted: boolean;
	isBusy: boolean;
	start: (note?: string) => void;
	continueEntry: (entryId: string, loggedMinutes: number) => void;
	stop: () => void;
	concern: ActivityConcern | null;
	pauseAndDiscardIdle: () => void;
	keepRunning: () => void;
	stopped: StoppedTimer | null;
	dismissStopped: () => void;
	/** There is no default service to start a timer on, and only the Settings sheet can fix that. */
	needsService: boolean;
	dismissNeedsService: () => void;
	error: string | null;
	dismissError: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

/** The running timer, shared by the app bar and a card's `Continue timer`. A context rather than a
 * `useTimer` call in each, so only one copy of the localStorage sync writes the value. */
export function TimerProvider({ session, children }: { session: Session; children: ReactNode }) {
	const timer = useTimer(session);
	const { service } = useDefaultService(session);
	const [stopped, setStopped] = useState<StoppedTimer | null>(null);
	const [needsService, setNeedsService] = useState(false);
	const describeEntry = useUpdateTimeEntry(session);
	const [justStarted, setJustStarted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Mounted here, not on the day view, so navigation does not restart the idle clock.
	const activity = useActivityMonitor(timer.running !== null, ACTIVITY_MONITOR);

	/** Every write the timer makes, with somewhere for a failure to land: callers get `void start()`,
	 * so without this a rejected `mutateAsync` went nowhere and the pill simply did not change. */
	async function run<T>(action: () => Promise<T>, message: string, onDone: (result: T) => void) {
		setError(null);

		try {
			onDone(await action());
		} catch {
			setError(message);
		}
	}

	/** Starting while one already runs retires it rather than refusing - the stop writes its minutes
	 * onto the entry it was attached to. Quietly, without the stop sheet. */
	async function start(note?: string) {
		if (timer.running !== null) {
			const previous = timer.running;
			setJustStarted(false);
			await run(
				() => timer.stop({ timer: previous, discardMinutes: 0 }),
				'Could not stop the running timer. Try again.',
				() => undefined
			);
		}

		if (service === null) {
			setNeedsService(true);

			return;
		}

		await run(
			async () => {
				const started = await timer.start({ serviceId: service.id });

				/* `POST /timers` takes relationships and nothing else, so a description is a second write.
				 * Its failure is swallowed: the timer is already running by this point. */
				if (note !== undefined && note !== '' && started?.timeEntryId != null) {
					const today = todayIso();
					await describeEntry
						.mutateAsync({ id: started.timeEntryId, previousDate: today, date: today, changes: { note } })
						.catch(() => undefined);
				}

				return started;
			},
			'Could not start the timer. Try again.',
			() => {
				setJustStarted(true);
			}
		);
	}

	async function continueEntry(entryId: string, loggedMinutes: number) {
		await run(
			() => timer.start({ entryId, loggedBefore: loggedMinutes }),
			'Could not continue this entry. Try again.',
			() => {
				setJustStarted(true);
			}
		);
	}

	async function stop(discardMinutes = 0) {
		if (timer.running === null) return;

		const running = timer.running;
		setJustStarted(false);
		await run(
			() => timer.stop({ timer: running, discardMinutes }),
			'Could not stop the timer. Try again.',
			(stopped) => {
				setStopped(stopped);
			}
		);
	}

	const value: TimerContextValue = {
		running: timer.running,
		justStarted,
		isBusy: timer.isStarting || timer.isStopping,
		start: (note) => {
			void start(note);
		},
		continueEntry: (entryId, loggedMinutes) => {
			void continueEntry(entryId, loggedMinutes);
		},
		stop: () => {
			void stop();
		},
		concern: activity.concern,
		pauseAndDiscardIdle: () => {
			const minutes = activity.concern?.minutes ?? 0;
			activity.acknowledge();
			void stop(minutes);
		},
		keepRunning: activity.acknowledge,
		stopped,
		dismissStopped: () => {
			setStopped(null);
		},
		needsService,
		dismissNeedsService: () => {
			setNeedsService(false);
		},
		error,
		dismissError: () => {
			setError(null);
		},
	};

	return <TimerContext value={value}>{children}</TimerContext>;
}

export function useTimerContext(): TimerContextValue {
	const value = useContext(TimerContext);
	if (value === null) throw new Error('useTimerContext must be used inside a TimerProvider');

	return value;
}
