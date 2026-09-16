import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderHookWithProviders, waitFor } from '@/__tests__/test-utils';
import type { Session } from '@/lib/storage';
import { server } from '@/mocks/node';
import { useDefaultService } from './useDefaultService';

const session: Session = {
	token: 'test-token',
	organizationId: '999999',
	personId: '1448639',
	personName: 'Ada Lovelace',
};

function renderDefaultService(current: Session = session) {
	return renderHookWithProviders(() => useDefaultService(current));
}

describe('useDefaultService', () => {
	it('is pending until the services arrive', () => {
		const { result } = renderDefaultService();

		expect(result.current.isPending).toBe(true);
		expect(result.current.service).toBeNull();
	});

	it('falls back to the first service by name', async () => {
		const { result } = renderDefaultService();

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});
		expect(result.current.service?.name).toBe('Acquiring new clients');
		expect(result.current.label).toBe('Example Agency · Administration · Acquiring new clients');
	});

	it('prefers the service the person chose', async () => {
		const { result } = renderDefaultService({ ...session, defaultServiceId: '16887826' });

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});
		expect(result.current.service?.name).toBe('Administrative work');
	});

	it('falls back to the first service when the chosen one is gone', async () => {
		const { result } = renderDefaultService({ ...session, defaultServiceId: 'removed' });

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});
		expect(result.current.service?.name).toBe('Acquiring new clients');
	});

	it('reports a failure to load as an error, not as an empty list', async () => {
		server.use(http.get('*/services', () => HttpResponse.error()));
		const { result } = renderDefaultService();

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});
		expect(result.current.service).toBeNull();
	});
});
