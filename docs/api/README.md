# Productive API notes

Verified against the live API on 2026-09-16. Every claim below is backed by a response in
`docs/api/samples/` and cites it. Where a claim rests on something a sample cannot hold, it says so.

Samples are pretty-printed (whitespace only) and scrubbed: the organization ID is replaced with
`999999`, and the person's name, email and avatar URLs with placeholders. Resource IDs are otherwise
untouched so relationship pointers stay coherent for MSW fixtures. `docs` is in `.prettierignore`,
so the bodies are never reformatted again. Transport statuses are in `http-status-lines.txt`,
recorded by `curl` rather than asserted in prose here.

## What this file is, and is not

**The contract is Productive's own reference**, at https://developer.productive.io/reference, and
changes to it are announced at https://developer.productive.io/reference/changelog. Read those
first; most questions are answered there.

**This file records the gap between that reference and what the API actually does**, because for
this integration the gap mattered. Unknown filter names are ignored rather than rejected, so a
filter that looks applied may not be. `X-Organization-Id` does not scope `/organization_memberships`.
Stopping a timer is `PUT`, not `POST`. `fields` is honoured on collections and ignored on a single
resource. None of that is in the reference, and each of them would have been a bug shipped on an
assumption. Every claim below cites the recorded response that established it.

**These recordings are a point in time, not a live contract.** They were taken on 2026-09-16/17 and
nothing re-checks them: the test suite runs against these files through MSW, so it would stay green
against a shape the API no longer sends. Re-record with `pnpm api:sample` and read the diff when the
changelog moves, or when something behaves unlike these notes describe. One known drift is already
documented at the end of this file.

The OpenAPI source (`api-master.yaml`, 130k lines) is deliberately not in the repo (ADR-0005). Where
it and the live API disagreed, the live API won.

## Auth and headers

- `X-Auth-Token: <token>`
- `X-Organization-Id: <id>` — required on every endpoint
- `Content-Type: application/vnd.api+json` on POST/PATCH only — the client sets it when a request
  carries a body (`src/api/client.ts`).
- Base URL: `https://api.productive.io/api/v2`

**`X-Organization-Id` does not scope `GET /organization_memberships`.** Recorded 2026-09-16: the
same request with `X-Organization-Id: 1234`, an organization that does not exist, returns **200**
and the token's own membership, whose `organization` relationship still points at the real
organization (`organization-memberships-unknown-organization.json`). A valid token with a *real*
organization it has no person in is refused with 403 `no_person` (`error-403.json`), so both
outcomes happen and both have to be handled.

This is why the app must **find the membership whose organization matches the entered ID** rather
than take the first one back, which is exactly what the assignment describes on page two:
"OrganizationMembership belonging to the Organization with the entered ID is found among the
results." An earlier revision of this file claimed that match was impossible because the
`organization` relationship carries no ID — that was read off a response fetched *without*
`include=organization`, the same trap described under "The relationship trap" below. Asked for, it
is there (`organization-memberships-include-organization.json`).

Narrow the organization with `fields[organizations]=name`. The full record carries an invitation
token, a billing email and analytics identifiers, none of which this app has any use for.

## Endpoints in use

| Purpose        | Method + path                                  | Sample                                                 |
| -------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Resolve person | `GET /organization_memberships?include=person,organization.company` | `organization-memberships-avatars.json`, which also carries `availabilities`      |
| List for a day | `GET /time_entries`                            | `time-entries-day-service-context.json`, `time-entries-empty-day.json` |
| Read one       | `GET /time_entries/{id}`                       | `time-entry-show.json`                                 |
| Create         | `POST /time_entries`                           | `time-entry-create.json`                               |
| Update         | `PATCH /time_entries/{id}`                     | `time-entry-update.json`                               |
| Delete         | `DELETE /time_entries/{id}`                    | `time-entry-delete.txt`                                |
| Services       | `GET /services`                                | `services.json`                                        |
| Running timer  | `GET /timers`                                  | `timers-running.json`                                  |

