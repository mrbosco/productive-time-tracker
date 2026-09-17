import { http, HttpResponse, type RequestHandler } from 'msw';
import timerAlreadyStopped from '../../docs/api/samples/error-409-timer-already-stopped.json';
import error404 from '../../docs/api/samples/error-404.json';
import memberships from '../../docs/api/samples/organization-memberships-avatars.json';
import services from '../../docs/api/samples/services.json';
import timeEntriesDay from '../../docs/api/samples/time-entries-day.json';
import timeEntriesEmptyDay from '../../docs/api/samples/time-entries-empty-day.json';
import timeEntryCreate from '../../docs/api/samples/time-entry-create.json';
import timeEntryShow from '../../docs/api/samples/time-entry-show.json';
import timeEntryUpdate from '../../docs/api/samples/time-entry-update.json';
import timerCreate from '../../docs/api/samples/timer-create.json';
import timerStop from '../../docs/api/samples/timer-stop.json';
import timersRunning from '../../docs/api/samples/timers-running.json';
import { todayIso } from '@/lib/date';

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

/**
 * The timer this run has started, if any.
 *
 * The recorded `timers-running.json` describes a timer that *is* running, and serving it
 * unconditionally would mean the app booted with a timer it never started - the pill would open
 * in its running state on every screen and every e2e spec. X-4 is only honest against a mock that
 * can also answer "nothing is running", which is the state every session starts in.
 */
let runningTimer: { id: string; startedAt: string; entryId: string } | null = null;
let nextTimerId = 0;

/**
 * Everything above, kept across a page reload.
 *
 * Module state lives in the page, so `page.reload()` forgets all of it - which made the mock a
 * worse stand-in than a server in exactly the place it mattered: X-4 persists a running timer so a
 * refresh finds it still going, and against a mock that forgot, the only honest outcome was the
 * feature appearing not to work. `sessionStorage` is per browser context, so Playwright still gets
 * a clean slate per test and Vitest clears it in the same `afterEach` that calls `resetMockData`.
 */
const STATE_KEY = 'tracktive.mock';

function persist(): void {
	try {
		window.sessionStorage.setItem(
			STATE_KEY,
			JSON.stringify({
				createdEntries,
				nextCreatedId,
				editedAttributes: [...editedAttributes],
				deletedIds: [...deletedIds],
				runningTimer,
				nextTimerId,
			})
		);
	} catch {
		// No storage is the state every run starts in anyway.
	}
}

function restore(): void {
	let raw: string | null;
	try {
		raw = window.sessionStorage.getItem(STATE_KEY);
	} catch {
		return;
	}
	if (raw === null) return;

	try {
		const state = JSON.parse(raw) as {
			createdEntries: typeof createdEntries;
			nextCreatedId: number;
			editedAttributes: [string, Record<string, unknown>][];
			deletedIds: string[];
			runningTimer: typeof runningTimer;
			nextTimerId: number;
		};
		createdEntries = state.createdEntries;
		nextCreatedId = state.nextCreatedId;
		editedAttributes = new Map(state.editedAttributes);
		deletedIds = new Set(state.deletedIds);
		runningTimer = state.runningTimer;
		nextTimerId = state.nextTimerId;
	} catch {
		// Anything unreadable is treated as a fresh run, which is what it may as well be.
	}
}

restore();

