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
	it('names the project and the service, and falls back to the service alone without a project', async () => {
		const { unmount } = await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		// Two separate elements, which is what lets the service name sit in a chip of its own and
		// the project name carry the disclosure. Asserted apart rather than as one string for the
		// same reason: nothing between them is text, so there is no pattern to match.
		expect(screen.getByRole('button', { name: 'Mobile banking app' })).toBeInTheDocument();
		expect(screen.getByText('Design')).toBeInTheDocument();

		unmount();
		await renderWithProviders(<ServiceContext service={buildService({ name: 'Administrative work' })} />);

		expect(screen.getByText('Administrative work')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('opens the context on touch, where there is no hover to open it with', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<ServiceContext service={SUBCONTRACTED} />);

		await user.click(screen.getByRole('button', { name: 'Mobile banking app' }));

		const sheet = await screen.findByRole('dialog');
		// The company heading is the one level the tooltip cannot show.
		expect(await screen.findByRole('heading', { name: 'Vela Studio' })).toBeInTheDocument();
		expect(sheet).toHaveTextContent('Client');
		expect(sheet).toHaveTextContent('Northlake Bank');
		expect(sheet).toHaveTextContent('Mobile banking app — phase 2');
		expect(sheet).toHaveTextContent('Section');
	});
});
