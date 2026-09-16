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

interface RequestBody {
	data?: { attributes?: Record<string, unknown> };
}

/**
 * Echo the submitted attributes onto the recorded envelope so a create/edit flow reads back. `id` is
 * overridden too: without it a PATCH answers with the recorded entry's ID rather than the edited
 * one, and a caller seeding its cache from the response would insert a phantom row.
 *
 * ponytail: these handlers hold no state, so a created entry does not appear in the following list
 * and a delete does not remove one. The stories that need round-tripping (US-2, US-3, US-4) add it.
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
	if (id === timeEntryShow.data.id) return HttpResponse.json(timeEntryShow);

	const entry = timeEntriesDay.data.find((candidate) => candidate.id === id);
	if (entry === undefined) return HttpResponse.json(error404, { status: 404 });

	return HttpResponse.json({ data: entry, included: timeEntriesDay.included, meta: {} });
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

		const data = timeEntriesDay.data.filter((entry) => {
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

	http.post('*/time_entries', async ({ request }) =>
		HttpResponse.json(withAttributes(timeEntryCreate, (await request.json()) as RequestBody), { status: 201 })
	),

	http.patch('*/time_entries/:id', async ({ request, params }) =>
		HttpResponse.json(withAttributes(timeEntryUpdate, (await request.json()) as RequestBody, String(params.id)))
	),

	http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 204 })),

	http.get('*/timers', () => HttpResponse.json(timersRunning)),

	http.post('*/timers', () => HttpResponse.json(timerCreate, { status: 201 })),

	// PUT, not POST: every other verb on this path 404s against the real API.
	http.put('*/timers/:id/stop', () => HttpResponse.json(timerStop)),
];
