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

/** `include` is mandatory for both relationships: without it each arrives as
 * `{ meta: { included: false } }` with no ID at all. `organization` is included because
 * **`X-Organization-Id` does not scope this collection** - an unknown one returns 200 and the
 * token's own memberships, a wrong one 403 `no_person`. Sparse fieldsets take this 29 KB to 1.4 KB. */
const FIELDS =
	'fields[organization_memberships]=person,organization' +
	'&fields[people]=first_name,last_name,email,avatar_url,availabilities' +
	'&fields[organizations]=name,company' +
	'&fields[companies]=name,avatar_url';

/** `organization.company` is how the organization's logo is reached: an organization has no picture
 * of its own, and the one Productive's client renders in its top bar belongs to the company record
 * behind it (recorded as `organization-memberships-avatars.json`). Costs no extra request - the
 * person's own `avatar_url` rides along in the same fieldset. */
function buildPath(page: number): string {
	return `/organization_memberships?include=person,organization.company&${FIELDS}&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`;
}

function toPerson(resource: Resource): Person {
	return {
		id: resource.id,
		firstName: readAttributeString(resource, 'first_name') ?? '',
		lastName: readAttributeString(resource, 'last_name') ?? '',
		email: readAttributeString(resource, 'email'),
		avatarUrl: readAttributeString(resource, 'avatar_url'),
		availabilities: readAttributeString(resource, 'availabilities'),
	};
}

export function parseOrganizationMemberships(document: JsonApiDocument): OrganizationMembership[] {
	return listResources(document).map((resource) => {
		const personId = readRelationshipId(resource, 'person');
		const person = findIncluded(document, 'people', personId);
		const organizationId = readRelationshipId(resource, 'organization');
		const organization = findIncluded(document, 'organizations', organizationId);
		const company =
			organization === undefined
				? undefined
				: findIncluded(document, 'companies', readRelationshipId(organization, 'company'));

		return {
			id: resource.id,
			personId,
			person: person === undefined ? null : toPerson(person),
			organizationId,
			organizationName: organization === undefined ? null : readAttributeString(organization, 'name'),
			organizationAvatarUrl: company === undefined ? null : readAttributeString(company, 'avatar_url'),
			organizationCompanyId: company?.id ?? null,
		};
	});
}

/** The membership for the organization the user typed. Undefined is a real answer - this token has
 * no person in that organization - not a missing-data case. A membership whose `organizationId` is
 * null never matches, because null there means the relationship was not requested. */
export function findMembershipForOrganization(
	memberships: OrganizationMembership[],
	organizationId: string
): OrganizationMembership | undefined {
	return memberships.find((membership) => membership.organizationId === organizationId);
}

export async function listOrganizationMemberships(auth: Auth): Promise<OrganizationMembership[]> {
	const documents = await requestAllPages(auth, buildPath);

	return documents.flatMap(parseOrganizationMemberships);
}
