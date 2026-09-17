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

/**
 * The five levels a service sits under, flattened (UI-1, UI-2). Productive nests them
 * `service -> deal -> project -> company`, with the section hanging off the service and a second
 * company off the deal; `Service Context.dc.html` works out which of them belong on a card.
 *
 * Every one of these is null when the request that produced the service did not ask for it, which
 * is never the same thing as "the record has none" (api-client rule 10). `/services` asks for the
 * deal and its company only - the default-service selector labels rows, it does not draw them.
 */
export interface Service {
	id: string;
	name: string;
	/** Productive's Deal: the commercial agreement. Names repeat, so this alone identifies nothing. */
	dealName: string | null;
	dealId: string | null;
	/** Productive's Project: the name people say out loud, and what the card's meta line leads with. */
	projectName: string | null;
	/** The company whose work this is - the project's, or the deal's when there is no project. */
	companyName: string | null;
	companyId: string | null;
	/** Its logo. Null when the company has none, which is the initials case rather than an error. */
	companyAvatarUrl: string | null;
	/**
	 * The company being billed, which is the same organisation almost always. It diverges on
	 * subcontracted work - an agency booked through a partner - and that is the only time it is
	 * worth a line of its own.
	 */
	clientName: string | null;
	clientId: string | null;
	sectionName: string | null;
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
