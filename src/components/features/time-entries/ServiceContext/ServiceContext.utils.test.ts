import { describe, expect, it } from 'vitest';
import { buildService } from '@/__tests__/test-utils';
import { serviceContextRows } from './ServiceContext.utils';

describe('serviceContextRows', () => {
	it('names the client, the deal and the section when they are all there', () => {
		expect(
			serviceContextRows(
				buildService({
					companyId: '1',
					companyName: 'Vela Studio',
					clientId: '2',
					clientName: 'Northlake Bank',
					dealName: 'Mobile banking app',
					sectionName: 'Design',
				})
			)
		).toEqual([
			{ label: 'Client', value: 'Northlake Bank' },
			{ label: 'Deal', value: 'Mobile banking app' },
			{ label: 'Section', value: 'Design' },
		]);
	});

	/**
	 * The company is already on the card as the avatar. Printing it again under "Client" costs a
	 * line and says nothing, which is why the row exists only for subcontracted work.
	 */
	it('drops the client when it is the same organisation as the company', () => {
		const rows = serviceContextRows(
			buildService({
				companyId: '1',
				companyName: 'Vela Studio',
				clientId: '1',
				clientName: 'Vela Studio',
				dealName: 'Retainer',
			})
		);

		expect(rows.map((row) => row.label)).toEqual(['Deal']);
	});

	/** Compared by ID, because two companies are allowed to be called the same thing. */
	it('keeps the client when it merely shares a name with the company', () => {
		const rows = serviceContextRows(
			buildService({ companyId: '1', companyName: 'Vela', clientId: '2', clientName: 'Vela' })
		);

		expect(rows).toEqual([{ label: 'Client', value: 'Vela' }]);
	});

	it('omits a row rather than drawing a dash for a value that is not there', () => {
		const rows = serviceContextRows(buildService({ dealName: 'Retainer' }));

		expect(rows).toEqual([{ label: 'Deal', value: 'Retainer' }]);
	});

	/**
	 * A service the request never asked the relationships for reads as every level missing, and an
	 * empty list is what tells the card not to draw a trigger at all.
	 */
	it('returns nothing for a service with no context and nothing for no service', () => {
		expect(serviceContextRows(buildService())).toEqual([]);
		expect(serviceContextRows(null)).toEqual([]);
	});
});
