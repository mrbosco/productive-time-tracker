import { z } from 'zod';

/**
 * The session lives in `localStorage` so a refresh keeps the user logged in (R-2) - and, unlike
 * `sessionStorage`, so does opening the app in a second tab, which is what a tracker used daily
 * has to do. ADR-0004 holds the security trade-off: the token is readable by any script on this
 * origin, and the mitigation within a no-server assignment is the CSP in `index.html` plus never
 * writing the token anywhere else.
 *
 * One namespaced key holds the whole session. Splitting it across keys invites a half-written
 * session - a token with no person - that every reader would then have to defend against.
 */
export const SESSION_STORAGE_KEY = 'tracktive.session';

/**
 * Parsed on every read rather than cast. What comes back is whatever was in the browser: an older
 * shape from a previous version, a half-cleared key, or something another script wrote. Anything
 * that does not parse is treated as "not logged in", which lands on the login screen instead of
 * failing somewhere further in with an undefined token.
 */
const sessionSchema = z.object({
	token: z.string().min(1),
	organizationId: z.string().min(1),
	personId: z.string().min(1),
	personName: z.string(),
	/** Written by the Settings sheet (A-1). Absent until the person picks one. */
	defaultServiceId: z.string().min(1).optional(),
});

export type Session = z.infer<typeof sessionSchema>;

/** Returns null when there is no session, and when there is one this app cannot use. */
export function readSession(): Session | null {
	let raw: string | null;

	// Reading throws outright when storage is disabled (Safari's private mode, a blocked
	// third-party context). That is "no session", not a crash on boot.
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
		// Out of quota or storage disabled. The in-memory session still works for this tab, so
		// the user stays logged in until they close it; only R-2's persistence is lost.
	}
}

export function clearSession(): void {
	try {
		window.localStorage.removeItem(SESSION_STORAGE_KEY);
	} catch {
		// Nothing was stored in the first place.
	}

	// A timer belongs to the person who started it, so logging out has to forget it too - otherwise
	// the next person to log in on this browser opens with someone else's timer running.
	clearTimerState();
}

/**
 * The running timer, so a refresh shows it before `['timer', personId]` has answered (SPEC 10, X-4).
 *
 * Its own key rather than a field on the session: the session is re-validated and rewritten on every
 * login, and a timer is not a credential. Same namespace, because both are cleared together.
 */
export const TIMER_STORAGE_KEY = 'tracktive.timer';

const timerStateSchema = z.object({
	timerId: z.string().min(1),
	startedAt: z.string().min(1),
	/**
	 * The entry the start created. Absent only in the window between starting a timer and the one
	 * request that returns the link (api-client rule 10).
	 */
	entryId: z.string().min(1).optional(),
	/**
	 * What that entry already held when the timer attached to it (X-4's `Continue`). Absent for a
	 * bare start, whose entry the timer created - which is what tells `Discard` whether throwing the
	 * tracked time away means deleting the entry or putting its minutes back.
	 */
	loggedBefore: z.number().int().nonnegative().optional(),
});

export type TimerState = z.infer<typeof timerStateSchema>;

/**
 * Parsed on every read, like the session and for the same reason: what comes back is whatever is in
 * the browser, and anything this app cannot use is "no timer" rather than a crash on boot.
 */
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
		// Out of quota or storage disabled. The timer still runs; only the head start on a refresh
		// is lost, and the query answers a moment later with the same thing.
	}
}

export function clearTimerState(): void {
	try {
		window.localStorage.removeItem(TIMER_STORAGE_KEY);
	} catch {
		// Nothing was stored in the first place.
	}
}
