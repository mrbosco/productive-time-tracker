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
		await user.click(await saveButton());

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the entry. Try again.');
		expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h');
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

	/**
	 * The description is a rich-text editor now (ADR-0010), and ProseMirror does not receive input
	 * under jsdom - it listens for `beforeinput` and composition events jsdom does not implement.
	 * What is asserted here is the wiring; typing a list and bolding a word are covered in
	 * `e2e/entry-create.spec.ts`, in a browser that runs the editor for real.
	 */
	it('gives the description editor a name and a multiline role', async () => {
		await renderForm();

		const description = screen.getByRole('textbox', { name: 'Description' });

		expect(description).toHaveAttribute('contenteditable', 'true');
		expect(description).toHaveAttribute('aria-multiline', 'true');
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

	/**
	 * The prompt names the work rather than asking in the abstract. Every wording permutation is
	 * covered against `summariseUnsavedEntry` in the utils test; this asserts the sentence is
	 * actually built from it.
	 */
	it('names what would be lost', async () => {
		const user = userEvent.setup();
		await renderForm();

		await user.type(screen.getByRole('textbox', { name: 'Duration' }), '1h 45m');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		const prompt = await screen.findByRole('dialog', { name: 'Save your changes?' });

		expect(prompt).toHaveTextContent('1h 45m would be lost.');
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

/**
 * US-3, R-11. The same component, so only the differences are worth asserting here: where the values
 * start, what the buttons say, what goes on the wire, and the two things editing deliberately does
 * not do - wait on a service, or offer to change one.
 */
/**
 * P-2. Only `time` is ever stored, so what is tested here is the swap and the arithmetic in front
 * of it - that the right fields are asked for, that the preview agrees with them, and that the
 * minutes reaching the API are the same whichever way they were entered.
 */
describe('TimeEntryForm in range mode (P-2)', () => {
	/** The toggle's label names the action, so it reads as the mode you are not in. */
	async function switchToRange(user: ReturnType<typeof userEvent.setup>) {
		await user.click(await screen.findByRole('button', { name: 'Enter start and end instead' }));
	}

	it('swaps the duration field for a start and an end', async () => {
		const user = userEvent.setup();
		await renderForm();

		expect(screen.getByRole('textbox', { name: 'Duration' })).toBeInTheDocument();

		await switchToRange(user);

		expect(screen.queryByRole('textbox', { name: 'Duration' })).not.toBeInTheDocument();
		expect(screen.getByLabelText('From')).toBeInTheDocument();
		expect(screen.getByLabelText('To')).toBeInTheDocument();
	});

	it('switches back, and the label says which way it goes', async () => {
		const user = userEvent.setup();
		await renderForm();

		await switchToRange(user);
		await user.click(screen.getByRole('button', { name: 'Enter a duration instead' }));

		expect(screen.getByRole('textbox', { name: 'Duration' })).toBeInTheDocument();
	});

	it('previews the span the two times describe', async () => {
		const user = userEvent.setup();
		await renderForm();
		await switchToRange(user);

		await user.type(screen.getByLabelText('From'), '09:00');
		await user.type(screen.getByLabelText('To'), '10:30');

		expect(await screen.findByText('= 1h 30m')).toBeInTheDocument();
	});

	it('previews nothing while the end is before the start', async () => {
		const user = userEvent.setup();
		await renderForm();
		await switchToRange(user);

		await user.type(screen.getByLabelText('From'), '10:30');
		await user.type(screen.getByLabelText('To'), '09:00');

		expect(screen.queryByText(/^= /)).not.toBeInTheDocument();
	});

	/** SPEC 10: an end before its start is a validation error, never a span across midnight. */
	it('refuses an end before its start on submit', async () => {
		const user = userEvent.setup();
		await renderForm();
		await switchToRange(user);

		await user.type(screen.getByLabelText('From'), '10:30');
		await user.type(screen.getByLabelText('To'), '09:00');
		await user.click(await saveButton());

		expect(await screen.findByText('End must be after start.')).toBeInTheDocument();
	});

	it('asks for both ends before it will save', async () => {
		const user = userEvent.setup();
		await renderForm();
		await switchToRange(user);

		await user.click(await saveButton());

		expect(await screen.findByText('Start and end are required.')).toBeInTheDocument();
	});

	/** The wire never learns which mode produced them: `time` is minutes either way. */
	it('sends the computed minutes and nothing about the range (R-9)', async () => {
		const bodies: unknown[] = [];
		server.use(
			http.post('*/time_entries', async ({ request }) => {
				bodies.push(await request.json());

				return HttpResponse.json({ data: { id: '1', type: 'time_entries', attributes: {} } }, { status: 201 });
			})
		);
		const user = userEvent.setup();
		await renderForm();
		await switchToRange(user);

		await user.type(screen.getByLabelText('From'), '09:00');
		await user.type(screen.getByLabelText('To'), '10:30');
		await user.click(await saveButton());

		await waitFor(() => {
			expect(bodies).toHaveLength(1);
		});
		expect(bodies[0]).toMatchObject({ data: { attributes: { date: DATE, time: 90 } } });
	});
});

describe('TimeEntryForm, editing an entry', () => {
	it('opens prefilled with the entry own values (R-11)', async () => {
		await renderEditForm();

		expect(await screen.findByRole('button', { name: /Date Tue 15 Sep 2026/ })).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h 30m');
		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Standup and time logging.');
	});

	it('says it is editing, and that the button saves changes', async () => {
		await renderEditForm();

		expect(await screen.findByRole('heading', { name: 'Edit entry' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Save entry' })).not.toBeInTheDocument();
	});

	/**
	 * A-1: edit keeps the entry's existing service. It is the entry's own, not the default - and it
	 * is text, because the sheet behind the New entry form's link decides what the *next* entry gets
	 * and would open showing a different service selected than the line just clicked.
	 */
	it('names the entry own service, not the default, and does not offer to change it (A-1)', async () => {
		await renderEditForm();

		expect(screen.getByText(/Logging as Ada Lovelace/)).toBeInTheDocument();
		// The full "Company · Project · Service" label the New entry form uses, so the same fact does
		// not read as a bare name on one screen and a path on the next.
		expect(await screen.findByText(ENTRY_SERVICE_LABEL)).toBeInTheDocument();
		expect(screen.queryByText(DEFAULT_SERVICE_LABEL)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: new RegExp(ENTRY_SERVICE_LABEL) })).not.toBeInTheDocument();
	});

	it('sends only the field that changed, and never the service (SPEC 4.1, A-1)', async () => {
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

			// SPEC 4.1 is "Only changed attributes": the date and note were never touched, so they
			// are not resent as though they had been.
			expect(body.data.attributes).toEqual({ time: 120 });
			expect(body.data.relationships).toBeUndefined();
		});
	});

	it('returns to the day the entry ends up on, and says it saved', async () => {
		const user = userEvent.setup();
		const { router } = await renderEditForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.clear(duration);
		await user.type(duration, '2h');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
		expect(router.state.location.state.toast).toBe('Entry saved');
	});

	/** A-8 is one schema for both write surfaces, so the edit form rejects what create rejects. */
	it('rejects a duration the create form would reject too (A-8)', async () => {
		const user = userEvent.setup();
		await renderEditForm();

		const duration = screen.getByRole('textbox', { name: 'Duration' });
		await user.clear(duration);
		await user.type(duration, '25h');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(await screen.findByText('Duration cannot be more than 24h.')).toBeInTheDocument();
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
	it('saves even when the service list is unavailable, and still names the service (A-1)', async () => {
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
	it('follows the entry when a fresher one arrives (R-11)', async () => {
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

	/** R-12 from this form: it asks first, like the day view's menu does (A-10). */
	it('asks before deleting rather than deleting on the first press (R-12, A-10)', async () => {
		const user = userEvent.setup();
		await renderEditForm();

		await user.click(await screen.findByRole('button', { name: 'Delete entry' }));

		const dialog = await screen.findByRole('dialog', { name: 'Delete this entry?' });
		// The entry it is asking about, so the question is answerable without dismissing it.
		expect(dialog).toHaveTextContent('1h 30m');
		expect(dialog).toHaveTextContent('Standup and time logging.');
	});

	it('deletes the entry and returns to its day (R-12)', async () => {
		const user = userEvent.setup();
		const { router } = await renderEditForm();

		await user.click(await screen.findByRole('button', { name: 'Delete entry' }));
		await user.click(await screen.findByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
		expect(router.state.location.state.toast).toBe('Entry deleted');
	});

	it('leaves the entry alone when the question is declined', async () => {
		const deleted = vi.fn();
		server.use(
			http.delete('*/time_entries/:id', () => {
				deleted();

				return new HttpResponse(null, { status: 204 });
			})
		);
		const user = userEvent.setup();
		const { router } = await renderEditForm();

		await user.click(await screen.findByRole('button', { name: 'Delete entry' }));
		await user.click(await screen.findByRole('button', { name: 'Cancel' }));

		expect(deleted).not.toHaveBeenCalled();
		expect(router.state.location.pathname).toBe('/entries/162903873/edit');
	});

	/**
	 * The banner rather than a toast, and the form rather than the day: the values are still here,
	 * and so is the person looking at them. The day view has no banner, which is why its own delete
	 * says so in a toast instead.
	 */
	it('stays on the form and says so when the delete fails (R-12)', async () => {
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

	it('has no delete action on the New entry form', async () => {
		await renderForm();

		expect(screen.queryByRole('button', { name: /^Delete entry/ })).not.toBeInTheDocument();
	});

	/** An untouched edit form is not a draft, so leaving it must not ask (Improvements 10). */
	it('closes without asking when nothing was changed', async () => {
		const user = userEvent.setup();
		const { router } = await renderEditForm();

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${DATE}`);
		});
		expect(screen.queryByRole('dialog', { name: 'Save your changes?' })).not.toBeInTheDocument();
	});

	/**
	 * P-2: only `time` reaches the API, so there is no range to reopen. An entry logged as 09:00 to
	 * 10:30 comes back as `1h 30m`, which is the whole truth the record holds about it.
	 */
	it('opens in duration mode whatever the entry was logged with (P-2)', async () => {
		await renderEditForm();

		expect(await screen.findByRole('textbox', { name: 'Duration' })).toHaveValue('1h 30m');
		expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Enter start and end instead' })).toBeInTheDocument();
	});
});
