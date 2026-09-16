import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/core/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/core/Dialog';
import { Input } from '@/components/core/Input';
import { RichTextEditor } from '@/components/core/RichTextEditor/RichTextEditor';
import { SettingsSheet } from '@/components/features/settings/SettingsSheet/SettingsSheet';
import { useDefaultService } from '@/components/features/settings/useDefaultService';
import { useCreateTimeEntry } from '@/components/features/time-entries/useCreateTimeEntry';
import { UnsavedChangesDialog } from '@/components/features/time-entries/TimeEntryForm/UnsavedChangesDialog';
import {
	isServiceRefusal,
	MAX_NOTE_LENGTH,
	type TimeEntryFormOutput,
	type TimeEntryFormValues,
	summariseUnsavedEntry,
	timeEntrySchema,
	toCreateErrorMessage,
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
	/** The day being logged, from the route's search param (A-5). */
	date: string;
	maxNoteLength?: number;
}

/**
 * The New entry form (US-2, R-9). Three fields and nothing else: the service is chosen once in
 * settings (A-1), and the person is the session's (R-10).
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
export function TimeEntryForm({ session, date, maxNoteLength = MAX_NOTE_LENGTH }: TimeEntryFormProps) {
	const navigate = useNavigate();
	const { service, label, isPending: isServicePending, isError: isServiceError } = useDefaultService(session);
	const createEntry = useCreateTimeEntry(session);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isUnsavedOpen, setIsUnsavedOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const fieldId = useId();

	const {
		register,
		handleSubmit,
		control,
		setValue,
		getValues,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<TimeEntryFormValues, unknown, TimeEntryFormOutput>({
		resolver: zodResolver(timeEntrySchema(maxNoteLength)),
		mode: 'onSubmit',
		reValidateMode: 'onSubmit',
		defaultValues: { date, duration: '', note: '' },
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
	const serviceProblem = isServiceError
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
	const blocker = useBlocker({
		shouldBlockFn: () => isDirty && !isSubmitting && !isUnsavedOpen,
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
		void navigate({ to: '/day/$date', params: { date } });
	}

	async function submit(values: TimeEntryFormOutput) {
		if (service === null) return;

		setErrorMessage(null);

		try {
			await createEntry.mutateAsync({
				date: values.date,
				minutes: values.duration,
				// `note` is nullable on the wire, and an empty textarea is "no note" rather than a
				// note that happens to be blank.
				note: values.note.trim() === '' ? null : values.note,
				serviceId: service.id,
			});

			// The day the entry belongs to, not the one the form was opened from - changing the
			// date field moves the entry, and landing back on the old day would hide it.
			await navigate({
				to: '/day/$date',
				params: { date: values.date },
				state: { toast: 'Entry saved' },
			});
		} catch (error) {
			setErrorMessage(toCreateErrorMessage(error));
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
								New entry
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
											aria-describedby={errors.note === undefined ? undefined : `${fieldId}-note-error`}
											className="md:min-h-26 md:px-3.5 md:py-3 md:text-list"
										/>
									)}
								/>
								{errors.note !== undefined && (
									<p id={`${fieldId}-note-error`} className="text-label text-danger">
										{errors.note.message}
									</p>
								)}
							</div>

							{/*
							 * Read-only meta, not a field (A-1). The service is a link because it is
							 * changeable - just not from here.
							 */}
							<div className="flex flex-wrap items-baseline gap-1.5 text-label leading-[1.5] text-muted">
								<span>Logging as {session.personName} · Service:</span>
								<button
									type="button"
									onClick={() => {
										setIsSettingsOpen(true);
									}}
									className="font-medium text-accent underline underline-offset-[3px]"
								>
									{label ?? (isServicePending ? 'Loading…' : 'Choose a service')}
								</button>
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
							<Button
								type="submit"
								disabled={isSubmitting || service === null}
								className="flex-1 md:h-11 md:flex-none md:px-6"
							>
								{isSubmitting && (
									<span className="size-4 animate-spinner rounded-pill border-2 border-white/35 border-t-white" />
								)}
								{isSubmitting ? 'Saving' : 'Save entry'}
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
