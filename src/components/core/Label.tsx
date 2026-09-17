import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/** shadcn's Label on Radix, restyled to the design tokens. Muted by default, which also sidesteps a
 * trap: tailwind-merge reads `text-label` and `text-muted` as one group and keeps only the later. */
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
