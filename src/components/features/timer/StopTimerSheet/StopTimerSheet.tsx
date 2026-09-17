import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core/Input';
import { RichTextEditor } from '@/components/core/RichTextEditor/RichTextEditor';
import { Sheet, SheetContent, SheetTitle } from '@/components/core/Sheet';
import { useServiceLabel } from '@/components/features/settings/useDefaultService';
import { timeEntryQueryOptions } from '@/components/features/time-entries/timeEntryQueryOptions';
import {
	MAX_NOTE_LENGTH,
	type TimeEntryFormOutput,
	type TimeEntryFormValues,
	timeEntrySchema,
	toSaveErrorMessage,
} from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm.utils';
import { useDeleteTimeEntry } from '@/components/features/time-entries/useDeleteTimeEntry';
import { useUpdateTimeEntry } from '@/components/features/time-entries/useUpdateTimeEntry';
import type { StoppedTimer } from '@/components/features/timer/useTimer';
import { formatDuration, parseDuration } from '@/lib/duration';
import type { Session } from '@/lib/storage';

/** `Tracked from 09:18 to 10:00`, the caption the design puts under the duration. */
const CLOCK = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

function formatClock(iso: string): string {
	return CLOCK.format(new Date(iso));
}

/**
 * What a stopped timer becomes (SPEC 10, X-4; `05-global-stop-timer.png`).
 *
 * Its own surface rather than a second chrome mode inside `TimeEntryForm`, which is what that
 * component's doc comment used to promise. The two turned out to share almost nothing: this one has
 * no date field (a timer ran today), no service link (the entry already has one), no delete button,
 * no unsaved-changes blocker and no range toggle - and it is a sheet, not a dialog. Reuse would have
 * meant five props and a chrome branch through a 600-line component to save two form fields.
 *
 * What it does reuse is everything that matters: `timeEntrySchema`, so a duration typed here is
 * rejected for the same reasons and in the same words as one typed on the entry form, and the same
 * update and delete mutations, so the day and the week are invalidated the way every other write
 * does it.
 *
 * It **edits** rather than creates. The entry already exists and the stop already wrote the minutes
 * onto it (SPEC 11) - either one the timer created, or, for a continuation, one that was already
 * there and has just been added to. So the duration shown is the entry's whole total, not the
 * elapsed, and `Save entry` is a PATCH of it. A timer stopped inside a minute adds nothing, because
 * whole minutes are all the API keeps - which is the other reason the duration is editable here.
 */
export function StopTimerSheet({
	session,
	stopped,
	onClose,
	maxNoteLength = MAX_NOTE_LENGTH,
}: {
	session: Session;
	stopped: StoppedTimer | null;
	onClose: () => void;
	maxNoteLength?: number;
}) {
	if (stopped === null) return null;

	return <StopTimerForm session={session} stopped={stopped} onClose={onClose} maxNoteLength={maxNoteLength} />;
}

/**
 * Split out so the form is mounted from nothing each time a timer stops: the entry it edits is
 * fetched on mount and seeds the fields, and a component kept alive between timers would open the
 * second one holding the first one's values.
 */
