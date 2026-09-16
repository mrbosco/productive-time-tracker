# Productive API notes

Verified against the live API on 2026-09-16. Every claim below is backed by a response in
`docs/api/samples/` and cites it. Where a claim rests on something a sample cannot hold, it says so.

Samples are pretty-printed (whitespace only) and scrubbed: the organization ID is replaced with
`999999`, and the person's name, email and avatar URLs with placeholders. Resource IDs are otherwise
untouched so relationship pointers stay coherent for MSW fixtures. `docs` is in `.prettierignore`,
so the bodies are never reformatted again. Transport statuses are in `http-status-lines.txt`,
recorded by `curl` rather than asserted in prose here.

Superseded source: `api-master.yaml` (OpenAPI 3.1, kept out of the repo because of size) and
https://developer.productive.io/reference/resources/time-entries. Where the OpenAPI file and the
live API disagreed, the live API won.

## Auth and headers

- `X-Auth-Token: <token>`
- `X-Organization-Id: <id>` — required on every endpoint
- `Content-Type: application/vnd.api+json` on POST/PATCH. SPEC 4 sends it on every request; that is
  harmless but unnecessary, and the client only sets it when there is a body.
- Base URL: `https://api.productive.io/api/v2`

`GET /organization_memberships` returned exactly one membership (`total_count: 1`) on the test
account, and a valid token paired with a different organization ID fails 403 `no_person`
(`error-403.json`). That is consistent with the header scoping the collection, but the test account
has only one membership, so **scoping is inferred, not proven** — a multi-org account would settle
it. Either way the 403 makes the "wrong organization" case an error, not a filtering problem.

## Endpoints in use

| Purpose        | Method + path                                  | Sample                                                 |
| -------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Resolve person | `GET /organization_memberships?include=person` | `organization-memberships-include-person.json`         |
| List for a day | `GET /time_entries`                            | `time-entries-day.json`, `time-entries-empty-day.json` |
| Read one       | `GET /time_entries/{id}`                       | `time-entry-show.json`                                 |
| Create         | `POST /time_entries`                           | `time-entry-create.json`                               |
| Update         | `PATCH /time_entries/{id}`                     | `time-entry-update.json`                               |
| Delete         | `DELETE /time_entries/{id}`                    | `time-entry-delete.txt`                                |
| Services       | `GET /services`                                | `services.json`                                        |
| Running timer  | `GET /timers`                                  | `timers-running.json`                                  |

`POST /timers` and `POST /timers/{id}/stop` are **not verified** — see Q6.

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
the four flat attributes SPEC 3 lists (`time-entry-create.json`). Only the omission of `service` was
exercised, so "required" is proven for `service` alone (`error-422-missing-service.json`).

- `note` is nullable, not just empty-string (`time-entries-day.json`).
- `time: 0` occurs in real data (`time-entries-day.json`, entry `162921848`). That entry is
  **`draft: false`** (`time-entries-day-all-fields.json`, the same day recorded without a field
  list) — zero-minute entries are not merely unfinished drafts, so rendering must tolerate them even
  though the create form rejects 0 (A-8).
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

- `max_page_size` is **200**, so SPEC 4.1's `page[size]=200` sits exactly at the ceiling.
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

`GET /timers?filter[person_id]=P&filter[stopped_at][eq]=&include=time_entry&page[size]=1`
returns the running timer (`timers-running.json`):

```json
{ "person_id": 1448639, "started_at": "…", "stopped_at": null, "total_time": 0 }
```

Note `person_id` is a plain **attribute** here, an integer, in addition to the relationships — the
only endpoint observed doing that.

`POST /timers` and `POST /timers/{id}/stop` were deliberately **not** exercised: a live timer was
already running on the test account, and Productive permits one running timer per person, so
starting another risked stopping the user's. Whether stopping a timer writes `time` onto the linked
entry is therefore still unknown. **SPEC 10 X-4 states these were "verified in Phase 4"; they were
not.**

## Verified findings

