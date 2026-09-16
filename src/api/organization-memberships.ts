import {
	type Auth,
	findIncluded,
	type JsonApiDocument,
	MAX_PAGE_SIZE,
	readAttributeString,
	readRelationshipId,
	requestAllPages,
	type Resource,
	listResources,
} from './client';
import type { OrganizationMembership, Person } from './types';

/**
 * `include=person` is mandatory, and not merely to get the name: without it the person
 * relationship arrives as `{ meta: { included: false } }` with no ID whatsoever.
 *
 * The `X-Organization-Id` header decides which organization this answers for - a token with no
 * person in the requested organization fails 403 `no_person` rather than returning a list to filter.
 *
 * Sparse fieldsets take this from 22 KB to under 1 KB: the full membership record is ~35
 * notification-preference attributes and we read two fields off the person.
 */
const FIELDS = 'fields[organization_memberships]=person&fields[people]=first_name,last_name,email';

function buildPath(page: number): string {
	return `/organization_memberships?include=person&${FIELDS}&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`;
}

function toPerson(resource: Resource): Person {
	return {
		id: resource.id,
		firstName: readAttributeString(resource, 'first_name') ?? '',
		lastName: readAttributeString(resource, 'last_name') ?? '',
		email: readAttributeString(resource, 'email'),
	};
}

export function parseOrganizationMemberships(document: JsonApiDocument): OrganizationMembership[] {
	return listResources(document).map((resource) => {
		const personId = readRelationshipId(resource, 'person');
		const person = findIncluded(document, 'people', personId);

		return {
			id: resource.id,
			personId,
			person: person === undefined ? null : toPerson(person),
		};
	});
}

export async function listOrganizationMemberships(auth: Auth): Promise<OrganizationMembership[]> {
	const documents = await requestAllPages(auth, buildPath);

	return documents.flatMap(parseOrganizationMemberships);
}
