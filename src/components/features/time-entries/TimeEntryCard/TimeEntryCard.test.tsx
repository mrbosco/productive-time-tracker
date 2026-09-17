import { describe, expect, it, vi } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { todayIso } from '@/lib/date';
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

/** Most of these are about what the card draws, not what its menu does. */
const noop = () => undefined;

describe('TimeEntryCard', () => {
	it('shows the duration, the description and the service (R-6)', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} />);

		expect(screen.getByText('1h 30m')).toBeInTheDocument();
		expect(screen.getByText('Standup and time logging.')).toBeInTheDocument();
		expect(screen.getByText('Administrative work')).toBeInTheDocument();
	});

	/** A-8: Productive writes zero-minute entries, and a running timer is one until it stops. */
	it('renders a zero-minute entry as 0h rather than hiding it', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ minutes: 0 })} />);

		expect(screen.getByText('0h')).toBeInTheDocument();
	});

	it('does not label a zero-minute entry a draft', async () => {
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ minutes: 0, draft: false })} />
		);

		expect(screen.queryByText('Draft')).not.toBeInTheDocument();
	});

	it('labels a draft from the API flag, whatever the duration is', async () => {
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ minutes: 240, draft: true })} />
		);

		expect(screen.getByText('Draft')).toBeInTheDocument();
	});

	/**
	 * A-9 as amended by ADR-0010. A note Productive stored as a list is drawn as a list: flattening
	 * it to a line was the app redrawing what the user wrote.
	 */
	it('renders a note written as a list as a list', async () => {
		const { container } = await renderWithProviders(
			<TimeEntryCard
				onRequestDelete={noop}
				entry={buildEntry({ note: '<ul><li><p>Probavam</p></li><li><p>Drugi</p></li></ul>' })}
			/>
		);

		expect(container.querySelectorAll('ul li')).toHaveLength(2);
		expect(screen.getByText('Probavam')).toBeInTheDocument();
		expect(screen.getByText('Drugi')).toBeInTheDocument();
	});

	it('renders emphasis as emphasis', async () => {
		const { container } = await renderWithProviders(
			<TimeEntryCard
				onRequestDelete={noop}
				entry={buildEntry({ note: '<p>Paired on <strong>the parser</strong></p>' })}
			/>
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
				onRequestDelete={noop}
				entry={buildEntry({ note: '<p>Safe</p><script>window.pwned = 1</script><img src="x" onerror="1">' })}
			/>
		);

		expect(screen.getByText('Safe')).toBeInTheDocument();
		expect(container.querySelector('script')).toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	it('treats markup with no words in it as no description', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ note: '<p></p>' })} />);

		expect(screen.getByText('No description')).toBeInTheDocument();
	});

	it('preserves the line breaks of a multiline description', async () => {
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ note: 'First line\nSecond line' })} />
		);

		// One text node carrying both lines: `whitespace-pre-line` renders the break, so splitting
		// it into two elements would be the app reformatting what the user typed.
		expect(screen.getByText(/First line\s+Second line/)).toBeInTheDocument();
	});

	it('says so when an entry has no description', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ note: null })} />);

		expect(screen.getByText('No description')).toBeInTheDocument();
	});

	it('names the service as unknown rather than printing nothing when it is missing', async () => {
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ service: null, serviceId: null })} />
		);

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
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ note: 'A very long note.' })} />
		);

		const more = await screen.findByRole('button', { name: 'More' });
		await user.click(more);

		expect(screen.getByRole('button', { name: 'Less' })).toBeInTheDocument();
		expect(scrollHeight).toHaveBeenCalled();
	});

	/** The card's only way into the edit route (US-3, R-11). */
	it('links the menu Edit to this entry own edit route', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		const edit = await screen.findByRole('menuitem', { name: 'Edit' });

		expect(edit).toHaveAttribute('href', '/entries/162903873/edit');
		expect(edit).not.toHaveAttribute('aria-disabled', 'true');
	});

	/**
	 * X-4. A new entry rather than an addition to this one, because `POST /timers` always creates
	 * one - the note is what carries over, so the running `0h` row already says what it is for.
	 */
	it('continues an entry as a new timer, carrying its description (X-4)', async () => {
		const onContinueTimer = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} onContinueTimer={onContinueTimer} />
		);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Continue timer' }));

		expect(onContinueTimer).toHaveBeenCalledTimes(1);
	});

	/**
	 * X-3. Today, not the entry's own day: copying yesterday's standup is almost always about
	 * logging today's. The entry travels as an ID, so nobody's description ends up in a URL.
	 */
	it('duplicates onto today, carrying the entry by id (X-3)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		const duplicate = await screen.findByRole('menuitem', { name: 'Duplicate' });
		/*
		 * The id arrives percent-encoded and quoted because the router JSON-encodes any search value
		 * that is itself valid JSON, and an id of digits is a valid JSON number. That is the round
		 * trip working, not a bug: `validateSearch` reads a string back out of it.
		 */
		expect(duplicate).toHaveAttribute('href', `/entries/new?date=${todayIso()}&duplicate=%22162903873%22`);
		expect(duplicate).not.toHaveAttribute('aria-disabled', 'true');
	});

	/** R-12 starts here: the card asks, and the day view is what confirms and deletes. */
	it('asks for the entry to be deleted from the menu (R-12)', async () => {
		const onRequestDelete = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} onRequestDelete={onRequestDelete} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

		expect(onRequestDelete).toHaveBeenCalledTimes(1);
	});

	/**
	 * X-2's roving tabindex, from the card's side: the list nominates one tab stop and the rest are
	 * reachable only by arrow key, so Tab does not walk through twenty cards to get past the list
	 * (guidebook 18).
	 */
	it('is a tab stop only when the list says so (X-2)', async () => {
		const { rerender } = await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} isTabStop={false} />
		);

		expect(screen.getByRole('article')).toHaveAttribute('tabindex', '-1');

		rerender(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} isTabStop />);

		expect(screen.getByRole('article')).toHaveAttribute('tabindex', '0');
	});

	/** The arrow keys choose a card, and nothing else would move the caret onto it (X-2). */
	it('takes focus when it becomes the chosen card (X-2)', async () => {
		const { rerender } = await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} />);

		expect(screen.getByRole('article')).not.toHaveFocus();

		rerender(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} isFocused />);

		expect(screen.getByRole('article')).toHaveFocus();
	});

	/**
	 * Focus events bubble. Without narrowing to the card itself, opening the menu would report the
	 * card as focused, the card would pull focus back out of the trigger, and the menu would never
	 * open - so this is asserted from the outside, by the menu still working.
	 */
	it('does not claim focus that landed on the menu trigger (X-2)', async () => {
		const onTakeFocus = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} onTakeFocus={onTakeFocus} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
		expect(onTakeFocus).not.toHaveBeenCalled();
	});

	/**
	 * X-4, `Timer.dc.html`: the app bar is the only sign a timer is running, and on a full day the
	 * row it belongs to can be scrolled far away from it. The tracking row says so itself.
	 */
	it('says when a timer is running against it (X-4)', async () => {
		const startedAt = new Date(Date.now() - 180_000).toISOString();
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} trackingSince={startedAt} onStopTimer={noop} />
		);

		expect(screen.getByText('Tracking')).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: 'Stop timer' }).length).toBeGreaterThan(0);
	});

	/**
	 * The entry's real total, not the timer's: what is stored plus what is running. An entry that
	 * already had minutes would otherwise look like it had lost them while being tracked.
	 */
	it('counts the running time on top of what the entry already holds (X-4)', async () => {
		const startedAt = new Date(Date.now() - 180_000).toISOString();
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} trackingSince={startedAt} onStopTimer={noop} />
		);

		// 1h 30m logged, three minutes running.
		expect(screen.getByText('1h 33m')).toBeInTheDocument();
	});

	it('shows only what is stored when no timer is running on it', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} />);

		expect(screen.getByText('1h 30m')).toBeInTheDocument();
		expect(screen.queryByText('Tracking')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Stop timer' })).not.toBeInTheDocument();
	});

	/** One timer at a time, so the entry already carrying it cannot be asked to start another. */
	it('cannot be continued while it is already being tracked (X-4)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(
			<TimeEntryCard
				onRequestDelete={noop}
				entry={buildEntry()}
				trackingSince={new Date().toISOString()}
				onStopTimer={noop}
				onContinueTimer={noop}
			/>
		);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));

		expect(await screen.findByRole('menuitem', { name: 'Continue timer' })).toHaveAttribute('aria-disabled', 'true');
	});

	it('offers no More on a note that fits', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ note: 'Short.' })} />);

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
	});
});
