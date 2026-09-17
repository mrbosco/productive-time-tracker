import { z } from 'zod';

/** `localStorage`, not `sessionStorage`, so a second tab keeps the login. The token is therefore
 * readable by any script on this origin, mitigated by the CSP in `index.html`. One key holds the
 * whole session, so it can never be half-written. */
export const SESSION_STORAGE_KEY = 'tracktive.session';

/** Parsed on every read rather than cast: what comes back is whatever was in the browser.
 * Unparseable means "not logged in". */
const sessionSchema = z.object({
	token: z.string().min(1),
	organizationId: z.string().min(1),
	personId: z.string().min(1),
	personName: z.string(),
	/** Written by the Settings sheet; absent until the person picks one. */
	defaultServiceId: z.string().min(1).optional(),
});

export type Session = z.infer<typeof sessionSchema>;

export function readSession(): Session | null {
	let raw: string | null;

	// Reading throws outright when storage is disabled (Safari private mode, a blocked
	// third-party context) - "no session", not a crash on boot.
	try {
		raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
	} catch {
		return null;
	}

	if (raw === null) return null;

	try {
		const parsed: unknown = JSON.parse(raw);
		const result = sessionSchema.safeParse(parsed);

		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function writeSession(session: Session): void {
	try {
		window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
	} catch {
		// Out of quota or storage disabled. The in-memory session still works for this tab; only
		// the persistence across tabs and refreshes is lost.
	}
}

export function clearSession(): void {
	try {
		window.localStorage.removeItem(SESSION_STORAGE_KEY);
	} catch {
		// Nothing was stored in the first place.
	}

	// A timer belongs to whoever started it, so logging out forgets it too.
	clearTimerState();
}

/** The running timer, so a refresh shows it before `['timer', personId]` has answered. */
export const TIMER_STORAGE_KEY = 'tracktive.timer';

const timerStateSchema = z.object({
	timerId: z.string().min(1),
	startedAt: z.string().min(1),
	/** Absent only between starting a timer and the request that returns the entry link. */
	entryId: z.string().min(1).optional(),
	/** What the entry already held when the timer attached to it; absent for a bare start, whose entry
	 * the timer created. That is what tells `Discard` whether to delete or restore. */
	loggedBefore: z.number().int().nonnegative().optional(),
});

export type TimerState = z.infer<typeof timerStateSchema>;

export function readTimerState(): TimerState | null {
	let raw: string | null;

	try {
		raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
	} catch {
		return null;
	}

	if (raw === null) return null;

	try {
		const parsed: unknown = JSON.parse(raw);
		const result = timerStateSchema.safeParse(parsed);

		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function writeTimerState(state: TimerState): void {
	try {
		window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Out of quota or storage disabled. The timer still runs; only the head start is lost.
	}
}

export function clearTimerState(): void {
	try {
		window.localStorage.removeItem(TIMER_STORAGE_KEY);
	} catch {
		// Nothing was stored in the first place.
	}
}
