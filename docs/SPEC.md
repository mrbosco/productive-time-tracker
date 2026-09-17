# Productive Time Tracker — Technical Specification

A client-side single-page application for managing one person's Productive time entries for a
chosen day. No server-side code: the browser holds the credentials and talks to the Productive API
directly.

Setup and run instructions are in [`README.md`](../README.md). Decision records are in
[`docs/adr/`](adr/).

## 1. Architecture

### Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build, framework | Vite 8, React 19, TypeScript strict | No server rendering is permitted, so a static SPA bundle is the whole deliverable ([ADR-0001](adr/0001-framework-react-vite.md)) |
| Routing | TanStack Router, file-based | Type-safe params and search params; `beforeLoad` guards give the auth redirect one home ([ADR-0007](adr/0007-router-tanstack.md)) |
| Server state | TanStack Query | Caching, deduplication and invalidation are the whole data layer here; nothing else needed a store ([ADR-0002](adr/0002-data-layer.md)) |
| API client | Hand-written, ~240 lines | The app drives four resources. A generated client or a JSON:API library costs more than it saves ([ADR-0002](adr/0002-data-layer.md)) |
| Forms | react-hook-form + zod | One schema validates create and edit, so both surfaces reject the same input |
| Styling | Tailwind CSS 4, shadcn/ui primitives on Radix | Radix supplies the focus trapping and dialog semantics that would otherwise be hand-written ([ADR-0006](adr/0006-styling-tailwind-shadcn.md)) |
| Rich text | TipTap, description field only | Productive stores notes as HTML; see [ADR-0010](adr/0010-rich-text-notes.md) |

### State ownership

Three layers, with no overlap:

- **Session** — token, organization ID, person ID, person name. React context over `localStorage`,
  injected into the router context so `beforeLoad` guards can redirect without rendering first.
- **Server data** — TanStack Query. Keys are `[resource, ...scope]`, scoped by person wherever the
  data is the person's:
  `['time-entries', personId, date]` for one day, `['week-entries', personId, monday]` for the week
  behind the strip and the timesheet, plus `['time-entry', id]`, `['services', personId]`,
  `['timer', personId]` and a few narrower ones.
- **UI state** — local component state. There is no global store.

### Folder layout

```
src/
├── api/              client.ts (fetch, headers, JSON:API parsing, paging, ApiError), types.ts,
│                     and one module per resource: time-entries, organization-memberships,
│                     services, timers
├── components/
│   ├── core/         shadcn primitives, copied in and edited here
│   ├── shared/       ConfirmDialog, DatePicker, Illustration, ShortcutsSheet, layouts/AppLayout,
│   │                 useHotkeys, useHasHover
│   └── features/     auth, time-entries, settings, timer, week, quick-add
├── routes/           TanStack Router file routes; routeTree.gen.ts is generated
├── lib/              date, duration, note, storage, availability, activity, focus-modality
├── mocks/            MSW handlers and fixtures, shared by tests and `pnpm dev:mock`
└── styles/           index.css with the @theme tokens
```

`src/api/` contains no React: plain async functions that issue one request and return parsed data
or throw. The hooks that wrap them live beside the feature that uses them.

### Routes

| Path | Renders | Guard |
| --- | --- | --- |
| `/login` | Login form | Redirects to `/` when a session exists |
| `/` | Redirect to `/day/<today>` | Auth |
| `/day/$date` | Day view | Auth |
| `/week/$date` | Timesheet grid (desktop) | Auth |
| `/entries/new?date=` | Entry form over the day | Auth |
| `/entries/$id/edit` | Entry form over the day | Auth |

Everything behind authentication sits under a `_authenticated` layout route, which holds the guard
and re-validates the stored session against the API on every load — a token revoked between visits
is caught there rather than on the first failing request.

## 2. Main UI components

### Application shell

**`AppLayout`** draws the app bar — organization name, the person's avatar, the timer control, the
shortcuts sheet, the settings sheet and logout — and mounts **`TimerProvider`** above the outlet, so
the bar and any entry card read the same running timer rather than two polls of the same endpoint.

