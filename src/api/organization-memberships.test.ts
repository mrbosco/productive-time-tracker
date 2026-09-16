import { describe, expect, it } from 'vitest';
import membershipsAllFields from '../../docs/api/samples/organization-memberships-all-fields.json';
import { server } from '../mocks/node';
import { http, HttpResponse } from 'msw';
import { listOrganizationMemberships } from './organization-memberships';

const auth = { token: 'test-token', organizationId: '999999' };

describe('listOrganizationMemberships', () => {
	it('resolves the person behind the membership', async () => {
		const [membership] = await listOrganizationMemberships(auth);

		expect(membership?.personId).toBe('1448639');
		expect(membership?.person).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace' });
	});

	it('asks for the person, without which the response carries no person id at all', async () => {
		let params: URLSearchParams | undefined;
		server.use(
			http.get('*/organization_memberships', ({ request }) => {
				params = new URL(request.url).searchParams;

				return HttpResponse.json(membershipsAllFields);
			})
		);

		const [membership] = await listOrganizationMemberships(auth);

		expect(params?.get('include')).toBe('person');
		// Served the unfielded recording, which has no `include`: the ID is genuinely absent.
		expect(membership?.personId).toBeNull();
		expect(membership?.person).toBeNull();
	});
});
