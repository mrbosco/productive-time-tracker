import { describe, expect, it } from 'vitest';
import servicesSample from '../../docs/api/samples/services.json';
import orphaned from '../../docs/api/samples/services-fields-without-relationship.json';
import type { JsonApiDocument } from './client';
import { parseServices } from './services';

const asDocument = (sample: unknown) => sample as JsonApiDocument;

describe('parseServices', () => {
	it('joins each service to its deal', () => {
		const services = parseServices(asDocument(servicesSample));
		const named = services.filter((service) => service.name === 'Project management');

		expect(named).toHaveLength(5);
		expect(named.every((service) => service.dealName !== null)).toBe(true);
	});

	it('does not make the label unique, because deal names duplicate too', () => {
		// Two distinct deals are both called "Development", so "Project management — Development"
		// appears twice. The selector must key on service id and cannot present the label as unique.
		const services = parseServices(asDocument(servicesSample));
		const labels = services.map((service) => `${service.name} — ${service.dealName ?? ''}`);

		expect(new Set(labels).size).toBeLessThan(labels.length);
	});

	it('reports no deal when the field list dropped the relationship, rather than guessing', () => {
		// Recorded with `fields[services]=name`: the deals still arrive in `included`, but nothing
		// points at them. Guessing from `included` here would silently mislabel every service.
		const services = parseServices(asDocument(orphaned));

		expect(services).not.toHaveLength(0);
		expect(services.every((service) => service.dealName === null)).toBe(true);
	});
});
