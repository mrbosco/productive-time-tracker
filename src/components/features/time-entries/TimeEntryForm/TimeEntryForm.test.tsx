import { http, HttpResponse } from 'msw';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import error404 from '../../../../../docs/api/samples/error-404.json';
import error422 from '../../../../../docs/api/samples/error-422-missing-service.json';
import services from '../../../../../docs/api/samples/services.json';
import type { TimeEntry } from '@/api/types';
import {
	act,
	buildService,
	renderWithProviders,
	screen,
	testSession,
	userEvent,
	waitFor,
} from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { TimeEntryForm } from './TimeEntryForm';

const DATE = '2026-09-15';

/** An entry as the edit route's loader hands it over: already parsed, service included. */
function buildEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: '162903873',
		date: DATE,
		minutes: 90,
		note: '<p>Standup and time logging.</p>',
		draft: false,
		// Deliberately not the default (`Acquiring new clients` sorts first): the point of the service
		// line on this form is that it shows the entry's own, whatever the default happens to be.
		serviceId: '16887840',
		// Matching the recording: this deal was never filed under a project, which is what makes
		// the label fall back to the deal name.
		service: buildService({
			id: '16887840',
			name: 'Android Development',
			dealName: 'Example Deal',
			dealId: '4287350',
			companyName: 'Example Companie',
			companyId: '1523286',
			clientName: 'Example Companie',
			clientId: '1523286',
		}),
		createdAt: '2026-09-15T16:08:26.527+02:00',
		...overrides,
	};
}

/** What `labelServices` makes of the entry's service, and of the default it must not be confused with. */
const ENTRY_SERVICE_LABEL = 'Example Companie · Example Deal · Android Development';
const DEFAULT_SERVICE_LABEL = 'Example Companie · Internal project [SAMPLE] · Acquiring new clients';

/**
 * The edit form with a way to hand it a newer copy of the same entry, which is what the route does
 * when the loader resolves after the first render.
 *
 * Driven through a ref rather than a button: `rerender` would replace the element
 * `renderWithProviders` wrapped, providers and all, and a control outside the dialog cannot be
 * clicked because Radix sets `pointer-events: none` on everything behind it.
 */
function ReseedingForm({ onReady }: { onReady: (deliver: () => void) => void }) {
	const [entry, setEntry] = useState(buildEntry());

	useEffect(() => {
		onReady(() => {
			setEntry(buildEntry({ minutes: 135 }));
		});
	}, [onReady]);

	return <TimeEntryForm session={testSession} date={entry.date} entry={entry} />;
}

/** Renders the harness and hands back the way to deliver the fresher entry. */
async function renderReseedingForm() {
	let deliver = () => undefined as void;
	const captureDeliver = (next: () => void) => {
		deliver = next;
	};

	await renderWithProviders(<ReseedingForm onReady={captureDeliver} />, { session: testSession });

	return () => {
		act(deliver);
	};
}

