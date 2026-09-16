import { createFileRoute, redirect } from '@tanstack/react-router';
import { todayIso } from '@/lib/date';

/**
 * `/` is not a screen: the day view is, and it always has a date in the URL so it can be linked,
 * refreshed and stepped through (ADR-0007). Today is the default the assignment asks for (R-3).
 *
 * `replace` so the redirect does not sit in history - otherwise Back from the day view lands on
 * `/` and bounces straight forward again.
 */
export const Route = createFileRoute('/_authenticated/')({
	beforeLoad: () => {
		throw redirect({ to: '/day/$date', params: { date: todayIso() }, replace: true });
	},
});
