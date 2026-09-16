import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * shadcn's Input, restyled to the design tokens (guidebook 16: copied in, edited here).
 *
 * 56px tall and 16px text: the design's field height, and anything under 16px makes iOS Safari
 * zoom the page on focus. Focus is the global `:focus-visible` outline from `styles/index.css`,
 * so the shadcn ring utilities are gone rather than overridden.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'h-14 w-full min-w-0 rounded-input border border-line bg-surface px-4 text-base text-ink transition-[color,background-color,border-color]',
				'placeholder:text-muted',
				'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted',
				'aria-invalid:border-danger',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
