import { Clock3 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { Input } from '@/components/core/Input';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { todayIso } from '@/lib/date';
import { cn } from '@/lib/utils';

function PlayIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
			<path d="M6 3.6 16 10 6 16.4V3.6Z" fill="currentColor" />
		</svg>
	);
}

/**
 * Describe, then track (UI-3).
 *
 * The line used to do one thing - open the entry form - and the design's reading of the common case
 * is that it is the other one: you write down what you are about to do and start the clock. So the
 * row has two actions, a primary `Start` and a quiet `Log time` for work already done.
 *
 * `Start` writes nothing into a URL and `Log time` carries the text in history state rather than in
 * the query string, for the reason `/entries/new` gives about `duplicate`: a description is
 * somebody's writing, and a query string is kept in their history and in any link they share.
 *
 * P-1's parser stays cut. Nothing here reads `1.5h` out of the text - the words become the
 * description and the duration comes from the clock or from the form.
 */
export function QuickAddInput({ date }: { date: string }) {
	const navigate = useNavigate();
	const timer = useTimerContext();
	const fieldId = useId();
	const [value, setValue] = useState('');

	const described = value.trim();
	const isTracking = timer.running !== null;
	/*
	 * A timer runs now, so it only belongs on today. On any other day `Start` offered to track work
	 * that is already over - and, because `POST /timers` files its entry on today, it answered by
	 * leaving the day you were looking at. `Log time` is the whole row on a past or future day.
	 */
	const canTrack = date === todayIso();

	/** Only ever called on today, so the row it creates is the row already on screen. */
	function startTracking() {
		timer.start(described);
		setValue('');
	}

	function logTime() {
		void navigate({
			to: '/entries/new',
			search: { date },
			state: described === '' ? undefined : { quickAddNote: described },
		});
	}

	return (
		<form
			className="flex flex-col gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				// Enter starts the clock, because that is the action the row is primarily for. `Log
				// time` is a click away for the other one - and is the only one on another day.
				if (described === '' || !canTrack) {
					logTime();

					return;
				}
				startTracking();
			}}
		>
			<div className="flex items-center gap-1 rounded-entry border border-accent/20 bg-surface p-2 shadow-card transition-[border-color,box-shadow] focus-within:border-accent/60 focus-within:shadow-control sm:gap-2 sm:p-3">
				<span
					aria-hidden="true"
					className="hidden size-11 shrink-0 items-center justify-center rounded-control bg-selection text-accent sm:flex"
				>
					<Clock3 size={21} strokeWidth={1.6} />
				</span>
				<label htmlFor={fieldId} className="sr-only">
					Quick add an entry
				</label>
				<Input
					id={fieldId}
					value={value}
					onChange={(event) => {
						setValue(event.target.value);
					}}
					placeholder="What are you working on?"
					className="h-11 flex-1 border-0 bg-transparent px-2.5 text-base md:text-list"
				/>

				{canTrack && (
					<button
						type="submit"
						// Not disabled while one runs: starting a second retires the first rather than
						// refusing, which is what somebody moving on to the next thing means by it.
						disabled={described === ''}
						className={cn(
							'duration-ui flex h-11 flex-none items-center gap-2 rounded-control bg-accent px-4 text-meta font-medium text-on-accent transition-colors ease-ui',
							'hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted'
						)}
					>
						<PlayIcon />
						Start
					</button>
				)}
				{/* The primary action on any day but today, and it is the only one there. */}
				<button
					type={canTrack ? 'button' : 'submit'}
					onClick={logTime}
					className={cn(
						'duration-ui h-11 flex-none rounded-control px-4 text-meta font-medium transition-colors ease-ui',
						canTrack
							? 'hidden border border-line hover:bg-subtle sm:block'
							: 'bg-accent text-on-accent hover:bg-accent-dark'
					)}
				>
					Log time
				</button>
			</div>

			<span className="px-2 text-caption leading-relaxed text-muted">
				{!canTrack
					? 'Log time opens the form for this day · the timer only runs on today'
					: isTracking
						? 'Starting this stops the timer that is running and keeps its time'
						: 'Start tracks against your default service · Log time opens the form'}
			</span>
		</form>
	);
}
