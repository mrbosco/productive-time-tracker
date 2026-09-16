import { createFileRoute, Link } from '@tanstack/react-router';
import { z } from 'zod';
import { isoDateSchema, todayIso } from '@/lib/date';

/**
 * Placeholder. US-2 fills in the entry form; what is here is the route itself, because R-7's
 * empty state has to offer a working `Add entry` and a typed `<Link>` cannot point at a route that
 * does not exist yet.
 */
export const Route = createFileRoute('/_authenticated/entries/new')({
	// A-5: the day being logged travels in the search param, so the form opens on the date the
	// user was looking at. Validated here for the same reason `/day/$date` validates its param.
	validateSearch: z.object({ date: isoDateSchema.catch(todayIso) }),
	component: NewEntryRoute,
});

function NewEntryRoute() {
	const { date } = Route.useSearch();

	return (
		<main className="mx-4 flex flex-col items-start gap-4 py-6 md:mx-12">
			<h1 tabIndex={-1} className="text-title font-bold tracking-tight">
				New entry
			</h1>
			<p className="text-list text-muted">The entry form arrives with US-2.</p>
			<Link to="/day/$date" params={{ date }} className="text-list text-accent hover:underline">
				Back to the day
			</Link>
		</main>
	);
}
