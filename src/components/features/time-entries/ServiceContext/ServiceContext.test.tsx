import { describe, expect, it } from 'vitest';
import { buildService, renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { ServiceContext } from './ServiceContext';

const SUBCONTRACTED = buildService({
	name: 'Design',
	companyId: '1',
	companyName: 'Vela Studio',
	clientId: '2',
	clientName: 'Northlake Bank',
	projectName: 'Mobile banking app',
	dealName: 'Mobile banking app — phase 2',
	sectionName: 'Design',
});

/**
 * jsdom reports no hover, so every test here takes the touch branch and opens the sheet. The
 * tooltip needs real pointer events and is covered in `e2e/entry-card.spec.ts` instead.
 */
describe('ServiceContext', () => {
	it('names the project and the service', async () => {
		await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		// Two separate elements, which is what lets the service name sit in a chip of its own and
		// the project name carry the disclosure. Asserted apart rather than as one string for the
		// same reason: nothing between them is text, so there is no pattern to match.
		expect(screen.getByRole('button', { name: 'Mobile banking app' })).toBeInTheDocument();
		expect(screen.getByText('Design')).toBeInTheDocument();
	});

	it('falls back to the service alone when the entry has no project', async () => {
		await renderWithProviders(<ServiceContext service={buildService({ name: 'Administrative work' })} />);

		expect(screen.getByText('Administrative work')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('names an unknown service rather than rendering an empty line', async () => {
		await renderWithProviders(<ServiceContext service={null} />);

		expect(screen.getByText('Unknown service')).toBeInTheDocument();
	});

	/** A dotted underline that opens an empty panel is worse than plain text. */
	it('offers nothing to open when there is nothing behind the project name', async () => {
		await renderWithProviders(
			<ServiceContext service={buildService({ name: 'Design', projectName: 'Mobile banking app' })} />
		);

		expect(screen.getByText('Mobile banking app')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('opens the context on touch, where there is no hover to open it with', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		await user.click(screen.getByRole('button', { name: 'Mobile banking app' }));

		const sheet = await screen.findByRole('dialog');
		expect(sheet).toHaveTextContent('Client');
		expect(sheet).toHaveTextContent('Northlake Bank');
		expect(sheet).toHaveTextContent('Mobile banking app — phase 2');
		expect(sheet).toHaveTextContent('Section');
	});

	/** The sheet has room for the company, which is the one level the tooltip cannot show. */
	it('names the company at the top of the sheet', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		await user.click(screen.getByRole('button', { name: 'Mobile banking app' }));

		expect(await screen.findByRole('heading', { name: 'Vela Studio' })).toBeInTheDocument();
	});

	it('says whether the context is open, so it is not hover-only', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		const trigger = screen.getByRole('button', { name: 'Mobile banking app' });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await user.click(trigger);

		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('closes again from inside the sheet', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		await user.click(screen.getByRole('button', { name: 'Mobile banking app' }));
		await user.click(await screen.findByRole('button', { name: 'Close' }));

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