### Login

**`LoginForm`** takes an API token and organization ID, validates both with zod, and on submit
resolves the person before it navigates. It distinguishes the three failures the API can return:
`401` is a bad token, `403 no_person` is a valid token with no person in that organization, and a
successful response with no matching organization is "not a member of that organization".

### Day view

**`DayView`** is the composition root for `/day/$date`. It owns the delete dialog, the delete
mutation and the result toast — not the card — because the toast belongs to the screen and the
`Delete` shortcut opens the same dialog from the list. Beneath it:

| Component | Owns |
| --- | --- |
| `DateNavigator` | Previous/next day, a worded label (`Today, Tue 15 Sep`) that opens `DatePicker`, and a `Today` button. Also the focusable `h1` that receives focus on navigation |
| `WeekStrip` | Seven day cells and the weekly total, from one request. Cells distinguish logged, zero and non-working days |
| `DaySummary` | The day's total and entry count |
| `QuickAddInput` | A description, carried into the entry form as a prefill, or straight into a timer on today |
| `TimeEntryList` | The list, and its own loading, empty and error states. They live inside it rather than in `shared/` because nothing else renders them |
| `TimeEntryCard` | One entry: duration, description, date and service, plus the per-entry menu |
| `ServiceTotals` | Minutes grouped by service, desktop only |

**`TimeEntryCard`** renders the description through **`Note`**, which walks the stored HTML against
a tag allowlist and maps it onto React elements. `dangerouslySetInnerHTML` appears nowhere in the
codebase. **`ServiceContext`** draws `project · service` and opens the rest of the hierarchy on
demand; **`DurationEditor`** edits minutes inline without leaving the list.

### Entry form

**`TimeEntryForm`** serves both create and edit — a full screen on mobile, a 560px dialog over the
day on desktop. It carries the three fields the assignment specifies: date, duration and
description. The person is taken from the session and never shown. The same zod schema validates
both routes, and the form reports API failures inline rather than through a toast, because it stays
open when a save fails.

Edit has its own route, so an entry is deep-linkable and survives a refresh; opening it directly
fetches the entry by ID.

### Shared dialogs

**`ConfirmDialog`** is the delete confirmation, asked from both the day view and the edit form, and
**`UnsavedChangesDialog`** is a thin wrapper over it. **`SettingsSheet`** holds the default-service
choice, with **`ServicePicker`** providing search and grouping by company.

### Responsive behaviour

Mobile is a design rather than a reflow: the app bar collapses, the week strip becomes a
horizontally scrollable rail, the totals panel drops, the entry form becomes full-screen with a
sticky footer, and the timesheet is withheld entirely. Accessibility throughout is semantic HTML
first — labelled inputs, focus moved to the page heading on navigation, focus trapped and returned
by dialogs, AA contrast, and every control keyboard-operable.

## 3. API communication

### Domain model

```
User 1 --< 0..n OrganizationMembership >-- 1 Organization
                    | has one
                    v
                 Person 1 --< 0..n TimeEntry
```

A token identifies a user, who may belong to several organizations. The organization ID entered at
login selects the membership, and that membership's `person` is who every entry belongs to — which
is why the person is resolved from the API rather than typed.

The attributes this app uses on a `TimeEntry`: `date` (`YYYY-MM-DD`), `time` (integer minutes),
`note` (string or `null`, may contain HTML), and the `person` and `service` relationships. Creating
one sends `date`, `time` and `note` as **attributes** and `person` and `service` as
**relationships** — not the flat attributes the OpenAPI file lists. `time` may legitimately be `0`
in an existing record.

Base URL `https://api.productive.io/api/v2`. Every request carries `X-Auth-Token` and
`X-Organization-Id`; requests with a body add `Content-Type: application/vnd.api+json`. The format
is JSON:API — `data`, `included`, `meta`, `errors[]`.

### Flows