## The relationship trap

This is the single most important thing to know about this API.

A relationship that was not named in `include` serialises as:

```json
"person": { "meta": { "included": false } }
```

There is **no `data` key at all** — not even a resource identifier (`organization-memberships.json`).
So `include` is not an optimisation here, it is the only way to learn a related record's ID.

Presence is also inconsistent per relationship. On a time entry fetched with `include=service`,
`organization` carries `data` nobody asked for while `person` and `task` carry none
(`time-entries-day-all-fields.json`). On a membership fetched with no `include` and no field list,
both `person` and `organization` carry none, and there is no `organization_id` attribute to fall
back on either (`organization-memberships-all-fields.json`).

**Never read `relationships.X.data` without having asked for `X` in `include`.** Treat a missing
`data` as "not requested", never as "no related record".

## TimeEntry

Attributes used: `date` (`YYYY-MM-DD`), `time` (integer minutes), `note` (string **or `null`**),
`created_at`. The full record carries 44 attributes (costs, approval, invoicing, overtime), all
read-only for this app — see `time-entry-show.json`. Relationships used: `person`, `service`.

Create takes `date` and `time` as attributes plus `person` and `service` as **relationships** — not
the four flat attributes the spec lists (`time-entry-create.json`). Only the omission of `service` was
exercised, so "required" is proven for `service` alone (`error-422-missing-service.json`).

- `note` is nullable, not just empty-string (`time-entries-day.json`).
- `time: 0` occurs in real data (`time-entries-day.json`, entry `162921848`). That entry is
  **`draft: false`** (`time-entries-day-all-fields.json`, the same day recorded without a field
  list) — zero-minute entries are not merely unfinished drafts, so rendering must tolerate them even
  though the create form rejects 0 (A-8).
- **`draft` is independent of duration.** The recorded zero-minute entry has `draft: false`, so a
  zero-minute entry is not a draft. A-8 renders the `draft` label from `attributes.draft` only, and
  `draft` is part of the day list's field set for that reason. Zero-minute entries render as `0h`
  with no extra label.
- **POST and PATCH responses carry only the `organization` relationship** — not `person` or
  `service` (`time-entry-create.json`). Re-fetch with `include`, or reuse what you already had, if
  the mutation response must render a service name.

## Filters, sorting, pagination

`filter` is a deepObject query param. Both of these return **identical ID sets** for one day
(`time-entries-day.json` vs `time-entries-day-date-operators.json`):

```
filter[person_id]=P&filter[after]=D&filter[before]=D
filter[person_id]=P&filter[date][gt_eq]=D&filter[date][lt_eq]=D
```

`after`/`before` are **inclusive**. Use them — they match the assignment's wording and are shorter.

`filter[person_id]` on `/time_entries` **does** filter: an ID belonging to nobody returns
`total_count: 0` for a day that otherwise holds three entries (`time-entries-unknown-person.json`).
That matters because R-4 rests on it, and the test account has one person, so every other sample
reads the same whether the filter works or is ignored.

**Unknown filters are silently ignored.** `filter[person_id]` on `/services` returns all 29 services
(`services-person-filter-ignored.json`), exactly as an unfiltered call does
(`services-unfiltered.json`) — no error, no warning. A filter that appears to work may be doing
nothing; verify against an unfiltered count.

**Sorting is heavily restricted.** `sort-support.txt` records one request per value: `date` and
`-date` succeed, `created_at`, `-created_at`, `started_at` and `id` are all rejected. Ordering
within a single day must be done client-side.

Pagination meta is the same on every collection:

```json
{ "current_page": 1, "total_pages": 1, "total_count": 3, "page_size": 200, "max_page_size": 200 }
```

- `max_page_size` is **200**, so the client's `page[size]=200` sits exactly at the ceiling.
- An empty result gives `total_pages: 0` (`time-entries-empty-day.json`), not `1`. A paging loop
  must therefore run while `current_page < total_pages`, never `if total_pages > 1`.
