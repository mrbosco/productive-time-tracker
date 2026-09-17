import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import services from '../../../../../docs/api/samples/services.json';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { readSession } from '@/lib/storage';
import { SettingsSheet } from './SettingsSheet';

/** Controlled by its caller in the app, so the test supplies the same control. */
function OpenSheet() {
	const [open, setOpen] = useState(true);

	return <SettingsSheet session={testSession} open={open} onOpenChange={setOpen} />;
}

function renderSheet() {
	return renderWithProviders(<OpenSheet />, { session: testSession });
}

describe('SettingsSheet', () => {
	it('lists the services as Company · Project · Service (A-1)', async () => {
		await renderSheet();

		const select = await screen.findByRole('combobox', { name: 'Default service' });

		expect(select).toHaveDisplayValue('Example Companie · Internal project [SAMPLE] · Acquiring new clients');
	});

	it('says what the choice is for', async () => {
		await renderSheet();

		expect(await screen.findByText('Used for new entries and the timer.')).toBeInTheDocument();
	});

	it('remembers the chosen service for the next entry', async () => {
		const user = userEvent.setup();
		await renderSheet();

		const select = await screen.findByRole('combobox', { name: 'Default service' });
		await user.selectOptions(select, screen.getByRole('option', { name: /Administrative work/ }));

		await waitFor(() => {
			expect(readSession()?.defaultServiceId).toBeDefined();
		});
		expect(readSession()?.defaultServiceId).not.toBe('');
	});

	it('closes once a service is chosen, having nothing left to confirm', async () => {
		const user = userEvent.setup();
		await renderSheet();

		const select = await screen.findByRole('combobox', { name: 'Default service' });
		await user.selectOptions(select, screen.getByRole('option', { name: /Administrative work/ }));

		await waitFor(() => {
			expect(screen.queryByRole('dialog', { name: 'Default service' })).not.toBeInTheDocument();
		});
	});

	it('says it is loading before the list arrives', async () => {
		await renderSheet();

		expect(screen.getByText('Loading services…')).toBeInTheDocument();
	});

	/**
	 * A-1 is explicit that this must not read like an empty account: one is worth retrying and the
	 * other is a fact about the organization.
	 */
	it('reports a failed load as a failure, not as an empty account', async () => {
		server.use(http.get('*/services', () => new HttpResponse(null, { status: 500 })));
		await renderSheet();

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the service list');
		expect(screen.queryByText(/has no services/)).not.toBeInTheDocument();
	});

	it('explains an organization that tracks nothing, rather than showing an empty select', async () => {
		// The recorded envelope with no rows in it: an empty collection is a state the endpoint
		// can be in, and reusing the real shape keeps the parser on the same path.
		server.use(http.get('*/services', () => HttpResponse.json({ ...services, data: [], included: [] })));
		await renderSheet();

		expect(await screen.findByText(/no services with time tracking enabled/)).toBeInTheDocument();
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
	});
});
