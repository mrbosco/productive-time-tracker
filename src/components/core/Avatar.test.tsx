import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@/__tests__/test-utils';
import { Avatar, toInitials } from './Avatar';

describe('toInitials', () => {
	it('takes the first and last word of a person, so a middle name is not what they are called', () => {
		expect(toInitials('Ada Lovelace')).toBe('AL');
		expect(toInitials('Ada Byron King Lovelace')).toBe('AL');
	});

	/** An organisation's first two words are its name; what follows is usually a legal suffix. */
	it('takes the first two words of an organisation', () => {
		expect(toInitials('Vela Studio Group', 'start')).toBe('VS');
		expect(toInitials('Northlake Bank', 'start')).toBe('NB');
	});

	it('takes one letter from a single name', () => {
		expect(toInitials('Ada')).toBe('A');
		expect(toInitials('Anoda', 'start')).toBe('A');
	});

	/** Otherwise "3M Company" reads as "3C", which is not anybody's initials. */
	it('skips past non-letters rather than taking them', () => {
		expect(toInitials('3M Company', 'start')).toBe('MC');
		expect(toInitials('  Ada   Lovelace  ')).toBe('AL');
	});

	it('passes over a word with no letters in it at all', () => {
		expect(toInitials('Studio 54 Partners', 'start')).toBe('SP');
	});

	it('returns nothing for an empty name, which is the glyph cue', () => {
		expect(toInitials('')).toBe('');
		expect(toInitials('   ')).toBe('');
		expect(toInitials('42')).toBe('');
	});
});

describe('Avatar', () => {
	it('falls back to the initials of the name it was given', () => {
		render(<Avatar name="Ada Lovelace" />);

		expect(screen.getByText('AL')).toBeInTheDocument();
	});

	/**
	 * A service on an archived deal has no company at all (UI-1). That is a real state rather than
	 * a picture that failed to load, so it gets a glyph rather than an empty tile.
	 */
	it('draws a glyph when there is not even a name to take initials from', () => {
		const { container } = render(<Avatar name="" />);

		expect(container.querySelector('svg')).toBeInTheDocument();
		expect(container.textContent).toBe('');
	});

	it('shows the logo instead when there is one', () => {
		render(<Avatar name="Example Company" src="https://example.com/logo.png" />);

		expect(screen.getByRole('presentation')).toHaveAttribute('src', 'https://example.com/logo.png');
		expect(screen.queryByText('EC')).not.toBeInTheDocument();
	});

	/**
	 * An empty `src` is what a logo field the API left blank arrives as, and it must read as "no
	 * logo" rather than as an image element pointing at the current page.
	 */
	it('treats an empty logo as no logo', () => {
		render(<Avatar name="Example Company" src="" />);

		expect(screen.getByText('EC')).toBeInTheDocument();
	});

	/**
	 * A logo carries its own colours and is very often transparent, so a tint chosen to sit behind
	 * two letters ends up sitting behind somebody's brand. Size and radius are true either way.
	 */
	it('does not put the initials tint behind a logo', () => {
		render(
			<Avatar
				name="Example Company"
				src="https://files.productive.io/logo.png"
				className="size-6 rounded-[6px]"
				fallbackClassName="bg-accent-dark text-on-accent"
			/>
		);

		const logo = screen.getByRole('presentation');
		expect(logo).toHaveClass('size-6', 'rounded-[6px]');
		expect(logo).not.toHaveClass('bg-accent-dark');
		// It gets a white ground and a hairline instead, so a logo carrying its own white ground
		// reads as one square rather than two, and a transparent one still has an edge.
		expect(logo).toHaveClass('bg-surface', 'border-avatar-line');
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

	/**
	 * Every avatar sits beside the name it depicts, so announcing it would read that name twice.
	 * An image with an empty `alt` is exposed as `presentation`, which is the same decision.
	 */
	it('is decorative, because the thing it depicts is always named beside it', () => {
		render(<Avatar name="Ada Lovelace" />);

		expect(screen.getByText('AL')).toHaveAttribute('aria-hidden', 'true');
	});
});