- `page[size]` and `per_page` are **both** honoured, returning the same page of the same collection
  with identical `meta` (`time-entries-page-size.json`, `time-entries-per-page.json`). Prefer
  `page[size]`: it is JSON:API canonical and it is what the API emits in its own `links`.

### Sparse fieldsets are supported, and worth using

Every collection this app reads is narrowed, measured raw as sent:

| Collection                                 | Full     | Sparse  |       |
| ------------------------------------------ | -------- | ------- | ----- |
| `/services`                                | 64,209 B | 4,824 B | 13.3x |
| `/organization_memberships` (incl. person) | 10,353 B | 833 B   | 12.4x |
| `/time_entries` (one day)                  | 8,592 B  | 1,602 B | 5.4x  |

Byte counts are of the raw responses as they came off the wire. The samples committed under
`samples/` are the same bodies formatted for reading, so their file sizes are larger and do not
reproduce these ratios directly.

Measured raw as sent, not as stored — the shipped samples are pretty-printed and so read larger.
The unfielded day and membership are shipped (`time-entries-day-all-fields.json`,
`organization-memberships-all-fields.json`); the unfielded `/services` response is not, so its
64 KB figure rests on the recorder's word alone.

Two catches:

1. **`fields` governs relationships as well as attributes.** `fields[services]=name` alone drops the
   `deal` relationship while still returning the deals in `included` — orphaned records with nothing
   pointing at them (`services-fields-without-relationship.json`). List every relationship you read.
2. **It works on collections only.** `GET /time_entries/{id}` ignores `fields` entirely and returns
   all 44 attributes. `time-entry-show.json` was recorded *with* a field list; unlike the collection
   samples it carries no `links` echoing the query, so that detail rests on the recorder's word.

## Services

`filter[time_tracking_enabled]=true` is the trackable-services filter: 29 services unfiltered
(`services-unfiltered.json`), 26 with the filter (`services.json`).

It does not agree with the attribute of the same name. The three excluded services — `16887836`,
`16887837`, `16887838`, all named `Expenses: …` — report `"time_tracking_enabled": true` in
`services-unfiltered.json` and are absent from `services.json`. **The filter is authoritative; the
attribute is not.**

**The list is organization-wide, not person-scoped.** `filter[person_id]` is ignored, and there is no
other per-person filter. Whether a given person may track against a service surfaces only as a 422
at create time (`error-422-missing-service.json`), so "the first service this person can track on"
cannot be resolved from this endpoint alone.

Service names duplicate badly — 5x "Project management", 2x each of "Design", "Development" and
"Quality Assurance/Testing" (`services.json`). A default-service selector therefore has to show the
deal alongside, which is why `services.json` is recorded with `include=deal&fields[deals]=name`.

**Even that is not unique.** Deal names duplicate too: deals `4287359` and `4287361` are both called
"Development", so the label "Project management — Development" describes two different services. A
selector must key on the service ID and must not present its label as unambiguous.

## Availability (expected hours)

`people.availabilities` is the only expected-hours figure anywhere in this API. It is an
**attribute holding a JSON string**, not a nested object, so it needs a second parse:

```json
"availabilities": "[[\"2026-09-15\", null, [8, 8, 8, 8, 8, 0, 0, 8, 8, 8, 8, 8, 0, 0], 65416]]"
```

One entry per period: `[startDate, endDate, hours, id]`. `endDate` is `null` while the period is
open-ended. `hours` is **fourteen** numbers, not seven - a fortnight, Mon..Sun then Mon..Sun again,
so a schedule that alternates week to week can be expressed. Index 0 is Monday: the recorded period
starts on a Tuesday and still reads `8,8,8,8,8,0,0`, which only lines up if the array is
Monday-based rather than start-date-based.

