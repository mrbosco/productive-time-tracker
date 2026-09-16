# Productive Time Tracker: Technical Specification

Status: v1 (Phase 1 closed 2026-09-15). All open decisions resolved; see ADR-0001..0008.

## 1. Purpose

A client-side web application (no server-side code) for managing a person's Productive time entries for a selected day: login with API credentials, list entries for a date, create, edit (own route) and delete entries. Built for the Productive Frontend Engineer take-home assignment; the assignment text is the source of truth (`docs/assignment/`).

Time budget: ~10 hours for research, specification and implementation.

## 2. Requirements traceability

Every requirement below is quoted or closely paraphrased from the assignment. IDs are used in commits, PRs and tests.

### 2.1 Functional (must)

| ID   | Requirement                                                                                                                           | Source                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R-1  | Login screen: user enters API token and organization ID                                                                               | "Features that must be implemented", "Regarding the login screen" |
| R-2  | Credentials persisted across page refresh; logout clears them                                                                         | same                                                              |
| R-3  | Screen listing time entries for a selected date, default today                                                                        | US-1                                                              |
| R-4  | Only entries belonging to the current person are shown                                                                                | US-1                                                              |
| R-5  | User can change the selected date; list updates                                                                                       | US-1                                                              |
| R-6  | Entry shows duration, multiline description, date                                                                                     | US-1                                                              |
| R-7  | Empty state when no entries: one sentence plus the primary "Add entry" action, never an illustration alone (competitive analysis 2.2) | US-1                                                              |
| R-8  | Error state when loading fails                                                                                                        | US-1                                                              |
| R-9  | Add entry: duration, description, date; list updates after success; validation and API errors shown                                   | US-2                                                              |
| R-10 | Person is not entered by the user; set dynamically to current person                                                                  | "For the sake of simplicity"                                      |
| R-11 | Edit entry in its own route; can change duration, description, date; list reflects update; errors shown                               | US-3                                                              |
| R-12 | Delete entry with confirmation; removed from list; error on failure                                                                   | US-4                                                              |

### 2.2 Non-functional (must)

| ID  | Requirement                                                                                                                                                     | Source                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| N-1 | JS + HTML + CSS only, no server-side technology                                                                                                                 | Implementation requirements |
| N-2 | Connected to the real Productive API for organization and time entry data                                                                                       | same                        |
| N-3 | Looks like something shippable to a client                                                                                                                      | same                        |
| N-4 | Usable on a lower-resolution (mobile) device                                                                                                                    | same                        |
| N-5 | README with setup and run instructions                                                                                                                          | same                        |
| N-6 | Technical specification in Markdown in the repo, covering architecture, main UI components, API communication, decisions and trade-offs, documented assumptions | Task                        |
| N-7 | Public git repository as the deliverable                                                                                                                        | "The result of the task"    |

### 2.3 Evaluation criteria (what reviewers look at)

Frontend architecture and code structure; API integration and efficiency; correctness and completeness; technical specification; UI/UX quality. "A submission that just implements the CRUD operations without paying attention to the other important factors will be viewed as incomplete."

## 3. Domain model (from the assignment and the OpenAPI spec)

```
User 1 --< 0..n OrganizationMembership >-- 1 Organization
                    | has one
                    v
                 Person 1 --< 0..n TimeEntry
```

TimeEntry attributes we use (OpenAPI `resource_time_entry`):

- `date` (string, `YYYY-MM-DD`): the day the time was tracked
- `time` (integer): duration in minutes
- `note` (string **or `null`**): description of the work (multiline). May contain HTML when written in Productive's UI (A-9)
- relationships: `person`, `service`

Creating a TimeEntry sends `date` and `time` as **attributes** and `person` and `service` as
**relationships** — not the four flat attributes the OpenAPI file lists
(`docs/api/samples/time-entry-create.json`). Only the omission of `service` was exercised, so
"required" is proven for `service` alone. See A-1 for how the service is chosen.

