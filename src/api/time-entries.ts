import { z } from 'zod';
import {
	ApiError,
	type Auth,
	findIncluded,
	type JsonApiDocument,
	MAX_PAGE_SIZE,
	readRelationshipId,
	request,
	requestAllPages,
	requireDocument,
	listResources,
	readResource,
	type Resource,
} from './client';
import { toService } from './services';
import type { MutatedTimeEntry, TimeEntry, TimeEntryInput } from './types';

/**
 * The attributes this app reads, and only those - a time entry carries about forty-five on the wire.
 *
 * Validated rather than read defensively: a `time` that stopped being a number would otherwise be
 * silently rendered as `0h`, which is a wrong answer presented as a real one. `note` is genuinely
 * nullable and `time` is genuinely allowed to be `0`, so both stay permissive; `draft` is absent
 * from mutation responses, so it is optional.
 */
const timeEntryAttributesSchema = z.object({
	date: z.string(),
	time: z.number().int(),
	note: z.string().nullable().optional(),
	created_at: z.string().optional(),
	draft: z.boolean().optional(),
});

function readTimeEntryAttributes(resource: Resource) {
	const parsed = timeEntryAttributesSchema.safeParse(resource.attributes ?? {});

	if (!parsed.success) {
		const [issue] = parsed.error.issues;
		const where = issue === undefined ? '' : ` (${issue.path.join('.')}: ${issue.message})`;

		throw new ApiError(200, [], `A time entry came back in an unexpected shape${where}.`);
	}

	return parsed.data;
}

function toTimeEntry(document: JsonApiDocument, resource: Resource): TimeEntry {
	const serviceId = readRelationshipId(resource, 'service');
	const service = findIncluded(document, 'services', serviceId);
	const attributes = readTimeEntryAttributes(resource);

	return {
		id: resource.id,
		date: attributes.date,
		minutes: attributes.time,
		note: attributes.note ?? null,
		draft: attributes.draft === true,
		serviceId,
		service: service === undefined ? null : toService(document, service),
		createdAt: attributes.created_at ?? '',
	};
}

export function parseTimeEntries(document: JsonApiDocument): TimeEntry[] {
	return listResources(document).map((resource) => toTimeEntry(document, resource));
}

export function parseTimeEntry(document: JsonApiDocument): TimeEntry {
	return toTimeEntry(document, readResource(document));
}

function parseMutatedTimeEntry(document: JsonApiDocument): MutatedTimeEntry {
	const resource = readResource(document);
	const attributes = readTimeEntryAttributes(resource);

	return {
		id: resource.id,
		date: attributes.date,
		minutes: attributes.time,
		note: attributes.note ?? null,
		draft: attributes.draft === true,
		createdAt: attributes.created_at ?? '',
	};
}

/** Sparse fieldsets take a day from 8.6 KB to 1.6 KB - a full time entry carries ~45 attributes and
 * this screen renders four. The chain is wide because a card names the company, project, deal,
 * section and client behind a service. `fields` governs relationships as well as attributes, so
 * every step has to be named on the step above it, or the linkage vanishes. */
const FIELDS =
	'fields[time_entries]=date,time,note,created_at,draft,service' +
	'&fields[services]=name,deal,section' +
	'&fields[deals]=name,company,project' +
	'&fields[projects]=name,company' +
	'&fields[companies]=name,avatar_url' +
	'&fields[sections]=name';

function buildRangePath(personId: string, from: string, to: string, page: number): string {
	const filters =
		`filter[person_id]=${encodeURIComponent(personId)}` +
		`&filter[after]=${encodeURIComponent(from)}&filter[before]=${encodeURIComponent(to)}`;

	return (
		`/time_entries?${filters}&include=service.deal.company,service.deal.project.company,service.section&${FIELDS}` +
		`&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`
	);
}

/**
 * `created_at` descending. The API rejects `sort=created_at`, so it happens here, and parsed rather
 * than string-compared because the timestamps carry UTC offsets that text ordering gets wrong.
 *
 * Newest first because the entry just logged is what someone is looking for; appending it to the
 * bottom of a full day puts it off the screen.
 */