| Flow | Request |
| --- | --- |
| Resolve the person | `GET /organization_memberships?include=person,organization` |
| List a day | `GET /time_entries?filter[person_id]=P&filter[after]=D&filter[before]=D&include=service&page[size]=200` |
| Read one | `GET /time_entries/{id}` |
| Create | `POST /time_entries` — `attributes: {date, time, note}`, `relationships: {person, service}` |
| Update | `PATCH /time_entries/{id}` — changed attributes only |
| Delete | `DELETE /time_entries/{id}` — 204 |
| Services | `GET /services?filter[time_tracking_enabled]=true` |
| Recent services | `GET /time_entries?filter[person_id]=P&filter[after]=..&filter[before]=..&fields[time_entries]=service` |
| Running timer | `GET /timers?filter[person_id]=P&filter[stopped_at][eq]=&include=time_entry` |
| Runs for an entry | `GET /timers?filter[time_entry_id]=E&include=time_entry` |
| Start a timer | `POST /timers?include=time_entry` — also creates the `time: 0` entry it runs against |
| Continue an entry | `POST /timers?include=time_entry` with a `time_entry` relationship — attaches, creates nothing |
| Stop a timer | `PUT /timers/{id}/stop` — `PUT`, not `POST`, and it writes the elapsed whole minutes onto the entry |

The timer rows are the ones no documentation covers; how each was established is recorded in
[`docs/api/README.md`](api/README.md).

### What the API actually does

Each of these was established by making the request and recording the response into
[`docs/api/samples/`](api/samples/), because none of it is in the documentation:

- **`X-Organization-Id` does not scope `/organization_memberships`.** An organization ID that does
  not exist is answered with 200 and the token's own memberships. The app therefore matches the
  membership whose `organization` relationship equals the entered ID, which is what the assignment
  describes, rather than trusting the header.
- **Unknown filter names are silently ignored, not rejected.** `filter[person_id]` on `/services`
  returns the unfiltered collection. Every filter in use was verified by comparing against an
  unfiltered count before being relied on.
- **`filter[after]` and `filter[before]` are inclusive**, and return the same IDs as
  `filter[date][gt_eq]`/`[lt_eq]`, so the shorter pair is used.
- **Sorting accepts only `date` and `-date`.** `sort=created_at` is a 400, so within-day ordering
  is done client-side.
- **Sparse fieldsets are honoured on collections only.** `GET /time_entries/{id}` ignores `fields`
  and returns the full record.
- **A relationship not named in `include` carries no `data` key at all** — absent data means "not
  requested", never "no related record". The two are indistinguishable downstream, so every
  relationship the code reads is named in `include`.
- **Mutation responses are not fully populated**: POST and PATCH return only the `organization`
  relationship. This is enforced in the type system — `MutatedTimeEntry` is
  `Omit<TimeEntry, 'service' | 'serviceId'>`, so a create response cannot be read for a service
  name that is not there.

### Efficiency

- **Sparse fieldsets on every collection**, which is where the real saving is: asking for the
  fields actually rendered returns roughly a thirteenth of `/services`, a twelfth of the membership
  collection and a fifth of a day of entries. The measurements and the recorded before/after
  responses are in [`docs/api/README.md`](api/README.md). `fields` governs relationships as well as
  attributes.
- **`page[size]` always explicit** at the API's `max_page_size` of 200. Paging loops while
  `current_page < total_pages`; an empty collection reports `total_pages: 0`, so a `total_pages > 1`
  test would be wrong. The loop is driven by a local counter rather than the echoed `current_page`,
  and has a page ceiling.
- **Login blocks on one request.** The services list is prefetched in the background without being
  awaited, so it never sits between the login submit and the first day render.
- **A day is a selection over its week, not a request of its own.** Both were `GET /time_entries`
  with identical `fields` and `include`, differing only in the range, so the day was always a subset
  of a request already being made. One key per week now carries the day list, the week strip and
  the totals. Measured against the mock API: a cold day view went from **five requests to four**,
  and stepping between days inside a loaded week from **one to none**.