function renderEditForm(entry = buildEntry()) {
	return renderWithProviders(<TimeEntryForm session={testSession} date={entry.date} entry={entry} />, {
		session: testSession,
		initialEntry: `/entries/${entry.id}/edit`,
	});
}

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
	it('leaves the form open and keeps every value when the save fails', async () => {
		server.use(http.post('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h');
		await user.click(await saveButton());

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the entry. Try again.');
		expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h');
		expect(router.state.location.pathname).not.toBe(`/day/${DATE}`);
	});

	/**
	 * The refused service is not a field on this form, so saying it was refused is not enough - the
	 * one screen that can change it is opened too.
	 */
	it('opens the default-service sheet when Productive refuses the service', async () => {
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
	 * Without this the form is simply dead: Save is disabled because no service resolved, and a
	 * disabled button cannot be focused, so there is no way to reach the reason.
	 */
	it('says why it cannot save when the service list will not load', async () => {
		server.use(http.get('*/services', () => new HttpResponse(null, { status: 500 })));
		await renderForm();

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the service list');
		expect(screen.getByRole('button', { name: 'Save entry' })).toBeDisabled();
	});

	/** An organization that tracks nothing must not read like a failed request. */
	it('distinguishes an organization with no trackable services from a failed load', async () => {
		server.use(http.get('*/services', () => HttpResponse.json({ ...services, data: [], included: [] })));
		await renderForm();

		expect(await screen.findByRole('alert')).toHaveTextContent('no services with time tracking enabled');
	});

	/**
	 * The prompt names the work rather than asking in the abstract. Every wording permutation is
	 * covered against `summariseUnsavedEntry` in the utils test; this asserts the sentence is
	 * actually built from it, and that the answer it offers is honoured.
	 */
	it('asks before Cancel throws away what was typed, names it, and leaves on Discard changes', async () => {
		const user = userEvent.setup();
		const { router } = await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		const prompt = await screen.findByRole('dialog', { name: 'Save your changes?' });
		expect(prompt).toHaveTextContent('1h 45m would be lost.');
		expect(router.state.location.pathname).not.toBe(`/day/${DATE}`);

		await user.click(screen.getByRole('button', { name: 'Discard changes' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
	});

	/**
	 * The prompt is the whole point of the change, but so is its absence: a dialog nobody typed in
	 * must still close on the first try, or the warning becomes noise people click through.
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
});

/**
 * Only `time` is ever stored, so what is tested here is the arithmetic in front of the swap - that
 * the minutes reaching the API are the same whichever way they were entered, and that the wire never
 * learns which mode produced them.
 */
describe('TimeEntryForm in range mode', () => {
	it('sends the computed minutes and nothing about the range', async () => {
		const bodies: unknown[] = [];
		server.use(
			http.post('*/time_entries', async ({ request }) => {
				bodies.push(await request.json());

				return HttpResponse.json({ data: { id: '1', type: 'time_entries', attributes: {} } }, { status: 201 });
			})
		);
		const user = userEvent.setup();
		await renderForm();
		await user.click(await screen.findByRole('button', { name: 'Enter start and end instead' }));

		await user.type(screen.getByLabelText('From'), '09:00');
		await user.type(screen.getByLabelText('To'), '10:30');
		await user.click(await saveButton());

		await waitFor(() => {
			expect(bodies).toHaveLength(1);
		});
		expect(bodies[0]).toMatchObject({ data: { attributes: { date: DATE, time: 90 } } });
	});
});

/**
 * The same component, so only the differences are worth asserting here: where the values start, what
 * goes on the wire, and the two things editing deliberately does not do - wait on a service, or
 * offer to change one.
 */
describe('TimeEntryForm, editing an entry', () => {
	it('opens prefilled with the entry own values, and says it is editing', async () => {
		await renderEditForm();

		expect(await screen.findByRole('heading', { name: 'Edit entry' })).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h 30m');
		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Standup and time logging.');
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
	});

	/**
	 * Edit keeps the entry's existing service. It is the entry's own, not the default - and it is
	 * text, because the sheet behind the New entry form's link decides what the *next* entry gets and
	 * would open showing a different service selected than the line just clicked.
	 */
	it('names the entry own service, not the default, and does not offer to change it', async () => {
		await renderEditForm();

		expect(screen.getByText(/Logging as Ada Lovelace/)).toBeInTheDocument();
		// The full "Company · Project · Service" label the New entry form uses, so the same fact does
		// not read as a bare name on one screen and a path on the next.
		expect(await screen.findByText(ENTRY_SERVICE_LABEL)).toBeInTheDocument();
		expect(screen.queryByText(DEFAULT_SERVICE_LABEL)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: new RegExp(ENTRY_SERVICE_LABEL) })).not.toBeInTheDocument();
	});

	it('sends only the field that changed, and never the service', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const user = userEvent.setup();
		await renderEditForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.clear(duration);
		await user.type(duration, '2h');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(() => {
			const patch = fetchSpy.mock.calls.find(([, init]) => init?.method === 'PATCH');
			expect(patch).toBeDefined();

			const body = JSON.parse(patch?.[1]?.body as string) as {
				data: { attributes: Record<string, unknown>; relationships?: unknown };
			};

			// Only changed attributes go out: the date and note were never touched, so they are not
			// resent as though they had been.
			expect(body.data.attributes).toEqual({ time: 120 });
			expect(body.data.relationships).toBeUndefined();
		});
	});

	/**
	 * Range mode derives the minutes from `from`/`to`, so the duration field itself is never typed
	 * in. Reading dirtiness off that field alone meant an edit made this way sent no PATCH at all
	 * and still reported success.
	 */
	it('saves a duration re-entered as a start and an end', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const user = userEvent.setup();
		await renderEditForm();

		await user.click(await screen.findByRole('button', { name: 'Enter start and end instead' }));
		await user.type(screen.getByLabelText('From'), '09:00');
		await user.type(screen.getByLabelText('To'), '11:00');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(() => {
			const patch = fetchSpy.mock.calls.find(([, init]) => init?.method === 'PATCH');
			expect(patch).toBeDefined();

			const body = JSON.parse(patch?.[1]?.body as string) as { data: { attributes: Record<string, unknown> } };
			expect(body.data.attributes).toEqual({ time: 120 });
		});
	});

	/**
	 * The one failure only this surface can have: the entry was deleted somewhere else while this
	 * form was open. "Try again" would be advice that cannot work.
	 */
	it('says the entry is gone when the save finds it deleted', async () => {
		server.use(http.patch('*/time_entries/:id', () => HttpResponse.json(error404, { status: 404 })));
		const user = userEvent.setup();
		await renderEditForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.clear(duration);
		await user.type(duration, '2h');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('This entry no longer exists.');
	});

	it('shows the design wording when the save fails for any other reason', async () => {
		server.use(http.patch('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		await renderEditForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.clear(duration);
		await user.type(duration, '2h');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the entry. Try again.');
	});

	/**
	 * Editing sends no service, so a `/services` request that never lands must not hold the save -
	 * the New entry form's Save is disabled in exactly this situation and this one must not be.
	 */
	it('saves even when the service list is unavailable, and still names the service', async () => {
		server.use(http.get('*/services', () => new HttpResponse(null, { status: 500 })));
		await renderEditForm();

		expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		// Falls back to the name the entry itself carries, rather than leaving the line blank.
		expect(await screen.findByText('Android Development')).toBeInTheDocument();
	});

	/**
	 * `defaultValues` is read once at mount, and the entry can arrive after it - the router can
	 * render this route with a stale copy first. The form has to follow the entry, or reopening one
	 * just saved shows what it said before the save and saving again puts it back.
	 */
	it('follows the entry when a fresher one arrives', async () => {
		const deliverFresherEntry = await renderReseedingForm();
		expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h 30m');

		deliverFresherEntry();

		await waitFor(() => {
			expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('2h 15m');
		});
	});

	/** ...but never over someone's shoulder: a field being typed in is left alone. */
	it('leaves a field that has been typed in alone when it re-seeds', async () => {
		const user = userEvent.setup();
		const deliverFresherEntry = await renderReseedingForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.clear(duration);
		await user.type(duration, '45m');

		deliverFresherEntry();

		await waitFor(() => {
			expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('45m');
		});
	});

	/** It asks first, like the day view's menu does. */
	it('asks before deleting rather than deleting on the first press', async () => {
		const user = userEvent.setup();
		await renderEditForm();

		await user.click(await screen.findByRole('button', { name: 'Delete entry' }));

		const dialog = await screen.findByRole('dialog', { name: 'Delete this entry?' });
		// The entry it is asking about, so the question is answerable without dismissing it.
		expect(dialog).toHaveTextContent('1h 30m');
		expect(dialog).toHaveTextContent('Standup and time logging.');
	});

	/**
	 * The banner rather than a toast, and the form rather than the day: the values are still here,
	 * and so is the person looking at them. The day view has no banner, which is why its own delete
	 * says so in a toast instead.
	 */
	it('stays on the form and says so when the delete fails', async () => {
		server.use(http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		const { router } = await renderEditForm();

		await user.click(await screen.findByRole('button', { name: 'Delete entry' }));
		await user.click(await screen.findByRole('button', { name: 'Delete' }));

		expect(await screen.findByText('Could not delete the entry. Try again.')).toBeInTheDocument();
		expect(router.state.location.pathname).toBe('/entries/162903873/edit');
	});

	/**
	 * A delete is not a form submit, so react-hook-form's `isSubmitting` never covers it. Without
	 * the blocker knowing, deleting an entry someone had edited would ask whether to save the
	 * changes to the entry being deleted.
	 */
	it('does not ask about unsaved changes on the way out of a delete', async () => {
		const user = userEvent.setup();
		await renderEditForm();

		await user.clear(await screen.findByRole('textbox', { name: 'Duration' }));
		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '4h');

		await user.click(screen.getByRole('button', { name: 'Delete entry' }));
		await user.click(await screen.findByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.queryByRole('dialog', { name: 'Delete this entry?' })).not.toBeInTheDocument();
		});
		expect(screen.queryByRole('dialog', { name: 'Save your changes?' })).not.toBeInTheDocument();
	});
});
