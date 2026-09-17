import type { Service } from '@/api/types';

export interface ServiceContextRow {
	label: string;
	value: string;
}

/**
 * The rows behind a project name (UI-2): who is billed, under which agreement, in which section.
 *
 * A row is left out when it has no value, and the client is left out when it is the same
 * organisation as the one already on the card's avatar - printing a name twice costs a line and
 * says nothing. Never an em dash and never "None": an absent row is the honest rendering of a
 * relationship the record does not have.
 *
 * Compared by ID rather than by name, because two companies are allowed to share one.
 */
export function serviceContextRows(service: Service | null): ServiceContextRow[] {
	if (service === null) return [];

	const rows: ServiceContextRow[] = [];
	const isSubcontracted = service.clientId !== null && service.clientId !== service.companyId;

	if (isSubcontracted && service.clientName !== null) rows.push({ label: 'Client', value: service.clientName });
	if (service.dealName !== null) rows.push({ label: 'Deal', value: service.dealName });
	if (service.sectionName !== null) rows.push({ label: 'Section', value: service.sectionName });

	return rows;
}