`time` can be `0` in existing records, and such an entry is not necessarily a draft — the recorded
zero-minute entry has `draft: false` (`docs/api/samples/time-entries-day-all-fields.json`). See A-8.

## 4. API communication

- Base URL: `https://api.productive.io/api/v2`
- Headers on every request: `X-Auth-Token: <token>`, `X-Organization-Id: <orgId>`
- `Content-Type: application/vnd.api+json` on requests that carry a body (POST/PATCH) only
- Format: JSON:API (`data`, `included`, `meta`, `errors[]`)

### 4.1 Flows

| Flow                   | Endpoint                                                                                                | Notes                                                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login / resolve person | `GET /organization_memberships?include=person`                                                          | `include=person` is mandatory: without it `relationships.person` is `{"meta":{"included":false}}` with no ID at all. There is no membership to pick — `X-Organization-Id` decides which organization the call answers for, and a token with no person there fails 403 `no_person`. 401 means a bad token, 403 the wrong organization; the login screen distinguishes them.                                                                 |
| List for a day         | `GET /time_entries?filter[person_id]=P&filter[after]=D&filter[before]=D&include=service&page[size]=200` | `after`/`before` are **inclusive** and return the same IDs as `filter[date][gt_eq]`/`[lt_eq]`, so the shorter pair wins. `filter[person_id]` genuinely filters (R-4): an ID belonging to nobody returns `total_count: 0`. `page[size]=200` is the API's `max_page_size`. Add the sparse fieldset from 4.2. |
| Create                 | `POST /time_entries`                                                                                    | `attributes: { date, time, note }`, `relationships: { person, service }`                                                                                                                                                                                                  |
| Read one (edit route)  | `GET /time_entries/{id}`                                                                                | Used when the edit route is opened directly (deep link / refresh).                                                                                                                                                                                                        |
| Update                 | `PATCH /time_entries/{id}`                                                                              | Only changed attributes.                                                                                                                                                                                                                                                  |
| Delete                 | `DELETE /time_entries/{id}`                                                                             | 204.                                                                                                                                                                                                                                                                      |
| Services               | `GET /services?filter[time_tracking_enabled]=true`                                                      | Organization-wide, **not** person-scoped: `filter[person_id]` here is silently ignored. See A-1.                                                                                                                                                                                                                                  |

### 4.2 Efficiency rules

- One list request per selected day; cached per `(personId, date)`; cache invalidated on create/update/delete for that date (and the old date if the date was changed on edit).
- Optimistic update on delete; on failure the entry is restored and an error toast is shown.
- `include` names every relationship the code reads, not only those rendered: an un-included
  relationship carries no `data` and no ID, so `include` is the only way to learn a related ID.
- **Sparse fieldsets** narrow every collection (`fields[...]`), which is where the real
  over-fetching saving is: 13.3x on `/services`, 12.4x on memberships, 5.4x on a day of entries.
  `fields` governs relationships as well as attributes, so every relationship read must be named in
  it too. It is honoured on collections only; `GET /time_entries/{id}` ignores it.
- Page size explicitly set; the app pages while `current_page < total_pages`. An empty day reports
  `total_pages: 0`, so a `total_pages > 1` test would be wrong.
- Login blocks on one request. The services list needed for A-1 is **prefetched in the background**
  (`queryClient.prefetchQuery(['services', personId])`, not awaited, `staleTime` 1 hour) so it never
  sits between the login submit and the first day render. The first create or timer start uses that
  cache, or waits for the one request if it has not landed yet.

## 5. Assumptions (assignment ambiguities)