function StopTimerForm({
	session,
	stopped,
	onClose,
	maxNoteLength,
}: {
	session: Session;
	stopped: StoppedTimer;
	onClose: () => void;
	maxNoteLength: number;
}) {
	const fieldId = useId();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	/*
	 * The entry as the stop left it: the API wrote the elapsed whole minutes onto it, so this is
	 * where the prefilled duration comes from rather than from counting in the browser. It also
	 * carries the note, which is how `Continue timer` arrives here with the description already in.
	 */
	const { data: entry, isPending, isError } = useQuery(timeEntryQueryOptions(session, stopped.entryId));
	const serviceLabel = useServiceLabel(session, entry?.service ?? null);
	const updateEntry = useUpdateTimeEntry(session);
	const deleteEntry = useDeleteTimeEntry(session);

	/**
	 * What the entry is worth once X-5's idle minutes are taken off it (SPEC 10: "subtracts
	 * `idleMinutes` from the value written on stop, client-side").
	 *
	 * Floored at what the entry held before this timer, never at zero: a continuation's earlier
	 * hours were logged by a person who was here, and no heuristic about the last fifteen minutes
	 * gets to reach back and take them.
	 */
	function keptMinutes(total: number): number {
		return Math.max(stopped.loggedBefore ?? 0, total - stopped.discardMinutes);
	}

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<TimeEntryFormValues, unknown, TimeEntryFormOutput>({
		resolver: zodResolver(timeEntrySchema(maxNoteLength)),
		mode: 'onSubmit',
		reValidateMode: 'onSubmit',
		// `values`, not `defaultValues`: the entry arrives a render after the sheet opens.
		values: {
			date: entry?.date ?? '',
			duration: entry === undefined ? '' : formatDuration(keptMinutes(entry.minutes)),
			from: '',
			to: '',
			note: entry?.note ?? '',
		},
		resetOptions: { keepDirtyValues: true },
	});

	const isDiscarding = deleteEntry.isPending || updateEntry.isPending;
	const durationMinutes = parseDuration(useWatch({ control, name: 'duration' }));
	const isDiscardingIdle = stopped.discardMinutes > 0;
	const preview = durationMinutes !== null && durationMinutes > 0 ? `= ${formatDuration(durationMinutes)}` : '';

	async function save(values: TimeEntryFormOutput) {
		if (entry === undefined) return;
		setErrorMessage(null);

		const note = values.note.trim() === '' ? null : values.note;

		try {
			await updateEntry.mutateAsync({
				id: entry.id,
				previousDate: entry.date,
				date: entry.date,
				// The whole point of this sheet: the minutes the timer wrote, corrected, plus what
				// the work was. The date and the service are the entry's own and are never sent.
				changes: { minutes: values.duration, note },
			});
			onClose();
		} catch (error) {
			setErrorMessage(toSaveErrorMessage(error));
		}
	}

	/**
	 * Discarding throws away the time this timer tracked, and what that means depends on where the
	 * entry came from.
	 *
	 * A timer started from the app bar created its entry, and that entry *is* the tracked time: it
	 * is deleted, because leaving it would put an unexplained row on the day. A timer continued from
	 * a card attached to an entry that already existed and added to it, so discarding puts it back
	 * to what it held - deleting it would throw away work the timer never touched, which is a far
	 * worse thing to do than the one the button promises.
	 */
	async function discard() {
		if (entry === undefined) {
			onClose();

			return;
		}

		setErrorMessage(null);

		try {
			if (stopped.loggedBefore === null) {
				await deleteEntry.mutateAsync({ id: entry.id, date: entry.date, minutes: entry.minutes });
			} else {
				await updateEntry.mutateAsync({
					id: entry.id,
					previousDate: entry.date,
					date: entry.date,
					changes: { minutes: stopped.loggedBefore },
				});
			}

			onClose();
		} catch {
			setErrorMessage('Could not discard the tracked time. Try again.');
		}
	}

	return (
		<Sheet
			open
			onOpenChange={(next) => {
				// Escape and the backdrop leave the entry where it is rather than deciding for
				// anyone: the time is already saved, and this sheet is about correcting it.
				if (!next) onClose();
			}}
		>
			<SheetContent aria-describedby={undefined}>
				<form
					noValidate
					onSubmit={(event) => {
						void handleSubmit(save)(event);
					}}
					className="flex flex-col gap-[22px]"
				>
					<SheetTitle>Save tracked time</SheetTitle>

					{isError && (
						<p role="alert" className="text-meta text-danger-ink">
							Could not read the tracked entry. It is still on today, and can be edited there.
						</p>
					)}

					<div className="flex flex-col gap-1.5">
						<label htmlFor={`${fieldId}-duration`} className="text-label font-medium text-muted">
							Duration
						</label>
						<div className="flex items-center gap-3 md:gap-2.5">
							<Input
								id={`${fieldId}-duration`}
								placeholder="1h 30m"
								autoComplete="off"
								autoCapitalize="none"
								spellCheck={false}
								disabled={isPending}
								aria-invalid={errors.duration !== undefined}
								aria-describedby={`${fieldId}-preview ${fieldId}-hint`}
								className="min-w-0 flex-1 tabular-nums md:h-13 md:px-3.5 md:text-list"
								{...register('duration')}
							/>
							<span
								id={`${fieldId}-preview`}
								className="min-w-[74px] flex-none text-base font-medium text-accent tabular-nums md:min-w-[66px] md:text-list"
							>
								{preview}
							</span>
						</div>
						{/*
						 * The caption says what was tracked; the error replaces it rather than
						 * pushing it down, exactly as the entry form's duration hint does.
						 */}
						<p
							id={`${fieldId}-hint`}
							className={
								errors.duration === undefined
									? 'text-label text-muted md:text-caption'
									: 'text-label leading-[1.4] text-danger'
							}
						>
							{errors.duration?.message ??
								`Tracked from ${formatClock(stopped.startedAt)} to ${formatClock(stopped.stoppedAt)}` +
									// Said out loud rather than silently shorter: the number was changed on a
									// guess, and the field is editable so it can be changed back.
									(isDiscardingIdle ? `, less ${formatDuration(stopped.discardMinutes)} idle` : '')}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<span id={`${fieldId}-note-label`} className="text-label font-medium text-muted">
							Description
						</span>
						<Controller
							control={control}
							name="note"
							render={({ field }) => (
								<RichTextEditor
									value={field.value}
									onChange={field.onChange}
									placeholder="What did you work on?"
									aria-labelledby={`${fieldId}-note-label`}
									aria-invalid={errors.note !== undefined}
									className="md:min-h-26 md:px-3.5 md:py-3 md:text-list"
								/>
							)}
						/>
						{errors.note !== undefined && <p className="text-label text-danger">{errors.note.message}</p>}
					</div>

					{/* Read-only, as on the entry form: the timer was started against a service, and
					    stopping it is not the moment to change which (A-1). */}
					<p className="text-label leading-[1.5] text-muted">
						Logging as {session.personName}
						{serviceLabel === null ? '' : ` · Service: ${serviceLabel}`}
					</p>

					{errorMessage !== null && (
						<p
							role="alert"
							className="rounded-input border border-danger-border bg-danger-bg px-3.5 py-3 text-meta text-danger-ink"
						>
							{errorMessage}
						</p>
					)}

					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting || isDiscarding}
							onClick={() => {
								void discard();
							}}
							className="flex-none md:h-11 md:px-5"
							// Says what it will do, because the two are different acts on different
							// entries and only one of them is reversible by starting again.
							title={
								stopped.loggedBefore === null
									? 'Delete the entry this timer created'
									: 'Put this entry back to what it held before'
							}
						>
							Discard
						</Button>
						<Button
							type="submit"
							disabled={isPending || isSubmitting || isDiscarding}
							className="flex-1 md:h-11 md:flex-none md:px-6"
						>
							{isSubmitting ? 'Saving' : 'Save entry'}
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
