import { describe, expect, it } from 'vitest';
import { buildService } from '@/__tests__/test-utils';
import { toPickerList } from './ServicePicker.utils';

const SERVICES = [
	buildService({ id: 'a', name: 'Development', companyId: 'c2', companyName: 'Vela', projectName: 'Rebrand' }),
	buildService({ id: 'b', name: 'Design', companyId: 'c2', companyName: 'Vela', projectName: 'Rebrand' }),
	buildService({ id: 'c', name: 'Administration', companyId: 'c1', companyName: 'Anoda', projectName: 'Internal' }),
	buildService({ id: 'd', name: 'Consulting', companyId: 'c1', companyName: 'Anoda', projectName: 'Internal' }),
];

describe('toPickerList', () => {
	it('groups by company, own organization first, then alphabetically inside', () => {
		const list = toPickerList(SERVICES, { ownCompanyId: 'c2' });

		expect(list.groups.map((group) => group.company)).toEqual(['Vela', 'Anoda']);
		expect(list.groups[0]?.rows.map((row) => row.service.name)).toEqual(['Design', 'Development']);
	});

	it('floats the current default, then anything recent, above the rest', () => {
		const list = toPickerList(SERVICES, { selectedId: 'a', recentIds: new Set(['b']), ownCompanyId: 'c2' });

		expect(list.groups[0]?.rows.map((row) => row.service.id)).toEqual(['a', 'b']);
		expect(list.groups[0]?.rows[1]?.isRecent).toBe(true);
	});

	/** Search spans all three levels, so "anoda" narrows by company and "dev" by service. */
	it('matches company, project and service, and collapses the groups while searching', () => {
		expect(toPickerList(SERVICES, { query: 'anoda' }).rows.map((row) => row.service.id)).toEqual(['c', 'd']);

		const byService = toPickerList(SERVICES, { query: 'dev' });
		expect(byService.rows.map((row) => row.service.id)).toEqual(['a']);
		expect(byService.groups).toHaveLength(1);
		// The company moves onto the row, since there is no header to carry it any more.
		expect(byService.rows[0]?.subtitle).toBe('Vela · Rebrand');
	});

	it('finds nothing rather than everything when nothing matches', () => {
		expect(toPickerList(SERVICES, { query: 'zzz' }).rows).toEqual([]);
	});
});
