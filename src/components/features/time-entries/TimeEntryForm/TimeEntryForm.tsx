import { Clock3, PencilLine } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { TimeEntry, TimeEntryInput } from '@/api/types';
import { Button } from '@/components/core/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/core/Dialog';
import { Input } from '@/components/core/Input';
import { RichTextEditor } from '@/components/core/RichTextEditor/RichTextEditor';
import { SettingsSheet } from '@/components/features/settings/SettingsSheet/SettingsSheet';
import { useDefaultService, useServiceLabel } from '@/components/features/settings/useDefaultService';
import { TimeEntryDeleteDialog } from '@/components/features/time-entries/TimeEntryDeleteDialog/TimeEntryDeleteDialog';
import { useCreateTimeEntry } from '@/components/features/time-entries/useCreateTimeEntry';
import { useDeleteTimeEntry } from '@/components/features/time-entries/useDeleteTimeEntry';
import { useUpdateTimeEntry } from '@/components/features/time-entries/useUpdateTimeEntry';
import { UnsavedChangesDialog } from '@/components/features/time-entries/TimeEntryForm/UnsavedChangesDialog';
import {
	type DurationMode,
	isServiceRefusal,
	MAX_NOTE_LENGTH,
	rangeMinutes,
	type TimeEntryFormOutput,
	type TimeEntryFormValues,
	summariseUnsavedEntry,
	timeEntrySchema,
	toSaveErrorMessage,
} from '@/components/features/time-entries/TimeEntryForm/TimeEntryForm.utils';
import { DatePicker } from '@/components/shared/DatePicker/DatePicker';
import { formatDayWithYear } from '@/lib/date';
import { formatDuration, parseDuration } from '@/lib/duration';
import type { Session } from '@/lib/storage';
import { cn } from '@/lib/utils';

function AlertIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="mt-px flex-none text-danger">
			<path d="M10 2.2 18.6 17H1.4L10 2.2Z" fill="currentColor" />
			<path d="M9.2 7.4h1.6v4.6H9.2zM9.2 13.2h1.6v1.6H9.2z" className="fill-danger-bg" />
		</svg>
	);
}

function CalendarIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="flex-none text-muted">
			<path d="M5 2.6h1.8v1.6h6.4V2.6H15v1.6h2.4V17H2.6V4.2H5V2.6Zm-.8 5.2v7.6h11.6V7.8H4.2Z" fill="currentColor" />
		</svg>
	);
}

interface TimeEntryFormProps {
	session: Session;
	date: string;
	entry?: TimeEntry;
	/** Values to open on without them counting as edits. A null duration leaves that field empty
	 * rather than seeding it with a `0h` nobody typed. Ignored while `entry` is present. */
	prefill?: { minutes: number | null; note: string | null } | null;
}

/** The entry form: New entry when `entry` is absent, Edit entry when it is. Validation runs on submit,
 * so Save is never disabled for invalid input - it disables only while the save is in flight, and
 * while no service has resolved, because a create without one cannot be sent. */
