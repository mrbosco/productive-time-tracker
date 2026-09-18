import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/api/client';
import { findMembershipForOrganization, listOrganizationMemberships } from '@/api/organization-memberships';
import { Clock3, LockKeyhole } from 'lucide-react';
import logoUrl from '@/assets/logo-productive.svg';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core/Input';
import { Label } from '@/components/core/Label';
import { sessionQueryOptions, useSession } from '@/components/features/auth/useSession';
import { servicesQueryOptions } from '@/components/features/settings/useDefaultService';
import type { Session } from '@/lib/storage';

/** `trim` is load-bearing: a token pasted with a trailing newline makes `Headers.set` throw, which
 * the client reports as a transport failure - so a paste mistake reads as "Network error". */
const credentialsSchema = z.object({
	token: z.string().trim().min(1, 'Enter your API token.'),
	organizationId: z.string().trim().regex(/^\d+$/, 'The organization ID is a number, like 1234.'),
});

type Credentials = z.infer<typeof credentialsSchema>;

/** Maps a failed login to what the person can do about it, branching on status and never on
 * `detail` text: 401 is a wrong token, 403 `no_person` a fine token and a wrong organization. */
function toLoginErrorMessage(error: unknown, organizationId: string): string {
	if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';

	if (error.status === 401) return 'Invalid API token.';
	if (error.status === 403) return `This token is not a member of organization ${organizationId}.`;
	if (error.status === 0) return 'Network error. Try again.';

	return error.message;
}

function AlertIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="mt-px flex-none text-danger">
			<path d="M10 2.2 18.6 17H1.4L10 2.2Z" fill="currentColor" />
			<path d="M9.2 7.4h1.6v4.6H9.2zM9.2 13.2h1.6v1.6H9.2z" className="fill-danger-bg" />
		</svg>
	);
}

function EyeIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M10 4.6c-4.2 0-7.3 5.4-7.3 5.4s3.1 5.4 7.3 5.4 7.3-5.4 7.3-5.4S14.2 4.6 10 4.6Zm0 8.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function LoginForm() {
	const { login } = useSession();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isValid },
	} = useForm<Credentials>({
		resolver: zodResolver(credentialsSchema),
		mode: 'onChange',
		defaultValues: { token: '', organizationId: '' },
	});

	/** A plain handler rather than `useMutation`, which would hold the submitted credentials in the
	 * mutation cache afterwards - the one place ADR-0004 says the token must not end up. */
	async function submit({ token, organizationId }: Credentials) {
		setIsPending(true);
		setErrorMessage(null);

		try {
			const memberships = await listOrganizationMemberships({ token, organizationId });

			// The call answers with every membership the token owns, whatever organization was asked
			// for, so the entered one has to be found among them: taking the first would sign the
			// user in against an organization they never typed.
			const membership = findMembershipForOrganization(memberships, organizationId);
			if (membership === undefined) {
				setErrorMessage(`This token is not a member of organization ${organizationId}.`);

				return;
			}
			// A membership with no person is a broken response, not a wrong organization, and
			// saying "not a member" here would send someone to check an ID that was correct.
			if (membership.person == null || membership.personId === null) {
				setErrorMessage('Productive returned a membership with no person. Try again.');

				return;
			}

			const session: Session = {
				token,
				organizationId,
				personId: membership.personId,
				personName: `${membership.person.firstName} ${membership.person.lastName}`.trim(),
			};

			// This response is exactly what the re-validation query would fetch, so seed it and
			// spare the app a second identical request on the very next route.
			queryClient.setQueryData(sessionQueryOptions(session).queryKey, memberships);

			login(session);

			// Not awaited: the day view must render on one request. The services list
			// is only needed by the first create or timer start, which reads this cache or waits
			// on that single request if it has not landed yet.
			void queryClient.prefetchQuery(servicesQueryOptions(session));

			await navigate({ to: '/' });
		} catch (error) {
			setErrorMessage(toLoginErrorMessage(error, organizationId));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<div className="w-full max-w-[460px]">
			{/* Decorative: the `h1` below already says the name, and an alt of "Productive" made a
			    screen reader announce it twice before reaching the heading. */}
			<img src={logoUrl} alt="" className="mx-auto mb-8 h-7 w-auto" />
			<form
				noValidate
				onSubmit={(event) => {
					void handleSubmit(submit)(event);
				}}
				className="overflow-hidden rounded-panel border border-line bg-surface shadow-card"
			>
				<div className="border-b border-line bg-canvas/65 px-6 py-7 sm:px-8 sm:py-8">
					<div
						aria-hidden="true"
						className="mb-5 grid size-12 place-items-center rounded-[14px] border border-accent/10 bg-selection text-accent"
					>
						<Clock3 size={24} strokeWidth={1.6} />
					</div>
					<h1 tabIndex={-1} className="text-[26px] leading-tight font-semibold tracking-[-.035em]">
						Productive Time Tracker
					</h1>
					<p className="mt-2 text-meta leading-relaxed text-muted">
						A clear view of your day. Log in to track your time.
					</p>
				</div>
				<div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-7">
					{errorMessage !== null && (
						<div
							role="alert"
							className="flex items-start gap-2.5 rounded-input border border-danger-border bg-danger-bg px-3.5 py-3"
						>
							<AlertIcon />
							<span className="text-meta leading-[1.4] text-danger-ink">{errorMessage}</span>
						</div>
					)}

					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="token">API token</Label>
							<div className="relative flex items-center">
								<Input
									id="token"
									type={isTokenVisible ? 'text' : 'password'}
									placeholder="••••••••••••••••"
									autoComplete="off"
									autoCapitalize="none"
									spellCheck={false}
									aria-invalid={errors.token !== undefined}
									aria-describedby={errors.token === undefined ? undefined : 'token-error'}
									className="h-13 pr-12"
									{...register('token')}
								/>
								<button
									type="button"
									aria-label={isTokenVisible ? 'Hide token' : 'Show token'}
									aria-pressed={isTokenVisible}
									onClick={() => {
										setIsTokenVisible((visible) => !visible);
									}}
									className="absolute right-1 grid size-11 place-items-center rounded-pill text-muted"
								>
									<EyeIcon />
								</button>
							</div>
							{errors.token !== undefined && (
								<p id="token-error" className="text-label text-danger">
									{errors.token.message}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="organizationId">Organization ID</Label>
							<Input
								id="organizationId"
								// `inputMode` rather than `type="number"`: this is an identifier, not a
								// quantity, so spinners and scroll-to-change are wrong - but it should
								// still bring up the numeric keypad on a phone.
								inputMode="numeric"
								autoComplete="off"
								placeholder="1234"
								aria-invalid={errors.organizationId !== undefined}
								aria-describedby={errors.organizationId === undefined ? undefined : 'organization-error'}
								className="h-13 tabular-nums"
								{...register('organizationId')}
								onChange={(event) => {
									// Digits only, as typed: the field takes an ID, and letting other
									// characters land only to reject them afterwards is a worse way to
									// say the same thing.
									setValue('organizationId', event.target.value.replace(/\D/g, ''), {
										shouldValidate: true,
										shouldDirty: true,
									});
								}}
							/>
							{errors.organizationId !== undefined && (
								<p id="organization-error" className="text-label text-danger">
									{errors.organizationId.message}
								</p>
							)}
						</div>
					</div>

					<p className="text-label leading-relaxed text-muted">
						Find your credentials in Productive under{' '}
						<span className="font-medium text-ink">Settings → API integrations</span>.
					</p>
					<Button type="submit" disabled={!isValid || isPending} className="h-12 w-full shadow-control">
						{isPending && (
							<span className="size-4 animate-spinner rounded-pill border-2 border-white/35 border-t-white" />
						)}
						{isPending ? 'Logging in' : 'Log in'}
					</Button>
				</div>
				<div className="flex items-start gap-2.5 border-t border-line bg-canvas/65 px-6 py-4 sm:px-8">
					<LockKeyhole aria-hidden="true" size={15} className="mt-0.5 flex-none text-muted" />
					<p className="text-caption leading-relaxed text-muted">
						Credentials are stored in this browser only. Log out to remove them.
					</p>
				</div>
			</form>
		</div>
	);
}
