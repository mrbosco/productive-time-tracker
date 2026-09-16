import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import error422 from '../../../../../docs/api/samples/error-422-missing-service.json';
import services from '../../../../../docs/api/samples/services.json';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { TimeEntryForm } from './TimeEntryForm';

const DATE = '2026-09-15';

function renderForm(date = DATE) {
	return renderWithProviders(<TimeEntryForm session={testSession} date={date} />, {
		session: testSession,
		initialEntry: `/entries/new?date=${date}`,
	});
}

/** The service resolves from the prefetched list, and Save stays disabled until it has. */
async function saveButton() {
	const save = await screen.findByRole('button', { name: 'Save entry' });
	await waitFor(() => {
		expect(save).toBeEnabled();
	});

	return save;
}

describe('TimeEntryForm', () => {
	it('opens on the date the route was given (A-5)', async () => {
		await renderForm();

		expect(await screen.findByRole('button', { name: /Date Tue 15 Sep 2026/ })).toBeInTheDocument();
	});

	it('names the person and the service the entry will be logged against (A-1, R-10)', async () => {
		await renderForm();

		expect(screen.getByText(/Logging as Ada Lovelace/)).toBeInTheDocument();
		expect(await screen.findByRole('button', { name: /Acquiring new clients/ })).toBeInTheDocument();
	});

	/** The design is explicit: errors show on submit, not while typing. */
	it('says nothing is wrong until Save is pressed', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), 'half a day');

		expect(screen.queryByText(/Enter a duration like/)).not.toBeInTheDocument();
		expect(screen.getByText('Accepts 1h 30m, 1:30, 1.5h or 90')).toBeInTheDocument();
	});

	it.each([
		['', 'Duration is required.'],
		['half a day', 'Enter a duration like 1h 30m, 1:30, 1.5h or 90.'],
		['0', 'Duration must be more than 0.'],
		['25h', 'Duration cannot be more than 24h.'],
	])('rejects %s on submit with %s', async (typed, message) => {
		const user = userEvent.setup();
		await renderForm();

		if (typed !== '') await user.type(screen.getByRole('textbox', { name: 'Duration' }), typed);
		await user.click(await saveButton());

		expect(await screen.findByText(message)).toBeInTheDocument();
	});

	/**
	 * The error takes the caption's place rather than adding a line under it, so nothing below the
	 * field moves when a save is rejected.
	 */
	it('replaces the helper caption with the error rather than adding a line', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.click(await saveButton());

		expect(await screen.findByText('Duration is required.')).toBeInTheDocument();
		expect(screen.queryByText('Accepts 1h 30m, 1:30, 1.5h or 90')).not.toBeInTheDocument();
	});

	it('marks the rejected field for assistive technology, not just in colour', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.click(await saveButton());

		await waitFor(() => {
			expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveAttribute('aria-invalid', 'true');
		});
	});

	/** The only confirmation that `1.5h` was read as intended before the entry is saved (A-2). */
	it.each([
		['1.5h', '= 1h 30m'],
		['1:30', '= 1h 30m'],
		['90', '= 1h 30m'],
		['45m', '= 45m'],
	])('previews %s as %s while typing', async (typed, preview) => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), typed);

		expect(await screen.findByText(preview)).toBeInTheDocument();
	});

	it('shows no preview while the value cannot be read', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), 'half');

		expect(screen.queryByText(/^= /)).not.toBeInTheDocument();
	});

	it('saves the entry and returns to the day it belongs to (R-9)', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 30m');
		await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Mapped the payload');
		await user.click(await saveButton());

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
	});

	/** The confirmation is handed to the screen it returns to, because this one is leaving. */
	it('hands the day view the confirmation to show', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '30m');
		await user.click(await saveButton());

		await waitFor(() => {
			expect(router.state.location.state.toast).toBe('Entry saved');
		});
	});

	it('leaves the form open and keeps every value when the save fails', async () => {
		server.use(http.post('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h');
		await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Worth keeping');
		await user.click(await saveButton());

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the entry. Try again.');
		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Worth keeping');
		expect(router.state.location.pathname).not.toBe(`/day/${DATE}`);
	});

	/**
	 * A-1b. The refused service is not a field on this form, so saying it was refused is not
	 * enough - the one screen that can change it is opened too.
	 */
	it('opens the default-service sheet when Productive refuses the service (A-1b)', async () => {
		server.use(http.post('*/time_entries', () => HttpResponse.json(error422, { status: 422 })));
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h');
		await user.click(await saveButton());

		// The sheet is a modal, so while it is open Radix hides the form behind it from assistive
		// technology - the banner included. It is read on the way back out, which is the order the
		// person meets them in too.
		expect(await screen.findByRole('dialog', { name: 'Default service' })).toBeInTheDocument();

		await user.keyboard('{Escape}');

		expect(await screen.findByRole('alert')).toHaveTextContent('person cannot track on this service');
	});

	/**
	 * A-1 and R-9. Without this the form is simply dead: Save is disabled because no service
	 * resolved, and a disabled button cannot be focused, so there is no way to reach the reason.
	 */
	it('says why it cannot save when the service list will not load', async () => {
		server.use(http.get('*/services', () => new HttpResponse(null, { status: 500 })));
		await renderForm();

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the service list');
		expect(screen.getByRole('button', { name: 'Save entry' })).toBeDisabled();
	});

	/** A-1 again: an organization that tracks nothing must not read like a failed request. */
	it('distinguishes an organization with no trackable services from a failed load', async () => {
		server.use(http.get('*/services', () => HttpResponse.json({ ...services, data: [], included: [] })));
		await renderForm();

		expect(await screen.findByRole('alert')).toHaveTextContent('no services with time tracking enabled');
	});

	/** The preview is the confirmation that `1.5h` was read as ninety minutes - for everyone. */
	it('lets the duration field carry its preview to assistive technology', async () => {
		const user = userEvent.setup();
		await renderForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.type(duration, '1.5h');

		expect(duration).toHaveAccessibleDescription(/= 1h 30m/);
	});

	it('returns to the day without saving when cancelled', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
		expect(router.state.location.state.toast).toBeUndefined();
	});

	/**
	 * Improvements 10. The prompt is the whole point of the change, but so is its absence: a
	 * dialog nobody typed in must still close on the first try, or the warning becomes noise
	 * people click through without reading.
	 */
	it('closes an untouched form without asking anything', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
		expect(screen.queryByRole('dialog', { name: 'Save your changes?' })).not.toBeInTheDocument();
	});

	it.each([
		['Cancel', 'Cancel'],
		['the close icon', 'Close'],
	])('asks before %s throws away what was typed', async (_name, button) => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.click(screen.getByRole('button', { name: button }));

		expect(await screen.findByRole('dialog', { name: 'Save your changes?' })).toBeInTheDocument();
		expect(router.state.location.pathname).not.toBe(`/day/${DATE}`);
	});

	it('asks before Escape throws away what was typed', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.keyboard('{Escape}');

		expect(await screen.findByRole('dialog', { name: 'Save your changes?' })).toBeInTheDocument();
	});

	/** The prompt names the work rather than asking in the abstract. */
	it('names what would be lost', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Paired on the parser');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		const prompt = await screen.findByRole('dialog', { name: 'Save your changes?' });

		expect(prompt).toHaveTextContent('1h 45m and a description would be lost.');
	});

	it('returns to the form, still filled, on Continue editing', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));
		await user.click(await screen.findByRole('button', { name: 'Continue editing' }));

		await waitFor(() => {
			expect(screen.queryByRole('dialog', { name: 'Save your changes?' })).not.toBeInTheDocument();
		});
		expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h 45m');
		expect(router.state.location.pathname).not.toBe(`/day/${DATE}`);
	});

	/** Enter on a prompt you did not mean to summon must not be the thing that loses the draft. */
	it('gives the safe choice focus, not the one that discards', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Continue editing' })).toHaveFocus();
		});
	});

	it('leaves on Discard changes', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));
		await user.click(await screen.findByRole('button', { name: 'Discard changes' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
	});

	it('does not ask on the way out of a successful save', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '30m');
		await user.click(await saveButton());

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
		expect(screen.queryByRole('dialog', { name: 'Save your changes?' })).not.toBeInTheDocument();
	});

	it('closes on Escape, because it is a modal (guidebook 18)', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.keyboard('{Escape}');

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
	});
});
