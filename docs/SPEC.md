# Productive Time Tracker: Technical Specification

Status: v1 (Phase 1 closed 2026-09-15). All open decisions resolved; see ADR-0001..0009.

## 1. Purpose

A client-side web application (no server-side code) for managing a person's Productive time entries for a selected day: login with API credentials, list entries for a date, create, edit (own route) and delete entries. Built for the Productive Frontend Engineer take-home assignment; the assignment text is the source of truth (`docs/assignment/`).

Time budget: ~10 hours for research, specification and implementation.

## 2. Requirements traceability

Every requirement below is quoted or closely paraphrased from the assignment. IDs are used in commits, PRs and tests.

US-1 to US-4 are the assignment's own user stories. US-0 is this project's: the assignment states
login, credential persistence and logout as a paragraph under "Regarding the login screen" rather
than as a story, and every other story is unreachable without it, so it is written up here in the
same shape as the rest.

**US-0 - Log in and stay logged in.** As a user I want to log in with my API token and organization
ID and stay logged in across refreshes, so that I can manage my time entries. Acceptance criteria:

- The login screen takes an API token and an organization ID (R-1).
- Credentials survive a page refresh, and logging out clears them (R-2, persisted per A-4).
- The person is resolved from the credentials, never typed (R-10), and the default service is
  resolved in the background per A-1.
- Login reports its failures distinctly: an invalid token, a token with no person in that
  organization, and an unreachable API (SPEC 4.1, design brief 3.1).

### 2.1 Functional (must)

| ID   | Requirement                                                                                                                           | Source                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R-1  | Login screen: user enters API token and organization ID                                                                               | US-0                                                              |
| R-2  | Credentials persisted across page refresh; logout clears them                                                                         | US-0                                                              |
| R-3  | Screen listing time entries for a selected date, default today                                                                        | US-1                                                              |
| R-4  | Only entries belonging to the current person are shown                                                                                | US-1                                                              |
| R-5  | User can change the selected date; list updates                                                                                       | US-1                                                              |
| R-6  | Entry shows duration, multiline description, date. The date is carried by the day heading, not repeated on every card (design brief 3.2) | US-1                                                              |
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
| Login / resolve person | `GET /organization_memberships?include=person,organization`                                             | Both relationships must be in `include`: without it each is `{"meta":{"included":false}}` with no ID at all. **`X-Organization-Id` does not scope this collection** — an organization that does not exist is answered with 200 and the token's own memberships — so the app finds the membership whose `organization` matches the entered ID, as the assignment describes on page two. No match is "not a member of organization N". A real organization the token has no person in is refused with 403 `no_person`, and 401 means a bad token; the login screen distinguishes all three. |
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
- The organization is validated inside that one request, by matching the returned memberships
  against the entered ID. There is no second call and no organization endpoint: the membership
  list is the check.
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
| A-3  | "Selected date" navigation                                                                           | Previous/next day buttons around a label in words (`Today, Tue 15 Sep`, `Yesterday, Mon 14 Sep`, otherwise `Wed 10 Sep 2026` - the dated form carries the year, per design brief 3.2), the label opens a calendar popover, plus a text-labelled `Today` button (pattern from Harvest).                                                                                               | decided |
| A-4  | Where credentials are persisted                                                                      | `localStorage` (survives refresh and browser restart), namespaced key, cleared on logout. Session data (person ID, default service) is derived and cached alongside. See ADR-0004 for the security trade-off.                                                                                                          | decided |
| A-5  | Edit route shape                                                                                     | `/entries/:id/edit`; opening it directly fetches the entry by ID. Create lives at `/entries/new?date=YYYY-MM-DD` (own route too, for symmetry and mobile).                                                                                                                                                             | decided |
| A-6  | Time zone                                                                                            | Dates are calendar dates, not instants; the app never converts through UTC. `date` is formatted from local time.                                                                                                                                                                                                       | decided |
| A-7  | Sorting                                                                                              | Entries for a day sorted by `created_at` **descending** - newest first - **client-side**: `/time_entries` accepts only `sort=date` and `sort=-date`, and rejects `created_at` with a 400 (`docs/api/samples/sort-support.txt`). **Amended 2026-09-17:** this said ascending, "order of logging". That is the right order for a ledger and the wrong one for a screen you work from - the entry just logged, and the timer just started, are what someone is looking for, and appending them below a full day puts them off the bottom of it. X-4 made it plainly wrong: starting a timer added its row to the end, where it could not be seen.                                                                                                                                                                                                                                                 | decided |
| A-8  | Validation                                                                                           | The form requires duration > 0 and <= 24h. Existing zero-minute entries are still rendered, as `0h`, with no extra label. The muted `draft` label is rendered **only** from `attributes.draft`, which is a real API field and is independent of duration — the recorded zero-minute entry has `draft: false`. `draft` is therefore part of the day list's sparse fieldset. Note that a **running timer also shows as a zero-minute entry**, because starting one creates its entry immediately (X-4); that is another reason the label cannot be derived from duration. Description optional (API allows an empty or `null` note) but max length guarded; date required.                                                                                                               | decided |
| A-9  | Notes created in Productive's UI are rich text, so `note` may contain HTML. **Confirmed**: a recorded note reads `<ul><li><p>Probavam</p></li></ul>` (`docs/api/samples/time-entries-day.json`). `note` is also nullable, so the renderer handles `null` as well as HTML. | **Amended (ADR-0010).** The app reads and writes the same rich text Productive does: the entry form is a TipTap editor whose schema matches the recorded shape byte for byte, and the card renders the markup as elements. `dangerouslySetInnerHTML` is still used nowhere - reading maps an allowlist of tags onto React elements (`components/shared/Note`) and fails closed on everything else, and the editor's schema discards anything it does not define. `lib/note.ts`'s `toPlainText` remains for the places that want a line of text rather than a document. **Superseded:** the original decision was to strip HTML to text on read and write plain text on save, which flattened a list on the card and silently degraded a Productive-authored note on every edit. | decided |
| A-10 | Delete confirmation                                                                                  | The assignment requires confirmation, so a dialog is used, unlike Productive's immediate delete with an UNDO toast. UNDO on top of the dialog is listed as a possible enhancement, not implemented.                                                                                                                    | decided |