| ID   | Ambiguity                                                                                            | Assumption                                                                                                                                                                                                                                                                                                             | Status  |
| ---- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| A-1  | The API requires a service on create, but the form must only have duration, date and description. | The form keeps exactly three fields. `/services` is **not** person-scoped, so "first service this person can track on" is not answerable from the API. Instead the app fetches `GET /services?filter[time_tracking_enabled]=true` with `page[size]=200`, `include=deal.company` and `fields[services]=name,deal&fields[deals]=name,company&fields[companies]=name`, sorts client-side by name and takes the first as the default. **Resolved lazily**: login blocks only on `organization_memberships`; on success the app calls `queryClient.prefetchQuery(['services', personId])` without awaiting it (`staleTime` 1 hour), so the day view renders on one request. The first create or timer start reads that cache, or waits for that single request if it has not landed. A "Default service" selector lives in a small Settings sheet reachable from the app bar, never on the entry form; edit keeps the entry's existing service. Selector labels are **"Company · Project · Service"** — neither service names nor deal names are unique alone. That form is unique across the recorded account but is not guaranteed, so a label still shared by two services gets ` (#<deal id>)` appended, to the colliding rows only. The selector keys on service ID regardless. | decided |
| A-1b | What the app does when the API refuses the chosen service on create.                                  | A 422 whose `errors[]` contains `code: invalid_attribute_value` with `source.pointer` naming `person` (the recorded body reads "person cannot track on this service") shows that `detail` text and opens the Settings sheet so the default service can be changed. Any other 422 goes to the generic error banner, showing `detail` from `errors[]`. | decided |
| A-2  | "Duration" input format                                                                              | Minutes are what the API stores; the UI accepts `h:mm`, `1h 30m`, `1.5h` or plain minutes, normalises to minutes and shows a live `= 1h 30m` preview next to the input (pattern from Productive); displays as `1h 30m`. Optional range mode (P-2) computes minutes from `from`/`to`.                                   | decided |
| A-3  | "Selected date" navigation                                                                           | Previous/next day buttons around a label in words (`Today, Tue 15 Sep`, `Yesterday, Mon 14 Sep`, otherwise `Wed 9 Sep`), the label opens a calendar popover, plus a text-labelled `Today` button (pattern from Harvest).                                                                                               | decided |
| A-4  | Where credentials are persisted                                                                      | `localStorage` (survives refresh and browser restart), namespaced key, cleared on logout. Session data (person ID, default service) is derived and cached alongside. See ADR-0004 for the security trade-off.                                                                                                          | decided |
| A-5  | Edit route shape                                                                                     | `/entries/:id/edit`; opening it directly fetches the entry by ID. Create lives at `/entries/new?date=YYYY-MM-DD` (own route too, for symmetry and mobile).                                                                                                                                                             | decided |
| A-6  | Time zone                                                                                            | Dates are calendar dates, not instants; the app never converts through UTC. `date` is formatted from local time.                                                                                                                                                                                                       | decided |
| A-7  | Sorting                                                                                              | Entries for a day sorted by `created_at` ascending (order of logging), **client-side**: `/time_entries` accepts only `sort=date` and `sort=-date`, and rejects `created_at` with a 400 (`docs/api/samples/sort-support.txt`).                                                                                                                                                                                                                                                 | decided |
| A-8  | Validation                                                                                           | The form requires duration > 0 and <= 24h. Existing zero-minute entries are still rendered, as `0h`, with no extra label. The muted `draft` label is rendered **only** from `attributes.draft`, which is a real API field and is independent of duration — the recorded zero-minute entry has `draft: false`. `draft` is therefore part of the day list's sparse fieldset. Note that a **running timer also shows as a zero-minute entry**, because starting one creates its entry immediately (X-4); that is another reason the label cannot be derived from duration. Description optional (API allows an empty or `null` note) but max length guarded; date required.                                                                                                               | decided |
| A-9  | Notes created in Productive's UI are rich text, so `note` may contain HTML. **Confirmed**: a recorded note reads `<ul><li><p>Probavam</p></li></ul>` (`docs/api/samples/time-entries-day.json`). `note` is also nullable, so the renderer handles `null` as well as HTML. | The app writes plain text with newlines and, when rendering, strips HTML tags to text (never `dangerouslySetInnerHTML`), preserving line breaks. Editing such an entry shows the stripped text; saving overwrites with plain text, which is documented.                                                                | decided |
| A-10 | Delete confirmation                                                                                  | The assignment requires confirmation, so a dialog is used, unlike Productive's immediate delete with an UNDO toast. UNDO on top of the dialog is listed as a possible enhancement, not implemented.                                                                                                                    | decided |

