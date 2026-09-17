import { useState } from 'react';
import type { Service } from '@/api/types';
import { Avatar } from '@/components/core/Avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/core/Sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/core/Tooltip';
import { useHasHover } from '@/components/shared/useHasHover';
import { cn } from '@/lib/utils';
import { type ServiceContextRow, serviceContextRows } from './ServiceContext.utils';

/** The card's meta line: `project · service`, with the project name opening everything behind it.
 * Five levels sit under a service, and all five on the card would make it a database record. */
export function ServiceContext({ service }: { service: Service | null }) {
	const rows = serviceContextRows(service);
	const projectName = service?.projectName ?? null;
	const serviceName = service?.name ?? 'Unknown service';

	return (
		<p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-label leading-[140%] text-muted">
			{projectName !== null &&
				(rows.length === 0 ? (
					// Nothing behind the name, so nothing to hint at. A dotted underline that opens
					// an empty panel is worse than plain text.
					<span className="font-medium text-ink">{projectName}</span>
				) : (
					<ServiceContextDisclosure
						projectName={projectName}
						companyName={service?.companyName ?? null}
						companyAvatarUrl={service?.companyAvatarUrl ?? null}
						rows={rows}
					/>
				))}
			<span className="rounded-md bg-subtle/70 px-2 py-0.5 text-caption">{serviceName}</span>
		</p>
	);
}

/** The project name, and the two ways of reading what is behind it. A real `button` with
 * `aria-expanded`, so it is reachable from the keyboard; touch gets a sheet rather than a tooltip. */
function ServiceContextDisclosure({
	projectName,
	companyName,
	companyAvatarUrl,
	rows,
}: {
	projectName: string;
	companyName: string | null;
	companyAvatarUrl: string | null;
	rows: ServiceContextRow[];
}) {
	const hasHover = useHasHover();
	const [isOpen, setIsOpen] = useState(false);

	/* The hit area is grown with a pseudo-element, downward only, because upward is the note and its
	 * `More` button. `onClick` is touch-only: Radix already opens the tooltip on focus, so a toggle
	 * here closed the panel the keyboard had just opened. */
	const renderTrigger = (onClick?: () => void) => (
		<button
			type="button"
			aria-expanded={isOpen}
			onClick={onClick}
			className={cn(
				'relative text-left text-meta font-semibold text-ink decoration-accent/40 underline-offset-4 hover:text-accent hover:underline',
				'[@media(hover:none)]:before:absolute [@media(hover:none)]:before:inset-x-0 [@media(hover:none)]:before:-top-2 [@media(hover:none)]:before:-bottom-4'
			)}
		>
			{projectName}
		</button>
	);

	if (!hasHover) {
		return (
			<>
				{renderTrigger(() => {
					setIsOpen((open) => !open);
				})}
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetContent aria-describedby={undefined} className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<Avatar
								name={companyName ?? ''}
								src={companyAvatarUrl}
								initialsFrom="start"
								className="size-10 flex-none rounded-[10px] object-contain p-1.5"
								fallbackClassName={cn(
									'text-micro font-bold tracking-[.02em]',
									companyName === null ? 'border border-line bg-subtle text-muted' : 'bg-selection text-accent-dark'
								)}
							/>
							<div className="min-w-0">
								<SheetTitle className="truncate">{companyName ?? 'Unknown company'}</SheetTitle>
								<p className="text-caption text-muted">Company</p>
							</div>
						</div>

						<dl className="flex flex-col">
							{rows.map((row) => (
								<div key={row.label} className="flex items-baseline gap-3.5 border-t border-line py-2.5">
									<dt className="w-[66px] flex-none text-label text-muted">{row.label}</dt>
									<dd className="flex-1 text-base leading-[140%] font-medium">{row.value}</dd>
								</div>
							))}
						</dl>

						<button
							type="button"
							onClick={() => {
								setIsOpen(false);
							}}
							className="duration-ui h-12 rounded-pill border border-line bg-surface text-list font-medium transition-colors ease-ui hover:bg-subtle"
						>
							Close
						</button>
					</SheetContent>
				</Sheet>
			</>
		);
	}

	return (
		/* The design's own 200ms rather than the week strip's second. Nothing sweeps across this one
		 * on the way somewhere else: it is a dotted target in the middle of a row that has to be
		 * aimed at, so a pointer resting on it already means it. */
		<Tooltip open={isOpen} onOpenChange={setIsOpen} delayDuration={200}>
			<TooltipTrigger asChild>{renderTrigger()}</TooltipTrigger>
			{/* Below the name, never above it: the note sits directly over this line, and a panel
			 * opening upward covers the very thing the entry is about. Radix still flips it when
			 * there is no room underneath. */}
			<TooltipContent side="bottom" align="start" className="max-w-[300px] min-w-[252px]">
				<dl className="flex flex-col gap-1.5">
					{rows.map((row) => (
						<div key={row.label} className="flex items-baseline gap-3.5">
							{/* Fixed label column, so three values start on the same edge and read as a
							    list rather than as a sentence with colons in it. */}
							<dt className="w-[58px] flex-none text-caption text-on-accent/60">{row.label}</dt>
							<dd className="flex-1 text-label leading-[140%] font-medium">{row.value}</dd>
						</div>
					))}
				</dl>
			</TooltipContent>
		</Tooltip>
	);
}