export function TimeEntryForm({ session, date, entry, prefill }: TimeEntryFormProps) {
	const navigate = useNavigate();
	const isEditing = entry !== undefined;
	const dayDate = entry?.date ?? date;
	// The edit path runs this too and ignores its answer - it keeps the entry's own service. The
	// `/services` request is shared with `useServiceLabel` below, so neither path pays twice.
	const { service, label, isPending: isServicePending, isError: isServiceError } = useDefaultService(session);
	const entryServiceLabel = useServiceLabel(session, entry?.service ?? null);
	const createEntry = useCreateTimeEntry(session);
	const updateEntry = useUpdateTimeEntry(session);
	const deleteEntry = useDeleteTimeEntry(session);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isUnsavedOpen, setIsUnsavedOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	/* A delete in flight or already done. It outlives the dialog, which is what tells the blocker
	 * below that the navigation following it is not someone walking away from a draft. */
	const [isDeleting, setIsDeleting] = useState(false);
	// Local state rather than a form field: it decides which fields are asked for, and a field that
	// changed the shape of its own form would be dirty for having been looked at.
	const [mode, setMode] = useState<DurationMode>('duration');
	const fieldId = useId();

	// What the fields start from. A prefilled form is not a dirty one: these feed `defaultValues`,
	// so closing a duplicate nobody touched asks nothing.
	const source = entry ?? prefill ?? undefined;
	const seed = {
		date: dayDate,
		duration: source?.minutes == null ? '' : formatDuration(source.minutes),
		from: '',
		to: '',
		note: source?.note ?? '',
	};

	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		formState: { errors, dirtyFields, isDirty, isSubmitting },
	} = useForm<TimeEntryFormValues, unknown, TimeEntryFormOutput>({
		resolver: zodResolver(timeEntrySchema(MAX_NOTE_LENGTH, mode)),
		mode: 'onSubmit',
		reValidateMode: 'onSubmit',
		defaultValues: seed,

		/* `values` as well as `defaultValues`, which is read once at mount: opening an entry the
		 * router still held a stale copy of mounted the form on the old values, so reopening an entry
		 * just saved showed what it said before the save - and saving that form put it back.
		 * `keepDirtyValues` leaves any field already typed in alone. */
		values: entry === undefined ? undefined : seed,
		resetOptions: { keepDirtyValues: true },
	});

	/** Why the entry cannot be saved, when the reason is the service rather than a field. Without
	 * this a failed `/services` load leaves Save disabled and silent - and a disabled button cannot
	 * be focused, so a keyboard user has no route to an explanation at all. */
	const serviceProblem = isEditing
		? null
		: isServiceError
			? 'Could not load the service list, so there is nothing to log this against yet. Try again.'
			: !isServicePending && service === null
				? 'This organization has no services with time tracking enabled, so entries cannot be logged yet.'
				: null;

	/* A refresh or a closed tab cannot be intercepted by the dialog, so it gets the browser's own
	 * prompt. Registered only while there is something to lose. */
	useEffect(() => {
		if (!isDirty || isSubmitting) return;

		function warn(event: BeforeUnloadEvent) {
			event.preventDefault();
		}

		window.addEventListener('beforeunload', warn);

		return () => {
			window.removeEventListener('beforeunload', warn);
		};
	}, [isDirty, isSubmitting]);

	/* In-app back never reaches `beforeunload`, so the same question is asked in the dialog.
	 * `isSubmitting` does not cover `isDeleting`: a delete is not a form submit, and without it,
	 * deleting an edited entry would ask whether to save changes to the entry being deleted. */
	const blocker = useBlocker({
		shouldBlockFn: () => isDirty && !isSubmitting && !isUnsavedOpen && !isDeleting,
		enableBeforeUnload: false,
		withResolver: true,
	});

	// `useWatch` rather than `watch`: it re-renders on one field, where `watch` re-renders the whole
	// form on every keystroke in any of them.
	const selectedDate = useWatch({ control, name: 'date' });
	const durationMinutes = parseDuration(useWatch({ control, name: 'duration' }));
	const spanMinutes = rangeMinutes(useWatch({ control, name: 'from' }), useWatch({ control, name: 'to' }));
	const minutes = mode === 'range' ? spanMinutes : durationMinutes;
	const preview = minutes !== null && minutes > 0 ? `= ${formatDuration(minutes)}` : '';
	const rangeError = errors.from?.message ?? errors.to?.message;

	/** Everything that closes the form comes through here - backdrop, Escape, Cancel, close icon -
	 * so the question is asked once. An untouched form still closes immediately. */
	function close() {
		if (isDirty && !isSubmitting) {
			setIsUnsavedOpen(true);

			return;
		}

		discard();
	}

	function discard() {
		void navigate({ to: '/day/$date', params: { date: dayDate } });
	}

	/** Awaited rather than navigating straight away: the entry is what this screen is for, so a
	 * failure is reported in the form's own banner and the form stays open. */
	async function confirmDelete() {
		if (entry === undefined) return;

		setIsConfirmDeleteOpen(false);
		setIsDeleting(true);
		setErrorMessage(null);

		try {
			await deleteEntry.mutateAsync({ id: entry.id, date: entry.date, minutes: entry.minutes });
			await navigate({ to: '/day/$date', params: { date: entry.date }, state: { toast: 'Entry deleted' } });
		} catch {
			setIsDeleting(false);
			setErrorMessage('Could not delete the entry. Try again.');
		}
	}

	async function submit(values: TimeEntryFormOutput) {
		setErrorMessage(null);

		// `note` is nullable on the wire, and an emptied editor reports `''` rather than `<p></p>`,
		// so clearing the description stores "no note" rather than a note that happens to be blank.
		const note = values.note.trim() === '' ? null : values.note;

		try {
			if (entry === undefined) {
				if (service === null) return;

				await createEntry.mutateAsync({
					date: values.date,
					minutes: values.duration,
					note,
					serviceId: service.id,
				});
			} else {
				/* Only changed attributes go on the wire; `dirtyFields` measures against the loaded
				 * values, so a field typed in and back does not count. Never `serviceId` - the entry
				 * keeps its own. `previousDate` tells the hook which other day to invalidate. */
				const changes: Partial<TimeEntryInput> = {};
				// In range mode the minutes are derived from `from`/`to`, so the duration field itself
				// is never touched and would report clean - which silently dropped the edit.
				const isDurationDirty =
					mode === 'range' ? dirtyFields.from === true || dirtyFields.to === true : dirtyFields.duration === true;

				if (dirtyFields.date === true) changes.date = values.date;
				if (isDurationDirty) changes.minutes = values.duration;
				if (dirtyFields.note === true) changes.note = note;

				// Nothing to send is not a failure, and PATCHing an empty body to say so would be a
				// request that asks the API to do nothing. Fall through to the same confirmation.
				if (Object.keys(changes).length > 0) {
					await updateEntry.mutateAsync({
						id: entry.id,
						previousDate: entry.date,
						date: values.date,
						changes,
					});
				}
			}

			// The day the entry belongs to, not the one the form was opened from - changing the
			// date field moves the entry, and landing back on the old day would hide it.
			await navigate({
				to: '/day/$date',
				params: { date: values.date },
				state: { toast: 'Entry saved' },
			});
		} catch (error) {
			setErrorMessage(toSaveErrorMessage(error));
			// The refused service is not a field on this form, so saying so is not enough - the only
			// place it can be changed is opened too.
			if (isServiceRefusal(error)) setIsSettingsOpen(true);
		}
	}

	return (
		<>
			<Dialog
				open
				onOpenChange={(next) => {
					if (!next) close();
				}}
			>
				<DialogContent
					className="inset-0 flex h-dvh w-full flex-col overflow-hidden md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[calc(100%-64px)] md:w-[min(600px,calc(100%-64px))] md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-y-auto md:rounded-panel md:shadow-dialog"
					aria-describedby={undefined}
				>
					<form
						noValidate
						onSubmit={(event) => {
							void handleSubmit(submit)(event);
						}}
						className="flex min-h-0 flex-1 flex-col"
					>
						<div className="flex h-14 flex-none items-center gap-1 border-b border-line bg-surface px-2 md:h-auto md:flex-row-reverse md:justify-between md:bg-canvas/65 md:px-6 md:py-5">
							<button
								type="button"
								onClick={close}
								aria-label="Close"
								className="duration-ui grid size-11 flex-none place-items-center rounded-control text-muted transition-colors ease-ui hover:bg-subtle md:size-9"
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
							<div className="flex items-center gap-3.5">
								<span
									aria-hidden="true"
									className="hidden size-11 items-center justify-center rounded-[13px] border border-accent/10 bg-selection text-accent md:flex"
								>
									{isEditing ? <PencilLine size={20} /> : <Clock3 size={22} strokeWidth={1.6} />}
								</span>
								<div>
									<DialogTitle className="text-base font-medium tracking-[-.01em] md:text-title md:font-semibold md:tracking-[-.025em]">
										{isEditing ? 'Edit entry' : 'New entry'}
									</DialogTitle>
									<p className="mt-1 hidden text-label text-muted md:block">
										{isEditing ? 'Keep the details of your work up to date.' : 'Add the time and details of your work.'}
									</p>
								</div>
							</div>
						</div>

						<div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-4 pt-6 pb-32 md:overflow-visible md:px-6 md:py-6">
							<div
								className={cn('flex flex-col gap-[22px] md:items-start md:gap-4', mode === 'duration' && 'md:flex-row')}
							>
								<div className="flex flex-col gap-1.5 md:min-w-0 md:flex-1">
									<span id={`${fieldId}-date-label`} className="text-label font-medium text-muted">
										Date
									</span>
									<DatePicker
										value={selectedDate}
										onSelect={(next) => {
											setValue('date', next, { shouldDirty: true });
										}}
									>
										<button
											type="button"
											aria-labelledby={`${fieldId}-date-label ${fieldId}-date-value`}
											className="flex h-14 items-center justify-between rounded-input border border-line bg-surface px-4 text-base text-ink md:h-13 md:px-3.5 md:text-list"
										>
											<span id={`${fieldId}-date-value`}>{formatDayWithYear(selectedDate)}</span>
											<CalendarIcon />
										</button>
									</DatePicker>
								</div>

								{mode === 'duration' ? (
									<div className="flex flex-col gap-1.5 md:min-w-0 md:flex-1">
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
												aria-invalid={errors.duration !== undefined}
												aria-describedby={`${fieldId}-duration-preview ${fieldId}-duration-hint`}
												className="min-w-0 flex-1 tabular-nums md:h-13 md:px-3.5 md:text-list"
												{...register('duration')}
											/>
											{/* Reserves its width so the field does not resize as you type, and is
											     described by the input: it is the only confirmation that `1.5h`
											     was read as ninety minutes. */}
											<span
												id={`${fieldId}-duration-preview`}
												className="min-w-[74px] flex-none text-base font-medium text-accent tabular-nums md:min-w-[66px] md:text-list"
											>
												{preview}
											</span>
										</div>
										<p
											id={`${fieldId}-duration-hint`}
											className={
												errors.duration === undefined
													? 'text-label text-muted md:text-caption'
													: 'text-label leading-[1.4] text-danger'
											}
										>
											{errors.duration?.message ?? 'Accepts 1h 30m, 1:30, 1.5h or 90'}
										</p>
									</div>
								) : (
									<div className="flex w-full flex-col gap-1.5">
										<span className="text-label font-medium text-muted">Start and end</span>
										<div className="flex items-end gap-3 md:gap-2.5">
											<div className="flex min-w-0 flex-1 flex-col gap-1">
												<label htmlFor={`${fieldId}-from`} className="text-label text-muted md:text-caption">
													From
												</label>
												<Input
													id={`${fieldId}-from`}
													type="time"
													aria-invalid={errors.from !== undefined}
													aria-describedby={`${fieldId}-range-preview ${fieldId}-range-hint`}
													className="min-w-0 tabular-nums md:h-13 md:px-3.5 md:text-list"
													{...register('from')}
												/>
											</div>
											<div className="flex min-w-0 flex-1 flex-col gap-1">
												<label htmlFor={`${fieldId}-to`} className="text-label text-muted md:text-caption">
													To
												</label>
												<Input
													id={`${fieldId}-to`}
													type="time"
													aria-invalid={errors.to !== undefined}
													aria-describedby={`${fieldId}-range-preview ${fieldId}-range-hint`}
													className="min-w-0 tabular-nums md:h-13 md:px-3.5 md:text-list"
													{...register('to')}
												/>
											</div>
											<span
												id={`${fieldId}-range-preview`}
												className="min-w-[74px] flex-none pb-3.5 text-base font-medium text-accent tabular-nums md:min-w-[66px] md:pb-3 md:text-list"
											>
												{preview}
											</span>
										</div>
										<p
											id={`${fieldId}-range-hint`}
											className={
												rangeError === undefined
													? 'text-label text-muted md:text-caption'
													: 'text-label leading-[1.4] text-danger'
											}
										>
											{rangeError ?? 'Both on the day above; the end must come after the start'}
										</p>
									</div>
								)}
							</div>

							{/* A plain button, not `role="switch"`: the label names the action rather than the
							     state, so `aria-checked` on it would announce a contradiction. */}
							<button
								type="button"
								onClick={() => {
									setMode((current) => (current === 'duration' ? 'range' : 'duration'));
								}}
								className="flex items-center gap-3 self-start rounded-pill"
							>
								<span
									aria-hidden="true"
									className={cn(
										'duration-ui relative h-6.5 w-11 flex-none rounded-pill transition-colors ease-ui',
										mode === 'range' ? 'bg-accent' : 'bg-line'
									)}
								>
									<span
										className={cn(
											'duration-ui absolute top-[3px] size-[19px] rounded-pill bg-surface transition-all ease-ui',
											mode === 'range' ? 'left-[23px]' : 'left-[3px]'
										)}
									/>
								</span>
								<span className="text-base font-medium md:text-meta">
									{mode === 'range' ? 'Enter a duration instead' : 'Enter start and end instead'}
								</span>
							</button>

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
											aria-describedby={
												errors.note === undefined
													? `${fieldId}-note-hint`
													: `${fieldId}-note-hint ${fieldId}-note-error`
											}
											className="md:min-h-26 md:px-3.5 md:py-3 md:text-list"
										/>
									)}
								/>
								<p id={`${fieldId}-note-hint`} className="text-label text-muted md:text-caption">
									Start a line with <span className="font-medium">-</span> for a list, or use Ctrl/Cmd+B for bold.
								</p>
								{errors.note !== undefined && (
									<p id={`${fieldId}-note-error`} className="text-label text-danger">
										{errors.note.message}
									</p>
								)}
							</div>

							<div className="flex flex-col items-start gap-1.5 rounded-control border border-line/70 bg-canvas/70 px-3.5 py-3 text-label leading-[1.5] text-muted">
								<span>Logging as {session.personName} · Service:</span>
								{entry === undefined ? (
									<button
										type="button"
										onClick={() => {
											setIsSettingsOpen(true);
										}}
										className="text-left font-medium text-accent underline-offset-[3px] hover:underline"
									>
										{label ?? (isServicePending ? 'Loading…' : 'Choose a service')}
									</button>
								) : (
									<span className="font-medium">{entryServiceLabel ?? 'Unknown service'}</span>
								)}
							</div>

							{(errorMessage ?? serviceProblem) !== null && (
								<div
									role="alert"
									className="flex items-start gap-2.5 rounded-input border border-danger-border bg-danger-bg px-3.5 py-3"
								>
									<AlertIcon />
									<span className="text-meta leading-[1.4] text-danger-ink">{errorMessage ?? serviceProblem}</span>
								</div>
							)}

							{isEditing && (
								<button
									type="button"
									disabled={isDeleting}
									onClick={() => {
										setIsConfirmDeleteOpen(true);
									}}
									className="self-start rounded-input text-base font-medium text-danger underline underline-offset-[3px] disabled:opacity-60 md:text-meta"
								>
									Delete entry
								</button>
							)}
						</div>

						<div className="absolute inset-x-0 bottom-0 flex flex-none gap-3 border-t border-line bg-surface px-4 pt-3 pb-6 md:static md:justify-end md:bg-canvas/65 md:px-6 md:py-4">
							<Button
								type="button"
								variant="outline"
								onClick={close}
								className="w-28 flex-none md:h-11 md:w-auto md:px-5"
							>
								Cancel
							</Button>
							{/* Editing never waits on the service: the PATCH does not carry one, so a
							     `/services` request that has not landed must not hold the save. */}
							<Button
								type="submit"
								disabled={isSubmitting || (!isEditing && service === null)}
								className="flex-1 shadow-control md:h-11 md:flex-none md:px-6"
							>
								{isSubmitting && (
									<span className="size-4 animate-spinner rounded-pill border-2 border-white/35 border-t-white" />
								)}
								{isSubmitting ? 'Saving' : isEditing ? 'Save changes' : 'Save entry'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<SettingsSheet session={session} open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

			<TimeEntryDeleteDialog
				entry={isConfirmDeleteOpen ? (entry ?? null) : null}
				onOpenChange={setIsConfirmDeleteOpen}
				onConfirm={() => {
					void confirmDelete();
				}}
			/>

			<UnsavedChangesDialog
				open={isUnsavedOpen || blocker.status === 'blocked'}
				onOpenChange={(next) => {
					if (next) return;

					setIsUnsavedOpen(false);
					if (blocker.status === 'blocked') blocker.reset();
				}}
				{...summariseUnsavedEntry(getValues(), mode)}
				onDiscard={() => {
					setIsUnsavedOpen(false);
					if (blocker.status === 'blocked') {
						blocker.proceed();

						return;
					}

					discard();
				}}
			/>
		</>
	);
}
