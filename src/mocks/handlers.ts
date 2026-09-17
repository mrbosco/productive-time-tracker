import { http, HttpResponse, type RequestHandler } from 'msw';
import timerAlreadyStopped from '../../docs/api/samples/error-409-timer-already-stopped.json';
import error404 from '../../docs/api/samples/error-404.json';
import memberships from '../../docs/api/samples/organization-memberships-avatars.json';
import services from '../../docs/api/samples/services.json';
import timeEntriesDay from '../../docs/api/samples/time-entries-day-service-context.json';
import timeEntriesEmptyDay from '../../docs/api/samples/time-entries-empty-day.json';
import timeEntryCreate from '../../docs/api/samples/time-entry-create.json';
import timeEntryShow from '../../docs/api/samples/time-entry-show.json';
import timeEntryUpdate from '../../docs/api/samples/time-entry-update.json';
import timerCreate from '../../docs/api/samples/timer-create.json';
import timerStop from '../../docs/api/samples/timer-stop.json';
import timersForEntry from '../../docs/api/samples/timers-for-entry.json';
import timersRunning from '../../docs/api/samples/timers-running.json';
import { todayIso } from '@/lib/date';

/** Fixtures are the responses recorded in `docs/api/samples/` (ADR-0003: recorded, never invented).
 * Paths use a leading wildcard so the same handlers serve `dev:mock` and the tests whatever
 * `VITE_API_BASE_URL` resolves to. Happy path only; error cases go in `server.use(...)`. */

const ENTRY_WITH_TIMER_RUNS = '162903873';

export const SEEDED_DATE = '2026-09-15';

/** The state a run accumulates, so a create, edit or delete shows up in the list that follows it.
 * `resetMockData` has to be called between tests: `resetHandlers` does not clear it. */
let createdEntries: (typeof timeEntriesDay.data)[number][] = [];
let nextCreatedId = 0;

/** Attributes a PATCH has changed, by entry ID. The list handler filters on them, so "editing the
 * date moves the entry to another day" is reachable here. */
let editedAttributes = new Map<string, Record<string, unknown>>();

/** `showEntry` honours these too, so a deep link to a deleted entry 404s as the real API would. */
let deletedIds = new Set<string>();

/** `timers-running.json` records a timer that *is* running, so serving it unconditionally would
 * boot the app with a timer nobody started. Every session starts with none. */
let runningTimer: { id: string; startedAt: string; entryId: string } | null = null;
let nextTimerId = 0;

/** Everything above, kept across a `page.reload()` so a running timer survives a refresh.
 * `sessionStorage` is per browser context, so Playwright still gets a clean slate per test. */
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
		// No storage: the state every run starts in anyway.
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
		// Unreadable is treated as a fresh run.
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

function withEdits<T extends { id: string; attributes: Record<string, unknown> }>(entry: T): T {
	const edits = editedAttributes.get(entry.id);
	if (edits === undefined) return entry;

	return { ...entry, attributes: { ...entry.attributes, ...edits } };
}

function toCreatedEntry(body: RequestBody, id: string) {
	return {
		...timeEntryCreate.data,
		id,
		attributes: {
			...timeEntryCreate.data.attributes,
			...(body.data?.attributes ?? {}),
			created_at: new Date().toISOString(),
		},
		// Pinned to the recorded entry's service whatever `serviceId` was posted - the list only
		// needs a service to render, and the component test asserts the request body instead.
		relationships: timeEntriesDay.data[0].relationships,
	} as (typeof timeEntriesDay.data)[number];
}

interface RequestBody {
	data?: { attributes?: Record<string, unknown> };
}

/** Echoes the submitted attributes onto the recorded envelope. `id` is overridden too: without it a
 * PATCH answers with the recorded entry's ID, and a caller seeding its cache would insert a phantom. */
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

/** ponytail: re-envelopes the resource from the day-list recording, so every entry the list shows is
 * deep-linkable. Only `time-entry-show.json` is a real recording of this endpoint. */
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
	/** Deliberately ignores `X-Organization-Id`, as the live API does: an unknown organization is
	 * answered 200 with the token's own memberships and the app finds the match. The recorded one
	 * belongs to organization 999999, so logging in against anything else fails as in production. */
	http.get('*/organization_memberships', () => HttpResponse.json(memberships)),

	http.get('*/services', () => HttpResponse.json(services)),

	http.get('*/time_entries/:id', ({ params }) => showEntry(String(params.id))),

	/** Filters by `filter[after]`/`filter[before]`, which the live API treats as an inclusive range.
	 * Matching the exact day would answer the week strip's Monday-to-Sunday request empty. */
	http.get('*/time_entries', ({ request }) => {
		const params = new URL(request.url).searchParams;
		const after = params.get('filter[after]');
		const before = params.get('filter[before]');

		// Edits before the filter, not after: changing an entry's date has to move it off the day it
		// was on and onto the new one.
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

		// 204 with no body and no `Content-Type`, as the live API answers - see the recorded sample.
		return new HttpResponse(null, { status: 204 });
	}),

	/* The runs for one entry. Answered before the running-timer handler because both are `GET /timers`
	 * and MSW takes the first match; this one only claims the request when the entry filter is on it.
	 * The recorded runs are re-enveloped onto the seeded day's noted entry, as `showEntry` does. */
	http.get('*/timers', ({ request }) => {
		const entryId = new URL(request.url).searchParams.get('filter[time_entry_id]');
		if (entryId === null) return undefined;

		const runs =
			entryId === ENTRY_WITH_TIMER_RUNS
				? timersForEntry.data.map((timer) => ({
						...timer,
						relationships: { time_entry: { data: { type: 'time_entries', id: entryId } } },
					}))
				: [];

		return HttpResponse.json({ ...timersForEntry, data: runs, meta: { ...timersForEntry.meta } });
	}),

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

	/** Starting a timer **also creates a time entry**, dated today with `time: 0`, linked through the
	 * timer's `time_entry` relationship. The mock creates it too. */
	http.post('*/timers', async ({ request }) => {
		const body = (await request.json()) as { data?: { relationships?: { time_entry?: { data?: { id?: string } } } } };
		const continued = body.data?.relationships?.time_entry?.data?.id;

		nextTimerId += 1;
		const startedAt = new Date().toISOString();

		/* Two behaviours, one endpoint, told apart by a relationship
		 * (`docs/api/samples/timer-continue-entry-probe.txt`): a start carrying `time_entry` attaches
		 * to that entry and creates nothing, a bare one creates a `0h` entry on today. */
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

	/** PUT, not POST: every other verb on this path 404s against the real API. Stopping writes the
	 * elapsed **whole minutes** onto the linked entry and drops the remainder - 87 seconds became 1
	 * against the live API - so a timer stopped inside a minute leaves a `0h` entry behind. */
	http.put('*/timers/:id/stop', ({ params }) => {
		const id = String(params.id);
		if (runningTimer?.id !== id) {
			return HttpResponse.json(timerAlreadyStopped, { status: 409 });
		}

		const stoppedAt = new Date();
		const elapsed = Math.floor((stoppedAt.getTime() - new Date(runningTimer.startedAt).getTime()) / 60_000);
		// Added, not replaced: the stop writes the entry's **cumulative** total, measured twice
		// against the live API (`timer-continue-entry-probe.txt`).
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