Both weeks are identical in the recorded account, so **the alternation itself is untested against
real data** - reading `hours[(weeksSincePeriodStart % 2) * 7 + weekdayIndex]` is correct for a
fortnightly schedule and indistinguishable from `hours[weekdayIndex]` here.

A zero is a non-working day. That is a better answer than "is it a weekend", which is what
`lib/date.ts` could offer on its own.

It is reachable without a request of its own: `fields[people]` honours it on
`GET /organization_memberships`, the call login already makes
(`organization-memberships-include-availabilities.json`).

## Errors

Envelope is `{"errors":[…]}` with objects shaped `{ status, code, title, detail, meta, source }`.
Transport statuses for all of these are in `http-status-lines.txt`.

| HTTP | `code`                    | `title`                 | Cause                       | Sample                            |
| ---- | ------------------------- | ----------------------- | --------------------------- | --------------------------------- |
| 400  | `sort_param_unsupported`  | Sort param unsupported  | Unsupported `sort` field    | `error-400-sort-unsupported.json` |
| 401  | `invalid_auth_token`      | Unauthenticated         | Bad token                   | `error-401.json`                  |
| 403  | `no_person`               | Access Denied           | Valid token, wrong org      | `error-403.json`                  |
| 404  | `record_not_found`        | Record Not Found        | Unknown ID                  | `error-404.json`                  |
| 422  | `invalid_attribute_value` | Invalid Attribute Value | Person can't track service  | `error-422-missing-service.json`  |
| 422  | `invalid_attribute_value` | Invalid Attribute Value | Timer sent with no service  | `error-422-timer-requires-service.json` |

Three things to know:

1. **`errors[].status` is not reliably the HTTP status.** The sort error's body says
   `"status": "unprocessable_content"` while `http-status-lines.txt` records the response as **400**.
   Map from the transport status; treat `errors[].status` as decoration.
2. **401 vs 403 is a genuinely useful split for the login screen.** 401 means the token is wrong;
   403 (`no_person`) means the token is fine but has no person in *that* organization, and its
   `detail` names both headers explicitly. They deserve different messages.
3. **`source.pointer` omits the leading slash** — `data/attributes/person`, not
   `/data/attributes/person` as JSON:API specifies. Do not rely on it for field-level mapping.

Omitting the `service` relationship on create does not produce a "missing parameter" error; it
produces 422 `invalid_attribute_value` / "person cannot track on this service", pointed at
`data/attributes/person`.

`DELETE` returns **204 with no body and no `Content-Type` header** — parsing the response as JSON
will throw. `time-entry-delete.txt` is the captured response head.

## Timers

The timer resource is where the API is least guessable, so the whole flow is recorded.
`timer-stop-endpoint-probes.txt` holds the full route matrix; fifteen plausible paths 404.

| Step         | Call                                                     | Sample                                 |
| ------------ | -------------------------------------------------------- | -------------------------------------- |
| Start        | `POST /timers`                                           | `timer-create.json`                    |
| Poll running | `GET /timers?filter[person_id]=P&filter[stopped_at][eq]=&include=time_entry` | `timers-running.json` |
| Stop         | `PUT /timers/{id}/stop`, body `{}`                       | `timer-stop.json`                      |
| Entry after  | `GET /time_entries/{linked id}`                          | `time-entry-from-timer.json`           |
| Stop twice   | 409 `timer_already_stopped`                              | `error-409-timer-already-stopped.json` |

Start takes `service` and `person` as **relationships**, no attributes. Despite that, the validation
error for a malformed start points at `data/attributes/service`
(`error-422-timer-requires-service.json`) — the pointer names a field shape the endpoint does not
actually accept, so do not build anything on it.

A timer's `person_id` is a plain integer **attribute** as well as a relationship — the only endpoint
observed doing that.

Three things worth knowing:

1. **`PUT`, not `POST`.** `POST /timers/{id}/stop` is a 404, as are `/stop_timer`, `/stop-timer`,
   `PATCH`/`PUT`/`DELETE` on `/timers/{id}`, and `POST /time_entries/{id}/stop`. `PATCH` on
   `/timers/{id}/stop` does work, which is how the path was confirmed before the verb was.
   `PATCH /time_entries/{id}` with `timer_stopped_at` returns 200 and silently ignores it.
2. **Starting a timer creates a time entry**, dated today with `time: 0`, linked through the timer's
   `time_entry` relationship. A running timer is therefore already visible in the day list as a `0h`
   row. Anything stopping a timer must update that entry, not create another.
3. **Stopping writes the elapsed whole minutes onto the linked entry.** 87 seconds of runtime gave
   `total_time: 1` on the timer and `time: 1` on the entry; the sub-minute remainder is dropped.
   A second stop is 409 `timer_already_stopped` — treat it as "already stopped", not as a failure.

**Listing one entry's runs.** `/timers?filter[time_entry_id]={id}` returns every run attached to
that entry - 3 rows against 16 unfiltered, so the filter is real and not one of the silently ignored
ones (`timers-for-entry.json`, `timers-all.json`).

`total_time` on each row is the **linked entry's cumulative minutes after that run**, not the run's
own length. Three runs on entry `163139951` read `2`, `26`, `26`; the entry holds 26. A single run's
contribution is therefore `total_time[n] - total_time[n-1]`, and the first row's is its own
`total_time`. The rows came back in start order, but nothing documents that they must, so sort on
`started_at` before differencing.

The last row's `total_time` is what the timer contributed in total; anything between that and the
entry's `time` was typed by hand.

## Verified findings

| #   | Question (from the Phase 1 extract)                                | Answer                                                                                                                                                                                                      | Sample                                                                     | Impact                                                                                                                      |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | `GET /organization_memberships` shape; is `include=person` needed?  | **Yes, and for more than the name.** Without it `relationships.person` is `{"meta":{"included":false}}` with no ID, and there is no `organization_id` attribute either. The same holds for `organization`.    | `organization-memberships.json`, `organization-memberships-include-organization.json` | **Confirmed** — "pick the membership whose `organization.id` matches" is exactly right, once `organization` is in the `include` |
| 2   | Are `after`/`before` inclusive for a single day?                    | **Inclusive.** `after=before=2026-09-15` returns all 3 entries for that date.                                                                                                                                 | `time-entries-day.json`                                                     | Confirmed                                                                                                           |
| 3   | How to list trackable services; 422 body when `service_id` missing  | `filter[time_tracking_enabled]=true` (29 → 26), disagreeing with the attribute. `filter[person_id]` is ignored — the list is org-wide. 422 is `invalid_attribute_value` / "person cannot track on this service". | `services-unfiltered.json`, `services.json`, `error-422-missing-service.json` | **Breaks A-1** — "first service the person can track on" is not resolvable from this endpoint, so A-1 needs a new rule, not just a deal name in the selector |
| 4   | 401 vs 403 bodies                                                   | 401 `invalid_auth_token` (bad token); 403 `no_person` (valid token, wrong organization).                                                                                                                      | `error-401.json`, `error-403.json`                                          | Login error copy can distinguish the two                                                                                    |
| 5   | `after`/`before` ≡ `date[gt_eq]`/`[lt_eq]`? `page[size]` or `per_page`? | Filter forms are equivalent (identical ID sets). **Both** pagination params work identically; use `page[size]`.                                                                                             | `time-entries-day-date-operators.json`, `time-entries-page-size.json`, `time-entries-per-page.json` | **Changed the client** — the key names are as assumed, but the guard is not: an empty day is `total_pages: 0`, so `total_pages > 1` is the wrong test |
| 6   | `POST /timers` body, `/timers/{id}/stop`, does stopping write `time`? | **Resolved.** Start posts `service` and `person` as relationships and auto-creates a `time: 0` entry. Stop is `PUT /timers/{id}/stop` with `{}`, and it writes the elapsed whole minutes onto that entry. | `timer-create.json`, `timer-stop.json`, `time-entry-from-timer.json`        | **Settled the timer endpoints** — the endpoints are now recorded rather than assumed                                                  |
| 7   | Does `note` from the UI contain HTML?                               | **Yes.** A UI-created entry's note is `"<ul><li><p>Probavam</p></li></ul>"`. `note` is also nullable. Plain text with `\n` round-trips unchanged.                                                              | `time-entries-day.json`, `time-entry-create.json`                           | **Confirms A-9** with evidence — strip tags on render, write plain text                                                     |

