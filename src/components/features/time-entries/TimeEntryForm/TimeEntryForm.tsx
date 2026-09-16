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
	isServiceRefusal,
	MAX_NOTE_LENGTH,
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
	/**
	 * The day this form belongs to when creating: the route's search param (A-5). When editing, the
	 * entry's own date wins over whatever is passed here - a caller that disagreed with the entry
	 * would otherwise discard to a day the entry was never on.
	 */
	date: string;
	/** The entry being edited (US-3). Absent means this is the New entry form. */
	entry?: TimeEntry;
	maxNoteLength?: number;
}

/**
 * The entry form: New entry when `entry` is absent (US-2, R-9), Edit entry when it is (US-3, R-11).
 * Three fields and nothing else: the service is chosen once in settings (A-1), and the person is
 * the session's (R-10).
 *
 * One component rather than two, because the design draws one screen twice - 3.4 is "same layout as
 * New entry, prefilled" - and because everything that is hard here is shared: the dirty-state
 * blocker, the `beforeunload` guard, the discard prompt, the duration preview and the
 * error-replaces-the-hint row. What differs is a title, a button label, where the values start and
 * which mutation runs. Editing sends no service (A-1) and so never waits on one.
 *
 * A modal at both widths, which is what the design draws: a full screen on mobile, a 560px dialog
 * over the day on desktop, where "adding time is never worth a page change". That is also what
 * makes the accessibility work free - Radix traps focus, restores it on close, and hides the day
 * behind from assistive technology (guidebook 18).
 *
 * Validation runs on submit rather than on change, unlike `LoginForm`. The design is explicit that
 * errors "show on submit, not while typing", and it follows that Save is never disabled for
 * invalid input: pressing it is how someone is told what is wrong. It disables only while the save
 * is in flight, and while no service has resolved, because a create without one cannot be sent.
 *
 * P-2 (SPEC 10) adds a toggle here that swaps Duration for From/To time inputs; the design has that
 * branch in full under `modeRange` in `TimeTracker.dc.html`. X-4's stop-timer sheet is this same
 * form with a "Tracked from 09:18 to 10:00" caption and Discard in place of Cancel - but per
 * SPEC 11 it edits the entry the timer already created rather than creating one.
 */
