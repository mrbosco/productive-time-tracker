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

const CLOCK = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

function formatClock(iso: string): string {
	return CLOCK.format(new Date(iso));
}

/** What a stopped timer becomes. It **edits** rather than creates: the stop already wrote the minutes
 * onto the entry, and a timer stopped inside a minute adds nothing, since whole minutes are all the
 * API keeps. */
export function StopTimerSheet({
	session,
	stopped,
	onClose,
}: {
	session: Session;
	stopped: StoppedTimer | null;
	onClose: () => void;
}) {
	if (stopped === null) return null;

	return <StopTimerForm session={session} stopped={stopped} onClose={onClose} />;
}

/** Split out so the form mounts fresh each time a timer stops: it seeds from the entry fetched on
 * mount, and one kept alive would open holding the last timer's values. */
function StopTimerForm({
	session,
	stopped,
	onClose,
}: {
	session: Session;
	stopped: StoppedTimer;
	onClose: () => void;
}) {
	const fieldId = useId();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	/* The entry as the stop left it: the API wrote the elapsed whole minutes onto it, so the prefilled
	 * duration comes from there rather than from counting in the browser. */
	const { data: entry, isPending, isError } = useQuery(timeEntryQueryOptions(session, stopped.entryId));
	const serviceLabel = useServiceLabel(session, entry?.service ?? null);
	const updateEntry = useUpdateTimeEntry(session);
	const deleteEntry = useDeleteTimeEntry(session);

	/** Floored at what the entry held before this timer, never zero: no idle heuristic gets to reach
	 * back and take hours a person logged earlier. */
	function keptMinutes(total: number): number {
		return Math.max(stopped.loggedBefore ?? 0, total - stopped.discardMinutes);
	}

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<TimeEntryFormValues, unknown, TimeEntryFormOutput>({
		resolver: zodResolver(timeEntrySchema(MAX_NOTE_LENGTH)),
		mode: 'onSubmit',
		reValidateMode: 'onSubmit',
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
				changes: { minutes: values.duration, note },
			});
			onClose();
		} catch (error) {
			setErrorMessage(toSaveErrorMessage(error));
		}
	}

	/** A timer started from the app bar created its entry, so discarding deletes it. A continued one
	 * added to an entry that already existed, so discarding puts it back to what it held. */
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
