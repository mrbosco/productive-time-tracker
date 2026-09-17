import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** tailwind-merge only knows Tailwind's own scales. The `@theme` block in `styles/index.css` renames
 * the type scale (`--text-title`, `--text-meta`, …), and untold, tailwind-merge files `text-title`
 * with the colours - so `cn('text-title', 'text-muted')` silently drops the size. Keep this list in
 * step with the scale. */
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
