import { createFileRoute, redirect } from '@tanstack/react-router';
import { todayIso } from '@/lib/date';

/** `/` is not a screen: the day view is, and it always carries a date so it can be linked and stepped
 * through (ADR-0007). `replace`, so Back from the day view does not bounce forward again. */
export const Route = createFileRoute('/_authenticated/')({
	beforeLoad: () => {
		throw redirect({ to: '/day/$date', params: { date: todayIso() }, replace: true });
	},
});
