import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { continueTimer, getRunningTimer, startTimer, stopTimer } from '@/api/timers';
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
	/**
	 * What the entry held before this timer attached to it, or `null` when the timer created it.
	 * `Discard` needs the difference: a continuation is put back to this, an entry the timer made
	 * is deleted.
	 */
	loggedBefore: number | null;
	/**
	 * Minutes X-5 offered to throw away, because the timer appeared to be running on its own. The
	 * sheet subtracts them from what it prefills; nothing is discarded until it is saved.
	 */
	discardMinutes: number;
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

	/** A day and the week around it: X-1's strip reads the week, so one without the other disagrees. */
	function invalidateDay(date: string) {
		return Promise.all([
			queryClient.invalidateQueries({ queryKey: ['time-entries', session.personId, date] }),
			queryClient.invalidateQueries({ queryKey: ['week-totals', session.personId, startOfWeek(date)] }),
		]);
	}

	/** Where a bare start puts its new entry, and where a stop writes the minutes. */
	function invalidateToday() {
		return invalidateDay(today);
	}

	/**
	 * A continued entry can be on any day, so the day to refresh is the entry's own. Read from the
	 * cache rather than fetched: the entry was on screen a moment ago, which is how it was clicked.
	 */
	function invalidateEntryDay(entryId: string) {
		const entry = queryClient
			.getQueriesData<{ id: string; date: string }[]>({ queryKey: ['time-entries', session.personId] })
			.flatMap(([, entries]) => entries ?? [])
			.find((candidate) => candidate.id === entryId);

		return entry === undefined ? invalidateToday() : invalidateDay(entry.date);
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

		// Merged with what is already stored, not replaced: the query knows the timer, and only the
		// start knew what the entry held before it (`loggedBefore`).
		writeTimerState({
			...readTimerState(),
			timerId: timer.id,
			startedAt: timer.startedAt,
			entryId: timer.timeEntryId ?? undefined,
		});
	}, [query.isPending, query.data]);

	const start = useMutation({
		/**
		 * Two ways to start one, and the API tells them apart by a relationship: a bare start creates
		 * a fresh entry on today (`serviceId`), and a start carrying `time_entry` attaches to an entry
		 * that already exists and adds to it on stop (`entryId`). Continuing is therefore a genuine
		 * continuation rather than a copy - no second row, and the entry keeps its own service.
		 */
		mutationFn: async (input: { serviceId: string } | { entryId: string; loggedBefore: number }) => {
			const started =
				'entryId' in input
					? await continueTimer(toAuth(session), input.entryId)
					: await startTimer(toAuth(session), session.personId, input.serviceId);

			/*
			 * A continue asks for `include=time_entry` and gets the link back, so it is already
			 * known and the cache is simply told. A bare start does not: `timer-create.json` was
			 * recorded without an include and carries `{"meta":{"included":false}}`, and nothing
			 * here is going to assume an include works on a call no sample covers (api-client rules
			 * 10 and 25). That one pays for a read.
			 *
			 * `staleTime: 0` on it is load-bearing, and its absence was a real bug: the app's client
			 * sets `staleTime: 30_000`, so `fetchQuery` answered from the cache - which still held
			 * the `null` read on mount - and the pill stayed on `Start timer` until the page was
			 * reloaded. A fetch asking "what is true now" has to say so.
			 */
			let running: typeof started | null = started;
			if (started.timeEntryId === null) {
				running = await queryClient.fetchQuery({ ...timerQueryOptions(session), staleTime: 0 });
			} else {
				queryClient.setQueryData(timerQueryOptions(session).queryKey, started);
			}

			// Remembered here rather than derived later: only the caller knows what the entry held
			// before, and after the stop the entry holds the sum.
			if (running !== null) {
				writeTimerState({
					timerId: running.id,
					startedAt: running.startedAt,
					entryId: running.timeEntryId ?? undefined,
					loggedBefore: 'entryId' in input ? input.loggedBefore : undefined,
				});
			}

			return running;
		},

		/**
		 * A bare start put a new entry on today. A continue changed an entry that may be on any day -
		 * the one it was started from - so that day and its week are what moved.
		 */
		onSuccess: (_timer, input) => ('entryId' in input ? invalidateEntryDay(input.entryId) : invalidateToday()),
	});

	const stop = useMutation({
		mutationFn: async ({
			timer,
			discardMinutes = 0,
		}: {
			timer: RunningTimer;
			discardMinutes?: number;
		}): Promise<StoppedTimer | null> => {
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

			if (timer.entryId === null) return null;

			return {
				entryId: timer.entryId,
				startedAt: timer.startedAt,
				stoppedAt,
				loggedBefore: readTimerState()?.loggedBefore ?? null,
				discardMinutes,
			};
		},
		onSuccess: async (stopped) => {
			clearTimerState();
			queryClient.setQueryData(timerQueryOptions(session).queryKey, null);
			// The entry's `time` was written by the stop, so the day it is on disagrees with the
			// cache - and a continued entry's day is its own, not today.
			await (stopped === null ? invalidateToday() : invalidateEntryDay(stopped.entryId));
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
