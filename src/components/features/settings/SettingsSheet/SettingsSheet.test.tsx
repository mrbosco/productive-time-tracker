import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import services from '../../../../../docs/api/samples/services.json';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { readSession } from '@/lib/storage';
import { server } from '@/mocks/node';
import { SettingsSheet } from './SettingsSheet';

/** Controlled by its caller in the app, so the test supplies the same control. */
function OpenSheet() {
	const [open, setOpen] = useState(true);

	return <SettingsSheet session={testSession} open={open} onOpenChange={setOpen} />;
}

function renderSheet() {
	return renderWithProviders(<OpenSheet />, { session: testSession });
}

/** `Administrative work` in `docs/api/samples/services.json`. */
const ADMINISTRATIVE_WORK_ID = '16887826';

describe('SettingsSheet', () => {
	it('remembers the chosen service for the next entry', async () => {
		const user = userEvent.setup();
		await renderSheet();

		await user.click(await screen.findByRole('button', { name: /Administrative work/ }));

		await waitFor(() => {
			// The id it stored, not merely that it stored something: storing the wrong service is
			// what this is here to catch.
			expect(readSession()?.defaultServiceId).toBe(ADMINISTRATIVE_WORK_ID);
		});
	});

	/**
	 * This must not read like an empty account: one is worth retrying and the other is a fact about
	 * the organization.
	 */
	it('reports a failed load as a failure, not as an empty account', async () => {
		server.use(http.get('*/services', () => new HttpResponse(null, { status: 500 })));
		await renderSheet();

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not load services.');
		expect(screen.queryByText(/No services are assigned/)).not.toBeInTheDocument();
	});

	it('explains an organization that tracks nothing, rather than showing an empty list', async () => {
		// The recorded envelope with no rows in it: an empty collection is a state the endpoint
		// can be in, and reusing the real shape keeps the parser on the same path.
		server.use(http.get('*/services', () => HttpResponse.json({ ...services, data: [], included: [] })));
		await renderSheet();

		expect(await screen.findByText(/No services are assigned to you/)).toBeInTheDocument();
		expect(screen.queryByRole('combobox', { name: 'Search services' })).not.toBeInTheDocument();
	});
});
