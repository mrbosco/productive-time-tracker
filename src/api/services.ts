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

/** `filter[time_tracking_enabled]=true` is the only reliable way to list trackable services - the
 * attribute of the same name disagrees with it and is not authoritative. Organization-wide, not
 * person-scoped: `filter[person_id]` is silently ignored, and a refusal only surfaces as a 422 at
 * create time. `fields` governs relationships too, so `deal` must be named there or the linkage
 * vanishes. */
const FIELDS =
	'fields[services]=name,deal&fields[deals]=name,company,project&fields[projects]=name&fields[companies]=name,avatar_url';

function buildPath(page: number): string {
	return (
		`/services?filter[time_tracking_enabled]=true&include=deal.company,deal.project&${FIELDS}` +
		`&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`
	);
}

/** Walks `service -> deal -> project -> company`, plus the section and the deal's own company. The
 * project's company is whose work it is and the deal's is who is billed; they come apart only on
 * subcontracted work. The deal's stands in when there is no project, so an avatar never goes missing. */
export function toService(document: JsonApiDocument, resource: Resource): Service {
	const dealId = readRelationshipId(resource, 'deal');
	const deal = findIncluded(document, 'deals', dealId);
	const client =
		deal === undefined ? undefined : findIncluded(document, 'companies', readRelationshipId(deal, 'company'));
	const project =
		deal === undefined ? undefined : findIncluded(document, 'projects', readRelationshipId(deal, 'project'));
	const company =
		project === undefined
			? client
			: (findIncluded(document, 'companies', readRelationshipId(project, 'company')) ?? client);
	const section = findIncluded(document, 'sections', readRelationshipId(resource, 'section'));

	return {
		id: resource.id,
		name: readAttributeString(resource, 'name') ?? '',
		dealName: deal === undefined ? null : readAttributeString(deal, 'name'),
		dealId,
		projectName: project === undefined ? null : readAttributeString(project, 'name'),
		companyName: company === undefined ? null : readAttributeString(company, 'name'),
		companyId: company?.id ?? null,
		companyAvatarUrl: company === undefined ? null : readAttributeString(company, 'avatar_url'),
		clientName: client === undefined ? null : readAttributeString(client, 'name'),
		clientId: client?.id ?? null,
		sectionName: section === undefined ? null : readAttributeString(section, 'name'),
	};
}

/** "Company · Project · Service". Neither service names nor deal names are unique on their own, and
 * the three-part form is unique across the recorded account - but nothing in the API guarantees it,
 * so only the labels that still collide get their deal ID appended. */
export function labelServices(services: Service[]): { service: Service; label: string }[] {
	// The deal stands in where a service was never filed under a project.
	const base = (service: Service) =>
		[service.companyName, service.projectName ?? service.dealName, service.name].filter(Boolean).join(' · ');

	const counts = new Map<string, number>();
	for (const service of services) counts.set(base(service), (counts.get(base(service)) ?? 0) + 1);

	return services.map((service) => {
		const label = base(service);
		const collides = (counts.get(label) ?? 0) > 1;

		return { service, label: collides && service.dealId !== null ? `${label} (#${service.dealId})` : label };
	});
}

export function parseServices(document: JsonApiDocument): Service[] {
	return listResources(document).map((resource) => toService(document, resource));
}

export async function listServices(auth: Auth): Promise<Service[]> {
	const documents = await requestAllPages(auth, buildPath);

	return documents.flatMap(parseServices);
}