## 6. Architecture

See ADR-0001..0005 for the reasoning. Summary:

- Vite + React 19 + TypeScript (strict)
- Routing: TanStack Router (file-based, type-safe params and search params; ADR-0007)
- Server state: TanStack Query; thin hand-written JSON:API client (`src/api`)
- Forms: react-hook-form + zod; the description field is TipTap (ADR-0010)
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
│   └── timers.ts           # start, continue, poll, stop; see X-4
├── components/
│   ├── core/               # Button, Card, Input, Textarea, Dialog, Toast (shadcn-based)
│   ├── shared/             # DatePicker, PageHeader, ConfirmDialog, layouts/AppLayout
│   │                       # (empty/error are states of TimeEntryList until a second caller)
│   └── features/
│       ├── auth/           # LoginForm, useSession
│       ├── time-entries/   # TimeEntryList, TimeEntryCard, TimeEntryForm, DaySummary, hooks (useTimeEntries, useCreateTimeEntry, ...)
│       ├── settings/       # DefaultServiceSelect (A-1)
│       ├── timer/          # TimerControl (app bar), useTimer (POST /timers), ActivityBanner, useActivityMonitor
│       ├── week/           # WeekStrip, useWeekTotals
│       └── quick-add/      # QuickAddInput, lib/quick-add parser (P-1)
├── routes/                 # TanStack Router file routes: __root.tsx, login.tsx, day.$date.tsx, entries.new.tsx, entries.$id.edit.tsx
├── lib/                    # date.ts, duration.ts, note.ts (A-9), storage.ts, query-client.ts
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

Implemented only after all required stories are merged (`v0.2.0`), one PR each, in this priority order.

