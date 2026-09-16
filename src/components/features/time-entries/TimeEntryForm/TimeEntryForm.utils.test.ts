import { describe, expect, it } from 'vitest';
import error401 from '../../../../../docs/api/samples/error-401.json';
import error404 from '../../../../../docs/api/samples/error-404.json';
import error422 from '../../../../../docs/api/samples/error-422-missing-service.json';
import { ApiError, toApiError } from '@/api/client';
import { isServiceRefusal, MAX_NOTE_LENGTH, timeEntrySchema, toCreateErrorMessage } from './TimeEntryForm.utils';

const schema = timeEntrySchema();

function durationError(duration: string): string | undefined {
	const result = schema.safeParse({ date: '2026-09-15', duration, note: '' });

	return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === 'duration')?.message;
}

describe('timeEntrySchema', () => {
	it('turns the typed duration into minutes for the API', () => {
		const result = schema.safeParse({ date: '2026-09-15', duration: '1.5h', note: 'Pairing' });

		expect(result.success).toBe(true);
		expect(result.data?.duration).toBe(90);
	});

	/**
	 * Four messages, not one (A-8). They are what the field says out loud, so each has to name the
	 * thing that is actually wrong rather than restating the rule.
	 */
	it.each([
		['', 'Duration is required.'],
		['   ', 'Duration is required.'],
		['half a day', 'Enter a duration like 1h 30m, 1:30, 1.5h or 90.'],
		['0', 'Duration must be more than 0.'],
		['0h', 'Duration must be more than 0.'],
		['25h', 'Duration cannot be more than 24h.'],
		['1441', 'Duration cannot be more than 24h.'],
	])('rejects %s with %s', (duration, expected) => {
		expect(durationError(duration)).toBe(expected);
	});

	it('accepts exactly 24h, which is the boundary rather than past it', () => {
		expect(durationError('24h')).toBeUndefined();
	});

	/** A-8: the description is optional, and the API takes an empty or null note. */
	it('accepts an empty description', () => {
		expect(schema.safeParse({ date: '2026-09-15', duration: '30m', note: '' }).success).toBe(true);
	});

	it('rejects a description past the guard', () => {
		const result = schema.safeParse({
			date: '2026-09-15',
			duration: '30m',
			note: 'x'.repeat(MAX_NOTE_LENGTH + 1),
		});

		expect(result.success).toBe(false);
	});

	it('takes the limit as an argument rather than reading a constant (guidebook 13)', () => {
		const tiny = timeEntrySchema(5);

		expect(tiny.safeParse({ date: '2026-09-15', duration: '30m', note: 'too long' }).success).toBe(false);
	});

	/** The same guard the route uses, so a hand-edited search param cannot reach the API. */
	it('rejects a date that is not a calendar day', () => {
		expect(schema.safeParse({ date: '2026-02-30', duration: '30m', note: '' }).success).toBe(false);
	});
});

describe('isServiceRefusal', () => {
	/** A-1b: the one failure whose fix is a different screen, so it has to be told apart. */
	it('recognises Productive refusing the service the app chose', () => {
		expect(isServiceRefusal(toApiError(422, error422))).toBe(true);
	});

	it.each([
		['a 404', toApiError(404, error404)],
		['a 401', toApiError(401, error401)],
		['a transport failure', new ApiError(0, [], 'Could not reach the Productive API.')],
		['something that is not an ApiError', new Error('boom')],
	])('does not mistake %s for it', (_name, error) => {
		expect(isServiceRefusal(error)).toBe(false);
	});
});

describe('toCreateErrorMessage', () => {
	/**
	 * A 422 speaks in Productive's words. We know the entry was refused; only the API knows why,
	 * and paraphrasing it would be guessing (api-client rule 19 forbids branching on the text, not
	 * showing it).
	 */
	it('passes a 422 through in the API own words', () => {
		expect(toCreateErrorMessage(toApiError(422, error422))).toBe('person cannot track on this service');
	});

	it('names a transport failure as one rather than blaming the save', () => {
		expect(toCreateErrorMessage(new ApiError(0, [], 'unreachable'))).toBe('Network error. Try again.');
	});

	it('tells the user to log in again when the session is rejected', () => {
		expect(toCreateErrorMessage(toApiError(401, error401))).toBe('Your session was rejected. Log in again.');
	});

	it.each([
		['a 404', toApiError(404, error404)],
		['a thrown string', 'boom'],
	])('falls back to the design wording for %s', (_name, error) => {
		expect(toCreateErrorMessage(error)).toBe('Could not save the entry. Try again.');
	});
});
