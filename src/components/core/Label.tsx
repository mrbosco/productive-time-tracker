import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * shadcn's Label on Radix, restyled to the design tokens. Every input has a visible one
 * (guidebook 18) - this is not a slot for placeholder-only fields.
 *
 * Muted by default because that is what every field label in the design is. It also sidesteps a
 * trap: `cn` merges through tailwind-merge, which reads `text-label` (a size) and `text-muted`
 * (a colour) as one `text-*` group and keeps only the later - so passing a colour in through
 * `className` would silently drop the size.
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				'flex items-center gap-2 text-label leading-none font-medium text-muted select-none',
				'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
				'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
				className
			)}
			{...props}
		/>
	);
}

export { Label };
