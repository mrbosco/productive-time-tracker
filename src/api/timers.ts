import {
	type Auth,
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

/** Every timer run attached to one entry, oldest first. `filter[time_entry_id]` genuinely filters
 * rather than being silently ignored: three rows against sixteen unfiltered. Sorted here rather
 * than trusted - each run is the step up from the one before, so a wrong order gives wrong minutes. */
export async function listTimersForEntry(auth: Auth, timeEntryId: string): Promise<Timer[]> {
	const path =
		`/timers?filter[time_entry_id]=${encodeURIComponent(timeEntryId)}` + `&include=time_entry&${FIELDS}&page[size]=200`;
	const timers = listResources(requireDocument(await request(auth, path))).map(toTimer);

	return timers.sort((left, right) => Date.parse(left.startedAt) - Date.parse(right.startedAt));
}

/**
 * `filter[stopped_at][eq]=` is an empty-valued filter copied from Productive's own web app, and no
 * sample proves it filters - this API ignores unknown filters silently rather than rejecting them.
 * So the page is asked for in full and the running row is picked here: capping it at one row would
 * mean an ignored filter returns one arbitrary timer, the check below rejects it, and a timer that
 * is genuinely running reads as none.
 */
export async function getRunningTimer(auth: Auth, personId: string): Promise<Timer | null> {
	const path =
		`/timers?filter[person_id]=${encodeURIComponent(personId)}` +
		`&filter[stopped_at][eq]=&include=time_entry&${FIELDS}&page[size]=200`;

	const timers = listResources(requireDocument(await request(auth, path))).map(toTimer);

	return timers.find((timer) => timer.stoppedAt === null) ?? null;
}

/** Starting a timer **also creates a time entry**, dated today with `time: 0`, linked through the
 * timer's `time_entry` relationship - so a running timer is visible as a `0h` row in the day list
 * before it is ever stopped. That is the behaviour of a start with no `time_entry` relationship;
 * `continueTimer` below sends one and gets the other behaviour. */
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

	const document = requireDocument(
		await request(auth, '/timers?include=time_entry', { method: 'POST', body: JSON.stringify(body) })
	);

	return toTimer(readResource(document));
}

/** Continues an **existing** entry: given a `time_entry` relationship `POST /timers` attaches rather
 * than creating, and stopping adds the elapsed whole minutes to what that entry holds
 * (`docs/api/samples/timer-continue-entry-probe.txt`). `time-entries`, dasherized, is not a typo -
 * it is what Productive's own client sends. No `person` and no `service`: the entry has both. */
export async function continueTimer(auth: Auth, timeEntryId: string): Promise<Timer> {
	const body = {
		data: {
			type: 'timers',
			relationships: {
				time_entry: { data: { type: 'time-entries', id: timeEntryId } },
			},
		},
	};

	// `include=time_entry` because `toTimer` reads that relationship, and an un-included one carries
	// no `data` and no id at all - the link would come back `null` from a call that was handed the
	// entry in the first place.
	const path = `/timers?include=time_entry&${FIELDS}`;
	const document = requireDocument(await request(auth, path, { method: 'POST', body: JSON.stringify(body) }));

	return toTimer(readResource(document));
}

/** `PUT`, not `POST` - the same path answers 404 for every other verb
 * (`docs/api/samples/timer-stop-endpoint-probes.txt`). The elapsed whole minutes are written onto
 * the linked time entry as `time`; the sub-minute remainder is dropped. Stopping twice is a 409
 * `timer_already_stopped`, so callers must treat that as "already stopped", not as a failure. */
export async function stopTimer(auth: Auth, timerId: string): Promise<Timer> {
	const path = `/timers/${encodeURIComponent(timerId)}/stop`;
	const document = requireDocument(await request(auth, path, { method: 'PUT', body: '{}' }));

	return toTimer(readResource(document));
}
