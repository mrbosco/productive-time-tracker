import { describe, expect, it, vi } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { TimeEntryCard } from './TimeEntryCard';

function buildEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: '162903873',
		date: '2026-09-15',
		minutes: 90,
		note: 'Standup and time logging.',
		draft: false,
		serviceId: '16887825',
		service: { id: '16887825', name: 'Administrative work', dealName: null, dealId: null, companyName: null },
		createdAt: '2026-09-15T16:08:26.527+02:00',
		...overrides,
	};
}

describe('TimeEntryCard', () => {
	it('shows the duration, the description and the service (R-6)', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} />);

		expect(screen.getByText('1h 30m')).toBeInTheDocument();
		expect(screen.getByText('Standup and time logging.')).toBeInTheDocument();
		expect(screen.getByText('Administrative work')).toBeInTheDocument();
	});

	/** A-8: Productive writes zero-minute entries, and a running timer is one until it stops. */
	it('renders a zero-minute entry as 0h rather than hiding it', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ minutes: 0 })} />);

		expect(screen.getByText('0h')).toBeInTheDocument();
	});

	it('does not label a zero-minute entry a draft', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ minutes: 0, draft: false })} />);

		expect(screen.queryByText('Draft')).not.toBeInTheDocument();
	});

	it('labels a draft from the API flag, whatever the duration is', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ minutes: 240, draft: true })} />);

		expect(screen.getByText('Draft')).toBeInTheDocument();
	});

	/**
	 * A-9 as amended by ADR-0010. A note Productive stored as a list is drawn as a list: flattening
	 * it to a line was the app redrawing what the user wrote.
	 */
	it('renders a note written as a list as a list', async () => {
		const { container } = await renderWithProviders(
			<TimeEntryCard entry={buildEntry({ note: '<ul><li><p>Probavam</p></li><li><p>Drugi</p></li></ul>' })} />
		);

		expect(container.querySelectorAll('ul li')).toHaveLength(2);
		expect(screen.getByText('Probavam')).toBeInTheDocument();
		expect(screen.getByText('Drugi')).toBeInTheDocument();
	});

	it('renders emphasis as emphasis', async () => {
		const { container } = await renderWithProviders(
			<TimeEntryCard entry={buildEntry({ note: '<p>Paired on <strong>the parser</strong></p>' })} />
		);

		expect(container.querySelector('strong')).toHaveTextContent('the parser');
	});

	/**
	 * The renderer fails closed: it walks a parsed document and only allowlisted tags become
	 * elements, so nothing executable can reach the card even if the API served it. There is no
	 * `dangerouslySetInnerHTML` in the app for it to reach through.
	 */
	it('drops anything executable rather than rendering it', async () => {
		const { container } = await renderWithProviders(
			<TimeEntryCard
				entry={buildEntry({ note: '<p>Safe</p><script>window.pwned = 1</script><img src="x" onerror="1">' })}
			/>
		);

		expect(screen.getByText('Safe')).toBeInTheDocument();
		expect(container.querySelector('script')).toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	it('treats markup with no words in it as no description', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ note: '<p></p>' })} />);

		expect(screen.getByText('No description')).toBeInTheDocument();
	});

	it('preserves the line breaks of a multiline description', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ note: 'First line\nSecond line' })} />);

		// One text node carrying both lines: `whitespace-pre-line` renders the break, so splitting
		// it into two elements would be the app reformatting what the user typed.
		expect(screen.getByText(/First line\s+Second line/)).toBeInTheDocument();
	});

	it('says so when an entry has no description', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ note: null })} />);

		expect(screen.getByText('No description')).toBeInTheDocument();
	});

	it('names the service as unknown rather than printing nothing when it is missing', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ service: null, serviceId: null })} />);

		expect(screen.getByText('Unknown service')).toBeInTheDocument();
	});

	/**
	 * jsdom lays nothing out, so `scrollHeight` and `clientHeight` are both 0 and a note never
	 * measures as overflowing. Stubbing the pair is the only way to reach the clamped branch.
	 */
	it('offers More on a note long enough to be clamped, and expands it', async () => {
		const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(120);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);

		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ note: 'A very long note.' })} />);

		const more = await screen.findByRole('button', { name: 'More' });
		await user.click(more);

		expect(screen.getByRole('button', { name: 'Less' })).toBeInTheDocument();
		expect(scrollHeight).toHaveBeenCalled();
	});

	/** The card's only way into the edit route (US-3, R-11). */
	it('links the menu Edit to this entry own edit route', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		const edit = await screen.findByRole('menuitem', { name: 'Edit' });

		expect(edit).toHaveAttribute('href', '/entries/162903873/edit');
		expect(edit).not.toHaveAttribute('aria-disabled', 'true');
	});

	/**
	 * The rest of the menu is drawn because the design puts it on the card, but each item belongs to
	 * a later story, so it says which and does not activate.
	 */
	it('leaves the actions later stories own marked as not yet wired', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		for (const name of [/^Continue timer/, /^Duplicate/, /^Delete/]) {
			expect(await screen.findByRole('menuitem', { name })).toHaveAttribute('aria-disabled', 'true');
		}
	});

	/** X-2 brings the roving tabindex; until then the card has nothing to activate. */
	it('is not a tab stop of its own', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} />);

		expect(screen.getByRole('article')).not.toHaveAttribute('tabindex');
	});

	it('offers no More on a note that fits', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ note: 'Short.' })} />);

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
	});
});
