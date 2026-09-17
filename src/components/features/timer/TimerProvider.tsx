import { createContext, type ReactNode, useContext, useState } from 'react';
import { useDefaultService } from '@/components/features/settings/useDefaultService';
import { type RunningTimer, type StoppedTimer, useTimer } from '@/components/features/timer/useTimer';
import type { Session } from '@/lib/storage';

interface TimerContextValue {
	running: RunningTimer | null;
	/**
	 * This timer was started in this session rather than found already running after a reload, so
	 * the control plays its arrival. A timer that was simply there should not announce itself.
	 */
	justStarted: boolean;
	/** A start or a stop is in flight, so neither control should be pressed twice. */
	isBusy: boolean;
	/** Starts a fresh entry on today, against the default service (A-1). */
	start: () => void;
	/**
	 * Continues an entry that already exists: the timer attaches to it and the stop adds to what it
	 * holds, so the row that was clicked is the one that counts up (X-4). `loggedMinutes` is what it
	 * holds now, which is the only way `Discard` can later put it back.
	 */
	continueEntry: (entryId: string, loggedMinutes: number) => void;
	stop: () => void;
	/** What the last stop left behind, for the sheet that edits it. */
	stopped: StoppedTimer | null;
	dismissStopped: () => void;
	/** There is no default service to start a timer on, and only the Settings sheet can fix that. */
	needsService: boolean;
	dismissNeedsService: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

/**
 * The running timer, shared across the two places that touch it (SPEC 10, X-4).
 *
 * A context rather than two `useTimer` calls, because there are genuinely two consumers in
 * different subtrees: the app bar, which starts and stops it on every route, and a card's
 * `Continue timer` down inside the day. Two calls would mean two copies of the localStorage sync
 * writing the same value, and X-5's activity banner would have made it three.
 *
 * It follows `SessionProvider`, which is the same shape for the same reason, and the query beneath
 * it is still the source of truth - this only stops the same hook being mounted three times.
 */
export function TimerProvider({ session, children }: { session: Session; children: ReactNode }) {
	const timer = useTimer(session);
	const { service } = useDefaultService(session);
	const [stopped, setStopped] = useState<StoppedTimer | null>(null);
	const [needsService, setNeedsService] = useState(false);
	const [justStarted, setJustStarted] = useState(false);

	async function start() {
		/*
		 * A timer is logged against the default service, the same one a new entry is (A-1). With
		 * none resolved there is nothing to start it on, and the only place that can be changed is
		 * the Settings sheet - the same route A-1b takes when Productive refuses a service.
		 */
		if (service === null) {
			setNeedsService(true);

			return;
		}

		await timer.start({ serviceId: service.id });
		setJustStarted(true);
	}

	/** No service needed: the entry already has the one it was logged against, and keeps it. */
	async function continueEntry(entryId: string, loggedMinutes: number) {
		await timer.start({ entryId, loggedBefore: loggedMinutes });
		setJustStarted(true);
	}

	async function stop() {
		if (timer.running === null) return;

		/*
		 * `null` when the linked entry was never learned - the one window where the app has a timer
		 * but not yet its entry. The timer is stopped either way, and the entry is left on the day
		 * to be edited there, which is better than refusing to stop it.
		 */
		setJustStarted(false);
		setStopped(await timer.stop(timer.running));
	}

	const value: TimerContextValue = {
		running: timer.running,
		justStarted,
		isBusy: timer.isStarting || timer.isStopping,
		start: () => {
			void start();
		},
		continueEntry: (entryId, loggedMinutes) => {
			void continueEntry(entryId, loggedMinutes);
		},
		stop: () => {
			void stop();
		},
		stopped,
		dismissStopped: () => {
			setStopped(null);
		},
		needsService,
		dismissNeedsService: () => {
			setNeedsService(false);
		},
	};

	return <TimerContext value={value}>{children}</TimerContext>;
}

/**
 * Throws outside the provider rather than handing back a null timer, for the reason `useSession`
 * does: a control that silently does nothing is harder to find than one that fails on mount.
 */
export function useTimerContext(): TimerContextValue {
	const value = useContext(TimerContext);
	if (value === null) throw new Error('useTimerContext must be used inside a TimerProvider');

	return value;
}
