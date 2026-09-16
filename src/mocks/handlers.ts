import { http, HttpResponse, type RequestHandler } from 'msw';
import error404 from '../../docs/api/samples/error-404.json';
import memberships from '../../docs/api/samples/organization-memberships-include-organization.json';
import services from '../../docs/api/samples/services.json';
import timeEntriesDay from '../../docs/api/samples/time-entries-day.json';
import timeEntriesEmptyDay from '../../docs/api/samples/time-entries-empty-day.json';
import timeEntryCreate from '../../docs/api/samples/time-entry-create.json';
import timeEntryShow from '../../docs/api/samples/time-entry-show.json';
import timeEntryUpdate from '../../docs/api/samples/time-entry-update.json';
import timerCreate from '../../docs/api/samples/timer-create.json';
import timerStop from '../../docs/api/samples/timer-stop.json';
import timersRunning from '../../docs/api/samples/timers-running.json';

/**
 * Fixtures are the responses recorded in `docs/api/samples/`, imported rather than copied so there
 * is one source of truth (ADR-0003: recorded, never invented).
 *
 * Paths are matched with a leading wildcard so the same handlers serve `pnpm dev:mock` and the test
 * runs regardless of what `VITE_API_BASE_URL` resolves to.
 *
 * Happy path only. Error cases belong in the test that needs them, via `server.use(...)`
 * (.claude/rules/testing.md).
 */

/** The date `time-entries-day.json` was recorded for; any other date responds empty. */
export const SEEDED_DATE = '2026-09-15';

/**
 * Entries created during a run, so a create shows up in the list that follows it. R-9 is "list
 * updates after success", which is not provable against handlers that answer from a fixture and
 * forget.
 *
 * Module state, so it has to be cleared between tests - `server.resetHandlers()` restores which
 * handlers are installed, not what they remember. `src/__tests__/setup.ts` calls `resetMockData`
 * in the same `afterEach`.
 */
let createdEntries: (typeof timeEntriesDay.data)[number][] = [];
let nextCreatedId = 0;

/**
 * Attributes a PATCH has changed, by entry ID.
 *
 * Same reason `createdEntries` exists, for the other half of the sentence: R-11 is "list reflects
 * update", and a handler that echoed the PATCH back but answered the next `GET /time_entries` from
 * the untouched fixture would fail an honest e2e for a reason that lives in the mock rather than in
 * the app. It also makes "editing the date moves the entry to another day" reachable, because the
 * list handler filters on the very attribute the edit changed.
 */
let editedAttributes = new Map<string, Record<string, unknown>>();

/**
 * IDs a DELETE has removed.
 *
 * The third of the same sentence `createdEntries` and `editedAttributes` cover: R-12 is "removed
 * from list", and a handler that answered 204 and then served the untouched fixture would fail an
 * honest e2e in the mock rather than in the app. `showEntry` honours it too, so a deep link to a
 * deleted entry 404s the way the real API would rather than serving it back.
 */
let deletedIds = new Set<string>();

export function resetMockData(): void {
	createdEntries = [];
	editedAttributes = new Map();
	deletedIds = new Set();
	nextCreatedId = 0;
}

/** A recorded entry as it stands after any edits this run has made to it. */
function withEdits<T extends { id: string; attributes: Record<string, unknown> }>(entry: T): T {
	const edits = editedAttributes.get(entry.id);
	if (edits === undefined) return entry;

	return { ...entry, attributes: { ...entry.attributes, ...edits } };
}

/** Builds the created record out of the recorded create response, so the shape stays real. */
function toCreatedEntry(body: RequestBody, id: string) {
	return {
		...timeEntryCreate.data,
		id,
		attributes: {
			...timeEntryCreate.data.attributes,
			...(body.data?.attributes ?? {}),
			// The list sorts on this (A-7), and every created entry has to sort after the
			// recorded ones rather than after whatever the fixture was recorded at.
			created_at: new Date().toISOString(),
		},
		// Pinned to the recorded entry's service whatever `serviceId` was posted. Harmless for a
		// mock - the list only needs a service to render - but it does mean no e2e can catch the
		// wrong service being sent; the component test asserts the request body instead.
		relationships: timeEntriesDay.data[0].relationships,
	} as (typeof timeEntriesDay.data)[number];
}

interface RequestBody {
	data?: { attributes?: Record<string, unknown> };
}

/**
 * Echo the submitted attributes onto the recorded envelope so a create/edit flow reads back. `id` is
 * overridden too: without it a PATCH answers with the recorded entry's ID rather than the edited
 * one, and a caller seeding its cache from the response would insert a phantom row.
 */