- **The trade-off that buys**: the day list and the week strip can no longer fail independently.
  Before, a failed week left a readable day under a degraded strip. Now one request either works or
  it does not, and the list's Retry refetches the week. One request that can fail in one way is
  easier to reason about than two that can disagree, but it is a real reduction in graceful
  degradation rather than a free win.
- **Two writes are optimistic, and only two.** Deleting removes the row and its minutes from the
  day and the week cache on confirm, and `onError` restores both. Editing writes optimistically
  **only when the duration alone changed and the entry stays on its day** — the inline editor
  corrects a number in place, so the number has to move with it; a date move rewrites which day an
  entry belongs to, which the cache cannot honestly guess. Creating is never optimistic, and
  neither is the rest of an edit: a POST or PATCH response carries only the `organization`
  relationship, so an optimistically-inserted row could not render the service name every card
  shows.
- **Errors are distinguished by HTTP status and `errors[].code`**, never by matching on message
  text. `errors[].status` is deliberately ignored — it is sometimes a slug that disagrees with the
  transport status. A network failure or a non-JSON body still throws `ApiError`, never a raw
  `TypeError`.

## 4. Assumptions

The assignment leaves these open; each was resolved as follows.

| | Ambiguity | Resolution |
| --- | --- | --- |
| A-1 | The API requires a service on create, but the form may only have duration, date and description | The form keeps three fields. A default service is chosen from `GET /services?filter[time_tracking_enabled]=true`, sorted by name, and is changed in a Settings sheet rather than on the form. `/services` is not person-scoped, so "the first service this person can track on" is not answerable from the API |
| A-2 | Duration format | Accepts `1:30`, `1h 30m`, `1.5h` or plain minutes; normalises to minutes; shows a live preview. Displays as `1h 30m` |
| A-3 | Date navigation | Previous/next buttons around a worded label that opens a calendar, plus a `Today` button |
| A-4 | Where credentials live | `localStorage` under a namespaced key, cleared on logout. Trade-off in [ADR-0004](adr/0004-credentials-in-browser.md) |
| A-5 | Route shapes | Edit at `/entries/:id/edit`, create at `/entries/new?date=YYYY-MM-DD` |
| A-6 | Time zone | Dates are calendar dates, never instants. The app does not convert through UTC |
| A-7 | Ordering within a day | Newest first, by `created_at`, client-side — the entry just logged is what someone is looking for. The API rejects `sort=created_at` |
| A-8 | Validation | Duration must be above 0 and at most 24h. Existing zero-minute entries still render, as does a running timer's entry. Description optional, length-guarded; date required |
| A-9 | `note` may contain HTML | Confirmed — a recorded note reads `<ul><li><p>Probavam</p></li></ul>`. The app reads and writes the same rich text Productive does ([ADR-0010](adr/0010-rich-text-notes.md)) |
| A-10 | Delete confirmation | A dialog, because the assignment requires confirmation — unlike Productive's own immediate delete with an undo toast |

## 5. Decisions

| | Decision |
| --- | --- |
| [ADR-0001](adr/0001-framework-react-vite.md) | React and Vite over the alternatives |
| [ADR-0002](adr/0002-data-layer.md) | TanStack Query with a hand-written JSON:API client |
| [ADR-0003](adr/0003-testing.md) | Vitest and Testing Library for units, Playwright against MSW for end to end |
| [ADR-0004](adr/0004-credentials-in-browser.md) | Credentials in `localStorage`, and the security trade-off that implies |
| [ADR-0005](adr/0005-scope-cuts.md) | What was deliberately rejected, and why |
| [ADR-0006](adr/0006-styling-tailwind-shadcn.md) | Tailwind and shadcn/ui over a component library |
| [ADR-0007](adr/0007-router-tanstack.md) | TanStack Router over React Router |
| [ADR-0008](adr/0008-extra-features.md) | Which features beyond the assignment to build, and in what order |
| [ADR-0009](adr/0009-date-picker.md) | react-day-picker for the calendar only |
| [ADR-0010](adr/0010-rich-text-notes.md) | Rich-text notes, superseding the original plain-text reading |

