import { useQuery } from '@tanstack/react-query';
import { labelServices } from '@/api/services';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/core/Sheet';
import { useSession } from '@/components/features/auth/useSession';
import { ServicePicker } from '@/components/features/settings/ServicePicker/ServicePicker';
import { servicesQueryOptions } from '@/components/features/settings/useDefaultService';
import { useRecentServiceIds } from '@/components/features/settings/useRecentServices';
import { useOrganizationCompanyId } from '@/components/features/settings/useOrganizationCompanyId';
import type { Session } from '@/lib/storage';

interface SettingsSheetProps {
	session: Session;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** The Default service sheet. The entry form has three fields and the API needs a service on every
 * create, so it is chosen once here. Choosing applies immediately, so `Done` only closes. */
export function SettingsSheet({ session: routeSession, open, onOpenChange }: SettingsSheetProps) {
	const { session: liveSession, login } = useSession();
	/* The live session, not the one the route handed down. Choosing writes through `login`, and the
	 * prop is a snapshot taken before that - so reading it left the row still unticked and the
	 * footer still naming the old service after a successful pick. */
	const session = liveSession ?? routeSession;
	// Only while it is open. The list is already prefetched at login for the entry form, and
	// a closed sheet mounted on every authenticated screen has no business issuing a request - or
	// re-issuing one the moment logout clears the cache.
	const { data, isPending, isError, refetch } = useQuery({ ...servicesQueryOptions(session), enabled: open });
	const recentIds = useRecentServiceIds(session, open);
	const ownCompanyId = useOrganizationCompanyId(session);

	const services = data ?? [];
	/** Resolved against the list, not just read off the session: a service that was the default and
	 * has since been disabled is no longer among the options, and marking a row that is not there
	 * would disagree with `useDefaultService`, which has already fallen back to the first by name. */
	const stored = services.find((service) => service.id === session.defaultServiceId);
	const selected = stored ?? [...services].sort((a, b) => a.name.localeCompare(b.name))[0];
	const [current] = labelServices(selected === undefined ? [] : [selected]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent aria-describedby={undefined} className="flex h-[88dvh] flex-col md:h-auto">
				<div className="flex-none">
					<SheetTitle className="block">Default service</SheetTitle>
					<SheetDescription className="mt-1">Used for new entries and the timer.</SheetDescription>
				</div>

				{isPending && (
					<div className="mt-4 flex flex-col gap-2" aria-hidden="true">
						<div className="h-11 animate-pulse rounded-input bg-subtle" />
						{[62, 48, 70, 54].map((width) => (
							<div key={width} className="flex min-h-14 items-center gap-3 px-3">
								<span className="size-5 flex-none animate-pulse rounded-pill bg-subtle" />
								<span className="flex flex-1 flex-col gap-1.5">
									<span className="h-3 animate-pulse rounded-[5px] bg-subtle" style={{ width: `${String(width)}%` }} />
									<span className="h-2.5 w-[46%] animate-pulse rounded-[5px] bg-subtle" />
								</span>
							</div>
						))}
					</div>
				)}

				{isError && (
					<div role="alert" className="mt-8 flex flex-col items-center gap-3.5 px-5 text-center">
						<p className="text-list">Could not load services.</p>
						<button
							type="button"
							onClick={() => void refetch()}
							className="duration-ui h-11 rounded-pill border border-line px-4.5 text-meta font-medium transition-colors ease-ui hover:bg-subtle"
						>
							Retry
						</button>
					</div>
				)}

				{!isPending && !isError && services.length === 0 && (
					<div className="mt-8 flex flex-col items-center gap-3 px-5 text-center">
						<p className="text-list">No services are assigned to you in this organization.</p>
						<p className="text-label text-muted">
							Ask an administrator to add you to a project, then reopen this sheet.
						</p>
					</div>
				)}

				{services.length > 0 && (
					<>
						<div className="mt-3.5 flex min-h-0 flex-1 flex-col">
							<ServicePicker
								services={services}
								selectedId={selected?.id ?? null}
								recentIds={recentIds}
								ownCompanyId={ownCompanyId}
								onSelect={(service) => {
									login({ ...session, defaultServiceId: service.id });
									if (!window.matchMedia?.('(hover: hover)').matches) onOpenChange(false);
								}}
							/>
						</div>

						<div className="flex flex-none items-center gap-3 border-t border-line pt-3.5">
							<span className="min-w-0 flex-1 truncate text-caption text-muted">
								Default: <span className="font-medium text-ink">{current?.label ?? '—'}</span>
							</span>
							<button
								type="button"
								onClick={() => {
									onOpenChange(false);
								}}
								className="duration-ui hidden h-11 flex-none rounded-pill bg-accent px-5 text-meta font-medium text-on-accent transition-colors ease-ui hover:bg-accent-dark md:block"
							>
								Done
							</button>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
