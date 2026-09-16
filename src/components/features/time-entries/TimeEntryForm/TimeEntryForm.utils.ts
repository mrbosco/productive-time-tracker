import { z } from 'zod';
import { ApiError } from '@/api/client';
import { isoDateSchema } from '@/lib/date';
import { formatDuration, parseDuration } from '@/lib/duration';
import { toPlainText } from '@/lib/note';

/**
 * A-8 requires the note to be "guarded" for length but fixes no number, and neither does the API -
 * no recorded response carries a limit, and nothing was rejected for length while the samples were
 * taken. 10,000 characters is this project's choice: far above any plausible day's note, and low
 * enough that a paste accident is caught here rather than by a 422 from Productive.
 */
export const MAX_NOTE_LENGTH = 10_000;

/**
 * A-8: more than nothing, no more than a day.
 *
 * A constant rather than a parameter, unlike `maxNoteLength`, because the spec fixes it. Guidebook
 * 13 is about numbers the code invented; this one is a decision that has already been made.
 */
const MAX_DURATION_MINUTES = 24 * 60;

/**
 * Shared by the create route and, from US-3, the edit route - the assignment's two write surfaces
 * reject the same input for the same reasons, so the rules live in one place.
 *
 * `maxNoteLength` is a parameter rather than a constant read from inside (guidebook 13).
 *
 * The duration field is a string on screen and minutes on the wire, and the conversion happens
 * here: `transform` with `ctx.addIssue` is what lets the schema both reject and convert, so the
 * submit handler receives a `number` and nothing downstream re-parses or asserts.
 *
 * The four messages are the design's own (`TimeTracker.dc.html`), and the order they are tested in
 * is what keeps them distinct: empty is "required", unreadable is "that is not a duration", and
 * only a duration that parsed can be too small or too large.
 */
export function timeEntrySchema(maxNoteLength: number = MAX_NOTE_LENGTH) {
	return z.object({
		date: isoDateSchema,
		duration: z.string().transform((value, ctx) => {
			if (value.trim() === '') {
				ctx.addIssue({ code: 'custom', message: 'Duration is required.' });

				return z.NEVER;
			}

			const minutes = parseDuration(value);
			if (minutes === null) {
				ctx.addIssue({ code: 'custom', message: 'Enter a duration like 1h 30m, 1:30, 1.5h or 90.' });

				return z.NEVER;
			}
			if (minutes <= 0) {
				ctx.addIssue({ code: 'custom', message: 'Duration must be more than 0.' });

				return z.NEVER;
			}
			if (minutes > MAX_DURATION_MINUTES) {
				ctx.addIssue({ code: 'custom', message: 'Duration cannot be more than 24h.' });

				return z.NEVER;
			}

			return minutes;
		}),
		/**
		 * Measured as text, not as markup. The field stores HTML now (ADR-0010), and counting the
		 * tags would reject a description for characters the user cannot see and did not type.
		 * The overhead is bounded - prose in paragraphs and lists, nothing nested deeply - so the
		 * cap still does its job of catching a paste accident before Productive has to.
		 */
		note: z
			.string()
			.refine(
				(note) => toPlainText(note).length <= maxNoteLength,
				`Keep the description under ${String(maxNoteLength)} characters.`
			),
	});
}

/** What the fields hold while being typed: all strings, because inputs are. */
export interface TimeEntryFormValues {
	date: string;
	duration: string;
	note: string;
}

/** What a valid form produces: `duration` has become minutes. */
export type TimeEntryFormOutput = z.output<ReturnType<typeof timeEntrySchema>>;

/**
 * The service the entry is logged against is chosen by the app, not typed (A-1), so a person who
 * cannot track on it has no field to correct - only the Default service sheet. A-1b singles this
 * failure out for that reason.
 *
 * Recognised by transport status plus `code`, never by matching `detail` text (api-client rule 19).
 * The pointer is read only to tell this 422 from any other one; it is not used to attach the error
 * to a field, which rule 21 warns against because Productive omits the leading slash. Matched as a
 * whole segment rather than a substring, so a future `person_id` pointer does not read as this.
 */
export function isServiceRefusal(error: unknown): boolean {
	return (
		error instanceof ApiError &&
		error.status === 422 &&
		error.code === 'invalid_attribute_value' &&
		error.errors.some((detail) => detail.pointer?.split('/').includes('person') === true)
	);
}

/**
 * What to show above the buttons when the save fails. The generic wording is the design's.
 *
 * A 422 speaks in Productive's own words rather than ours: the API knows why it refused this
 * entry and we would only be guessing at it. Everything else is mapped, because "Failed to fetch"
 * is not something to put in front of a person.
 */
export function toCreateErrorMessage(error: unknown): string {
	if (!(error instanceof ApiError)) return 'Could not save the entry. Try again.';

	if (error.status === 0) return 'Network error. Try again.';
	if (error.status === 401) return 'Your session was rejected. Log in again.';
	if (error.status === 422) return error.errors[0]?.detail ?? 'Could not save the entry. Try again.';

	return 'Could not save the entry. Try again.';
}

/**
 * What a half-written entry would lose, for the dismissal prompt (Improvements 10).
 *
 * The prompt names the work rather than asking in the abstract - "1h 45m and a description would
 * be lost" is a different decision from "discard your changes?". A duration that does not parse is
 * not named, because there is no honest way to say what it was worth.
 */
export function summariseUnsavedEntry(values: TimeEntryFormValues): {
	duration: string | null;
	hasNote: boolean;
} {
	const minutes = parseDuration(values.duration);

	return {
		duration: minutes !== null && minutes > 0 ? formatDuration(minutes) : null,
		hasNote: toPlainText(values.note).trim() !== '',
	};
}