> **X-1 is the exception, and landed with US-1.** The week strip is not decoration on the day view,
> it is a band of the screen the design draws between the date navigator and the day summary, and
> its content is per-day totals - there is no way to render it "UI now, data later" without showing
> numbers that are wrong. It costs one extra request per week (`filter[after]`/`filter[before]` over
> a range), keyed on the week's Monday so stepping within a week reuses the cache. Any of them is cut without regret if the budget runs out; the README lists what shipped. Scope of each was refined by `docs/research/competitive-analysis.md` section 3 and 4.

| #   | ID  | Feature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | API                                                 | Effort |
| --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| 1   | X-1 | **Week strip and totals.** 7 cells around the selected date plus a weekly-total cell, from one `GET /time_entries` week-range request grouped client-side. Three cell states: `logged` (bold total), `past workday, nothing logged` (muted dash, as in Productive), `weekend or future` (muted `0h`). Tap to navigate. **Superseded by UI-5:** the dash and the zero swapped places. A dash now means no work was expected and a `0h` means it was and none is there - the original pairing drew a Saturday and an unfilled Tuesday identically, which is the complaint UI-5 opens with. DaySummary shows the day total and totals grouped by service.                                                                                                                                                                                                                                                                                                                                                                                                                                | `GET /time_entries` (week range)                    | S      |
| 2   | X-2 | **Keyboard shortcuts.** `n` new, `←`/`→` day, `t` today, `?` shortcut sheet, `Esc` close; cards are focusable with roving `↑`/`↓`, `e` edits and `Delete`/`Backspace` opens the confirm dialog for the focused card; `s` stops a running timer. All shortcuts are disabled while an input, textarea or dialog has focus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | none                                                | S      |
| 3   | P-2 | **Start/end range mode.** A toggle in the entry form swaps the duration field for `from`/`to` time inputs; minutes are computed client-side and only `time` is stored; end before start is a validation error; editing always opens in duration mode (the API keeps no range).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | none beyond create/update                           | S      |
| 4   | X-3 | **Duplicate / copy.** Card menu `Duplicate` opens New entry prefilled with the note and duration and `date = today` (Toggl's continue pattern; the source date stays reachable in the picker). Empty-day state adds `Copy from yesterday`: sequential `POST /time_entries` from the cached D-1 list, one toast with count and failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | create                                              | S      |
| 5   | X-4 | **Timer.** Start a timer for the default service from the app bar; elapsed time is shown in the app bar on every route and mirrored into `document.title`, written in units (`23s`, `9m 20s`, `1h 9m 20s`) rather than as a clock - `9:20` beside a card reading `9h 20m` is the same six glyphs meaning two different amounts of time, and the design's `0:07` has the same problem past an hour; `{ timerId, startedAt, entryId? }` is persisted in `localStorage` so a refresh restores the indicator before the `['timer', personId]` query resolves. Stop opens the entry form prefilled with elapsed minutes. A card's `Continue` starts a timer that adds to that entry, not a new entry: `POST /timers` with a `time_entry` relationship attaches to the entry instead of creating one, and the stop adds the elapsed whole minutes to what it already holds (finding 4 below). **This row was briefly amended the other way and the amendment was wrong** - it assumed `POST /timers` always creates an entry, which is only true of a start that sends no `time_entry`.                                                                                                                                                                                                                                                                                                                                          | `POST /timers`, `PUT /timers/{id}/stop` (verified, see below) | M      |
| 6   | X-5 | **Activity awareness while a timer runs.** Idle detection (no `pointermove`/`keydown`/`wheel`/`click` for `idleMinutes`, default 15) is gated on `document.visibilityState === 'visible'` so a background tab never triggers it. Banner offers Harvest's resolution model: `Pause and discard idle time` (subtracts `idleMinutes` from the value written on stop, client-side) and `Keep running`. The synthetic-input heuristic (near-constant pointer intervals, near-zero displacement, no non-pointer events) is implemented and unit-tested but sits behind a config flag, **off by default**, because the market (Toggl, Harvest) explicitly positions itself against input monitoring; the README explains the flag and the reasoning. Nothing is sent to the API; the timer is never stopped automatically. | none                                                | S      |
| 7   | P-1 | **Quick add line.** One text input above the list parsing `1.5h client call yesterday`, `45m standup`, `2:30 fix login bug` into `{ time, note, date }` and opening the New entry form prefilled; never submits directly. Deterministic parser in `lib/quick-add.ts`, no AI, no network; table-driven unit tests. **Cut**, and partly superseded by UI-3: the line now starts a timer or opens the form with its text as the description, with no parsing of `1.5h` or `yesterday` out of it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | via the existing form                               | M      |

### X-5 detection sketch

- Listeners are attached to `window` only while a timer runs and removed with it.
- Idle: timestamp of the last input event; checked every 30 s; only while the document is visible.
- Synthetic score (flag `activityMonitor.detectSyntheticInput`, default `false`): rolling window of the last 60 pointer events; fires when the coefficient of variation of intervals is below 0.15, median displacement is below 3 px and the window contains no keyboard, wheel or click events.
- Thresholds live in one config object (`activityMonitor.idleMinutes`, `...cvThreshold`, `...displacementPx`); the hook `useActivityMonitor` is tested with recorded synthetic and human-like event streams.

### 10.1 Second design pass (UI-1..UI-11)

Ten changes to what was already designed, drawn as standalone proposals after `v0.3.0` shipped the
required stories and the extras above. Nothing on that page is wired into the approved screens -
`TimeTracker.dc.html`, the day, login and add-entry boards and the exported PNGs are untouched - so
the approved set still builds as-is. Each item states what changes and what it costs; the cost
column below is the design page's own.

**Design source.** The Claude Design project **"Design system accent conflicts"**
(`1292b384-b318-467c-a2b9-1d92d5629a33`), read through the `DesignSync` MCP:

> Read `Improvements.dc.html` together with the `_ds/productive-time-design-system-.../tokens/*.css`
> and `styles.css` it imports, and `TimeTracker.dc.html` for the approved screen each proposal sits
> inside. The PNGs under `docs/design/screens/` are exports, never the source; where a PNG and the
> design file disagree, the file wins. Every project and deal name on that page ends in `[SAMPLE]` -
> placeholder copy, not data to reproduce.

The page is exported as `docs/design/screens/08-improvements.png`.

| #   | ID    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                              | API                                          | Effort |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------ |
| 1   | UI-1  | **Company avatar, duration to the trailing edge.** A service belongs to a company, and the old Productive UI led with that company's logo. The card gains a 40px avatar at the leading edge and the duration moves to the trailing edge, which also makes room for UI-4's play control. Logo when the company has one; a building glyph on the subtle fill when it does not.                                                                            | `service.deal.company` on the day list       | S      |
| 2   | UI-2  | **Client, deal and section behind the service.** The service line becomes `project · service`, and the project name is a hover target revealing client, deal and section on three labelled lines. Dark tooltip, 200 ms - the name has to be aimed at, so a rest on it already means it. The week strip's panels (UI-6) take a second instead, because that row is swept across. Tap opens it as a small sheet on mobile - hover is not a mobile affordance.                                                                                                                                               | the same request as UI-1                     | S      |
| 3   | UI-3  | **Quick add becomes describe-then-track.** The approved quick add only ever opens the prefilled form; the common case is typing what you are about to do and starting the timer. The row gets two actions - a primary `Start`, and a quiet `Log time` for time already spent. `Start` tracks against the default service right away and the entry appears immediately as a normal card with an indigo border and a live duration; `Log time` opens the form with the text as the description. **`Start` is on today only**: a timer runs now, and on any other day it offered to track work that was already over - then answered by navigating away to today, where `POST /timers` had filed its entry. On a past or future day `Log time` is the whole row. | `POST /timers`, then the existing update     | M      |
| 4   | UI-4  | **Play on the row, and time editable in place.** Drawn in full as `Card Actions.dc.html`, which is the standard for the desktop row. `Continue timer` leaves the kebab for a 36px play button, and the duration itself becomes a 112px field with a popover carrying the parsed preview and `−15m` / `+15m` / `+1h`. Both controls' width is reserved at rest so hovering a row does not reflow the list. **Desktop only**: touch has no hover to reveal them and no room for a field beside a 15px note, so it keeps `Continue timer` and `Edit` in the kebab. A tracking row is never inline-editable. The kebab is Edit / Duplicate / Timer logs / Delete on a pointer. Saving is reversible rather than confirmed: the row says `Saved` for 2.6s and the toast carries `Undo` for 8s. On a focused row `Enter` opens the field and `p` starts the timer. **Two departures from the page, both deliberate:** the play button sits *before* the duration, because a reservation on the trailing side is a visible hole between the number and the kebab and on the leading side it is absorbed by the note column's gap; and the tracking edge is a thick left border rather than an absolute bar, because a rectangle's ends stick out past the row's rounded corners.      | `PATCH /time_entries/{id}`                   | M      |
| 5   | UI-5  | **Week strip: tell the cells apart.** Non-working days take a hatched fill, `—` replaces `0h` wherever nothing is expected, and the week total sits in the selection wash with an equals sign, no border, no click and no focus stop - it is not a day and not navigable.                                                                                                                                                                              | none                                         | S      |
| 6   | UI-6  | **Expected, worked and remaining.** A day cell and the week total both answer a hover with `Expected work time`, `Worked time` and `Work hours left`, scoped to that day or to the week. Durations stay `1h 30m`, never `01:30`.                                                                                                                                                                                                                       | an expected-hours figure per person          | S      |
| 7   | UI-7  | **Timesheet alongside Day.** A second route, `/week/:date`, reached by a segmented switch in the app bar, with `w` and `d` as its shortcuts. One row per project and service, one column per day, cells editable in place with the entry form's own duration rules. Today's column takes the selection wash and non-working ones the hatch from UI-5; a running timer fills its cell. `Add row` opens UI-11's picker. Desktop only - nine columns do not survive 390px, and the day view is the mobile answer. **Drawn in full as `Timesheet.dc.html`, which is why it is built rather than reserved.** | one week of entries, which the strip already fetches | L      |
| 8   | UI-8  | **Organization on the avatar.** Someone who works across organizations should see which one they are logging into before they log anything. The avatar carries a small organization badge and the menu names the organization and its ID - the same ID typed at login. The avatar is 44px, the largest control in the bar, never smaller than the help button beside it.                                                                               | already in the login response                | S      |
| 9   | UI-9  | **Timer logs.** Tracked time is timer runs plus manual corrections, and the card shows only the result. A read-only dialog from the kebab shows how the number was arrived at: one row per run (`Started`, `Stopped`, `Timer`, `Running`), a dash in `Stopped` while a run is going, and a footer reconciling `Tracked by timer`, `Manual correction` and `Logged`.                                                                                     | `GET /timers` narrowed to one time entry     | S      |
| 10  | UI-10 | **Don't throw away a half-written entry. SHIPPED with US-4.** Dismissing the form with unsaved changes asks first; an untouched form still closes immediately, because a prompt nobody needs is one people click through without reading. `shared/ConfirmDialog` and `UnsavedChangesDialog`.                                                                                                                                                           | none                                         | S      |
| 11  | UI-11 | **Default service: a searchable picker.** The sheet's native `select` cannot be searched, truncates its options to the control's width and holds no markup, which stops working at eighty services across a dozen companies. A search field and a list grouped by company replace it: service name leading, project beneath, the company once per group header with its logo. Search spans company, project and service and collapses the groups. Current default first in its group, then anything tracked in the last 30 days marked `Recent`, then by name; the person's own organization leads. Choosing applies at once - `Done` only closes, and on touch a tap does both. | `/services` + one 30-day `/time_entries` read while the sheet is open | M      |

Order of work - dependency order, not ID order, cheapest and least blocked first:

1. Record the three API answers UI-1, UI-6 and UI-9 turn on (below).
2. UI-5, 3. UI-8, 4. UI-1, 5. UI-2, 6. UI-6, 7. UI-4, 8. UI-3, 9. UI-9, 10. UI-11, 11. UI-7.

UI-1 changes the entry card's anatomy, and UI-2, UI-4 and UI-3 each redraw the card that change
produces. They are therefore **one branch and one pull request**, which is the exception to SPEC 12's
one-story-per-PR rule and the only one: four PRs would rewrite the same component four times and
show a reviewer three intermediate shapes that never ship.

> **UI-7 was reserved and is now built.** It was carried as a number with nowhere to point until
> `Timesheet.dc.html` drew it as a real screen, cell states and all. SPEC 9 still lists the
> timesheet grid as out of scope for the assignment's own stories; this is an extra beyond them.

> **UI-10 already shipped**, with US-4 - `shared/ConfirmDialog` was extracted there and
> `UnsavedChangesDialog` became a thin wrapper over it. It is listed for completeness, and because
> the design page calls it the cheapest item and the only one that prevents data loss rather than
> adding information.

**Three items rest on API facts this repository has not recorded**, and the recording decides them:

- **No expected-hours figure anywhere** - drop UI-6, and UI-5's hatch means "weekend" only.
- **No way to fetch one time entry's timer runs** - drop UI-9. That is the design page's own
  instruction: "Only possible if runs are stored individually rather than summed into one duration.
  Ask the API first; if it only stores totals, drop this one."
- **`/time_entries` will not nest `service.deal.company`** - the choice between a second cached
  request per day and dropping UI-1 and UI-2 belongs to the author of this section, not to whoever
  is implementing it.

Never invent a filter, a figure or a fallback number to keep an item alive. A dropped item is
amended into this table with what the recording proved.

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
| Continue     | `POST /timers` with a `time_entry` relationship   | `timer-continue-entry-probe.txt`         |

Start body — `service` and `person` as relationships, no attributes:

```json
{ "data": { "type": "timers", "relationships": {
  "service": { "data": { "type": "services", "id": "S" } },
  "person":  { "data": { "type": "people",   "id": "P" } } } } }
```

Four behaviours that shape X-4:

1. **Starting a timer also creates a time entry**, dated today with `time: 0`, linked through the
   timer's `time_entry` relationship. It appears in the day list straight away, so a running timer is
   already a `0h` row before anything is stopped. X-4 must not create a second entry on stop.
2. **Stopping writes the elapsed whole minutes onto that linked entry** as `time`, and returns them
   as the timer's `total_time`. 87 seconds became `1`; the remainder is dropped. So "stop opens the
   entry form prefilled with elapsed minutes" holds — but the entry already exists and already has
   the value, so the form edits it rather than creating it.
3. **`PUT`, not `POST`.** The same path 404s for `POST`. Stopping twice is 409
   `timer_already_stopped`, which the UI treats as "already stopped", not as an error. Productive's
   own client uses `PATCH` on the same path; both work.
4. **A `time_entry` relationship on the start attaches instead of creating** (added 2026-09-17,
   `timer-continue-entry-probe.txt`). `POST /timers` with `relationships.time_entry` starts a timer
   *on* that entry - no second entry, and the stop adds the elapsed whole minutes to the entry's
   existing `time` rather than replacing it, so the timer's `total_time` comes back as the entry's
   cumulative total. This is how Productive's own play-on-a-row control works, and it is what makes
   X-4's `Continue` a continuation rather than a copy.

`src/api/timers.ts` implements all four calls.

- `docs/research/productive-app-analysis.md`: reverse-engineering of Productive's own Time screen (UI, mobile layout, network calls) and the adopt/adapt table that fed A-9, A-10, X-1, X-3 and X-4.
- `docs/research/competitive-analysis.md`: Harvest and Toggl compared with Productive; source of the X-1..X-5 refinements, P-1, P-2, A-2, A-3 and the R-7 wording.

## 12. Delivery

- Public repository, `main` protected, PR per user story (R-IDs in PR titles), CI green
- Tags: `v0.1.0` scaffold, `v0.2.0` core stories, `v0.3.0` extras (X-1, X-2, P-2, X-3, X-4, X-5 shipped in that order; P-1 cut, as section 10 says it would be first), `v1.0.0` submission
- Docs: this SPEC, ADRs, README, [`docs/AI_WORKFLOW.md`](AI_WORKFLOW.md)
