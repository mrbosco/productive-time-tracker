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
 * `include` is mandatory for both relationships, and not merely to get the names: without it each
 * one arrives as `{ meta: { included: false } }` with no ID whatsoever.
 *
 * `organization` is included because **`X-Organization-Id` does not scope this collection**. A
 * header naming an organization that does not exist returns 200 and the token's own memberships
 * (`organization-memberships-unknown-organization.json`), so the membership for the entered
 * organization has to be found among the results - which is what the assignment describes on page
 * two. Some wrong organizations are refused with 403 `no_person` (`error-403.json`), so both
 * outcomes have to be handled.
 *
 * Sparse fieldsets take this from 29 KB to 1.4 KB, and that is not only about weight: the full
 * organization record carries an invitation token, a billing email and analytics identifiers that
 * this app has no business holding.
 */
const FIELDS =
	'fields[organization_memberships]=person,organization' +
	'&fields[people]=first_name,last_name,email,avatar_url,availabilities' +
	'&fields[organizations]=name,company' +
	'&fields[companies]=name,avatar_url';

/**
 * `organization.company` is how the organization's logo is reached (UI-8). An organization has no
 * picture of its own; the one Productive's own client renders in its top bar belongs to the
 * company record behind it, and this is the include its request uses - watched on
 * `app.productive.io` and then recorded as `organization-memberships-avatars.json`.
 *
 * It costs no extra request. The person's own `avatar_url` rides along in the same fieldset.
 */
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

/**
 * The membership for the organization the user typed, which is the step the assignment spells out:
 * "OrganizationMembership belonging to the Organization with the entered ID is found among the
 * results."
 *
 * Returning undefined is a real answer - this token has no person in that organization - and not a
 * missing-data case. A membership whose `organizationId` is null never matches, because a null
 * there means the relationship was not requested, never that it is unset (api-client rule 10).
 */
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
