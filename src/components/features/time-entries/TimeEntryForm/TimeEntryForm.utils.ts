import { z } from 'zod';
import { ApiError } from '@/api/client';
import { isoDateSchema } from '@/lib/date';
import { formatDuration, parseDuration, toMinutesOfDay } from '@/lib/duration';
import { toPlainText } from '@/lib/note';

/** The API fixes no note limit - no recorded response carries one. 10,000 is this project's choice:
 * above any plausible note, low enough to catch a paste accident before Productive 422s. */
export const MAX_NOTE_LENGTH = 10_000;

const MAX_DURATION_MINUTES = 24 * 60;

/** How the duration is being entered. Only `time` is ever stored either way, which is why editing
 * always opens back in `duration` - the API keeps no range to reopen. */
export type DurationMode = 'duration' | 'range';

/** Measured as text, not markup: the field stores HTML (ADR-0010), and counting the tags would
 * reject a description for characters the user never typed. */
function noteField(maxNoteLength: number) {
	return z
		.string()
		.refine(
			(note) => toPlainText(note).length <= maxNoteLength,
			`Keep the description under ${String(maxNoteLength)} characters.`
		);
}

/** The duration field's rules, extracted so the card's inline editor rejects exactly what this form
 * rejects, in the same words. */
export function readDuration(input: string): { minutes: number } | { error: string } {
	const value = input.trim();

	if (value === '') return { error: 'Duration is required.' };

	const minutes = parseDuration(value);
	if (minutes === null) return { error: 'Enter a duration like 1h 30m, 1:30, 1.5h or 90.' };
	if (minutes <= 0) return { error: 'Duration must be more than 0.' };
	if (minutes > MAX_DURATION_MINUTES) return { error: 'Duration cannot be more than 24h.' };

	return { minutes };
}

/** Shared by the create and edit routes. `mode` picks between two schemas rather than making three
 * fields optional in one; both produce the same output, converted, so nothing downstream re-parses. */
export function timeEntrySchema(maxNoteLength: number = MAX_NOTE_LENGTH, mode: DurationMode = 'duration') {
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

			/* On the object rather than either field, because "end before start" is a fact about the
			 * pair. `path` puts each message under the field that can fix it. */
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

			return { date: values.date, duration: end - start, note: values.note };
		});
	}

	return z.object(fields).transform((values, ctx) => {
		const read = readDuration(values.duration);

		if ('error' in read) {
			ctx.addIssue({ code: 'custom', path: ['duration'], message: read.error });

			return z.NEVER;
		}

		return { date: values.date, duration: read.minutes, note: values.note };
	});
}

/** What the fields hold while being typed: all strings, because inputs are. `from` and `to` stay
 * here in both modes rather than in a union the duration schema would ignore anyway. */
export interface TimeEntryFormValues {
	date: string;
	duration: string;
	from: string;
	to: string;
	note: string;
}

export interface TimeEntryFormOutput {
	date: string;
	duration: number;
	note: string;
}

/** The one save failure with no field to correct - the service is chosen in the settings sheet.
 * Recognised by status plus `code`, never by `detail` text; the pointer only tells this 422 from
 * any other, matched whole so a future `person_id` pointer does not read as this. */
export function isServiceRefusal(error: unknown): boolean {
	return (
		error instanceof ApiError &&
		error.status === 422 &&
		error.code === 'invalid_attribute_value' &&
		error.errors.some((detail) => detail.pointer?.split('/').includes('person') === true)
	);
}

/** What to show above the buttons when the save fails. A 422 speaks in Productive's own words;
 * everything else is mapped, because "Failed to fetch" is not for a person to read. */
export function toSaveErrorMessage(error: unknown): string {
	if (!(error instanceof ApiError)) return 'Could not save the entry. Try again.';

	if (error.status === 0) return 'Network error. Try again.';
	if (error.status === 401) return 'Your session was rejected. Log in again.';
	if (error.status === 404) return 'This entry no longer exists.';
	if (error.status === 422) return error.errors[0]?.detail ?? 'Could not save the entry. Try again.';

	return 'Could not save the entry. Try again.';
}

/** What a half-written entry would lose, for the dismissal prompt. A duration that does not parse
 * is not named - there is no honest way to say what it was worth. */
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

/** The minutes a start and an end describe, or `null` - the range schema's question without the
 * messages, for the live preview and the dismissal prompt. */
export function rangeMinutes(from: string, to: string): number | null {
	const start = toMinutesOfDay(from);
	const end = toMinutesOfDay(to);
	if (start === null || end === null || end <= start) return null;

	return end - start;
}