export function TimeEntryForm({ session, date, entry, maxNoteLength = MAX_NOTE_LENGTH }: TimeEntryFormProps) {
	const navigate = useNavigate();
	const isEditing = entry !== undefined;
	// The entry is authoritative about its own day; the prop only answers for the New entry form.
	const dayDate = entry?.date ?? date;
	/*
	 * ponytail: one component for both surfaces, so the edit path also runs `useDefaultService` and
	 * ignores its answer - A-1 keeps the entry's own service. The `/services` request behind it is
	 * not wasted, though: `useServiceLabel` below reads the same query to label the entry's service
	 * the way the default is labelled. Splitting this into a shell plus two wrappers would charge
	 * six drilled props and a rewrite of US-2's tested markup to save nothing.
	 */
	const { service, label, isPending: isServicePending, isError: isServiceError } = useDefaultService(session);
	// The entry's own service, labelled the way the default is - both read the one `/services`
	// query, so this costs no extra request on either path.
	const entryServiceLabel = useServiceLabel(session, entry?.service ?? null);
	const createEntry = useCreateTimeEntry(session);
	const updateEntry = useUpdateTimeEntry(session);
	const deleteEntry = useDeleteTimeEntry(session);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isUnsavedOpen, setIsUnsavedOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
	/**
	 * A delete in flight or already done. Separate from `isConfirmDeleteOpen` because it has to
	 * outlive the dialog: it is what tells the blocker below that the navigation which follows is
	 * not someone walking away from a draft.
	 */
	const [isDeleting, setIsDeleting] = useState(false);
	const fieldId = useId();

	/** What the fields start from: blank for a new entry, the entry's own values for an edit. */
	const seed = {
		date: dayDate,
		duration: entry === undefined ? '' : formatDuration(entry.minutes),
		note: entry?.note ?? '',
	};

	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		formState: { errors, dirtyFields, isDirty, isSubmitting },
	} = useForm<TimeEntryFormValues, unknown, TimeEntryFormOutput>({
		resolver: zodResolver(timeEntrySchema(maxNoteLength)),
		mode: 'onSubmit',
		reValidateMode: 'onSubmit',
		/*
		 * Editing starts from the entry rather than from blank, and `formatDuration` is what the
		 * field would have accepted anyway (A-2) - so `isDirty` stays false until something is
		 * actually changed, and the dismissal prompt does not fire on a form nobody touched.
		 */
		defaultValues: seed,

		/*
		 * `values` as well, because `defaultValues` is read once at mount and the entry can arrive
		 * after it. Opening an entry the router still holds a stale copy of mounted this form on the
		 * old values; the fresh ones landed a render later and were ignored, so reopening an entry
		 * just saved showed what it said before the save - and saving that form put it back.
		 *
		 * `keepDirtyValues` is what makes re-seeding safe: a field someone has typed in is left
		 * alone, and only the ones they have not touched follow the entry.
		 */
		values: entry === undefined ? undefined : seed,
		resetOptions: { keepDirtyValues: true },
	});

	// `useWatch` rather than `watch`: it returns the value instead of a function, which is what
	// lets the React Compiler keep optimising this component.
	/**
	 * Why the entry cannot be saved, when the reason is the service rather than a field.
	 *
	 * Without this a failed `/services` load leaves Save disabled and silent - and a disabled
	 * button cannot be focused, so a keyboard user has no route to an explanation at all. A-1
	 * keeps the two causes apart: a list that would not load is worth retrying, an organization
	 * that tracks nothing is not.
	 */
	const serviceProblem = isEditing
		? null
		: isServiceError
			? 'Could not load the service list, so there is nothing to log this against yet. Try again.'
			: !isServicePending && service === null
				? 'This organization has no services with time tracking enabled, so entries cannot be logged yet.'
				: null;

	/**
	 * A refresh or a closed tab cannot be intercepted by the dialog, so it gets the browser's own
	 * prompt instead. Registered only while there is something to lose: a page that always asks is
	 * a page people stop reading.
	 */
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

	/**
	 * In-app back, which never reaches `beforeunload`: the browser button walks the router's own
	 * history rather than unloading the page, so the same question is asked in the same dialog.
	 */
	/*
	 * `isDeleting` belongs in this condition and `isSubmitting` does not cover it: a delete is not a
	 * form submit, so react-hook-form never sees it. Without it, deleting an entry on a form that
	 * had been edited would ask whether to save the changes to the entry being deleted.
	 */
	const blocker = useBlocker({
		shouldBlockFn: () => isDirty && !isSubmitting && !isUnsavedOpen && !isDeleting,
		enableBeforeUnload: false,
		withResolver: true,
	});

	const selectedDate = useWatch({ control, name: 'date' });
	const durationMinutes = parseDuration(useWatch({ control, name: 'duration' }));
	// The only confirmation before saving that `1.5h` was read the way it was meant, so it tracks
	// every keystroke - and stays blank rather than guessing while the value is unreadable.
	const preview = durationMinutes !== null && durationMinutes > 0 ? `= ${formatDuration(durationMinutes)}` : '';

	/**
	 * Dismissal (Improvements 10). Anything that closes the form comes through here - the backdrop,
	 * Escape, Cancel and the header's close icon - so the question is asked once, in one place,
	 * rather than at four call sites that could drift apart.
	 *
	 * An untouched form still closes immediately. A prompt on a dialog nobody typed in is noise
	 * people learn to click through, which is how a real warning gets ignored later.
	 */
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

	/**
	 * R-12 from the edit form. Awaited rather than navigating straight away: the day view deletes
	 * optimistically because it is watching the row go, but here the entry is what the screen is
	 * *for* - so a failure is reported in the banner already on this form, beside the values, and
	 * the form stays open. Leaving first and raising the failure on another screen would tell
	 * someone their entry is gone and then, elsewhere, that it is not.
	 */
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
				/*
				 * SPEC 4.1: "Only changed attributes". `dirtyFields` is react-hook-form's own answer
				 * to what was edited, measured against the values the entry was loaded with, so a
				 * field someone typed in and then typed back does not count as a change.
				 *
				 * No `serviceId` in any case: A-1 keeps the entry's existing service. `previousDate`
				 * is what tells the hook which other day to invalidate when the date moved (SPEC 4.2).
				 */
				const changes: Partial<TimeEntryInput> = {};
				if (dirtyFields.date === true) changes.date = values.date;
				if (dirtyFields.duration === true) changes.minutes = values.duration;
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
			// A-1b: the refused service is not a field on this form, so saying so is not enough -
			// the only place it can be changed is opened too.
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
				{/*
				 * A full screen on mobile, a 560px dialog centred over the day from `md`. One element
				 * either way - the day behind is what the design keeps visible on desktop, and Radix
				 * marks it `aria-hidden` at both widths.
				 */}
				<DialogContent
					className="inset-0 flex h-dvh w-full flex-col overflow-hidden md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[calc(100%-64px)] md:w-[min(560px,calc(100%-64px))] md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-y-auto md:rounded-panel md:p-7 md:shadow-dialog"
					aria-describedby={undefined}
				>
					<form
						noValidate
						onSubmit={(event) => {
							void handleSubmit(submit)(event);
						}}
						className="flex min-h-0 flex-1 flex-col md:gap-[22px]"
					>
						{/*
						 * One header that restyles across the breakpoint rather than two hidden by CSS:
						 * a back chevron on the left on mobile, a close cross on the right on desktop.
						 * Only the glyphs swap - both are decorative, so the button keeps one
						 * accessible name at every width.
						 */}
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
								{isEditing ? 'Edit entry' : 'New entry'}
							</DialogTitle>
						</div>

						<div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-4 pt-6 pb-32 md:overflow-visible md:p-0 md:pb-0">
							{/* Date and Duration share a row on desktop, stack on mobile. */}
							<div className="flex flex-col gap-[22px] md:flex-row md:items-start md:gap-4">
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
										{/*
										 * A button, not an input, so it takes its accessible name from
										 * the label beside it plus the date it is showing.
										 */}
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
										{/*
										 * Reserves its width so the field does not resize as you
										 * type. Described by the input rather than hidden from
										 * assistive technology: this is the only confirmation
										 * that `1.5h` was read as ninety minutes, and an empty
										 * described node costs nothing.
										 */}
										<span
											id={`${fieldId}-duration-preview`}
											className="min-w-[74px] flex-none text-base font-medium text-accent tabular-nums md:min-w-[66px] md:text-list"
										>
											{preview}
										</span>
									</div>
									{/*
									 * One line under the field, never two: the error replaces the
									 * helper caption rather than pushing it down, so nothing below
									 * moves when a save is rejected.
									 */}
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
							</div>

							<div className="flex flex-col gap-1.5">
								{/*
								 * A span, not a `<label htmlFor>`: the editor is a contenteditable
								 * div, which is not a labelable element, so the name is attached
								 * the same way the Date button's is.
								 */}
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
								{/*
								 * The field is rich and nothing else says so: the formatting is
								 * reachable only through shortcuts and the `- ` rule, which a
								 * screen-reader user would otherwise never learn about. Wired
								 * through `aria-describedby` so it is announced with the field
								 * rather than sitting beside it as decoration.
								 */}
								<p id={`${fieldId}-note-hint`} className="text-label text-muted md:text-caption">
									Start a line with <span className="font-medium">-</span> for a list, or use Ctrl/Cmd+B for bold.
								</p>
								{errors.note !== undefined && (
									<p id={`${fieldId}-note-error`} className="text-label text-danger">
										{errors.note.message}
									</p>
								)}
							</div>

							{/*
							 * Read-only meta, not a field (A-1).
							 *
							 * On the New entry form the service is a link, because the sheet behind it
							 * is what decides the one this entry will get. On the edit form it is
							 * plain text: A-1 keeps the entry's existing service and the PATCH never
							 * carries one, so the sheet would open showing a different service
							 * selected than the line that was just clicked - a control that appears to
							 * change this entry and does not.
							 */}
							<div className="flex flex-wrap items-baseline gap-1.5 text-label leading-[1.5] text-muted">
								<span>Logging as {session.personName} · Service:</span>
								{entry === undefined ? (
									<button
										type="button"
										onClick={() => {
											setIsSettingsOpen(true);
										}}
										className="font-medium text-accent underline underline-offset-[3px]"
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

							{/*
							 * At the end of the fields rather than in the button bar (design brief
							 * 3.4): a destructive control next to Save is one mis-tap from the thing
							 * it undoes. It asks before it acts, like the day view's menu does.
							 */}
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

						{/*
						 * The same two buttons at both widths: a sticky bar over the scrolling fields
						 * on mobile, a right-aligned row at the end of the dialog on desktop.
						 */}
						<div className="absolute inset-x-0 bottom-0 flex flex-none gap-3 border-t border-line bg-surface px-4 pt-3 pb-6 md:static md:justify-end md:border-0 md:p-0 md:pt-0.5">
							<Button
								type="button"
								variant="outline"
								onClick={close}
								className="w-28 flex-none md:h-11 md:w-auto md:px-5"
							>
								Cancel
							</Button>
							{/*
							 * Editing never waits on the service: A-1 keeps the entry's own and the
							 * PATCH does not carry one, so a `/services` request that has not landed
							 * (or failed) must not hold the save.
							 */}
							<Button
								type="submit"
								disabled={isSubmitting || (!isEditing && service === null)}
								className="flex-1 md:h-11 md:flex-none md:px-6"
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

			{/*
			 * A sibling of the form rather than a child of it: two modals that open independently,
			 * one of which (A-1b) is opened by the form failing. Radix stacks them, so the sheet
			 * takes focus while it is up and hands it back to the form on close.
			 */}
			<SettingsSheet session={session} open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

			{/*
			 * A third layer over the form, on the same stacking `SettingsSheet` and the unsaved
			 * prompt already use. The day view's dialog, because it is the same question about the
			 * same entry (design brief 4).
			 */}
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
					// Staying put is what "Continue editing" means to the router too.
					if (blocker.status === 'blocked') blocker.reset();
				}}
				{...summariseUnsavedEntry(getValues())}
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
