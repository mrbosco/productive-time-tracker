import type { Service } from '@/api/types';

export interface ServiceContextRow {
	label: string;
	value: string;
}

/** The rows behind a project name: who is billed, under which agreement, in which section. A row with
 * no value is left out rather than shown as an em dash or "None", and the client is left out when it
 * is the company already on the card's avatar - compared by ID, since two companies may share a name. */
export function serviceContextRows(service: Service | null): ServiceContextRow[] {
	if (service === null) return [];

	const rows: ServiceContextRow[] = [];
	const isSubcontracted = service.clientId !== null && service.clientId !== service.companyId;

	if (isSubcontracted && service.clientName !== null) rows.push({ label: 'Client', value: service.clientName });
	if (service.dealName !== null) rows.push({ label: 'Deal', value: service.dealName });
	if (service.sectionName !== null) rows.push({ label: 'Section', value: service.sectionName });

	return rows;
}
