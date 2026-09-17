import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { useEffect, useState } from 'react';
import { ApiError } from '@/api/client';
import { continueTimer, getRunningTimer, startTimer, stopTimer } from '@/api/timers';
import { toAuth } from '@/components/features/auth/useSession';
import { todayIso } from '@/lib/date';
import { clearTimerState, readTimerState, type Session, writeTimerState } from '@/lib/storage';

export interface RunningTimer {
	id: string;
	startedAt: string;
	/** The entry the start created. Only `GET /timers?include=time_entry` ever returns it - the
	 * create and stop responses carry `time_entry` un-included - so it is learned once and remembered. */
	entryId: string | null;
}

export interface StoppedTimer {
	entryId: string;
	startedAt: string;
	stoppedAt: string;
	/** What the entry held before this timer attached to it, or `null` when the timer created it.
	 * `Discard` needs the difference: a continuation is put back to this, an entry the timer made
	 * is deleted. */
	loggedBefore: number | null;
	/** Idle minutes offered for discard. The sheet subtracts them from what it prefills. */
	discardMinutes: number;
}

export function timerQueryOptions(session: Session) {
	return queryOptions({
		queryKey: ['timer', session.personId],
		queryFn: () => getRunningTimer(toAuth(session), session.personId),
	});
}

/** Seconds since `startedAt`, ticking, or 0 when nothing is running. Computed during render rather
 * than held in state - the interval only nudges React - so a timer restored from a refresh does not
 * read `0:00` for a second before catching up with itself. */
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

/** The running timer, and the two things that can be done to it. Starting one **also creates a time
 * entry**, dated today with `time: 0` and linked through `time_entry`; stopping writes the elapsed
 * whole minutes onto that same entry, so stopping must not create a second. The timer is persisted
 * because a refresh would otherwise show `Start timer` while one was running. */
export function useTimer(session: Session) {
	const queryClient = useQueryClient();
	const query = useQuery(timerQueryOptions(session));
	// Stands in only while the query is pending; the effect below keeps storage itself in step.
	const [restored] = useState(readTimerState);

	const today = todayIso();

	/** The week a date falls in - which is also the day list, since that selects from this one key. */
	function invalidateDay(date: string) {
		return queryClient.invalidateQueries({ queryKey: weekQueryKey(session, date) });
	}

	function invalidateToday() {
		return invalidateDay(today);
	}

	/** A continued entry can be on any day, and only the cache knows which. Read rather than fetched:
	 * the entry was on screen a moment ago, which is how it came to be clicked. Scans every cached
	 * week - the entry's own `date` is what names the week to invalidate, so a timer continued on a
	 * week that is not the one on screen still refreshes the right one. */
	function invalidateEntryDay(entryId: string) {
		const entry = queryClient
			.getQueriesData<{ id: string; date: string }[]>({ queryKey: ['week-entries', session.personId] })
			.flatMap(([, entries]) => entries ?? [])
			.find((candidate) => candidate.id === entryId);

		return entry === undefined ? invalidateToday() : invalidateDay(entry.date);
	}

	useEffect(() => {
		if (query.isPending) return;

		const timer = query.data ?? null;
		if (timer === null) {
			// What was remembered is stale: the API is the truth the moment it replies.
			clearTimerState();

			return;
		}

		// Merged rather than replaced: only the start knew what the entry held before (`loggedBefore`).
		writeTimerState({
			...readTimerState(),
			timerId: timer.id,
			startedAt: timer.startedAt,
			entryId: timer.timeEntryId ?? undefined,
		});
	}, [query.isPending, query.data]);

	const start = useMutation({
		/** Two ways to start one, told apart by a relationship: a bare start creates a fresh entry on
		 * today, and one carrying `time_entry` attaches to an existing entry and adds to it on stop. */
		mutationFn: async (input: { serviceId: string } | { entryId: string; loggedBefore: number }) => {
			const started =
				'entryId' in input
					? await continueTimer(toAuth(session), input.entryId)
					: await startTimer(toAuth(session), session.personId, input.serviceId);

			/* Both start and continue ask for `include=time_entry`, so the link normally comes back on
			 * the create itself. The read stays as a fallback for a response that omits it anyway.
			 * `staleTime: 0` there is load-bearing: without it `fetchQuery` inherited the client's 30s
			 * staleness, answered from the `null` read on mount, and the pill stayed on `Start timer`
			 * until a reload. */
			let running: typeof started | null = started;
			if (started.timeEntryId === null) {
				running = await queryClient.fetchQuery({ ...timerQueryOptions(session), staleTime: 0 });
			} else {
				queryClient.setQueryData(timerQueryOptions(session).queryKey, started);
			}

			// Only the caller knows what the entry held before; after the stop it holds the sum.
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

		/** A continue changed an entry that may be on any day, so that day and its week are what moved. */
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
				/* 409 `timer_already_stopped` is not a failure: the timer was stopped in another tab or in
				 * Productive itself, and the only wrong thing to do is say it is still running. */
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
			// The stop wrote the entry's `time`, and a continued entry's day is its own, not today.
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
