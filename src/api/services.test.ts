import { describe, expect, it } from 'vitest';
import { buildService } from '@/__tests__/test-utils';
import servicesSample from '../../docs/api/samples/services.json';
import orphaned from '../../docs/api/samples/services-fields-without-relationship.json';
import type { JsonApiDocument } from './client';
import { labelServices, parseServices } from './services';

const asDocument = (sample: unknown) => sample as JsonApiDocument;

describe('parseServices', () => {
	it('joins each service to its deal', () => {
		const services = parseServices(asDocument(servicesSample));
		const named = services.filter((service) => service.name === 'Project management');

		expect(named).toHaveLength(5);
		expect(named.every((service) => service.dealName !== null)).toBe(true);
	});

	// This started as an assertion that the deal alone disambiguates. It failed - two distinct deals
	// are both named "Development" - which is why the default service uses the three-part label.
	it('disambiguates every service with Company - Project - Service', () => {
		const labelled = labelServices(parseServices(asDocument(servicesSample)));

		expect(labelled).toHaveLength(26);
		expect(new Set(labelled.map((entry) => entry.label)).size).toBe(labelled.length);
		expect(labelled.some((entry) => entry.label.includes('·'))).toBe(true);
	});

	it('neither name alone is unique, which is why all three parts are needed', () => {
		const services = parseServices(asDocument(servicesSample));

		expect(new Set(services.map((service) => service.name)).size).toBeLessThan(services.length);
		expect(new Set(services.map((service) => `${service.name}|${service.dealName ?? ''}`)).size).toBeLessThan(
			services.length
		);
	});

	it('appends the deal id only to labels that still collide, never to every row', () => {
		const collide = [
			buildService({ id: 's1', name: 'Design', dealName: 'Retainer', dealId: 'd1', companyName: 'Acme' }),
			buildService({ id: 's2', name: 'Design', dealName: 'Retainer', dealId: 'd2', companyName: 'Acme' }),
			buildService({ id: 's3', name: 'Build', dealName: 'Retainer', dealId: 'd3', companyName: 'Acme' }),
		];

		const labelled = labelServices(collide);

		expect(labelled[0]?.label).toBe('Acme · Retainer · Design (#d1)');
		expect(labelled[1]?.label).toBe('Acme · Retainer · Design (#d2)');
		expect(labelled[2]?.label).toBe('Acme · Retainer · Build');
	});

	it('reports no deal when the field list dropped the relationship, rather than guessing', () => {
		// Recorded with `fields[services]=name`: the deals still arrive in `included`, but nothing
		// points at them. Guessing from `included` here would silently mislabel every service.
		const services = parseServices(asDocument(orphaned));

		expect(services).not.toHaveLength(0);
		expect(services.every((service) => service.dealName === null)).toBe(true);
	});
});
