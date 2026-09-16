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
}
