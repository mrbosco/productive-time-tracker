import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The dark panel a hover reveals (UI-2), on Radix.
 *
 * The provider is folded into the root rather than mounted once at the top of the app: the only
 * thing it carries is the delay, that delay is the design's and is the same everywhere, and a
 * caller that has to remember to wrap its own tooltip is a caller that will forget.
 *
 * Not a substitute for a label. Radix opens this on focus as well as hover and closes it on
 * Escape, but a tooltip is unreachable on touch either way - the caller is expected to draw
 * something else there (guidebook 18).
 */
function Tooltip({
	/*
	 * Two seconds, not the design's 200ms. A pointer crosses these targets constantly - the project
	 * name sits mid-card and the day cells are a row you sweep across to click one - and at 200ms
	 * the panel fires on the way past. This is supplementary detail nobody is waiting on, so the
	 * delay is set to the length of a deliberate rest rather than to a reflex.
	 */
	delayDuration = 2000,
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
