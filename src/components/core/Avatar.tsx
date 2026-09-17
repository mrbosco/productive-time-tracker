import * as React from 'react';
import { cn } from '@/lib/utils';

/** Two letters from a name. A person is `edges` - "Ada Byron King Lovelace" is AL; an organisation is
 * `start` - "Vela Studio Group" is VS, because the rest is usually a legal suffix. Non-letters are
 * skipped, so "3M Company" is MC. An empty result is the glyph's cue. */
export function toInitials(name: string, from: 'edges' | 'start' = 'edges'): string {
	const letters = name
		.split(/\s+/)
		.map((word) => /\p{L}/u.exec(word)?.[0])
		.filter((letter) => letter !== undefined);

	if (letters.length < 2) return (letters.at(0) ?? '').toUpperCase();

	const [first, second] = from === 'start' ? [letters.at(0), letters.at(1)] : [letters.at(0), letters.at(-1)];

	return `${first ?? ''}${second ?? ''}`.toUpperCase();
}

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
	name: string;
	src?: string | null;
	initialsFrom?: 'edges' | 'start';
	/** Classes for the initials only. Separate from `className` because a logo brings its own colours
	 * and is often transparent, so a tint meant for two letters would sit behind someone's brand. */
	fallbackClassName?: string;
}

/** A logo, the initials of whoever has none, or a glyph when there is not even a name. Decorative:
 * every avatar sits beside the name it depicts, so a second accessible name would be read twice. */
function Avatar({ name, src, className, fallbackClassName, initialsFrom = 'edges', ...props }: AvatarProps) {
	const initials = toInitials(name, initialsFrom);
	/* An avatar URL outlives the file it points at - Productive's CDN 404s for a logo since replaced -
	 * and a broken-image glyph is worse than initials. Keyed on `src` so a new one gets its own try. */
	const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

	if (src !== null && src !== undefined && src !== '' && src !== failedSrc) {
		return (
			<img
				src={src}
				alt=""
				onError={() => {
					setFailedSrc(src);
				}}
				/* White, never a tint: most logos carry their own white ground. Before `className` so a
				 * caller can override - a brand mark needs `object-contain`, not `object-cover`. */
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
