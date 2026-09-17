/**
 * Domain types, narrowed to the fields this app renders. Derived from the recorded responses in
 * `docs/api/samples/`, not from the OpenAPI file (ADR-0005) - a TimeEntry carries ~45 attributes on
 * the wire and we use three of them.
 */

export interface Person {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	/** Uploaded in Productive, and null for anyone who has not. Initials are the fallback. */
	avatarUrl: string | null;
}

export interface Service {
	id: string;
	name: string;
	/** The deal is Productive's "project". Names repeat, so this alone does not identify a service. */
	dealName: string | null;
	dealId: string | null;
	companyName: string | null;
}

export interface OrganizationMembership {
	id: string;
	/** null when the response was fetched without `include=person` - never "has no person". */
	personId: string | null;
	person: Person | null;
	/**
	 * The organization this membership is in, which is not necessarily the one that was asked for:
	 * `X-Organization-Id` does not scope the collection. Null only when the response was fetched
	 * without `include=organization`.
	 */
	organizationId: string | null;
	organizationName: string | null;
	/**
	 * The organization's logo, which hangs off its **company**, not off the organization itself -
	 * Productive's own client reaches it as `include=organization.company` and renders that
	 * company's `avatar_url` (`organization-memberships-avatars.json`).
	 */
	organizationAvatarUrl: string | null;
}

export interface TimeEntry {
	id: string;
	date: string;
	/** Minutes. Can be 0 in records written by Productive's UI, even though our form rejects 0 (A-8). */
	minutes: number;
	/** May contain HTML from Productive's rich-text editor (A-9). Strip before rendering. */
	note: string | null;
	/**
	 * Productive's own draft flag. Independent of `minutes` being 0 - the recorded zero-minute entry
	 * has `draft: false` - so the UI's draft label renders from this, never from the duration (A-8).
	 */
	draft: boolean;
	serviceId: string | null;
	service: Service | null;
	/** The API cannot sort by this, so the day list orders on it client-side (A-7). */
	createdAt: string;
}

export interface Timer {
	id: string;
	/** null when neither the attribute nor the relationship was returned. */
	personId: string | null;
	startedAt: string;
	stoppedAt: string | null;
	totalTime: number;
	timeEntryId: string | null;
}

/**
 * What a create or update actually returns. POST and PATCH responses carry only the `organization`
 * relationship, so `service` and `serviceId` are omitted rather than reported as null - a caller
 * that needs the service must use the one it sent, or refetch.
 */
export type MutatedTimeEntry = Omit<TimeEntry, 'service' | 'serviceId'>;

export interface TimeEntryInput {
	date: string;
	minutes: number;
	note: string | null;
}
