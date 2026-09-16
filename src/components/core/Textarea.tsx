import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * shadcn's Textarea, restyled to the design tokens (guidebook 16: copied in, edited here).
 *
 * Sized and coloured to match `Input`, including `placeholder:text-muted` - Tailwind's Preflight
 * leaves the placeholder at the browser's own grey, which is not this design's muted.
 *
 * `resize-none` because the design draws a fixed box and a drag handle would break the sticky
 * footer's layout on mobile. `field-sizing-content` grows it with the text instead, which is the
 * autogrow the brief asks for and is a CSS property rather than a resize observer.
 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'field-sizing-content min-h-28 w-full rounded-input border border-line bg-surface px-4 py-3.5',
				'resize-none text-base leading-[1.45] text-ink transition-[color,background-color,border-color]',
				'placeholder:text-muted',
				'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted',
				'aria-invalid:border-danger',
				className
			)}
			{...props}
		/>
	);
}

export { Textarea };
