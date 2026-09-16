import {
	type Auth,
	readAttributeNumber,
	readAttributeString,
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

function toTimeEntry(document: JsonApiDocument, resource: Resource): TimeEntry {
	const serviceId = readRelationshipId(resource, 'service');
	const service = findIncluded(document, 'services', serviceId);

	return {
		id: resource.id,
		date: readAttributeString(resource, 'date') ?? '',
		minutes: readAttributeNumber(resource, 'time'),
		note: readAttributeString(resource, 'note'),
		draft: resource.attributes?.draft === true,
		serviceId,
		service: service === undefined ? null : toService(document, service),
		createdAt: readAttributeString(resource, 'created_at') ?? '',
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

	return {
		id: resource.id,
		date: readAttributeString(resource, 'date') ?? '',
		minutes: readAttributeNumber(resource, 'time'),
		note: readAttributeString(resource, 'note'),
		draft: resource.attributes?.draft === true,
		createdAt: readAttributeString(resource, 'created_at') ?? '',
	};
}

/**
 * Sparse fieldsets take a day from 8.6 KB to 1.6 KB - a full time entry carries ~45 attributes
 * (costs, approval, invoicing, overtime) and this screen renders four of them.
 */
const FIELDS = 'fields[time_entries]=date,time,note,created_at,draft,service&fields[services]=name';

function buildRangePath(personId: string, from: string, to: string, page: number): string {
	const filters =
		`filter[person_id]=${encodeURIComponent(personId)}` +
		`&filter[after]=${encodeURIComponent(from)}&filter[before]=${encodeURIComponent(to)}`;

	return (
		`/time_entries?${filters}&include=service&${FIELDS}` +
		`&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`
	);
}

/**
 * `created_at` ascending (A-7). The API rejects `sort=created_at`, so it happens here. Parsed
 * rather than string-compared: the timestamps carry UTC offsets, which text ordering gets wrong.
 */
function compareByCreatedAt(a: TimeEntry, b: TimeEntry): number {
	return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

/**
 * One day's entries. `after`/`before` are inclusive, so a single date needs both set to it.
 *
 * Paging is a safety net rather than an expectation: 200 is the API's ceiling and a person rarely
 * logs that many entries in a day. An empty day reports `total_pages: 0`, hence the `<` loop.
 */
export async function listTimeEntries(auth: Auth, personId: string, date: string): Promise<TimeEntry[]> {
	return listTimeEntriesInRange(auth, personId, date, date);
}

/**
 * Every entry between two calendar dates, both ends included. The week strip reads a whole week
 * this way rather than issuing seven day requests (SPEC 10, X-1); a single day is the same call
 * with `from` and `to` set to it.
 */
export async function listTimeEntriesInRange(
	auth: Auth,
	personId: string,
	from: string,
	to: string
): Promise<TimeEntry[]> {
	const documents = await requestAllPages(auth, (page) => buildRangePath(personId, from, to, page));

	return documents.flatMap(parseTimeEntries).sort(compareByCreatedAt);
}

export async function getTimeEntry(auth: Auth, id: string): Promise<TimeEntry> {
	// `fields[time_entries]` is silently ignored on this endpoint, so the full record comes back
	// regardless; asking for it anyway would only imply a narrowing that does not happen.
	const path = `/time_entries/${encodeURIComponent(id)}?include=service`;

	return parseTimeEntry(requireDocument(await request(auth, path)));
}

/**
 * Create and update responses carry only the `organization` relationship - never `person` or
 * `service` - so the returned entry's `service` is always null. Callers that render a service name
 * must reuse what they already had or refetch.
 */
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