## 6. Architecture

See ADR-0001..0005 for the reasoning. Summary:

- Vite + React 19 + TypeScript (strict)
- Routing: TanStack Router (file-based, type-safe params and search params; ADR-0007)
- Server state: TanStack Query; thin hand-written JSON:API client (`src/api`)
- Forms: react-hook-form + zod
- Styling: Tailwind CSS v4 + shadcn/ui primitives (Radix-based, accessible)
- Tests: Vitest + Testing Library (unit/component), Playwright (e2e against MSW mocks)
- Tooling: pnpm, ESLint flat config, Prettier (handbook config), Husky + lint-staged, commitlint, Changesets

### 6.1 Folder layout (Infinum handbook conventions: `core` / `shared` / `features`, PascalCase component folders, tests colocated)

```
src/
├── api/                    # client.ts (fetch wrapper, headers, JSON:API parsing, paging, ApiError)
│   ├── types.ts            # domain types, derived from docs/api/samples (ADR-0005)
│   ├── time-entries.ts     # typed resource functions
│   ├── organization-memberships.ts
│   ├── services.ts
│   └── timers.ts           # read-only; see X-4
├── components/
│   ├── core/               # Button, Card, Input, Textarea, Dialog, Toast (shadcn-based)
│   ├── shared/             # DatePicker, PageHeader, EmptyState, ErrorState, ConfirmDialog, layouts/AppLayout
│   └── features/
│       ├── auth/           # LoginForm, useSession
│       ├── time-entries/   # TimeEntryList, TimeEntryCard, TimeEntryForm, DaySummary, hooks (useTimeEntries, useCreateTimeEntry, ...)
│       ├── settings/       # DefaultServiceSelect (A-1)
│       ├── timer/          # TimerControl (app bar), useTimer (POST /timers), ActivityBanner, useActivityMonitor
│       ├── week/           # WeekStrip, useWeekTotals
│       └── quick-add/      # QuickAddInput, lib/quick-add parser (P-1)
├── routes/                 # TanStack Router file routes: __root.tsx, login.tsx, day.$date.tsx, entries.new.tsx, entries.$id.edit.tsx
├── lib/                    # date.ts, duration.ts, storage.ts, query-client.ts
├── mocks/                  # MSW handlers + fixtures (used by tests and `pnpm dev:mock`)
└── main.tsx, App.tsx, router.tsx
e2e/                        # Playwright specs, one per user story
```

### 6.2 Routes

| Path                 | Component                                       | Guard                        |
| -------------------- | ----------------------------------------------- | ---------------------------- |
| `/login`             | LoginRoute                                      | redirect to `/` if logged in |
| `/`                  | redirect to `/day/:date` (today)                | auth                         |
| `/day/:date`         | DayRoute (list + summary + add button)          | auth                         |
| `/entries/new?date=` | NewEntryRoute (search param validated with zod) | auth                         |
| `/entries/:id/edit`  | EditEntryRoute                                  | auth                         |
| `*`                  | NotFoundRoute                                   |                              |

### 6.3 State

- Session (token, orgId, personId, personName, defaultServiceId): React context backed by `localStorage`, injected into the router context so route guards (`beforeLoad`) can redirect.
- Server data: TanStack Query cache, keys `['time-entries', personId, date]`, `['time-entry', id]`, `['services', personId]`, `['week-totals', personId, weekStart]`, `['timer', personId]`.
- UI state: local component state; no global store.

## 7. UI

Mobile-first, single column up to `md`, two-column (list + summary) on desktop. See `docs/design/BRIEF.md` and the Claude Design export in `docs/design/`.

Screens: Login, Day (list), New entry, Edit entry. Global: toast notifications, confirm dialog, error boundary.

Accessibility (handbook chapter): semantic HTML, labelled inputs, focus management on route change and dialog open, visible focus rings, colour contrast AA, keyboard-operable date navigation.

