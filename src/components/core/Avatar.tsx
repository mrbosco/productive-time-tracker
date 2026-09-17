import * as React from 'react';
import { cn } from '@/lib/utils';

/** "Ada Lovelace" -> "AL". One letter when there is only one word, empty when the name is. */
export function toInitials(name: string): string {
	const words = name.split(' ').filter(Boolean);

	return [words.at(0), words.length > 1 ? words.at(-1) : undefined]
		.filter((word) => word !== undefined)
		.map((word) => word.charAt(0).toUpperCase())
		.join('');
}

interface AvatarProps extends React.ComponentProps<'span'> {
	/** Who or what this stands for. Its initials are what shows when there is no image. */
	name: string;
	/** A logo or photograph, when the thing depicted has one. */
	src?: string | null;
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
 * A logo, or the initials of whoever has none.
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
function Avatar({ name, src, className, fallbackClassName, ...props }: AvatarProps) {
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
				 * The plate goes before `className` so a caller can still override it - the
				 * organization badge replaces the hairline with a thicker ring in the bar's own
				 * colour, which is what lifts it off the avatar underneath.
				 */
				className={cn('border border-avatar-line bg-avatar object-cover', className)}
			/>
		);
	}

	return (
		<span
			aria-hidden="true"
			{...props}
			className={cn('grid place-items-center overflow-hidden', className, fallbackClassName)}
		>
			{toInitials(name)}
		</span>
	);
}

export { Avatar };