## 6. Beyond the assignment

The brief notes that a submission implementing only CRUD reads as incomplete, so the following were
built on top of the five required features. Each is described in
[ADR-0008](adr/0008-extra-features.md).

| | Feature |
| --- | --- |
| Week strip and timesheet | Seven days and a weekly total from one request; a desktop timesheet grid with expected hours read from the person's availability |
| Keyboard shortcuts | `n`, `←`/`→`, `t`, `↑`/`↓`, `e`, `Del`, `s`, `?`, `Esc`, all suppressed inside a field or a dialog |
| Timer | Start, stop, continue an existing entry, and survive a refresh |
| Idle awareness | Notices a timer running with nobody there and offers to deduct the idle time |
| Range entry | Log an entry as a start and end time instead of a duration |
| Duplicate and copy forward | Duplicate one entry, or fill an empty day from the day before |
| Rich-text descriptions | Round-trip with Productive's own editor |

## 7. Testing

Pure logic — duration parsing, date arithmetic, JSON:API parsing and error mapping, note
conversion — is unit-tested exhaustively, because it is cheap and it is where the real bugs live.
Component tests cover the error paths, which this end-to-end suite is not wired to reach: the MSW
worker takes no per-test override, and it answers inside the page, so Playwright's network layer
never sees the request to fail it. A component test can install a failing handler directly. Playwright then covers each
user story end to end on desktop and mobile, against MSW rather than the live API, so the suite is
deterministic and needs no credentials.

## 8. Out of scope

Multi-user or team views, reporting, approvals, projects and budgets, offline support,
internationalisation, and any server-side component — the assignment forbids the last outright and
scopes the rest away.

## 9. Requirements

The assignment's requirements, and where each is met. Identifiers are used in commit footers and
pull request titles.

| | Requirement | Where |
| --- | --- | --- |
| R-1 | Login screen taking an API token and organization ID | `features/auth/LoginForm` |
| R-2 | Credentials survive a refresh; logout clears them | `lib/storage.ts`, `features/auth/useSession` |
| R-3 | A screen listing entries for a selected date, defaulting to today | `routes/_authenticated/day.$date.tsx`, `features/time-entries/DayView` |
| R-4 | Only the current person's entries are shown | `filter[person_id]` in `api/time-entries.ts` |
| R-5 | The date can be changed and the list follows | `features/time-entries/DateNavigator`; the date is part of the query key |
| R-6 | An entry shows its duration, multiline description and date | `features/time-entries/TimeEntryCard` |
| R-7 | An empty day shows an empty state | `features/time-entries/TimeEntryList` |
| R-8 | A failed load shows an error | `features/time-entries/TimeEntryList` |
| R-9 | Add an entry with duration, description and date; the list updates; validation and API errors are shown | `features/time-entries/TimeEntryForm`, `useCreateTimeEntry` |
| R-10 | The person is never entered by the user, and is set from the session | `useCreateTimeEntry` |
| R-11 | Edit in its own route, changing duration, description and date; errors shown | `routes/_authenticated/entries.$id.edit.tsx`, `useUpdateTimeEntry` |
| R-12 | Delete behind a confirmation; the row leaves the list; errors shown | `TimeEntryDeleteDialog`, `useDeleteTimeEntry` |

| | Constraint | How |
| --- | --- | --- |
| N-1 | No server-side technology | A static Vite bundle; the browser calls the API directly |
| N-2 | Connected to the real Productive API | `src/api/`, against `https://api.productive.io/api/v2` |
| N-3 | Looks shippable to a client | See `docs/screenshots/` |
| N-4 | Usable on a lower-resolution device | Mobile-first layouts; Playwright runs a mobile project |
| N-5 | README with setup and run instructions | `README.md` |
| N-6 | Technical specification in the repository | This document |
| N-7 | A public git repository | The repository itself |
