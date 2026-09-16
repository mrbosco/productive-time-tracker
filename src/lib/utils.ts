import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's own scales. The `@theme` block in `styles/index.css`
 * renames the type scale (`--text-title`, `--text-meta`, …), and without being told, tailwind-merge
 * reads `text-title` as an unknown `text-*` and files it with the colours - so `cn('text-title',
 * 'text-muted')` drops the size and leaves the element at its inherited one. Silently: the class is
 * gone from the DOM, with nothing to grep for.
 *
 * Listing the scale here is the fix, and it has to be updated when the scale is.
 */
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			'font-size': [{ text: ['display', 'title', 'duration', 'list', 'meta', 'label', 'caption', 'micro'] }],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
