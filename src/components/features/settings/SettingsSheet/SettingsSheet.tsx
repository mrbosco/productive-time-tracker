import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { labelServices } from '@/api/services';
import { Select } from '@/components/core/Select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/core/Sheet';
import { useSession } from '@/components/features/auth/useSession';
import { servicesQueryOptions } from '@/components/features/settings/useDefaultService';
import type { Session } from '@/lib/storage';

interface SettingsSheetProps {
	session: Session;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The Default service sheet (A-1): a bottom sheet on mobile, a side panel on desktop.
 *
 * It exists because the entry form has exactly three fields and the API needs a service on every
 * create. The service is therefore chosen once, here, rather than on every entry - and this is the
 * only place it can be changed, which is why A-1b sends a person here when Productive refuses the
 * service their entry was logged against.
 *
 * There are no Cancel and Save buttons: the design draws none, and a single select that applies on
 * change has nothing to confirm.
 *
 * Failing to load and having nothing to load are rendered differently on purpose (A-1). "We could
 * not read the list" is a problem to retry; "this organization tracks nothing" is a fact about the
 * account, and showing the second when the first happened sends someone to the wrong place.
 */
export function SettingsSheet({ session, open, onOpenChange }: SettingsSheetProps) {
	const { login } = useSession();
	// Only while it is open. The list is already prefetched at login for the entry form (A-1), and
	// a closed sheet mounted on every authenticated screen has no business issuing a request - or
	// re-issuing one the moment logout clears the cache.
	const { data, isPending, isError } = useQuery({ ...servicesQueryOptions(session), enabled: open });
	const selectId = useId();

	// Sorted by name before labelling, so the order is stable across sessions - `/services`
	// guarantees none of its own.
	const labelled = data === undefined ? [] : labelServices([...data].sort((a, b) => a.name.localeCompare(b.name)));
	/**
	 * Resolved against the list, not just read off the session: a service that was the default and
	 * has since been disabled is no longer among the options, and pointing the select at a value
	 * with no option would leave it showing the first one while claiming the stored one -
	 * disagreeing with `useDefaultService`, which has already fallen back.
	 */
	const stored = labelled.find((entry) => entry.service.id === session.defaultServiceId);
	const selectedId = (stored ?? labelled[0])?.service.id;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent aria-describedby={undefined}>
				<SheetTitle className="mb-[18px] block md:mb-5">Default service</SheetTitle>

				{isPending && <p className="text-meta text-muted">Loading services…</p>}

				{isError && (
					<p role="alert" className="text-meta text-danger-ink">
						Could not load the service list. Close this and try again.
					</p>
				)}

				{!isPending && !isError && labelled.length === 0 && (
					<p className="text-meta text-muted">
						This organization has no services with time tracking enabled, so entries cannot be logged yet.
					</p>
				)}

				{labelled.length > 0 && (
					<div className="flex flex-col gap-1.5">
						<label htmlFor={selectId} className="text-label font-medium text-muted">
							Default service
						</label>
						<Select
							id={selectId}
							value={selectedId}
							onChange={(event) => {
								login({ ...session, defaultServiceId: event.target.value });
								onOpenChange(false);
							}}
						>
							{labelled.map(({ service, label }) => (
								<option key={service.id} value={service.id}>
									{label}
								</option>
							))}
						</Select>
						<SheetDescription className="pl-0.5">Used for new entries and the timer.</SheetDescription>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
