import { useQuery } from '@tanstack/react-query';
import type { Service } from '@/api/types';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/core/Sheet';
import { ServicePicker } from '@/components/features/settings/ServicePicker/ServicePicker';
import { servicesQueryOptions } from '@/components/features/settings/useDefaultService';
import { useOrganizationCompanyId } from '@/components/features/settings/useOrganizationCompanyId';
import { useRecentServiceIds } from '@/components/features/settings/useRecentServices';
import type { Session } from '@/lib/storage';

/**
 * `Add row`: choosing the project and service a new timesheet row is for (UI-7).
 *
 * The design says this picker is "the main new component this view needs" - and it was already
 * built for UI-11's default-service sheet, which is what that page meant by "building it here pays
 * for both". Nothing new here but the wrapper and the words.
 */
export function AddRowSheet({
	session,
	open,
	onOpenChange,
	onAdd,
}: {
	session: Session;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (service: Service) => void;
}) {
	const { data } = useQuery({ ...servicesQueryOptions(session), enabled: open });
	const recentIds = useRecentServiceIds(session, open);
	const ownCompanyId = useOrganizationCompanyId(session);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent aria-describedby={undefined} className="flex h-[88dvh] flex-col md:h-auto">
				<div className="flex-none">
					<SheetTitle className="block">Add a row</SheetTitle>
					<SheetDescription className="mt-1">The project and service this week&apos;s row is for.</SheetDescription>
				</div>

				<div className="mt-3.5 flex min-h-0 flex-1 flex-col">
					<ServicePicker
						services={data ?? []}
						selectedId={null}
						recentIds={recentIds}
						ownCompanyId={ownCompanyId}
						onSelect={onAdd}
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
