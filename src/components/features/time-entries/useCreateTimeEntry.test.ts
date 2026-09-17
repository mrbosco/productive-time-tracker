import { describe, expect, it, vi } from 'vitest';
import { renderHookWithProviders, testSession } from '@/__tests__/test-utils';
import { useCreateTimeEntry } from './useCreateTimeEntry';

const DATE = '2026-09-17';

describe('useCreateTimeEntry', () => {
	it('sends the logged-in person rather than anything typed', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const { result } = renderHookWithProviders(() => useCreateTimeEntry(testSession));

		await result.current.mutateAsync({ date: DATE, minutes: 90, note: 'Pairing', serviceId: '16887825' });

		const [, init] = fetchSpy.mock.calls.at(-1) ?? [];
		const body = JSON.parse(init?.body as string) as {
			data: { relationships: { person: { data: { id: string } } } };
		};

		expect(body.data.relationships.person.data.id).toBe(testSession.personId);
	});
});