| #   | Question (from the Phase 1 extract)                                | Answer                                                                                                                                                                                                      | Sample                                                                     | SPEC impact                                                                                                                 |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | `GET /organization_memberships` shape; is `include=person` needed?  | **Yes, and for more than the name.** Without it `relationships.person` is `{"meta":{"included":false}}` with no ID, and there is no `organization_id` attribute either.                                       | `organization-memberships.json`, `organization-memberships-include-person.json` | **Changes SPEC 4.1** — "pick the membership whose `organization.id` matches" cannot be done; the wrong organization is a 403 |
| 2   | Are `after`/`before` inclusive for a single day?                    | **Inclusive.** `after=before=2026-09-15` returns all 3 entries for that date.                                                                                                                                 | `time-entries-day.json`                                                     | Confirms SPEC 4.1                                                                                                           |
| 3   | How to list trackable services; 422 body when `service_id` missing  | `filter[time_tracking_enabled]=true` (29 → 26), disagreeing with the attribute. `filter[person_id]` is ignored — the list is org-wide. 422 is `invalid_attribute_value` / "person cannot track on this service". | `services-unfiltered.json`, `services.json`, `error-422-missing-service.json` | **Breaks A-1** — "first service the person can track on" is not resolvable from this endpoint, so A-1 needs a new rule, not just a deal name in the selector |
| 4   | 401 vs 403 bodies                                                   | 401 `invalid_auth_token` (bad token); 403 `no_person` (valid token, wrong organization).                                                                                                                      | `error-401.json`, `error-403.json`                                          | Login error copy can distinguish the two                                                                                    |
| 5   | `after`/`before` ≡ `date[gt_eq]`/`[lt_eq]`? `page[size]` or `per_page`? | Filter forms are equivalent (identical ID sets). **Both** pagination params work identically; use `page[size]`.                                                                                             | `time-entries-day-date-operators.json`, `time-entries-page-size.json`, `time-entries-per-page.json` | **Changes SPEC 4.2** — the key names are as SPEC assumed, but the guard is not: an empty day is `total_pages: 0`, so `total_pages > 1` is the wrong test |
| 6   | `POST /timers` body, `/timers/{id}/stop`, does stopping write `time`? | **Unresolved.** GET verified; writes skipped to avoid stopping the live timer already running on the account.                                                                                                 | `timers-running.json`                                                       | **Contradicts SPEC 10 X-4**, which claims these were verified                                                               |
| 7   | Does `note` from the UI contain HTML?                               | **Yes.** A UI-created entry's note is `"<ul><li><p>Probavam</p></li></ul>"`. `note` is also nullable. Plain text with `\n` round-trips unchanged.                                                              | `time-entries-day.json`, `time-entry-create.json`                           | **Confirms A-9** with evidence — strip tags on render, write plain text                                                     |

### Found while verifying (not among the original seven)

| Finding                                                                                     | Sample                                       | SPEC impact                                                          |
| ------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Sparse fieldsets supported on collections — 13x, 27x and 5.4x on the three in use.           | `services.json` and the other sparse samples | **Extends SPEC 4.2** — a concrete "no over-fetching" lever            |
| `fields` is ignored on `GET /time_entries/{id}`; the full 44-attribute record comes back.    | `time-entry-show.json`                       | The efficiency lever does not apply to the edit route's fetch         |
| `sort=created_at` is rejected; only `date`/`-date` are accepted.                             | `sort-support.txt`                           | **Changes A-7** — sort by `created_at` must be client-side            |
| `errors[].status` can be a slug (`unprocessable_content`) over a different HTTP status.      | `error-400-sort-unsupported.json` + `http-status-lines.txt` | Error mapping must use the transport status            |
| Unknown filters are silently ignored rather than rejected.                                   | `services-person-filter-ignored.json`        | Any new filter needs an unfiltered-count check                        |
| `time: 0` entries exist in real data, with `draft: false`.                                   | `time-entries-day.json`                      | **Qualifies A-8** — and its "zero means draft" rationale is wrong     |
| POST/PATCH responses omit `person` and `service` relationship data.                          | `time-entry-create.json`                     | Mutation responses can't render a service name                        |
| `DELETE` → 204, no body, no `Content-Type`.                                                  | `time-entry-delete.txt`                      | Client must not JSON-parse 204                                        |
| `note` is nullable; SPEC 3 and the domain diagram type it as a plain `string`.               | `time-entries-day.json`                      | **Changes SPEC 3** and `docs/diagrams/02-domain-model.mmd`            |
| Create takes `person`/`service` as relationships, not as flat `person_id`/`service_id` attributes. | `time-entry-create.json`                | **Changes SPEC 3**                                                    |

## Reproducing

`docs/api/samples/` was recorded with a throwaway entry that was created, read, updated and then
deleted; the account was verified back to zero entries for that date afterwards. Credentials came
from a gitignored `.env.local` sourced by the shell and never written to disk or logs. Never use
`curl -v`: it echoes request headers, and the token is a request header.
