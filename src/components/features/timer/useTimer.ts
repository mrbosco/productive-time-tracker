import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { updateTimeEntry } from '@/api/time-entries';
import { getRunningTimer, startTimer, stopTimer } from '@/api/timers';
import { toAuth } from '@/components/features/auth/useSession';
import { startOfWeek, todayIso } from '@/lib/date';
import { clearTimerState, readTimerState, type Session, writeTimerState } from '@/lib/storage';

/** The running timer as the app bar needs it, from the query or from what a refresh remembered. */
export interface RunningTimer {
	id: string;
	startedAt: string;
	/**
	 * The entry the start created. Only `GET /timers?include=time_entry` ever returns it - both the
	 * create and the stop responses carry `time_entry` un-included (api-client rule 10) - so it is
	 * learned once and then remembered.
	 */
	entryId: string | null;
}

/** What a stop leaves behind for the sheet that follows it (X-4). */
export interface StoppedTimer {
	entryId: string;
	startedAt: string;
	stoppedAt: string;
}

export function timerQueryOptions(session: Session) {
	return queryOptions({
		queryKey: ['timer', session.personId],
		queryFn: () => getRunningTimer(toAuth(session), session.personId),
	});
}

/**
 * Seconds since `startedAt`, ticking, or 0 when nothing is running.
 *
 * The elapsed time is computed during render rather than held in state, and the interval only
 * nudges React into rendering again. It is a reading of the clock, not a value this component
 * owns - holding it would mean a copy that is stale between ticks, and a timer restored from a
 * refresh would read `0:00` for a second before catching up with itself.
 */
export function useElapsedSeconds(startedAt: string | null): number {
	const [, setTick] = useState(0);

	useEffect(() => {
		if (startedAt === null) return;

		const tick = setInterval(() => {
			setTick((count) => count + 1);
		}, 1000);

		return () => {
			clearInterval(tick);
		};
	}, [startedAt]);

	return elapsedSince(startedAt);
}

function elapsedSince(startedAt: string | null): number {
	if (startedAt === null) return 0;

	return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

/**
 * The running timer, and the two things that can be done to it (SPEC 10, X-4).
 *
 * Productive's own timer resource, which is why X-4 is worth doing at all: starting one **also
 * creates a time entry**, dated today with `time: 0` and linked through `time_entry`, and stopping
 * writes the elapsed whole minutes onto that same entry (SPEC 11). So the day list shows a `0h` row
 * the moment a timer starts, and stopping must not create a second entry - it edits the one that is
 * already there.
 *
 * `{ timerId, startedAt, entryId }` is persisted, because the query takes a request to answer and a
 * refresh would otherwise show `Start timer` for a second while a timer was running. What is stored
 * stands in only while the query is pending; the API is the truth the moment it replies, including
 * when it says nothing is running and the stored state is stale.
 */
export function useTimer(session: Session) {
	const queryClient = useQueryClient();
	const query = useQuery(timerQueryOptions(session));
	/**
	 * Read once, on the way in, and never written back: it stands in only while the query is
	 * pending, and from the moment the query answers nothing reads it again. The effect below keeps
	 * storage itself in step.
	 */
	const [restored] = useState(readTimerState);

	const today = todayIso();

	/** The day the timer's entry is on, and the week around it, both of which the start changed. */
	function invalidateToday() {
		return Promise.all([
			queryClient.invalidateQueries({ queryKey: ['time-entries', session.personId, today] }),
			queryClient.invalidateQueries({ queryKey: ['week-totals', session.personId, startOfWeek(today)] }),
		]);
	}

	useEffect(() => {
		if (query.isPending) return;

		const timer = query.data ?? null;
		if (timer === null) {
			// What was remembered is stale: the API is the truth the moment it replies, including
			// when it says nothing is running.
			clearTimerState();

			return;
		}

		writeTimerState({
			timerId: timer.id,
			startedAt: timer.startedAt,
			entryId: timer.timeEntryId ?? undefined,
		});
	}, [query.isPending, query.data]);

	const start = useMutation({
		mutationFn: async ({ serviceId, note }: { serviceId: string; note?: string | null }) => {
			await startTimer(toAuth(session), session.personId, serviceId);

			/*
			 * Refetched rather than read off the create response, because the create response does
			 * not contain it: `time_entry` comes back un-included, and this is the only call that
			 * asks for it. Nothing can be stopped usefully until the entry it belongs to is known.
			 */
			const running = await queryClient.fetchQuery(timerQueryOptions(session));

			/*
			 * X-3's `Continue timer`, in one PATCH: the entry the timer just created is written with
			 * the note of the entry being continued, so the running `0h` row already says what it is
			 * for and the stop sheet opens with it. It is a new entry rather than an addition to the
			 * old one, because `POST /timers` always makes one - see the note in SPEC 10.
			 */
			if (running?.timeEntryId != null && note != null && note !== '') {
				await updateTimeEntry(toAuth(session), running.timeEntryId, { note });
			}

			return running;
		},
		onSuccess: invalidateToday,
	});

	const stop = useMutation({
		mutationFn: async (timer: RunningTimer): Promise<StoppedTimer | null> => {
			let stoppedAt = new Date().toISOString();

			try {
				const stopped = await stopTimer(toAuth(session), timer.id);
				stoppedAt = stopped.stoppedAt ?? stoppedAt;
			} catch (error) {
				/*
				 * 409 `timer_already_stopped` is not a failure (api-client rule 19, SPEC 11): the
				 * timer was stopped in another tab or in Productive itself, and the only wrong thing
				 * to do is tell someone their timer is still running.
				 */
				if (!(error instanceof ApiError) || error.code !== 'timer_already_stopped') throw error;
			}

			return timer.entryId === null ? null : { entryId: timer.entryId, startedAt: timer.startedAt, stoppedAt };
		},
		onSuccess: async () => {
			clearTimerState();
			queryClient.setQueryData(timerQueryOptions(session).queryKey, null);
			// The entry's `time` was written by the stop, so the day it is on disagrees with the cache.
			await invalidateToday();
		},
	});

	const running: RunningTimer | null = query.isPending
		? toRestoredTimer(restored)
		: query.data == null
			? null
			: { id: query.data.id, startedAt: query.data.startedAt, entryId: query.data.timeEntryId };

	return {
		running,
		isStarting: start.isPending,
		isStopping: stop.isPending,
		start: start.mutateAsync,
		stop: stop.mutateAsync,
	};
}

function toRestoredTimer(restored: ReturnType<typeof readTimerState>): RunningTimer | null {
	if (restored === null) return null;

	return { id: restored.timerId, startedAt: restored.startedAt, entryId: restored.entryId ?? null };
}
