import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import error400Sort from '../../docs/api/samples/error-400-sort-unsupported.json';
import error401 from '../../docs/api/samples/error-401.json';
import error403 from '../../docs/api/samples/error-403.json';
import error404 from '../../docs/api/samples/error-404.json';
import error422 from '../../docs/api/samples/error-422-missing-service.json';
import membershipsBare from '../../docs/api/samples/organization-memberships.json';
import membershipsWithPerson from '../../docs/api/samples/organization-memberships-include-person.json';
import timeEntriesDay from '../../docs/api/samples/time-entries-day.json';
import timeEntriesEmptyDay from '../../docs/api/samples/time-entries-empty-day.json';
import { server } from '../mocks/node';
import { ApiError, type JsonApiDocument, readPageMeta, request, toApiError } from './client';
import { parseOrganizationMemberships } from './organization-memberships';
import { parseTimeEntries } from './time-entries';

const auth = { token: 'test-token', organizationId: '999999' };
const asDocument = (sample: unknown) => sample as JsonApiDocument;

describe('JSON:API parsing', () => {
	it('resolves a to-one relationship out of included', () => {
		const entries = parseTimeEntries(asDocument(timeEntriesDay));

		expect(entries).toHaveLength(3);
		// The day list includes services with only `name`, so the deal fields are absent here by
		// design - the selector's fuller shape comes from /services (A-1).
		expect(entries[0]?.service).toMatchObject({ id: '16887825', name: 'Acquiring new clients' });
		expect(entries[0]?.service?.dealName).toBeNull();
	});

	it('keeps a note that arrived as rich-text HTML intact for the renderer to strip (A-9)', () => {
		const entry = parseTimeEntries(asDocument(timeEntriesDay)).find((candidate) => candidate.id === '162903873');

		expect(entry?.note).toBe('<ul><li><p>Probavam</p></li></ul>');
	});

	it('preserves a zero-minute entry rather than treating it as missing (A-8)', () => {
		const entry = parseTimeEntries(asDocument(timeEntriesDay)).find((candidate) => candidate.id === '162921848');

		expect(entry?.minutes).toBe(0);
		expect(entry?.note).toBeNull();
	});

	it('reads draft from the API flag, which a zero-minute entry does not imply (A-8)', () => {
		const entries = parseTimeEntries(asDocument(timeEntriesDay));
		const zeroMinute = entries.find((candidate) => candidate.id === '162921848');

		expect(zeroMinute?.minutes).toBe(0);
		expect(zeroMinute?.draft).toBe(false);
		expect(entries.every((entry) => entry.draft === false)).toBe(true);
	});

	it('reads the person out of a membership fetched with include=person', () => {
		const [membership] = parseOrganizationMemberships(asDocument(membershipsWithPerson));

		expect(membership?.personId).toBe('1448639');
		expect(membership?.person?.firstName).toBe('Ada');
	});

	it('reports no person id when the relationship was not included, instead of inventing one', () => {
		const [membership] = parseOrganizationMemberships(asDocument(membershipsBare));

		expect(membership?.personId).toBeNull();
		expect(membership?.person).toBeNull();
	});

	it('reads an empty collection as zero total pages', () => {
		expect(readPageMeta(asDocument(timeEntriesEmptyDay))).toMatchObject({ total_pages: 0, total_count: 0 });
	});
});

describe('error mapping', () => {
	it.each([
		['a bad token', 401, error401, 'invalid_auth_token'],
		['a token with no person in the organization', 403, error403, 'no_person'],
		['an unknown record', 404, error404, 'record_not_found'],
		['a service the person cannot track', 422, error422, 'invalid_attribute_value'],
	])('maps %s to ApiError', (_label, status, body, code) => {
		const error = toApiError(status, body);

		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(status);
		expect(error.code).toBe(code);
		expect(error.message).toBe(body.errors[0].detail);
	});

	it('falls back to a usable message when the body carries no errors array', () => {
		const error = toApiError(500, { nonsense: true });

		expect(error.code).toBeNull();
		expect(error.message).toContain('500');
	});

	it('takes the status from the transport, not from the slug the payload carries', () => {
		// This body says "unprocessable_content" while the response was HTTP 400.
		expect(toApiError(400, error400Sort).status).toBe(400);
		expect(toApiError(400, error400Sort).code).toBe('sort_param_unsupported');
	});

	it('keeps source.pointer exactly as sent, which means without a leading slash', () => {
		expect(toApiError(422, error422).errors[0]?.pointer).toBe('data/attributes/person');
	});

	it('throws ApiError rather than a SyntaxError when the body is not JSON', async () => {
		server.use(http.get('*/broken', () => new HttpResponse('<html>gateway</html>', { status: 502 })));

		await expect(request(auth, '/broken')).rejects.toBeInstanceOf(ApiError);
	});

	it('throws ApiError rather than a TypeError when the request never lands', async () => {
		server.use(http.get('*/offline', () => HttpResponse.error()));

		await expect(request(auth, '/offline')).rejects.toMatchObject({ name: 'ApiError', status: 0 });
	});
});

describe('request', () => {
	it('sends both credential headers and the JSON:API accept type', async () => {
		let seen: Headers | undefined;
		server.use(
			http.get('*/echo', ({ request: received }) => {
				seen = received.headers;

				return HttpResponse.json({ data: [] });
			})
		);

		await request(auth, '/echo');

		expect(seen?.get('X-Auth-Token')).toBe('test-token');
		expect(seen?.get('X-Organization-Id')).toBe('999999');
		expect(seen?.get('Accept')).toBe('application/vnd.api+json');
	});

	it('resolves 204 to null instead of trying to parse an empty body', async () => {
		server.use(http.delete('*/gone', () => new HttpResponse(null, { status: 204 })));

		await expect(request(auth, '/gone', { method: 'DELETE' })).resolves.toBeNull();
	});
});
