import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Two letters, uppercased, from the first letter of two of the words in a name.
 *
 * Which two differs by what is being named, so the caller says. A person is `edges` - "Ada Byron
 * King Lovelace" is AL, because a middle name is not what anyone is called. An organisation is
 * `start` - "Vela Studio Group" is VS, the rule `Service Context.dc.html` sets, because an
 * organisation's first two words are its name and the rest is usually a legal suffix.
 *
 * Non-letters are skipped rather than taken, so "3M Company" is MC and not "3C"; a word with no
 * letters in it at all is passed over entirely. One letter is a fine answer, three is not, and a
 * name with nothing in it returns nothing - which is the glyph's cue.
 */
export function toInitials(name: string, from: 'edges' | 'start' = 'edges'): string {
	const letters = name
		.split(/\s+/)
		.map((word) => /\p{L}/u.exec(word)?.[0])
		.filter((letter) => letter !== undefined);

	if (letters.length < 2) return (letters.at(0) ?? '').toUpperCase();

	const [first, second] = from === 'start' ? [letters.at(0), letters.at(1)] : [letters.at(0), letters.at(-1)];

	return `${first ?? ''}${second ?? ''}`.toUpperCase();
}

/**
 * The stand-in for a company with no name to take initials from (UI-1). A building rather than a
 * blank tile, so an entry whose service has no company reads as "an organisation we know nothing
 * about" instead of as a picture that failed to load.
 */
function BuildingIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M3.4 17V4.2L11 2.2v3.2h5.6V17H3.4Zm2-2h1.8v-1.8H5.4V15Zm0-3.6h1.8V9.6H5.4v1.8Zm0-3.6h1.8V6H5.4v1.8Zm3.8 7.2H11v-1.8H9.2V15Zm0-3.6H11V9.6H9.2v1.8Zm0-3.6H11V6H9.2v1.8Zm3.8 7.2h1.8v-1.8H13V15Zm0-3.6h1.8V9.6H13v1.8Z"
				fill="currentColor"
			/>
		</svg>
	);
}

interface AvatarProps extends React.ComponentProps<'span'> {
	/** Who or what this stands for. Its initials are what shows when there is no image. */
	name: string;
	/** A logo or photograph, when the thing depicted has one. */
	src?: string | null;
	/** Which two letters stand in without one. See `toInitials`. */
	initialsFrom?: 'edges' | 'start';
	/**
	 * Classes for the initials only - the tint behind them and the type on top.
	 *
	 * Separate from `className` because a logo brings its own colours and is often transparent, so
	 * a tint meant to sit behind two letters ends up sitting behind somebody's brand instead.
	 * `className` is the part that is true either way: size, radius, position.
	 */
	fallbackClassName?: string;
}

/**
 * A logo, the initials of whoever has none, or a glyph when there is not even a name.
 *
 * Decorative by default: every avatar in the app sits beside the name it depicts - in the account
 * menu, in a row, or under a button that carries its own label - so giving it a second accessible
 * name would have that name read out twice (guidebook 18).
 *
 * Deliberately variant-free. Size, radius and colour come in as classes, because the four places
 * that use one - the bar's 44px person, the menu's 36px, and the two organization badges - agree
 * on nothing but the fallback, and a variant table for four one-offs is more to read than the
 * classes it would hide.
 */
function Avatar({ name, src, className, fallbackClassName, initialsFrom = 'edges', ...props }: AvatarProps) {
	const initials = toInitials(name, initialsFrom);
	/*
	 * An avatar URL outlives the file it points at: Productive stores these on its own CDN, and a
	 * logo replaced or removed there leaves a link behind that 404s. A broken-image glyph is worse
	 * than the initials it replaced, so a failed load falls back to them.
	 *
	 * Keyed on `src` so swapping in a different avatar gets its own chance to load rather than
	 * inheriting the last one's failure.
	 */
	const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

	if (src !== null && src !== undefined && src !== '' && src !== failedSrc) {
		// No pass-through props on this branch: a span and an img share almost no attributes, and
		// nothing needs to set one on an avatar that happens to have a logo.
		return (
			<img
				src={src}
				alt=""
				onError={() => {
					setFailedSrc(src);
				}}
				/*
				 * White, never a tint: most logos carry their own white ground, and a tinted plate
				 * behind one draws a box inside a box. The hairline is what gives it an edge.
				 *
				 * These go before `className` so a caller can still override them: the
				 * organization badge replaces the hairline with a thicker ring in the bar's own
				 * colour, and a company logo replaces `object-cover` with `object-contain` and
				 * padding, because a brand mark must not be cropped to fill a square the way a
				 * photograph can be.
				 */
				className={cn('border border-avatar-line bg-surface object-cover', className)}
			/>
		);
	}

	return (
		<span
			aria-hidden="true"
			{...props}
			className={cn('grid place-items-center overflow-hidden', className, fallbackClassName)}
		>
			{initials === '' ? <BuildingIcon /> : initials}
		</span>
	);
}

export { Avatar };
