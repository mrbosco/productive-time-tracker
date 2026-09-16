import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/api/client';
import { findMembershipForOrganization, listOrganizationMemberships } from '@/api/organization-memberships';
import brandmarkUrl from '@/assets/brandmark.svg';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core/Input';
import { Label } from '@/components/core/Label';
import { sessionQueryOptions, useSession } from '@/components/features/auth/useSession';
import { servicesQueryOptions } from '@/components/features/settings/useDefaultService';
import type { Session } from '@/lib/storage';

/**
 * `trim` is load-bearing, not tidiness: a token pasted with a trailing newline makes
 * `Headers.set` throw, which the client reports as a transport failure - so an easy paste mistake
 * would read as "Network error. Try again." and send the user looking at their wifi.
 */
const credentialsSchema = z.object({
	token: z.string().trim().min(1, 'Enter your API token.'),
	organizationId: z.string().trim().regex(/^\d+$/, 'The organization ID is a number, like 1234.'),
});

type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Maps a failed login to what the person can do about it. Branching is on the HTTP status, never
 * on `detail` text (api-client rule 19): 401 means the token is wrong, while 403 `no_person` means
 * the token is fine and the organization is not theirs - two different fixes.
 */
function toLoginErrorMessage(error: unknown, organizationId: string): string {
	if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';

	if (error.status === 401) return 'Invalid API token.';
	if (error.status === 403) return `This token is not a member of organization ${organizationId}.`;
	if (error.status === 0) return 'Network error. Try again.';

	return error.message;
}

/**
 * Icons are drawn here as solid monochrome paths rather than pulled from an icon set, and these
 * two are the design system's own: a stroked set reads wrong beside them. Both paint with
 * `currentColor` so they take their colour from whatever contains them.
 */
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

	/**
	 * A plain handler rather than `useMutation`: this runs once, needs no cache entry, no retry
	 * and no invalidation, and `useMutation` would hold the submitted credentials in the mutation
	 * cache afterwards - the one place ADR-0004 says the token must not end up.
	 */
	async function submit({ token, organizationId }: Credentials) {
		setIsPending(true);
		setErrorMessage(null);

		try {
			const memberships = await listOrganizationMemberships({ token, organizationId });

			// The call answers with every membership the token owns, whatever organization was
			// asked for, so the one for the entered organization has to be found among them - the
			// step the assignment describes on page two. Taking the first membership instead would
			// sign the user in against an organization they never typed.
			const membership = findMembershipForOrganization(memberships, organizationId);
			if (membership?.person == null || membership.personId === null) {
				setErrorMessage(`This token is not a member of organization ${organizationId}.`);

				return;
			}

			const session: Session = {
				token,
				organizationId,
				personId: membership.personId,
				personName: `${membership.person.firstName} ${membership.person.lastName}`.trim(),
			};

			// This response is exactly what the re-validation query would fetch, so seed it and
			// spare the app a second identical request on the very next route (SPEC 4.2).
			queryClient.setQueryData(sessionQueryOptions(session).queryKey, memberships);

			login(session);

			// Not awaited: the day view must render on one request (SPEC 4.2). The services list
			// is only needed by the first create or timer start, which reads this cache or waits
			// on that single request if it has not landed yet (A-1).
			void queryClient.prefetchQuery(servicesQueryOptions(session));

			await navigate({ to: '/' });
		} catch (error) {
			setErrorMessage(toLoginErrorMessage(error, organizationId));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<div className="w-full max-w-[380px]">
			<form
				noValidate
				onSubmit={(event) => {
					void handleSubmit(submit)(event);
				}}
				className="flex flex-col gap-5 rounded-panel border border-line bg-surface px-6 py-7"
			>
				<div className="flex flex-col gap-2">
					<img src={brandmarkUrl} alt="" width={28} height={28} className="mb-1 block size-7" />
					<h1 tabIndex={-1} className="text-title leading-[1.2] font-bold tracking-[-0.02em]">
						Productive Time Tracker
					</h1>
					<p className="text-meta leading-[1.4] text-muted">
						Find these under Settings &gt; API integrations in Productive.
					</p>
				</div>

				{errorMessage !== null && (
					<div
						role="alert"
						className="flex items-start gap-2.5 rounded-input border border-danger-border bg-danger-bg px-3.5 py-3"
					>
						<AlertIcon />
						<span className="text-meta leading-[1.4] text-danger-ink">{errorMessage}</span>
					</div>
				)}

				<div className="flex flex-col gap-4">
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
								// One glyph for both states, as drawn. The state is carried by the
								// accessible name and `aria-pressed`, not by a second icon.
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
							className="tabular h-13"
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

				<Button type="submit" disabled={!isValid || isPending} className="w-full">
					{isPending && (
						<span className="size-4 animate-spinner rounded-pill border-2 border-white/35 border-t-white" />
					)}
					{isPending ? 'Logging in' : 'Log in'}
				</Button>
			</form>

			<p className="mt-4 px-1 text-center text-caption leading-[1.5] text-muted">
				Credentials are stored in this browser only. Log out to remove them.
			</p>
		</div>
	);
}
