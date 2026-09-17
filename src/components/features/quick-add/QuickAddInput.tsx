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

	/**
	 * Starting puts a row on **today**, because that is where `POST /timers` files the entry it
	 * creates - so starting while looking at another day would file the work correctly and then
	 * show nothing at all. Go to the day it landed on, where it is visible and counting.
	 */
	function startTracking() {
		timer.start(described);
		setValue('');
		if (date !== todayIso()) void navigate({ to: '/day/$date', params: { date: todayIso() } });
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
			className="flex flex-col gap-1.5"
			onSubmit={(event) => {
				event.preventDefault();
				// Enter starts the clock, because that is the action the row is primarily for. `Log
				// time` is a click away for the other one.
				if (described === '') {
					logTime();

					return;
				}
				startTracking();
			}}
		>
			<div className="flex items-center gap-2">
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
					className="h-12 flex-1 text-list"
				/>

				<button
					type="submit"
					// Not disabled while one runs: starting a second retires the first rather than
					// refusing, which is what somebody moving on to the next thing means by it.
					disabled={described === ''}
					className={cn(
						'duration-ui flex h-10 flex-none items-center gap-2 rounded-pill bg-accent px-4 text-meta font-medium text-on-accent transition-colors ease-ui',
						'hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40'
					)}
				>
					<PlayIcon />
					Start
				</button>
				<button
					type="button"
					onClick={logTime}
					className="duration-ui hidden h-10 flex-none rounded-pill border border-line px-4 text-meta font-medium transition-colors ease-ui hover:bg-subtle sm:block"
				>
					Log time
				</button>
			</div>

			<span className="pl-0.5 text-caption text-muted">
				{isTracking
					? 'Starting this stops the timer that is running and keeps its time'
					: 'Start tracks against your default service · Log time opens the form'}
			</span>
		</form>
	);
}
