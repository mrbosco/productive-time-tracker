import type { Service } from '@/api/types';

export interface PickerRow {
	service: Service;
	/** What the row's second line says. The company joins it while searching, where groups are gone. */
	subtitle: string;
	isRecent: boolean;
}

export interface PickerGroup {
	companyId: string;
	company: string;
	avatarUrl: string | null;
	rows: PickerRow[];
}

export interface PickerList {
	groups: PickerGroup[];
	/** Every row in reading order, which is what the arrow keys walk - headers are not stops. */
	rows: PickerRow[];
	total: number;
}

/**
 * The picker's list: filtered, grouped by company, ordered (`Default Service.dc.html`).
 *
 * Searching is client-side over the list already in the cache, matched against company, project and
 * service together so "dev" finds every development service and "company c" narrows to one company.
 * Everything a person can log to arrives in one request; a search endpoint would be a round trip to
 * filter an array that is already here.
 *
 * While searching the groups collapse to one - a header with a single row under it is noise - and
 * the company moves onto the row's own second line instead.
 *
 * Order, within a group: the current default, then anything tracked in the last 30 days, then by
 * name. Between groups: the person's own organization leads, then alphabetically. Which puts the
 * row somebody wants at the top without hiding the rest behind a "recent" tab.
 */
export function toPickerList(
	services: Service[],
	{
		query = '',
		selectedId = null,
		recentIds = new Set<string>(),
		ownCompanyId = null,
	}: { query?: string; selectedId?: string | null; recentIds?: Set<string>; ownCompanyId?: string | null } = {}
): PickerList {
	const needle = query.trim().toLowerCase();
	const matches = (service: Service) =>
		needle === '' ||
		[service.companyName, service.projectName ?? service.dealName, service.name]
			.filter(Boolean)
			.join(' ')
			.toLowerCase()
			.includes(needle);

	const found = services.filter(matches);
	const rank = (service: Service) => (service.id === selectedId ? 0 : recentIds.has(service.id) ? 1 : 2);
	const byRankThenName = (left: Service, right: Service) =>
		rank(left) - rank(right) || left.name.localeCompare(right.name);

	const toRow = (service: Service): PickerRow => ({
		service,
		subtitle:
			needle === ''
				? (service.projectName ?? service.dealName ?? '')
				: [service.companyName, service.projectName ?? service.dealName].filter(Boolean).join(' · '),
		isRecent: recentIds.has(service.id) && service.id !== selectedId,
	});

	if (needle !== '') {
		const rows = [...found].sort(byRankThenName).map(toRow);

		return { groups: [{ companyId: '', company: '', avatarUrl: null, rows }], rows, total: services.length };
	}

	const byCompany = new Map<string, Service[]>();
	for (const service of found) {
		const id = service.companyId ?? '';
		byCompany.set(id, [...(byCompany.get(id) ?? []), service]);
	}

	const groups = [...byCompany.entries()]
		.map(([companyId, members]) => ({
			companyId,
			company: members[0]?.companyName ?? 'Other services',
			avatarUrl: members[0]?.companyAvatarUrl ?? null,
			rows: [...members].sort(byRankThenName).map(toRow),
		}))
		.sort((left, right) => {
			if (left.companyId === ownCompanyId) return -1;
			if (right.companyId === ownCompanyId) return 1;

			return left.company.localeCompare(right.company);
		});

	return { groups, rows: groups.flatMap((group) => group.rows), total: services.length };
}

/** `21 services · 5 companies`, or `5 of 21 services` while searching. */
export function describeCount(list: PickerList, query: string, companies: number): string {
	const services = (count: number) => `${String(count)} service${count === 1 ? '' : 's'}`;

	if (query.trim() !== '') return `${String(list.rows.length)} of ${services(list.total)}`;

	return `${services(list.total)} · ${String(companies)} compan${companies === 1 ? 'y' : 'ies'}`;
}
