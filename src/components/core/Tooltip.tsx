import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/** The dark panel a hover reveals, on Radix. Not a substitute for a label: a tooltip is unreachable
 * on touch, so the caller draws something else there. */
function Tooltip({
	/* A second by default, which is the week strip's case: seven cells you sweep across on the way
	 * to clicking one, where the design's 200ms fires four panels in passing. A caller whose target
	 * is not swept over - the project name, which you have to aim at - passes the shorter delay. */
	delayDuration = 1000,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return (
		<TooltipPrimitive.Provider delayDuration={delayDuration}>
			<TooltipPrimitive.Root data-slot="tooltip" {...props} />
		</TooltipPrimitive.Provider>
	);
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
	className,
	sideOffset = 6,
	collisionPadding = 16,
	children,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				data-slot="tooltip-content"
				sideOffset={sideOffset}
				collisionPadding={collisionPadding}
				className={cn('z-50 rounded-input bg-raised px-3.5 py-3 text-on-accent shadow-menu', className)}
				{...props}
			>
				{children}
				<TooltipPrimitive.Arrow className="fill-raised" width={14} height={7} />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipContent, TooltipTrigger };
