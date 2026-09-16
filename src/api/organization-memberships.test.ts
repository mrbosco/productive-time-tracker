import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import membershipsAllFields from '../../docs/api/samples/organization-memberships-all-fields.json';
import memberships from '../../docs/api/samples/organization-memberships-include-organization.json';
import unknownOrganization from '../../docs/api/samples/organization-memberships-unknown-organization.json';
import { server } from '../mocks/node';
import {
	findMembershipForOrganization,
	listOrganizationMemberships,
	parseOrganizationMemberships,
} from './organization-memberships';

const auth = { token: 'test-token', organizationId: '999999' };

/**
 * The recording account has one membership, so a token in several organizations is a shape its
 * responses cannot hold. The second membership is the recorded one with its IDs changed, which
 * keeps the envelope real while covering the case the assignment describes.
 */
const twoOrganizations = {
	...memberships,
	data: [
		{
			id: '2000001',
			type: 'organization_memberships',
			relationships: {
				organization: { data: { type: 'organizations', id: '555555' } },
				person: { data: { type: 'people', id: '2000002' } },
			},
		},
		...memberships.data,
	],
	included: [
		{ id: '555555', type: 'organizations', attributes: { name: 'Other Organization' } },
		{
			id: '2000002',
			type: 'people',
			attributes: { email: 'grace@example.com', first_name: 'Grace', last_name: 'Hopper' },
		},
		...memberships.included,
	],
};

describe('listOrganizationMemberships', () => {
	it('resolves the person behind the membership', async () => {
		const [membership] = await listOrganizationMemberships(auth);

		expect(membership?.personId).toBe('1448639');
		expect(membership?.person).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace' });
	});

	it('resolves the organization the membership belongs to', async () => {
		const [membership] = await listOrganizationMemberships(auth);

		expect(membership?.organizationId).toBe('999999');
		expect(membership?.organizationName).toBe('Example Organization');
	});

	it('asks for both relationships, without which the response carries no IDs at all', async () => {
		let params: URLSearchParams | undefined;
		server.use(
			http.get('*/organization_memberships', ({ request }) => {
				params = new URL(request.url).searchParams;

				return HttpResponse.json(membershipsAllFields);
			})
		);

		const [membership] = await listOrganizationMemberships(auth);

		expect(params?.get('include')).toBe('person,organization');
		// Served the unfielded recording, which has no `include`: the IDs are genuinely absent.
		expect(membership?.personId).toBeNull();
		expect(membership?.organizationId).toBeNull();
	});

	it('narrows the organization to its name, which keeps the record’s secrets out of the response', async () => {
		let params: URLSearchParams | undefined;
		server.use(
			http.get('*/organization_memberships', ({ request }) => {
				params = new URL(request.url).searchParams;

				return HttpResponse.json(memberships);
			})
		);

		await listOrganizationMemberships(auth);

		expect(params?.get('fields[organizations]')).toBe('name');
	});
});

describe('findMembershipForOrganization', () => {
	it('finds the membership for the organization that was entered', () => {
		const parsed = parseOrganizationMemberships(twoOrganizations);

		expect(findMembershipForOrganization(parsed, '555555')?.person?.firstName).toBe('Grace');
		expect(findMembershipForOrganization(parsed, '999999')?.person?.firstName).toBe('Ada');
	});

	it('finds nothing for an organization the token is not in', () => {
		// Recorded live against `X-Organization-Id: 1234`, which came back 200 with the token's own
		// memberships rather than 403 - see the row for this sample in `http-status-lines.txt`,
		// where the status and that header are the whole finding. The body is byte-identical to the
		// matching-organization recording, which is exactly the point: nothing in the response says
		// which organization was asked for, so this match is the only thing standing between a typo
		// and a session against the wrong organization.
		const parsed = parseOrganizationMemberships(unknownOrganization);

		expect(parsed).toHaveLength(1);
		expect(findMembershipForOrganization(parsed, '1234')).toBeUndefined();
	});

	it('never matches a membership whose organization was not requested', () => {
		// A null organization id means "not included", never "no organization" - matching one
		// against a null would sign someone in on the strength of a missing field.
		const parsed = parseOrganizationMemberships(membershipsAllFields);

		expect(parsed[0]?.organizationId).toBeNull();
		expect(findMembershipForOrganization(parsed, '999999')).toBeUndefined();
	});
});
