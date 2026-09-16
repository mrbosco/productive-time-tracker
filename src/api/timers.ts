import {
	type Auth,
	type JsonApiDocument,
	listResources,
	readAttributeNumber,
	readAttributeString,
	readRelationshipId,
	readResource,
	request,
	requireDocument,
	type Resource,
} from './client';
import type { Timer } from './types';

const FIELDS = 'fields[timers]=started_at,stopped_at,total_time,person_id,time_entry';

function toTimer(resource: Resource): Timer {
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

export function parseTimer(document: JsonApiDocument): Timer | null {
	const [resource] = listResources(document);

	return resource === undefined ? null : toTimer(resource);
}

/**
 * `filter[stopped_at][eq]=` is an empty-valued filter copied from Productive's own web app, and no
 * sample can prove it filters - the account only ever had one timer. Since an ignored filter would
 * hand back an arbitrary timer, the running check is repeated client-side.
 */
export async function getRunningTimer(auth: Auth, personId: string): Promise<Timer | null> {
	const path =
		`/timers?filter[person_id]=${encodeURIComponent(personId)}` +
		`&filter[stopped_at][eq]=&include=time_entry&${FIELDS}&page[size]=1`;

	const timer = parseTimer(requireDocument(await request(auth, path)));

	return timer !== null && timer.stoppedAt === null ? timer : null;
}

/**
 * Starting a timer **also creates a time entry**, dated today with `time: 0`, linked through the
 * timer's `time_entry` relationship. That entry shows up in the day list immediately, so a running
 * timer is visible as a `0h` row before it is ever stopped.
 */
export async function startTimer(auth: Auth, personId: string, serviceId: string): Promise<Timer> {
	const body = {
		data: {
			type: 'timers',
			relationships: {
				service: { data: { type: 'services', id: serviceId } },
				person: { data: { type: 'people', id: personId } },
			},
		},
	};

	const document = requireDocument(await request(auth, '/timers', { method: 'POST', body: JSON.stringify(body) }));

	return toTimer(readResource(document));
}

/**
 * `PUT`, not `POST` - the same path answers 404 for every other verb
 * (`docs/api/samples/timer-stop-endpoint-probes.txt`). The elapsed whole minutes are written onto
 * the linked time entry as `time`; the sub-minute remainder is dropped. Stopping twice is a 409
 * `timer_already_stopped`, so callers must treat that as "already stopped", not as a failure.
 */
export async function stopTimer(auth: Auth, timerId: string): Promise<Timer> {
	const path = `/timers/${encodeURIComponent(timerId)}/stop`;
	const document = requireDocument(await request(auth, path, { method: 'PUT', body: '{}' }));

	return toTimer(readResource(document));
}
