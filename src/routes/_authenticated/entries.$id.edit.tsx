import { createFileRoute, Link, useNavigate, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ApiError } from '@/api/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/core/Dialog';
import { DayView } from '@/components/features/time-entries/DayView/DayView';
import { TimeEntryForm } from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import { weekEntriesQueryOptions } from '@/components/features/week/useWeekEntries';
import { todayIso } from '@/lib/date';

export const Route = createFileRoute('/_authenticated/entries/$id/edit')({
	/** Awaited, unlike the day route's (ADR-0007): a form cannot open half-prefilled, and the entry's
	 * date decides which day renders behind it. The router owning that wait is what makes the
	 * skeleton a `pendingComponent` rather than another branch inside the form. The day and its week
	 * are started but not awaited - they are decoration behind a modal.
	 *
	 * `fetchQuery` rather than `ensureQueryData`, which hands back whatever is cached however old it
	 * is: an entry changed in Productive itself, in another tab, would have opened this form on the
	 * values from before that change. This respects the client's staleness instead, so reopening a
	 * form straight after closing it still costs no request. */
	loader: async ({ context, params }) => {
		const entry = await context.queryClient.fetchQuery(timeEntryQueryOptions(context.session, params.id));

		void context.queryClient.prefetchQuery(weekEntriesQueryOptions(context.session, entry.date));

		return entry;
	},

	component: EditEntryRoute,
	pendingComponent: EditEntryPending,
	errorComponent: EditEntryErrorRoute,
});

/** Editing an entry. The entry comes from the loader rather than a `useQuery` subscription: a
 * background refetch pushing a new `note` into an editor someone is typing in would overwrite it. */
function EditEntryRoute() {
	const { session } = Route.useRouteContext();
	const entry = Route.useLoaderData();

	return (
		<>
			<DayView session={session} date={entry.date} />
			<TimeEntryForm session={session} date={entry.date} entry={entry} />
		</>
	);
}

/** The dialog the entry is not in yet, or never will be. Neither state renders `DayView` behind it:
 * the entry's date is what says which day that would be, and in both it is what is missing. */
function EditEntryShell({ children }: { children: ReactNode }) {
	const navigate = useNavigate();

	function close() {
		// Today, because neither state knows the entry's own date. Nothing is typed here, so there is
		// no draft to ask about.
		void navigate({ to: '/day/$date', params: { date: todayIso() } });
	}

	return (
		/* `onOpenChange` is what gives Escape and the backdrop their meaning: without it Radix traps
		 * focus in a dialog whose only exit is whatever button happens to be inside it. */
		<Dialog
			open
			onOpenChange={(next) => {
				if (!next) close();
			}}
		>
			<DialogContent
				className="inset-0 flex h-dvh w-full flex-col overflow-hidden md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[calc(100%-64px)] md:w-[min(560px,calc(100%-64px))] md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-y-auto md:rounded-panel md:p-7 md:shadow-dialog"
				aria-describedby={undefined}
			>
				<div className="flex h-14 flex-none items-center gap-1 border-b border-line bg-surface px-2 md:h-auto md:flex-row-reverse md:justify-between md:border-0 md:p-0">
					<button
						type="button"
						onClick={close}
						aria-label="Close"
						className="duration-ui grid size-11 flex-none place-items-center rounded-pill text-muted transition-colors ease-ui hover:bg-subtle md:size-10"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="md:hidden">
							<path d="M12.6 3.4 6 10l6.6 6.6 1.7-1.7L9.4 10l4.9-4.9-1.7-1.7Z" fill="currentColor" />
						</svg>
						<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="hidden md:block">
							<path
								d="M5.6 4.2 10 8.6l4.4-4.4 1.4 1.4L11.4 10l4.4 4.4-1.4 1.4L10 11.4l-4.4 4.4-1.4-1.4L8.6 10 4.2 5.6 5.6 4.2Z"
								fill="currentColor"
							/>
						</svg>
					</button>
					<DialogTitle className="text-base font-medium tracking-[-.01em] md:text-title md:font-bold md:tracking-[-.02em]">
						Edit entry
					</DialogTitle>
				</div>

				{children}
			</DialogContent>
		</Dialog>
	);
}

function FieldSkeleton({ className }: { className?: string }) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="h-3 w-16 rounded-md bg-subtle" />
			<div className={`rounded-input bg-subtle ${className ?? 'h-14 md:h-13'}`} />
		</div>
	);
}

/** Field-shaped skeletons, in the field order. */
function EditEntryPending() {
	return (
		<EditEntryShell>
			<div aria-hidden="true" className="flex animate-pulse flex-col gap-[22px] px-4 pt-6 md:p-0">
				<FieldSkeleton />
				<FieldSkeleton />
				<FieldSkeleton className="h-26" />
			</div>
			{/* Skeletons carry no text, so without this a screen-reader user gets silence. */}
			<span role="status" className="sr-only">
				Loading entry
			</span>
		</EditEntryShell>
	);
}

/** Branched on the status rather than assuming 404: an entry deleted in another tab is genuinely gone
 * and "Try again" cannot work, but telling someone their entry no longer exists when the server
 * merely fell over invites them to redo work they never lost. */
function isMissingEntry(error: unknown): boolean {
	return error instanceof ApiError && error.status === 404;
}

/** Exported so it can be rendered on its own. `Route.options.errorComponent` cannot be: the router
 * wraps it, and the wrapper reads a match this route has none of outside a real navigation. */
export function EditEntryErrorState({ error }: { error: unknown }) {
	const router = useRouter();
	const isGone = isMissingEntry(error);

	return (
		<EditEntryShell>
			<div
				role="alert"
				className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center md:py-12"
			>
				<p className="text-base leading-[140%]">
					{isGone ? 'This entry no longer exists.' : 'Could not load this entry.'}
				</p>

				{/* `router.invalidate()`, not the boundary's own `reset`: resetting only re-renders the
				     match, which is still in its error state and throws the same error straight back. */}
				{!isGone && (
					<button
						type="button"
						onClick={() => {
							void router.invalidate();
						}}
						className="rounded-input text-base font-medium text-accent underline underline-offset-[3px]"
					>
						Try again
					</button>
				)}

				{/* Always offered: a retry that keeps failing must not be the only way out. */}
				<Link
					to="/day/$date"
					params={{ date: todayIso() }}
					className="rounded-input text-base font-medium text-accent underline underline-offset-[3px]"
				>
					Go to today
				</Link>
			</div>
		</EditEntryShell>
	);
}

function EditEntryErrorRoute({ error }: ErrorComponentProps) {
	return <EditEntryErrorState error={error} />;
}