function compareByCreatedAt(a: TimeEntry, b: TimeEntry): number {
	return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

/** One day's entries. `after`/`before` are inclusive, so a single date needs both set to it. */
export async function listTimeEntries(auth: Auth, personId: string, date: string): Promise<TimeEntry[]> {
	return listTimeEntriesInRange(auth, personId, date, date);
}

/** Every entry between two calendar dates, both ends included. The week strip reads a whole week
 * this way rather than issuing seven day requests. */
export async function listTimeEntriesInRange(
	auth: Auth,
	personId: string,
	from: string,
	to: string
): Promise<TimeEntry[]> {
	const documents = await requestAllPages(auth, (page) => buildRangePath(personId, from, to, page));

	return documents.flatMap(parseTimeEntries).sort(compareByCreatedAt);
}

/**
 * The distinct services a person logged against over a range, for the picker's `Recent` marks.
 *
 * Its own request rather than a reuse of `listTimeEntriesInRange`: that one includes the whole
 * company/project/deal chain to render a card, and none of it is read here. Asking only for the
 * `service` linkage keeps a month of entries to one field per row.
 */
export async function listRecentServiceIds(auth: Auth, personId: string, from: string, to: string): Promise<string[]> {
	const documents = await requestAllPages(auth, (page) => {
		const filters =
			`filter[person_id]=${encodeURIComponent(personId)}` +
			`&filter[after]=${encodeURIComponent(from)}&filter[before]=${encodeURIComponent(to)}`;

		return (
			`/time_entries?${filters}&fields[time_entries]=service` +
			`&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`
		);
	});

	const ids = documents
		.flatMap(listResources)
		.map((resource) => readRelationshipId(resource, 'service'))
		.filter((id): id is string => id !== null);

	return [...new Set(ids)];
}

export async function getTimeEntry(auth: Auth, id: string): Promise<TimeEntry> {
	// `fields[time_entries]` is silently ignored on this endpoint, so the full record comes back
	// regardless; asking for it anyway would only imply a narrowing that does not happen.
	const path = `/time_entries/${encodeURIComponent(id)}?include=service.deal.company,service.deal.project.company,service.section`;

	return parseTimeEntry(requireDocument(await request(auth, path)));
}

/** Create and update responses carry only the `organization` relationship - never `person` or
 * `service` - so the returned entry's `service` is always null. Callers that render a service name
 * must reuse what they already had or refetch. */
export async function createTimeEntry(
	auth: Auth,
	input: TimeEntryInput & { personId: string; serviceId: string }
): Promise<MutatedTimeEntry> {
	const body = {
		data: {
			type: 'time_entries',
			attributes: { date: input.date, time: input.minutes, note: input.note },
			relationships: {
				person: { data: { type: 'people', id: input.personId } },
				service: { data: { type: 'services', id: input.serviceId } },
			},
		},
	};

	const document = requireDocument(
		await request(auth, '/time_entries', { method: 'POST', body: JSON.stringify(body) })
	);

	return parseMutatedTimeEntry(document);
}

export async function updateTimeEntry(
	auth: Auth,
	id: string,
	input: Partial<TimeEntryInput>
): Promise<MutatedTimeEntry> {
	const attributes: Record<string, unknown> = {};
	if (input.date !== undefined) attributes.date = input.date;
	if (input.minutes !== undefined) attributes.time = input.minutes;
	if (input.note !== undefined) attributes.note = input.note;

	const body = { data: { type: 'time_entries', id, attributes } };
	const path = `/time_entries/${encodeURIComponent(id)}`;
	const document = requireDocument(await request(auth, path, { method: 'PATCH', body: JSON.stringify(body) }));

	return parseMutatedTimeEntry(document);
}

export async function deleteTimeEntry(auth: Auth, id: string): Promise<void> {
	await request(auth, `/time_entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