## 8. Testing strategy

| Level     | Tool                           | Scope                                                                                                       |
| --------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Unit      | Vitest                         | `lib/duration`, `lib/date`, JSON:API parsing, error mapping                                                 |
| Component | Vitest + Testing Library + MSW | forms (validation, submit, error rendering), list states (loading/empty/error/data)                         |
| E2E       | Playwright + MSW (browser)     | one spec per user story: login and persistence, list by date, create, edit, delete; mobile viewport project |
| CI        | GitHub Actions                 | lint, typecheck, unit, build, e2e; Playwright report artifact                                               |

E2E does not hit the real API: no secrets in CI and deterministic runs. A manual smoke checklist against the real API is part of the PR template.

## 9. Out of scope (deliberately)

- Approvals, billable flags, tasks and projects on entries
- Multiple organizations switching after login (user logs out and back in)
- Offline mode
- i18n (English only; date formatting locale-aware via `Intl`)
- Storybook (component tests and the design export cover the need; see ADR-0005)

## 10. Extra features (beyond the required stories; ADR-0008)

Implemented only after all required stories are merged (`v0.2.0`), one PR each, in this priority order. Any of them is cut without regret if the budget runs out; the README lists what shipped. Scope of each was refined by `docs/research/competitive-analysis.md` section 3 and 4.

