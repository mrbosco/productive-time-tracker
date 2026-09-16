import {
	type Auth,
	findIncluded,
	type JsonApiDocument,
	listResources,
	MAX_PAGE_SIZE,
	readAttributeString,
	readRelationshipId,
	requestAllPages,
	type Resource,
} from './client';
import type { Service } from './types';

/**
 * `filter[time_tracking_enabled]=true` is the only reliable way to list trackable services - the
 * attribute of the same name disagrees with it (the three "Expenses: ..." services report `true`
 * and are still excluded). The filter is authoritative.
 *
 * This list is organization-wide, not person-scoped: `filter[person_id]` is silently ignored here,
 * and whether a given person may track on a service only surfaces as a 422 at create time.
 *
 * Sparse fieldsets cut this 13x. `fields` governs relationships as well as attributes, so `deal`
 * has to be named there or the linkage vanishes while the included deals remain orphaned.
 */
const FIELDS = 'fields[services]=name,deal&fields[deals]=name';

function buildPath(page: number): string {
	return (
		`/services?filter[time_tracking_enabled]=true&include=deal&${FIELDS}` +
		`&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`
	);
}

export function toService(document: JsonApiDocument, resource: Resource): Service {
	const deal = findIncluded(document, 'deals', readRelationshipId(resource, 'deal'));

	return {
		id: resource.id,
		name: readAttributeString(resource, 'name') ?? '',
		dealName: deal === undefined ? null : readAttributeString(deal, 'name'),
	};
}

export function parseServices(document: JsonApiDocument): Service[] {
	return listResources(document).map((resource) => toService(document, resource));
}

export async function listServices(auth: Auth): Promise<Service[]> {
	const documents = await requestAllPages(auth, buildPath);

	return documents.flatMap(parseServices);
}
