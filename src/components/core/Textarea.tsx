import * as React from 'react';
import { cn } from '@/lib/utils';

/** shadcn's Textarea, copied in and restyled to the design tokens. `resize-none` because a drag
 * handle would break the sticky footer on mobile; `field-sizing-content` autogrows it instead. */
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