| #   | ID  | Feature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | API                                                 | Effort |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| 1   | X-1 | **Week strip and totals.** 7 cells around the selected date plus a weekly-total cell, from one `GET /time_entries` week-range request grouped client-side. Three cell states: `logged` (bold total), `past workday, nothing logged` (muted dash, as in Productive), `weekend or future` (muted `0h`). Tap to navigate. DaySummary shows the day total and totals grouped by service.                                                                                                                                                                                                                                                                                                                                                                                                                                | `GET /time_entries` (week range)                    | S      |
| 2   | X-2 | **Keyboard shortcuts.** `n` new, `←`/`→` day, `t` today, `?` shortcut sheet, `Esc` close; cards are focusable with roving `↑`/`↓`, `e` edits and `Delete`/`Backspace` opens the confirm dialog for the focused card; `s` stops a running timer. All shortcuts are disabled while an input, textarea or dialog has focus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | none                                                | S      |
| 3   | P-2 | **Start/end range mode.** A toggle in the entry form swaps the duration field for `from`/`to` time inputs; minutes are computed client-side and only `time` is stored; end before start is a validation error; editing always opens in duration mode (the API keeps no range).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | none beyond create/update                           | S      |
| 4   | X-3 | **Duplicate / copy.** Card menu `Duplicate` opens New entry prefilled with the note and duration and `date = today` (Toggl's continue pattern; the source date stays reachable in the picker). Empty-day state adds `Copy from yesterday`: sequential `POST /time_entries` from the cached D-1 list, one toast with count and failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | create                                              | S      |
| 5   | X-4 | **Timer.** Start a timer for the default service from the app bar; elapsed time is shown in the app bar on every route and mirrored into `document.title`; `{ timerId, startedAt, entryId? }` is persisted in `localStorage` so a refresh restores the indicator before the `['timer', personId]` query resolves. Stop opens the entry form prefilled with elapsed minutes. A card's `Continue` starts a timer that adds to that entry on stop (`PATCH`), not a new entry.                                                                                                                                                                                                                                                                                                                                          | `POST /timers`, `PUT /timers/{id}/stop` (verified, see below) | M      |
| 6   | X-5 | **Activity awareness while a timer runs.** Idle detection (no `pointermove`/`keydown`/`wheel`/`click` for `idleMinutes`, default 15) is gated on `document.visibilityState === 'visible'` so a background tab never triggers it. Banner offers Harvest's resolution model: `Pause and discard idle time` (subtracts `idleMinutes` from the value written on stop, client-side) and `Keep running`. The synthetic-input heuristic (near-constant pointer intervals, near-zero displacement, no non-pointer events) is implemented and unit-tested but sits behind a config flag, **off by default**, because the market (Toggl, Harvest) explicitly positions itself against input monitoring; the README explains the flag and the reasoning. Nothing is sent to the API; the timer is never stopped automatically. | none                                                | S      |
| 7   | P-1 | **Quick add line.** One text input above the list parsing `1.5h client call yesterday`, `45m standup`, `2:30 fix login bug` into `{ time, note, date }` and opening the New entry form prefilled; never submits directly. Deterministic parser in `lib/quick-add.ts`, no AI, no network; table-driven unit tests. Cut first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | via the existing form                               | M      |

### X-5 detection sketch

- Listeners are attached to `window` only while a timer runs and removed with it.
- Idle: timestamp of the last input event; checked every 30 s; only while the document is visible.
- Synthetic score (flag `activityMonitor.detectSyntheticInput`, default `false`): rolling window of the last 60 pointer events; fires when the coefficient of variation of intervals is below 0.15, median displacement is below 3 px and the window contains no keyboard, wheel or click events.
- Thresholds live in one config object (`activityMonitor.idleMinutes`, `...cvThreshold`, `...displacementPx`); the hook `useActivityMonitor` is tested with recorded synthetic and human-like event streams.

## 11. Research inputs

#### X-4 timer endpoints (verified 2026-09-16)

Every call below was run against the live API and recorded in `docs/api/samples/`. The full route
matrix, including the fifteen paths that 404, is in `timer-stop-endpoint-probes.txt`.

| Step         | Call                                              | Sample                                   |
| ------------ | ------------------------------------------------- | ---------------------------------------- |
| Start        | `POST /timers`                                    | `timer-create.json`                      |
| Poll running | `GET /timers?filter[stopped_at][eq]=&include=time_entry` | `timers-running.json`             |
| Stop         | `PUT /timers/{id}/stop` with body `{}`            | `timer-stop.json`                        |
| Entry after  | `GET /time_entries/{linked id}`                   | `time-entry-from-timer.json`             |
| Stop twice   | 409 `timer_already_stopped`                       | `error-409-timer-already-stopped.json`   |

Start body — `service` and `person` as relationships, no attributes:

```json
{ "data": { "type": "timers", "relationships": {
  "service": { "data": { "type": "services", "id": "S" } },
  "person":  { "data": { "type": "people",   "id": "P" } } } } }
```

Three behaviours that shape X-4:

1. **Starting a timer also creates a time entry**, dated today with `time: 0`, linked through the
   timer's `time_entry` relationship. It appears in the day list straight away, so a running timer is
   already a `0h` row before anything is stopped. X-4 must not create a second entry on stop.
2. **Stopping writes the elapsed whole minutes onto that linked entry** as `time`, and returns them
   as the timer's `total_time`. 87 seconds became `1`; the remainder is dropped. So "stop opens the
   entry form prefilled with elapsed minutes" holds — but the entry already exists and already has
   the value, so the form edits it rather than creating it.
3. **`PUT`, not `POST`.** The same path 404s for `POST`. Stopping twice is 409
   `timer_already_stopped`, which the UI treats as "already stopped", not as an error.

`src/api/timers.ts` implements all three calls.

- `docs/research/productive-app-analysis.md`: reverse-engineering of Productive's own Time screen (UI, mobile layout, network calls) and the adopt/adapt table that fed A-9, A-10, X-1, X-3 and X-4.
- `docs/research/competitive-analysis.md`: Harvest and Toggl compared with Productive; source of the X-1..X-5 refinements, P-1, P-2, A-2, A-3 and the R-7 wording.

## 12. Delivery

- Public repository, `main` protected, PR per user story (R-IDs in PR titles), CI green
- Tags: `v0.1.0` scaffold, `v0.2.0` core stories, `v0.3.0` extras (X-1, X-2, P-2, X-3, X-4, X-5, P-1 in that order), `v1.0.0` submission
- Docs: this SPEC, ADRs, README, `docs/AI_WORKFLOW.md`
