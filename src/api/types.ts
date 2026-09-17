/** Domain types, narrowed to the fields this app renders. Derived from the recorded responses in
 * `docs/api/samples/` rather than the OpenAPI file - a TimeEntry carries ~45 attributes on the wire
 * and we use three of them. */

export interface Person {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	/** Uploaded in Productive, and null for anyone who has not. Initials are the fallback. */
	avatarUrl: string | null;
	/** Expected working hours, as the JSON **string** the API stores it as. Read with
	 * `lib/availability.ts`; null when the request did not ask for it. */
	availabilities: string | null;
}

/** The levels a service sits under, flattened from `service -> deal -> project -> company`. Every
 * field is null when the request did not `include` it, which is never the same thing as "the record
 * has none". */
export interface Service {
	id: string;
	name: string;
	/** Productive's Deal. Names repeat, so this alone identifies nothing. */
	dealName: string | null;
	dealId: string | null;
	/** Productive's Project: the name people say out loud. */
	projectName: string | null;
	/** The project's company, or the deal's when there is no project. */
	companyName: string | null;
	companyId: string | null;
	/** Null when the company has no logo, which is the initials case rather than an error. */
	companyAvatarUrl: string | null;
	/** The company being billed. Diverges from `companyName` only on subcontracted work. */
	clientName: string | null;
	clientId: string | null;
	sectionName: string | null;
}

export interface OrganizationMembership {
	id: string;
	/** null when the response was fetched without `include=person` - never "has no person". */
	personId: string | null;
	person: Person | null;
	/** The organization this membership is in, which is not necessarily the one that was asked for:
	 * `X-Organization-Id` does not scope the collection. Null only when the response was fetched
	 * without `include=organization`. */
	organizationId: string | null;
	organizationName: string | null;
	/** Hangs off the organization's **company**, not the organization itself: Productive's own client
	 * reaches it as `include=organization.company` and renders that company's `avatar_url`. */
	organizationAvatarUrl: string | null;
	/** That company's ID. */
	organizationCompanyId: string | null;
}

export interface TimeEntry {
	id: string;
	date: string;
	/** Minutes. Can be 0 in records written by Productive's UI, even though this form rejects 0. */
	minutes: number;
	/** May contain HTML from Productive's rich-text editor. Never render it raw. */
	note: string | null;
	/** Productive's own draft flag, independent of `minutes` being 0 - the recorded zero-minute entry
	 * has `draft: false`. The draft label renders from this, never from the duration. */
	draft: boolean;
	serviceId: string | null;
	service: Service | null;
	/** The API cannot sort by this, so the day list orders on it client-side. */
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

/** What a create or update actually returns. POST and PATCH responses carry only the `organization`
 * relationship, so `service` and `serviceId` are omitted rather than reported as null - a caller
 * that needs the service must use the one it sent, or refetch. */
export type MutatedTimeEntry = Omit<TimeEntry, 'service' | 'serviceId'>;

export interface TimeEntryInput {
	date: string;
	minutes: number;
	note: string | null;
}
