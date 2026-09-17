import * as React from 'react';
import { cn } from '@/lib/utils';

/** shadcn's Input, copied in and restyled to the design tokens. 16px text because anything under it
 * makes iOS Safari zoom the page on focus; focus is the global `:focus-visible` outline. */
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
