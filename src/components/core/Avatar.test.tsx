import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@/__tests__/test-utils';
import { Avatar, toInitials } from './Avatar';

describe('toInitials', () => {
	it.each([
		// A middle name is not what anybody is called.
		{ name: 'Ada Byron King Lovelace', from: undefined, initials: 'AL' },
		// An organisation's first two words are its name; what follows is usually a legal suffix, and
		// a word with no letters in it is passed over rather than read as an initial.
		{ name: 'Studio 54 Partners', from: 'start', initials: 'SP' },
		// Nothing to take a letter from returns nothing, which is the glyph cue.
		{ name: '   ', from: undefined, initials: '' },
	] as const)('turns "$name" into "$initials"', ({ name, from, initials }) => {
		expect(toInitials(name, from)).toBe(initials);
	});
});

describe('Avatar', () => {
	it('shows the logo instead when there is one', () => {
		render(<Avatar name="Example Company" src="https://example.com/logo.png" />);

		expect(screen.getByRole('presentation')).toHaveAttribute('src', 'https://example.com/logo.png');
		expect(screen.queryByText('EC')).not.toBeInTheDocument();
	});

	/**
	 * These URLs point at Productive's own CDN and outlive the files behind them, so a logo that
	 * was replaced or removed leaves a link that 404s. A broken-image glyph is worse than the
	 * initials it replaced.
	 */
	it('falls back to initials when the logo fails to load', async () => {
		render(<Avatar name="Example Company" src="https://files.productive.io/gone.png" />);

		fireEvent.error(screen.getByRole('presentation'));

		expect(await screen.findByText('EC')).toBeInTheDocument();
	});
});
