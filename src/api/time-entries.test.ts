import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import timeEntriesEmptyDay from '../../docs/api/samples/time-entries-empty-day.json';
import timeEntriesPaged from '../../docs/api/samples/time-entries-page-size.json';
import timeEntryCreate from '../../docs/api/samples/time-entry-create.json';
import timeEntryUpdate from '../../docs/api/samples/time-entry-update.json';
import { server } from '../mocks/node';
import { createTimeEntry, deleteTimeEntry, getTimeEntry, listTimeEntries, updateTimeEntry } from './time-entries';

const auth = { token: 'test-token', organizationId: '999999' };

function captureQuery(path: string) {
	const seen: { params?: URLSearchParams } = {};
	server.use(
		http.get(`*${path}`, ({ request }) => {
			seen.params = new URL(request.url).searchParams;

			return HttpResponse.json(timeEntriesEmptyDay);
		})
	);

	return seen;
}

describe('listTimeEntries', () => {
	it('asks for one inclusive day, the service, and an explicit page size (SPEC 4.2)', async () => {
		const seen = captureQuery('/time_entries');

		await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(seen.params?.get('filter[person_id]')).toBe('1448639');
		expect(seen.params?.get('filter[after]')).toBe('2026-09-15');
		expect(seen.params?.get('filter[before]')).toBe('2026-09-15');
		expect(seen.params?.get('include')).toBe('service');
		expect(seen.params?.get('page[size]')).toBe('200');
	});

	it('narrows the payload with sparse fieldsets rather than pulling all ~45 attributes', async () => {
		const seen = captureQuery('/time_entries');

		await listTimeEntries(auth, '1448639', '2026-09-15');

		// Set membership rather than the exact string: reordering the list is behaviour-preserving.
		// `service` must be in it or the relationship linkage is dropped along with the attributes.
		expect(seen.params?.get('fields[time_entries]')?.split(',')).toEqual(
			expect.arrayContaining(['date', 'time', 'note', 'created_at', 'service'])
		);
		expect(seen.params?.get('fields[services]')?.split(',')).toContain('name');
	});

	it('never sends sort, which this endpoint rejects for anything but date', async () => {
		const seen = captureQuery('/time_entries');

		await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(seen.params?.has('sort')).toBe(false);
	});

	it('orders a day by created_at ascending client-side (A-7)', async () => {
		const entries = await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(entries.map((entry) => entry.id)).toEqual(['162903873', '162921848', '162921872']);
	});

	it('issues exactly one request for a day with no entries', async () => {
		let calls = 0;
		server.use(
			http.get('*/time_entries', () => {
				calls += 1;

				return HttpResponse.json({ data: [], meta: { current_page: 1, total_pages: 0, total_count: 0 } });
			})
		);

		await listTimeEntries(auth, '1448639', '2026-09-02');

		expect(calls).toBe(1);
	});

	it('follows meta.total_pages when a day spills over', async () => {
		// A real paged response: `page[size]=1` over the same three entries, so total_pages is 3.
		server.use(
			http.get('*/time_entries', ({ request }) => {
				const number = Number(new URL(request.url).searchParams.get('page[number]') ?? '1');
				const entry = timeEntriesPaged.data[0];

				return HttpResponse.json({
					data: number <= timeEntriesPaged.meta.total_pages ? [{ ...entry, id: String(number) }] : [],
					meta: { ...timeEntriesPaged.meta, current_page: number },
				});
			})
		);

		await expect(listTimeEntries(auth, '1448639', '2026-09-15')).resolves.toHaveLength(3);
	});
});

describe('mutations', () => {
	it('sends a JSON:API create body with both required relationships', async () => {
		let body: unknown;
		server.use(
			http.post('*/time_entries', async ({ request }) => {
				body = await request.json();

				return HttpResponse.json(timeEntryCreate, { status: 201 });
			})
		);

		await createTimeEntry(auth, {
			date: '2026-09-16',
			minutes: 30,
			note: 'x',
			personId: '1448639',
			serviceId: '16887825',
		});

		expect(body).toMatchObject({
			data: {
				type: 'time_entries',
				attributes: { date: '2026-09-16', time: 30, note: 'x' },
				relationships: {
					person: { data: { type: 'people', id: '1448639' } },
					service: { data: { type: 'services', id: '16887825' } },
				},
			},
		});
	});

	it('patches only the fields that were supplied', async () => {
		let body: { data?: { attributes?: Record<string, unknown> } } | undefined;
		server.use(
			http.patch('*/time_entries/:id', async ({ request }) => {
				body = (await request.json()) as typeof body;

				return HttpResponse.json(timeEntryUpdate);
			})
		);

		await updateTimeEntry(auth, '163007266', { minutes: 45 });

		expect(body?.data?.attributes).toEqual({ time: 45 });
	});

	it('resolves delete on a 204 with no body', async () => {
		await expect(deleteTimeEntry(auth, '163007266')).resolves.toBeUndefined();
	});

	it('surfaces the recorded 404 when an entry is gone', async () => {
		await expect(getTimeEntry(auth, '999999999')).rejects.toMatchObject({ status: 404, code: 'record_not_found' });
	});

	it('can deep-link every entry the seeded day list shows', async () => {
		const listed = await listTimeEntries(auth, '1448639', '2026-09-15');

		await expect(Promise.all(listed.map((entry) => getTimeEntry(auth, entry.id)))).resolves.toHaveLength(3);
	});
});
