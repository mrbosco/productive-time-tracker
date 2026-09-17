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
 *
 * That is the behaviour of a start with no `time_entry` relationship. `continueTimer` below sends
 * one and gets the other behaviour: attached to an entry that already exists, creating nothing.
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
 * Continues an **existing** entry: the timer attaches to it rather than creating one, and stopping
 * adds the elapsed whole minutes to what that entry already holds
 * (`docs/api/samples/timer-continue-entry-probe.txt`).
 *
 * The one thing that makes this work is the `time_entry` relationship. Given one, `POST /timers`
 * attaches; without one it creates, which is what `startTimer` above relies on. Two behaviours,
 * one endpoint, told apart by a relationship.
 *
 * `time-entries`, dasherized, is not a typo: it is what Productive's own client sends and what was
 * observed to work. The response echoes the type back underscored, so the API normalises on the way
 * in - but the underscored form has not been tested here, and there is no reason to be the one to
 * find out.
 *
 * No `person` and no `service`: the entry already has both, and A-1's default has no business
 * overwriting the service something was originally logged against.
 */
export async function continueTimer(auth: Auth, timeEntryId: string): Promise<Timer> {
	const body = {
		data: {
			type: 'timers',
			relationships: {
				time_entry: { data: { type: 'time-entries', id: timeEntryId } },
			},
		},
	};

	/*
	 * `include=time_entry` because `toTimer` reads that relationship, and an un-included one carries
	 * no `data` and no id at all (api-client rule 10) - the link would come back `null` from a call
	 * that was handed the entry in the first place. It is also the request the probe recorded:
	 * Productive's own client asks for `include=time_entry.person`.
	 */
	const path = `/timers?include=time_entry&${FIELDS}`;
	const document = requireDocument(await request(auth, path, { method: 'POST', body: JSON.stringify(body) }));

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
