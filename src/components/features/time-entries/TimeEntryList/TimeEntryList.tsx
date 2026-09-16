import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { TimeEntry } from '@/api/types';
import { Button } from '@/components/core/Button';
import { TimeEntryCard } from '@/components/features/time-entries/TimeEntryCard/TimeEntryCard';
import { EmptyDayIllustration, LoadFailedIllustration } from '@/components/shared/Illustration/Illustration';

interface TimeEntryListProps {
	entries: TimeEntry[] | undefined;
	isPending: boolean;
	/** A retry already in flight, so the button says so instead of looking inert. */
	isRetrying?: boolean;
	onRetry: () => void;
	/** The day being shown, so the empty state's `Add entry` lands on the right date. */
	date: string;
	/** Asks the day view to confirm a delete (R-12). The dialog and the toast belong to the screen. */
	onRequestDelete: (entry: TimeEntry) => void;
}

/** The card the empty and error states share, so the list never collapses to nothing. */
function ListState({ children, role }: { children: ReactNode; role?: 'alert' }) {
	return (
		<div
			role={role}
			className="flex flex-col items-center gap-4 rounded-entry border border-line bg-surface px-5 py-7 text-center"
		>
			{children}
		</div>
	);
}

function CardSkeleton() {
	return (
		<div aria-hidden="true" className="flex animate-pulse gap-3.5 rounded-entry border border-line bg-surface p-4">
			<div className="h-5 w-16 flex-none rounded-md bg-subtle" />
			<div className="flex flex-1 flex-col gap-2">
				<div className="h-3.5 rounded-md bg-subtle" />
				<div className="h-3.5 w-[70%] rounded-md bg-subtle" />
				<div className="h-3 w-[45%] rounded-md bg-subtle" />
			</div>
		</div>
	);
}

/**
 * The day's entries, and the three ways there are none to show.
 *
 * ponytail: `empty` and `error` are states of this component rather than `shared/EmptyState` and
 * `shared/ErrorState`, which SPEC 6.1 names - the design's own component sheet captions them
 * `TimeEntryList · empty / error / loading`, and each would have exactly one caller today.
 *
 * US-3 was expected to be the second caller and turned out not to be. Its "this entry no longer
 * exists" is a bare centred sentence and a link on the page background
 * (`04-edit-entry-mobile-notfound.png`), where these are a bordered card with an illustration, a
 * sentence and a button - sharing a component between them would mean a prop for every part that
 * differs, which is all of them. It stays here until something wants *this* shape.
 */
export function TimeEntryList({
	entries,
	isPending,
	isRetrying = false,
	onRetry,
	date,
	onRequestDelete,
}: TimeEntryListProps) {
	if (isPending) {
		return (
			<div className="flex flex-col gap-3">
				{/*
				 * `role="status"` so the wait is announced: a screen-reader user gets silence
				 * otherwise, because skeletons are decoration and carry no text.
				 */}
				<span role="status" className="sr-only">
					Loading entries
				</span>

				{[0, 1, 2].map((index) => (
					<CardSkeleton key={index} />
				))}
			</div>
		);
	}

	/*
	 * R-8. The list reports its own failure and offers a way out, rather than the route's error
	 * boundary replacing the whole screen - the date navigator above stays usable, so another day
	 * is one tap away even while this one is failing.
	 *
	 * The condition is "nothing to show", not "the query reports an error". A refetch that fails
	 * after a successful load leaves the day's entries in the cache, and replacing a list the user
	 * can still read with an error card loses more than it explains.
	 *
	 * `role="alert"` because this replaces the `role="status"` of the loading branch. Without it
	 * the live region simply unmounts and the failure is inserted as static text, so a screen
	 * reader announces nothing at all.
	 */
	if (entries === undefined) {
		return (
			<ListState role="alert">
				<LoadFailedIllustration />
				<p className="text-base leading-[140%]">Could not load entries.</p>
				<Button variant="outline" disabled={isRetrying} onClick={onRetry}>
					{isRetrying ? 'Retrying...' : 'Retry'}
				</Button>
			</ListState>
		);
	}

	// R-7: one sentence and the primary action, with the illustration beside them rather than
	// instead of them.
	if (entries.length === 0) {
		return (
			<ListState>
				<EmptyDayIllustration />
				<p className="text-base leading-[140%]">Nothing logged for this day yet.</p>
				<Button asChild>
					<Link to="/entries/new" search={{ date }}>
						Add entry
					</Link>
				</Button>
				{/*
				 * X-3 copies yesterday's entries into this day. Drawn here because the design puts
				 * it in this state; it does nothing until that story lands.
				 */}
				<button
					type="button"
					disabled
					className="rounded-input text-meta font-medium text-accent underline underline-offset-[3px] disabled:opacity-60"
				>
					Copy from yesterday (X-3)
				</button>
			</ListState>
		);
	}

	return (
		<ul className="flex flex-col gap-3">
			{entries.map((entry) => (
				<li key={entry.id}>
					<TimeEntryCard
						entry={entry}
						onRequestDelete={() => {
							onRequestDelete(entry);
						}}
					/>
				</li>
			))}
		</ul>
	);
}
