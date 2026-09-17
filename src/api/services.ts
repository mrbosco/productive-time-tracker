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
const FIELDS = 'fields[services]=name,deal&fields[deals]=name,company&fields[companies]=name';

function buildPath(page: number): string {
	return (
		`/services?filter[time_tracking_enabled]=true&include=deal.company&${FIELDS}` +
		`&page[size]=${String(MAX_PAGE_SIZE)}&page[number]=${String(page)}`
	);
}

/**
 * Walks `service -> deal -> project -> company`, plus the section and the deal's own company.
 *
 * Which company is "the company" and which is "the client" is the one judgement in here. The
 * project's is the work's - it is what a logo is recognised as - and the deal's is whoever is
 * billed for it. They are the same record in every entry this account has; they come apart on
 * subcontracted work, which is the case `Service Context.dc.html` designs the Client row for. The
 * project's is used when there is one and the deal's stands in when there is not, so an avatar
 * never goes missing over a deal that was never filed under a project.
 */
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

/**
 * "Company · Project · Service" (A-1). Neither service names nor deal names are unique on their own,
 * and the three-part form is unique across the recorded account - but nothing in the API guarantees
 * it, so any label still shared by two services gets its deal ID appended. Only the collided labels
 * are suffixed; suffixing every row would be noise.
 */
export function labelServices(services: Service[]): { service: Service; label: string }[] {
	const base = (service: Service) => [service.companyName, service.dealName, service.name].filter(Boolean).join(' · ');

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
