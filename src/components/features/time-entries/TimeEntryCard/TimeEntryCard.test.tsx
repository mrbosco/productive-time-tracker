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

	/** A-9: notes written in Productive's editor come back as markup. */
	it('renders a rich-text note as text rather than as markup', async () => {
		const { container } = await renderWithProviders(
			<TimeEntryCard entry={buildEntry({ note: '<ul><li><p>Probavam</p></li></ul>' })} />
		);

		expect(screen.getByText('Probavam')).toBeInTheDocument();
		expect(container.querySelector('ul')).toBeNull();
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

	/**
	 * Every item belongs to a later story, so the menu opens and does nothing. It is here because
	 * the design puts it on the card and a card that grew one later would reflow around it.
	 */
	it('opens the entry menu with the actions the design lists', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Continue timer' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
	});

	/** X-2 moves between cards with the arrow keys; the design gives them the focus ring for it. */
	it('is focusable', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} />);

		expect(screen.getByRole('article')).toHaveAttribute('tabindex', '0');
	});

	it('offers no More on a note that fits', async () => {
		await renderWithProviders(<TimeEntryCard entry={buildEntry({ note: 'Short.' })} />);

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
	});
});