### Found while verifying (not among the original seven)

| Finding                                                                                     | Sample                                       | Impact                                                               |
| ------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `X-Organization-Id` does not scope the membership collection: an unknown organization returns 200 and the token's own memberships. | `organization-memberships-unknown-organization.json` | **Restored the membership match** — the app finds the matching membership, and a login that skipped that step accepted any organization |
| Sparse fieldsets supported on collections — 13.3x, 12.4x and 5.4x on the three in use.           | `services.json` and the other sparse samples | **Extended** — a concrete "no over-fetching" lever            |
| `fields` is ignored on `GET /time_entries/{id}`; the full 44-attribute record comes back.    | `time-entry-show.json`                       | The efficiency lever does not apply to the edit route's fetch         |
| `sort=created_at` is rejected; only `date`/`-date` are accepted.                             | `sort-support.txt`                           | **Changes A-7** — sort by `created_at` must be client-side            |
| `errors[].status` can be a slug (`unprocessable_content`) over a different HTTP status.      | `error-400-sort-unsupported.json` + `http-status-lines.txt` | Error mapping must use the transport status            |
| Unknown filters are silently ignored rather than rejected.                                   | `services-person-filter-ignored.json`        | Any new filter needs an unfiltered-count check                        |
| `time: 0` entries exist in real data, with `draft: false`.                                   | `time-entries-day.json`                      | **Qualifies A-8** — and its "zero means draft" rationale is wrong     |
| POST/PATCH responses omit `person` and `service` relationship data.                          | `time-entry-create.json`                     | Mutation responses can't render a service name                        |
| `DELETE` → 204, no body, no `Content-Type`.                                                  | `time-entry-delete.txt`                      | Client must not JSON-parse 204                                        |
| `note` is nullable; the domain model originally typed it as a plain `string`.               | `time-entries-day.json`                      | **Changed the domain model** and `docs/diagrams/02-domain-model.mmd`            |
| Create takes `person`/`service` as relationships, not as flat `person_id`/`service_id` attributes. | `time-entry-create.json`                | **Changed the domain model**                                                    |
| `/time_entries` nests `include=service.deal.company,service.section` in one request; the deal, its company and the section all come back in `included`. | `time-entries-day-service-deal.json`         | **Unblocks UI-1 and UI-2** — no second request for the company or the project |
| `services.section` is a real relationship and answers `"data": null` for every service in this account — requested and empty, not un-included. | `time-entries-day-service-deal.json`         | **Qualifies UI-2** — the tooltip's third line renders only when a section exists |
| `companies.avatar_url` exists and is a URL string; the scrubber rewrites it to a placeholder, which is itself the proof it was populated. | `company-show.json`                          | **Confirms UI-1** — the card's company logo is real, initials are the fallback |
| `people.availabilities` holds expected hours: a JSON **string** parsing to `[[start, end, hours[14], id]]`, where `hours` is Mon..Sun twice and `end` is `null` while the period is open. | `person-show.json`                           | **Unblocks UI-5 and UI-6** — non-working days and expected hours both come from it |
| `fields[people]=…,availabilities` is honoured on `GET /organization_memberships`, so that figure rides the login request. | `organization-memberships-include-availabilities.json` | **Extended** — UI-6 costs no request of its own |
| `/timers` accepts `filter[time_entry_id]`, and it genuinely filters: 3 rows against 16 unfiltered. | `timers-for-entry.json` + `timers-all.json`  | **Unblocks UI-9** — one entry's runs are listable                     |
| A timer's `total_time` is the linked entry's **cumulative** minutes after that run, not the run's own length. Three runs on one entry read 2, 26, 26. | `timers-for-entry.json`                      | **Confirmed** — UI-9's per-run figure is a delta      |
| The recorded day drifted between 2026-09-16 and 2026-09-17: entry `162921872` (240 min) is gone and `163073474` (0 min) is new, so the day totals `5h` rather than `9h`. | `time-entries-day-service-deal.json`         | The day fixture and every test asserting `9h` move with it            |
| A service's whole hierarchy resolves in one day request: `include=service.deal.company,service.deal.project.company,service.section`. `deals` carry both `company` and `project`, `projects` carry a `company` of their own, and `sections` hang off the service. | `time-entries-day-service-context.json`       | **Unblocks UI-2** — five levels, no fan-out                   |
| The project names in the recording are the design's own sample copy - `Internal project [SAMPLE]`, `Fixed price [SAMPLE]` - which is what confirms the card's meta line is `project · service` rather than `deal · service`. | `time-entries-day-service-context.json`      | **Confirms UI-2** — the dotted name is `deal.project.name`     |
| A single-resource endpoint answers every relationship with `{"meta":{"included":false}}` unless `include` asks; `/services/{id}` and `/deals/{id}` list the relationship names and nothing else. | `service-show.json`, `deal-show.json`        | Confirms api-client rule 10 — the shapes came from the collection |
| An organization has no picture of its own: the logo Productive's top bar renders belongs to `organization.company`, and that company's `avatar_url` is the field. Watched on `app.productive.io`, whose own request is `organization_memberships/{id}?include=…organization.company…`. | `organization-memberships-avatars.json`       | **Confirms UI-8** — the org badge is a real logo, not initials |
| `people.avatar_url` exists and is nullable (null for the recorded person, who never uploaded one). | `person-show.json`, `organization-memberships-avatars.json` | **Confirms UI-8** — initials are the fallback, not the design |
| `fields[people]=…,avatar_url` and `include=person,organization.company` are both honoured on the login request, alongside `availabilities`. | `organization-memberships-avatars.json`      | **Extended** — avatars and expected hours cost no request |

