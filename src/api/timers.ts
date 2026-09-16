import {
	type Auth,
	type JsonApiDocument,
	listResources,
	readAttributeNumber,
	readAttributeString,
	readRelationshipId,
	request,
	requireDocument,
} from './client';
import type { Timer } from './types';

/**
 * ponytail: read-only. `POST /timers` and `POST /timers/{id}/stop` are deliberately absent because
 * they were never recorded - Productive allows one running timer per person, and the test account
 * had a live one, so starting another risked stopping the user's. Record those two calls into
 * `docs/api/samples/` before adding start/stop here (docs/api/README.md, Q6).
 */
const FIELDS = 'fields[timers]=started_at,stopped_at,total_time,person_id,time_entry';

export function parseTimer(document: JsonApiDocument): Timer | null {
	const [resource] = listResources(document);
	if (resource === undefined) return null;

	const personId = readAttributeNumber(resource, 'person_id');

	return {
		id: resource.id,
		// The only endpoint observed exposing person_id as a plain attribute as well as a relationship.
		personId: personId === 0 ? readRelationshipId(resource, 'person') : String(personId),
		startedAt: readAttributeString(resource, 'started_at') ?? '',
		stoppedAt: readAttributeString(resource, 'stopped_at'),
		totalTime: readAttributeNumber(resource, 'total_time'),
		timeEntryId: readRelationshipId(resource, 'time_entry'),
	};
}

/**
 * `filter[stopped_at][eq]=` is an empty-valued filter copied from Productive's own web app, and the
 * recorded sample cannot prove it filters - the account had exactly one timer. Since an ignored
 * filter would hand back an arbitrary timer, the running check is repeated client-side.
 */
export async function getRunningTimer(auth: Auth, personId: string): Promise<Timer | null> {
	const path =
		`/timers?filter[person_id]=${encodeURIComponent(personId)}` + `&filter[stopped_at][eq]=&${FIELDS}&page[size]=1`;

	const timer = parseTimer(requireDocument(await request(auth, path)));

	return timer !== null && timer.stoppedAt === null ? timer : null;
}