function withAttributes<T extends { data: { id: string; attributes: Record<string, unknown> } }>(
	sample: T,
	body: RequestBody,
	id?: string
): T {
	return {
		...sample,
		data: {
			...sample.data,
			id: id ?? sample.data.id,
			attributes: { ...sample.data.attributes, ...(body.data?.attributes ?? {}) },
		},
	};
}

/**
 * ponytail: the single-entry endpoint is served by re-enveloping the resource recorded in the day
 * list, so every entry the list shows is also deep-linkable. Only `time-entry-show.json` is a real
 * recording of this endpoint; it covers one of the three IDs and proves the envelope shape.
 */
function showEntry(id: string) {
	if (deletedIds.has(id)) return HttpResponse.json(error404, { status: 404 });

	if (id === timeEntryShow.data.id) {
		return HttpResponse.json({ ...timeEntryShow, data: withEdits(timeEntryShow.data) });
	}

	const entry = [...timeEntriesDay.data, ...createdEntries].find((candidate) => candidate.id === id);
	if (entry === undefined) return HttpResponse.json(error404, { status: 404 });

	return HttpResponse.json({ data: withEdits(entry), included: timeEntriesDay.included, meta: {} });
}

export const handlers: RequestHandler[] = [
	/**
	 * Deliberately ignores `X-Organization-Id`, which is what the live API does: an unknown
	 * organization is answered 200 with the token's own memberships
	 * (`organization-memberships-unknown-organization.json`), and the app finds the match. The
	 * recorded membership belongs to organization 999999, so logging in against anything else
	 * fails here exactly as it does in production.
	 */
	http.get('*/organization_memberships', () => HttpResponse.json(memberships)),

	http.get('*/services', () => HttpResponse.json(services)),

	http.get('*/time_entries/:id', ({ params }) => showEntry(String(params.id))),

	/**
	 * Filters the recorded day by `filter[after]`/`filter[before]`, which the live API treats as an
	 * inclusive range. Matching the exact day would answer the week strip's Monday-to-Sunday
	 * request with an empty week, so every day but the seeded one would read as `0h` in
	 * `pnpm dev:mock` and in the e2e run - a mock artefact that looks exactly like a bug.
	 */
	http.get('*/time_entries', ({ request }) => {
		const params = new URL(request.url).searchParams;
		const after = params.get('filter[after]');
		const before = params.get('filter[before]');

		// Edits are applied before the filter, not after: changing an entry's date has to move it
		// off the day it was on and onto the new one, which is the behaviour SPEC 4.2's old-date
		// invalidation exists for.
		const data = [...timeEntriesDay.data, ...createdEntries]
			.filter((entry) => !deletedIds.has(entry.id))
			.map(withEdits)
			.filter((entry) => {
				const { date } = entry.attributes;

				return (after === null || date >= after) && (before === null || date <= before);
			});

		if (data.length === 0) return HttpResponse.json(timeEntriesEmptyDay);

		return HttpResponse.json({
			...timeEntriesDay,
			data,
			meta: { ...timeEntriesDay.meta, total_count: data.length },
		});
	}),

	http.post('*/time_entries', async ({ request }) => {
		const body = (await request.json()) as RequestBody;
		// A counter rather than a timestamp: two creates inside the same millisecond would
		// otherwise share an ID, and React would key two rows the same.
		nextCreatedId += 1;
		const id = `9000000${String(nextCreatedId)}`;
		createdEntries.push(toCreatedEntry(body, id));

		return HttpResponse.json(withAttributes(timeEntryCreate, body, id), { status: 201 });
	}),

	http.patch('*/time_entries/:id', async ({ request, params }) => {
		const body = (await request.json()) as RequestBody;
		const id = String(params.id);

		// Merged, not replaced: `updateTimeEntry` sends a sparse body, so a second edit that touches
		// only the duration must not undo the first one's date.
		editedAttributes.set(id, { ...editedAttributes.get(id), ...(body.data?.attributes ?? {}) });

		return HttpResponse.json(withAttributes(timeEntryUpdate, body, id));
	}),

	http.delete('*/time_entries/:id', ({ params }) => {
		deletedIds.add(String(params.id));

		// 204 with no body and no `Content-Type` - `time-entry-delete.txt`, api-client rule 14.
		return new HttpResponse(null, { status: 204 });
	}),

	http.get('*/timers', () => HttpResponse.json(timersRunning)),

	http.post('*/timers', () => HttpResponse.json(timerCreate, { status: 201 })),

	// PUT, not POST: every other verb on this path 404s against the real API.
	http.put('*/timers/:id/stop', () => HttpResponse.json(timerStop)),
];