## Reproducing

`pnpm api:sample <name> '<path-with-query>'` records one response into `docs/api/samples/`.

It expects a gitignored `.env.local` holding two variables:

```sh
PRODUCTIVE_API_TOKEN=...      # or PRODUCTIVE_TOKEN, or API_TOKEN
PRODUCTIVE_ORGANIZATION_ID=... # or PRODUCTIVE_ORG_ID, ORGANIZATION_ID, or ORG_ID
```

The app itself never reads that file — only this script does. It reads the credentials
from `.env.local` itself, so they never reach a terminal, a log or an agent's
context, and it scrubs the organization ID, the person's name and email, and the organization name
before anything is written.

Two things it does that are not optional. It passes `curl -g`, because without it curl reads the
`[` and `]` in `fields[organizations]` as a glob range and drops every sparse-fieldset parameter
silently — which turns a 1.4 KB request into a 29 KB one carrying an invitation token and a
billing email. And it refuses to write a body containing any of a list of secret-shaped keys, as
the backstop for exactly that failure.

The earlier samples were recorded by hand with throwaway records that were created, read, updated
and then deleted, and the account was checked back to zero afterwards each time.

Two caveats about replaying these against the live account. The timer verification stopped a timer
that had been running since 2026-09-15, which wrote 1332 minutes onto entry `162921872`; that entry
was then deleted, so `time-entries-day.json` records three entries where the day now holds two.
And `time-entry-show.json` is entry `162903873`, which still exists. Credentials came
from a gitignored `.env.local` sourced by the shell and never written to disk or logs. Never use
`curl -v`: it echoes request headers, and the token is a request header.
