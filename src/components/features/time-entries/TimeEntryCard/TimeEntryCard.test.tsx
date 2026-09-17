import { describe, expect, it, vi } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { buildService, renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { TimeEntryCard } from './TimeEntryCard';

function buildEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: '162903873',
		date: '2026-09-15',
		minutes: 90,
		note: 'Standup and time logging.',
		draft: false,
		serviceId: '16887825',
		service: buildService(),
		createdAt: '2026-09-15T16:08:26.527+02:00',
		...overrides,
	};
}

/** Most of these are about what the card draws, not what its menu does. */
const noop = () => undefined;

describe('TimeEntryCard', () => {
	it('shows the duration, the description and the service', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} />);

		expect(screen.getByText('1h 30m')).toBeInTheDocument();
		expect(screen.getByText('Standup and time logging.')).toBeInTheDocument();
		expect(screen.getByText('Administrative work')).toBeInTheDocument();
	});

	/** Productive writes zero-minute entries, and a running timer is one until it stops. */
	it('renders a zero-minute entry as 0h rather than hiding it', async () => {
		await renderWithProviders(<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ minutes: 0 })} />);

		expect(screen.getByText('0h')).toBeInTheDocument();
	});

	it('labels a draft from the API flag, whatever the duration is', async () => {
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry({ minutes: 240, draft: true })} />
		);

		expect(screen.getByText('Draft')).toBeInTheDocument();
	});

	/**
	 * A note Productive stored as a list is drawn as a list: flattening it to a line was the app
	 * redrawing what the user wrote.
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

	/** Deleting starts here: the card asks, and the day view is what confirms and deletes. */
	it('asks for the entry to be deleted from the menu', async () => {
		const onRequestDelete = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryCard entry={buildEntry()} onRequestDelete={onRequestDelete} />);

		await user.click(screen.getByRole('button', { name: 'Entry actions' }));
		await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

		expect(onRequestDelete).toHaveBeenCalledTimes(1);
	});

	/**
	 * The entry's real total, not the timer's: what is stored plus what is running. An entry that
	 * already had minutes would otherwise look like it had lost them while being tracked.
	 */
	it('counts the running time on top of what the entry already holds', async () => {
		const startedAt = new Date(Date.now() - 180_000).toISOString();
		await renderWithProviders(
			<TimeEntryCard onRequestDelete={noop} entry={buildEntry()} trackingSince={startedAt} onStopTimer={noop} />
		);

		// 1h 30m logged, three minutes running.
		expect(screen.getByText('1h 33m')).toBeInTheDocument();
	});

	/** One timer at a time, so the entry already carrying it cannot be asked to start another. */
	it('cannot be continued from the menu while it is already being tracked', async () => {
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
});