export function resetMockData(): void {
	createdEntries = [];
	editedAttributes = new Map();
	deletedIds = new Set();
	nextCreatedId = 0;
	runningTimer = null;
	nextTimerId = 0;

	try {
		window.sessionStorage.removeItem(STATE_KEY);
	} catch {
		// Nothing was stored in the first place.
	}
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
		persist();

		return HttpResponse.json(withAttributes(timeEntryCreate, body, id), { status: 201 });
	}),

	http.patch('*/time_entries/:id', async ({ request, params }) => {
		const body = (await request.json()) as RequestBody;
		const id = String(params.id);

		// Merged, not replaced: `updateTimeEntry` sends a sparse body, so a second edit that touches
		// only the duration must not undo the first one's date.
		editedAttributes.set(id, { ...editedAttributes.get(id), ...(body.data?.attributes ?? {}) });
		persist();

		return HttpResponse.json(withAttributes(timeEntryUpdate, body, id));
	}),

	http.delete('*/time_entries/:id', ({ params }) => {
		deletedIds.add(String(params.id));
		persist();

		// 204 with no body and no `Content-Type` - `time-entry-delete.txt`, api-client rule 14.
		return new HttpResponse(null, { status: 204 });
	}),

	/**
	 * `filter[stopped_at][eq]=` asks for the running one, and the answer is a collection - empty
	 * when there is none, which is the state a session starts in.
	 *
	 * `include=time_entry` is the only place the linked entry's ID is returned at all: both the
	 * create and the stop responses carry `time_entry` un-included (api-client rule 10), which is
	 * why the app learns it from here and remembers it.
	 */
	http.get('*/timers', () => {
		if (runningTimer === null) {
			return HttpResponse.json({
				...timersRunning,
				data: [],
				included: [],
				meta: { ...timersRunning.meta, total_count: 0 },
			});
		}

		const entry = [...timeEntriesDay.data, ...createdEntries].find(
			(candidate) => candidate.id === runningTimer?.entryId
		);

		return HttpResponse.json({
			...timersRunning,
			data: [
				{
					...timersRunning.data[0],
					id: runningTimer.id,
					attributes: { ...timersRunning.data[0].attributes, started_at: runningTimer.startedAt, stopped_at: null },
					relationships: {
						...timersRunning.data[0].relationships,
						time_entry: { data: { type: 'time_entries', id: runningTimer.entryId } },
					},
				},
			],
			included: entry === undefined ? [] : [withEdits(entry)],
			meta: { ...timersRunning.meta, total_count: 1 },
		});
	}),

	/**
	 * Starting a timer **also creates a time entry**, dated today with `time: 0`, linked through the
	 * timer's `time_entry` relationship (SPEC 11, finding 1). The mock creates it too, or the `0h`
	 * row a running timer is would never appear in the day list and X-4's second entry problem would
	 * be invisible here.
	 */
	http.post('*/timers', async ({ request }) => {
		const body = (await request.json()) as { data?: { relationships?: { time_entry?: { data?: { id?: string } } } } };
		const continued = body.data?.relationships?.time_entry?.data?.id;

		nextTimerId += 1;
		const startedAt = new Date().toISOString();

		/*
		 * Two behaviours, one endpoint, told apart by a relationship
		 * (`docs/api/samples/timer-continue-entry-probe.txt`): a start carrying `time_entry`
		 * attaches to that entry and creates nothing, while a bare one creates a `0h` entry on today.
		 * The mock has to do both, or X-4's `Continue` would look like it worked here and put a
		 * second row on the day against the real API.
		 */
		let entryId = continued;
		if (entryId === undefined) {
			nextCreatedId += 1;
			entryId = `9100000${String(nextCreatedId)}`;
			createdEntries.push(toCreatedEntry({ data: { attributes: { date: todayIso(), time: 0, note: null } } }, entryId));
		}

		runningTimer = { id: `1433564${String(nextTimerId)}`, startedAt, entryId };
		persist();

		return HttpResponse.json(
			{
				...timerCreate,
				data: {
					...timerCreate.data,
					id: runningTimer.id,
					attributes: { ...timerCreate.data.attributes, started_at: startedAt, stopped_at: null, total_time: 0 },
				},
			},
			{ status: 201 }
		);
	}),

	/**
	 * PUT, not POST: every other verb on this path 404s against the real API.
	 *
	 * Stopping writes the elapsed **whole minutes** onto the linked entry and drops the remainder -
	 * 87 seconds became 1 against the live API - so a timer stopped inside a minute really does
	 * leave a `0h` entry behind. The stop sheet is editable because of it.
	 */
	http.put('*/timers/:id/stop', ({ params }) => {
		const id = String(params.id);
		if (runningTimer?.id !== id) {
			return HttpResponse.json(timerAlreadyStopped, { status: 409 });
		}

		const stoppedAt = new Date();
		const elapsed = Math.floor((stoppedAt.getTime() - new Date(runningTimer.startedAt).getTime()) / 60_000);
		/*
		 * Added, not replaced: the stop writes the entry's **cumulative** total, measured twice
		 * against the live API (`timer-continue-entry-probe.txt`). A mock that overwrote would make
		 * a continued entry appear to lose everything it had logged, and only on the real thing.
		 */
		const entry = [...timeEntriesDay.data, ...createdEntries].find(
			(candidate) => candidate.id === runningTimer?.entryId
		);
		const logged = entry === undefined ? 0 : Number((withEdits(entry).attributes as { time?: number }).time ?? 0);
		const totalTime = logged + elapsed;
		editedAttributes.set(runningTimer.entryId, { ...editedAttributes.get(runningTimer.entryId), time: totalTime });
		runningTimer = null;
		persist();

		return HttpResponse.json({
			...timerStop,
			data: {
				...timerStop.data,
				id,
				attributes: {
					...timerStop.data.attributes,
					stopped_at: stoppedAt.toISOString(),
					total_time: totalTime,
				},
			},
		});
	}),
];
