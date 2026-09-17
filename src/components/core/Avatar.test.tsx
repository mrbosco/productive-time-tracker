import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@/__tests__/test-utils';
import { Avatar, toInitials } from './Avatar';

describe('toInitials', () => {
	it('takes the first and last word', () => {
		expect(toInitials('Ada Lovelace')).toBe('AL');
		expect(toInitials('Ada Byron King Lovelace')).toBe('AL');
	});

	it('takes one letter from a single name', () => {
		expect(toInitials('Ada')).toBe('A');
	});

	it('returns nothing for an empty name', () => {
		expect(toInitials('')).toBe('');
	});
});

describe('Avatar', () => {
	it('falls back to the initials of the name it was given', () => {
		render(<Avatar name="Ada Lovelace" />);

		expect(screen.getByText('AL')).toBeInTheDocument();
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
		// It gets the neutral plate instead, so a transparent logo still has an edge.
		expect(logo).toHaveClass('bg-avatar', 'border-avatar-line');
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
