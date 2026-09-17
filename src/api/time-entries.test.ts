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

describe('reading a time entry', () => {
	/**
	 * The readers this replaced turned a missing `time` into `0`, so a wire change arrived as a
	 * duration of `0h` sitting among real ones - wrong, and indistinguishable from a genuinely empty
	 * entry. Validating the four attributes the app actually reads makes that an error instead.
	 */
	it('refuses an entry whose duration is not a number', async () => {
		server.use(
			http.get('*/time_entries', () =>
				HttpResponse.json({
					data: [{ id: '1', type: 'time_entries', attributes: { date: '2026-09-15', time: '90' } }],
					meta: { current_page: 1, total_pages: 1 },
				})
			)
		);

		await expect(listTimeEntries(auth, '1448639', '2026-09-15')).rejects.toThrow(/unexpected shape/);
	});

	/** `0` is a real duration - a running timer's entry starts there - and `note` is genuinely
	 * nullable, so neither may be rejected. */
	it('accepts a zero-minute entry with no note', async () => {
		server.use(
			http.get('*/time_entries', () =>
				HttpResponse.json({
					data: [{ id: '1', type: 'time_entries', attributes: { date: '2026-09-15', time: 0, note: null } }],
					meta: { current_page: 1, total_pages: 1 },
				})
			)
		);

		const [entry] = await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(entry?.minutes).toBe(0);
		expect(entry?.note).toBeNull();
	});
});

describe('listTimeEntries', () => {
	it('never sends sort, which this endpoint rejects for anything but date', async () => {
		const seen = captureQuery('/time_entries');

		await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(seen.params?.has('sort')).toBe(false);
	});

	/**
	 * The sparse fieldsets are the efficiency claim, not decoration: asking for the fields actually
	 * rendered is what keeps a day of entries to a fraction of the full record. `fields` also governs
	 * relationships, so every step of the include chain has to be named on the step above it - drop
	 * one and the linkage silently vanishes while the included records stay, orphaned.
	 */
	it('narrows every level of the include chain, not just the entries', async () => {
		const seen = captureQuery('/time_entries');

		await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(seen.params?.get('fields[time_entries]')).toContain('service');
		expect(seen.params?.get('fields[services]')).toContain('deal');
		expect(seen.params?.get('fields[deals]')).toContain('company');
		expect(seen.params?.get('include')).toContain('service.deal.company');
		// The cap the API documents; asking for more is a 400 and asking for none pages at 30.
		expect(seen.params?.get('page[size]')).toBe('200');
	});

	/**
	 * Newest first: the top of the list is where a day is read and written, so the entry just logged
	 * belongs there rather than below everything already on the screen.
	 */
	it('orders a day by created_at descending client-side', async () => {
		const entries = await listTimeEntries(auth, '1448639', '2026-09-15');

		expect(entries.map((entry) => entry.id)).toEqual(['163073474', '162921848', '162903873']);
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
});
