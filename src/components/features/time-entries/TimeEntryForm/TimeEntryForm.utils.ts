import { z } from 'zod';
import { ApiError } from '@/api/client';
import { isoDateSchema } from '@/lib/date';
import { formatDuration, parseDuration, toMinutesOfDay } from '@/lib/duration';
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
 * How the duration is being entered (P-2). `duration` is the field the assignment asks for;
 * `range` swaps it for `from` and `to` and computes the minutes client-side. Only `time` is ever
 * stored either way, which is why editing always opens back in `duration` - the API keeps no range
 * to reopen.
 */
export type DurationMode = 'duration' | 'range';

/**
 * Measured as text, not as markup. The field stores HTML now (ADR-0010), and counting the tags
 * would reject a description for characters the user cannot see and did not type. The overhead is
 * bounded - prose in paragraphs and lists, nothing nested deeply - so the cap still does its job of
 * catching a paste accident before Productive has to.
 */
function noteField(maxNoteLength: number) {
	return z
		.string()
		.refine(
			(note) => toPlainText(note).length <= maxNoteLength,
			`Keep the description under ${String(maxNoteLength)} characters.`
		);
}

/**
 * Shared by the create route and the edit route - the assignment's two write surfaces reject the
 * same input for the same reasons, so the rules live in one place.
 *
 * `maxNoteLength` is a parameter rather than a constant read from inside (guidebook 13). `mode` is
 * one too, and it picks between two schemas rather than adding optional fields to one: a single
 * schema would have to make `from`, `to` and `duration` all optional and then cross-check which
 * three-way combination is currently meant, which is a state machine written as refinements.
 *
 * Both branches produce the same output - `{ date, duration: minutes, note }` - so the submit
 * handler, the mutations and `TimeEntryFormOutput` never learn which one ran.
 *
 * The duration field is a string on screen and minutes on the wire, and the conversion happens
 * here: `transform` with `ctx.addIssue` is what lets the schema both reject and convert, so the
 * submit handler receives a `number` and nothing downstream re-parses or asserts.
 *
 * The four messages are the design's own (`TimeTracker.dc.html`), and the order they are tested in
 * is what keeps them distinct: empty is "required", unreadable is "that is not a duration", and
 * only a duration that parsed can be too small or too large.
 */
export function timeEntrySchema(maxNoteLength: number = MAX_NOTE_LENGTH, mode: DurationMode = 'duration') {
	/*
	 * Both branches take the same five fields, because react-hook-form keeps one set of values
	 * across a toggle and the resolver has to accept whatever is in it. The branch that is not
	 * showing simply does not read its own: in duration mode `from` and `to` are two empty strings,
	 * and in range mode `duration` is one.
	 */
	const fields = {
		date: isoDateSchema,
		duration: z.string(),
		from: z.string(),
		to: z.string(),
		note: noteField(maxNoteLength),
	};

	if (mode === 'range') {
		return z.object(fields).transform((values, ctx) => {
			const start = toMinutesOfDay(values.from);
			const end = toMinutesOfDay(values.to);

			/*
			 * The transform sits on the object rather than on either field, because neither `from`
			 * nor `to` means anything alone - "end before start" is a fact about the pair. `path`
			 * puts each message under the field that can fix it, so the one hint line beneath the
			 * pair says something the person reading it can act on.
			 */
			if (start === null || end === null) {
				ctx.addIssue({
					code: 'custom',
					path: [start === null ? 'from' : 'to'],
					message: 'Start and end are required.',
				});

				return z.NEVER;
			}

			if (end <= start) {
				ctx.addIssue({ code: 'custom', path: ['to'], message: 'End must be after start.' });

				return z.NEVER;
			}

			/*
			 * Bounds come for free and are not re-checked: two points inside one day are at most
			 * 23h 59m apart, which is already inside A-8's 24h, and an end after its start is
			 * already more than nothing.
			 */
			return { date: values.date, duration: end - start, note: values.note };
		});
	}

	return z.object(fields).transform((values, ctx) => {
		const value = values.duration.trim();

		if (value === '') {
			ctx.addIssue({ code: 'custom', path: ['duration'], message: 'Duration is required.' });

			return z.NEVER;
		}

		const minutes = parseDuration(value);
		if (minutes === null) {
			ctx.addIssue({
				code: 'custom',
				path: ['duration'],
				message: 'Enter a duration like 1h 30m, 1:30, 1.5h or 90.',
			});

			return z.NEVER;
		}
		if (minutes <= 0) {
			ctx.addIssue({ code: 'custom', path: ['duration'], message: 'Duration must be more than 0.' });

			return z.NEVER;
		}
		if (minutes > MAX_DURATION_MINUTES) {
			ctx.addIssue({ code: 'custom', path: ['duration'], message: 'Duration cannot be more than 24h.' });

			return z.NEVER;
		}

		return { date: values.date, duration: minutes, note: values.note };
	});
}

/**
 * What the fields hold while being typed: all strings, because inputs are.
 *
 * `from` and `to` are here in both modes rather than in a second values type. They are registered
 * fields whichever mode is showing - react-hook-form keeps one set of values across a toggle, and a
 * union would mean re-typing every `setValue` and `dirtyFields` read for the sake of two empty
 * strings the duration schema ignores anyway.
 */
export interface TimeEntryFormValues {
	date: string;
	duration: string;
	from: string;
	to: string;
	note: string;
}

/** What a valid form produces: `duration` has become minutes, whichever mode produced it. */
export interface TimeEntryFormOutput {
	date: string;
	duration: number;
	note: string;
}

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
 * Named for the act rather than the verb: both write surfaces fail the same four ways and say the
 * same four things about it, so US-3's edit reuses this rather than forking a near-identical copy.
 *
 * A 422 speaks in Productive's own words rather than ours: the API knows why it refused this
 * entry and we would only be guessing at it. Everything else is mapped, because "Failed to fetch"
 * is not something to put in front of a person.
 *
 * The 404 can only happen on edit, and only to someone whose entry was deleted elsewhere while
 * this form was open - a second tab, or Productive's own UI. It says so rather than offering the
 * generic "try again", because trying again cannot work.
 */
export function toSaveErrorMessage(error: unknown): string {
	if (!(error instanceof ApiError)) return 'Could not save the entry. Try again.';

	if (error.status === 0) return 'Network error. Try again.';
	if (error.status === 401) return 'Your session was rejected. Log in again.';
	if (error.status === 404) return 'This entry no longer exists.';
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
export function summariseUnsavedEntry(
	values: TimeEntryFormValues,
	mode: DurationMode = 'duration'
): {
	duration: string | null;
	hasNote: boolean;
} {
	const minutes = mode === 'range' ? rangeMinutes(values.from, values.to) : parseDuration(values.duration);

	return {
		duration: minutes !== null && minutes > 0 ? formatDuration(minutes) : null,
		hasNote: toPlainText(values.note).trim() !== '',
	};
}

/**
 * The minutes a start and an end describe, or `null` when they do not describe any - the same
 * question the range schema asks, without the messages, for the live preview and the dismissal
 * prompt. Both want a number or nothing; only the schema wants to say why.
 */
export function rangeMinutes(from: string, to: string): number | null {
	const start = toMinutesOfDay(from);
	const end = toMinutesOfDay(to);
	if (start === null || end === null || end <= start) return null;

	return end - start;
}
