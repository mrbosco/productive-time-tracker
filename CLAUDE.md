# Tracktive

Client-side SPA (no server code) for managing a person's [Productive](https://www.productive.io/) time entries for a selected day: log in with an API token and organization ID, list entries for a date, create, edit and delete them. Built for the Productive Frontend Engineer take-home assignment; the PDF in `docs/assignment/` is the source of truth.

**Status: the assignment's stories and the extras, both complete.** US-0 to US-4 close the assignment's own stories; X-1, X-2, P-2, X-3, X-4 and X-5 close SPEC 10's extras. **P-1, the quick-add line, is cut** - SPEC 10 ranks it last and says to cut it first - so its input is still on the day view and still opens the form without parsing what was typed. Descriptions are rich text in both directions (A-9 as amended by ADR-0010). Three assumptions moved while the extras landed: **A-7** now sorts a day newest first, **SPEC 10's X-4 row** was amended and then reverted after the real API was watched, and **SPEC 11** gained a fourth verified timer behaviour. `docs/AI_WORKFLOW.md` records what needed correcting and why.

## Source of truth

Authoritative over anything inferred from code. Read before changing.

| Document                                       | Holds                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/SPEC.md`                                 | Requirements (2), domain model (3), API flows (4), assumptions (5), architecture and folder layout (6), UI (7), testing strategy (8), out of scope (9), extras (10), delivery (12)                                                                                                      |
| `docs/adr/0001..0010`                          | Decisions and their reasoning. Do not relitigate a decided ADR in code                                                                                                                                                                                                                  |
| `docs/guidebook/RULES_DRAFT.md`                | The 32 code conventions, distilled from `docs/guidebook/infinum-handbook.md`                                                                                                                                                                                                            |
| `docs/api/README.md`                           | Productive JSON:API endpoints, auth headers, filter shape                                                                                                                                                                                                                               |
| Claude Design project (live)                   | **Authoritative UI reference.** `Day View.dc.html` and the `TimeTracker` component it imports are the source the screens were rendered from, and `Improvements.dc.html` is the second design pass (SPEC 10.1); read them through the `DesignSync` MCP before changing a screen's markup |
| `docs/design/BRIEF.md`, `docs/design/screens/` | The brief the design was made from, and PNG exports of it. Behind the live project where they disagree                                                                                                                                                                                  |
| `docs/diagrams/*.mmd`                          | Use cases, domain model, login and CRUD sequences, navigation                                                                                                                                                                                                                           |
| `docs/research/`                               | Competitive and Productive-app analysis behind the extras                                                                                                                                                                                                                               |

## Identifiers

IDs appear in commits, PR titles and tests. Unpadded decimal, except ADRs.

- `R-1`..`R-12` functional requirements (SPEC 2.1)
- `N-1`..`N-7` non-functional requirements (SPEC 2.2)
- `US-0`..`US-4` user stories. Canonical form in commits and PRs. US-1 to US-4 are the assignment's; `US-0` (login and session) is this project's, because the assignment states login as a paragraph rather than a story (SPEC 2)
- `UC-n` in `docs/diagrams/01-use-cases.mmd` maps 1:1 to `US-n`
- `A-1`..`A-10` assumptions (SPEC 5)
- `X-1`..`X-5`, `P-1`, `P-2` extra features (SPEC 10)
- `UI-1`..`UI-11` second design pass (SPEC 10.1). `UI-7` is reserved and not built; `UI-10` shipped with US-4
- `ADR-0001`..`ADR-0010` decisions, zero-padded to four

## Stack

React 19, TypeScript 6 strict, Vite 8, TanStack Router (file-based, `autoCodeSplitting`), TanStack Query, react-hook-form + zod 4, Tailwind CSS 4 + shadcn/ui (new-york, Radix), react-day-picker (the calendar only; ADR-0009), TipTap 3 (the description field only; ADR-0010), Vitest 5 + Testing Library + jsdom, Playwright, MSW 2, pnpm 12, Node 22 (`.nvmrc`).

No state library. Session is React context over `localStorage`, server state is TanStack Query, UI state is local (SPEC 6.3).

## Commands

| Command          | Does                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server on `:5173`, real API                              |
| `pnpm dev:mock`  | Same with `VITE_ENABLE_MSW=true`; MSW handlers instead of the API |
| `pnpm build`     | `tsc -b && vite build`                                            |
| `pnpm preview`   | Serve the build                                                   |
| `pnpm lint`      | `eslint .`                                                        |
| `pnpm typecheck` | `tsc -b`                                                          |
| `pnpm test`      | `vitest run`                                                      |
| `pnpm test:e2e`  | `playwright test` (boots `dev:mock` itself)                       |
| `pnpm format`    | `prettier --write .`                                              |
| `pnpm changeset` | Add a changeset                                                   |
| `pnpm version`   | `changeset version`, bumps and writes CHANGELOG                   |

## Layout

`@` resolves to `./src`.

```
src/
  api/          client.ts (fetch wrapper, headers, JSON:API parsing, ApiError),
                time-entries.ts, organization-memberships.ts, services.ts
  components/
    core/       shadcn primitives, copied in and edited here (components.json ui alias)
    shared/     DatePicker, Illustration, PageHeader, ConfirmDialog, layouts/
                (empty/error are states of TimeEntryList until a second caller, SPEC 6.1)
    features/   auth, time-entries, settings, timer, week, quick-add
  routes/       TanStack Router file routes; routeTree.gen.ts is generated, never edited
  lib/          date.ts, duration.ts, note.ts (text of a note), storage.ts, query-client.ts
  mocks/        MSW handlers and fixtures, shared by tests and dev:mock
  styles/       index.css with the @theme tokens
  __tests__/    setup.ts, test-utils.tsx
e2e/            Playwright specs, one per user story
```

`api/` is complete and is infrastructure, not a story: `client.ts` plus one typed module per resource, with MSW handlers built from the recorded responses in `docs/api/samples/`. Stories add hooks in `components/features/` that call these functions; they do not add API functions. Extending it means recording a sample first (`.claude/rules/api-client.md`).

`components/shared/` and `components/features/` are specified in SPEC 6.1 and get created as stories land. `features/auth/` (session context, login form), `features/settings/useDefaultService.ts` (A-1) and `shared/layouts/AppLayout.tsx` (app bar, logout) landed with US-0. `features/time-entries/` (`useTimeEntries`, `DateNavigator`, `DaySummary`, `ServiceTotals`, `TimeEntryList`, `TimeEntryCard`), `features/week/` (X-1), `features/quick-add/`, `shared/DatePicker/` and `shared/Illustration/` landed with US-1; the list's empty and error states live inside `TimeEntryList` rather than as `shared/EmptyState` and `shared/ErrorState`, which get extracted when US-3 gives them a second caller. US-2 added `features/time-entries/TimeEntryForm/` and `useCreateTimeEntry`, `features/settings/SettingsSheet/`, `features/time-entries/DayView/` (lifted out of the day route so `/entries/new` can render the day behind its dialog), and the `Textarea`, `Select`, `Dialog`, `Sheet` and `Toast` primitives in `core/`. There is no `shared/PageHeader`: the form is a modal at both widths, so its 56px mobile bar is part of the dialog rather than a page header. US-3 added `useTimeEntry` and `useUpdateTimeEntry` beside them, and the `entries.$id.edit` route; it added no component, because the edit screen is `TimeEntryForm` with an `entry` prop. `shared/EmptyState` and `shared/ErrorState` were expected to be extracted here and were not - the edit route's not-found state is a bare sentence and a link, not the bordered card with an illustration that `TimeEntryList` draws, so the two have no shape in common to share. US-4 added `useDeleteTimeEntry` and, this time, the extraction SPEC 6.1 names: `shared/ConfirmDialog`, because the delete confirm is asked from both the day view and the edit form, and `UnsavedChangesDialog` - which had said in its own doc comment that it was waiting for a second caller - is now a thin wrapper over it. The day view owns the delete dialog, the mutation and the toast rather than the card, because the toast belongs to the screen and X-2's `Delete` key will open the same dialog from the list; `DayView` gained its first test for that reason.

One part of the day view is still **drawn but inert**: the quick-add line, which opens the entry form without reading what was typed, because P-1 is cut. Everything else that used to be on that list is live - the timer pill and the `?` sheet in the app bar (X-4, X-2), the kebab's `Continue timer` and `Duplicate` (X-4, X-3), `Copy from yesterday` (X-3), `Default service...` (US-2), `Edit` (US-3), and `Delete` on both the card and the edit form (US-4).

The extras added `components/features/timer/` (`TimerProvider`, which `AppLayout` mounts so the app bar and a card's `Continue timer` read one timer; `TimerControl`; `StopTimerSheet`, lazily imported so TipTap stays off every authenticated route, ADR-0010; `ActivityBanner`; `useTimer`; `useActivityMonitor`), `components/shared/ShortcutsSheet/` and `components/shared/useHotkeys.ts` (X-2, in `shared/` because the app bar and the day view both bind keys), `features/time-entries/useCopyDayForward.ts` (X-3) and `lib/activity.ts` (X-5's heuristic, pure and flag-gated off). `src/api/timers.ts` is no longer unused and is no longer read-only: `continueTimer` writes.

Deleting is the app's one **optimistic** write, which is what SPEC 4.2 asks for and only there: the row and its minutes leave the day and the week cache on confirm, and `onError` puts both back. The other two mutations explain in their own doc comments why they cannot be - a POST or PATCH response carries only the `organization` relationship (api-client rule 15), so an optimistic row could not render the service name every card shows. A failure is reported where the user is standing: the day view has no banner, so it raises the error toast SPEC 4.2 names (and `Toast` grew the error variant the design's component sheet always drew); the edit form has one, so it uses that and stays open.

Descriptions are **rich text** (ADR-0010). The form's field is TipTap, trimmed to paragraphs, bold, italic, strike and the two list kinds; `components/features/time-entries/Note` renders a stored note as elements by walking the parsed DOM against an allowlist, so `dangerouslySetInnerHTML` still appears nowhere. `lib/note.ts`'s `toPlainText` stays for the places that want a line of text rather than a document. ProseMirror does not receive input under jsdom, so typing a list or bolding a word is covered in `e2e/entry-create.spec.ts` rather than in a component test - and entry cards are queried as `article`, because a note's own bullets are `listitem`s now.

The entry form is a **modal at both widths** - a full screen on mobile, a 560px dialog over the day on desktop, where the design's build notes say "adding time is never worth a page change". The P-2 range toggle is deliberately absent rather than drawn inert: it is an extra, and the field it swaps is the one the form is for. `TimeEntryForm.tsx` names where its markup lives in the design source, as it does for X-4's stop-timer sheet.

## Environment

`.env` is unreadable to Claude by design (`.claude/settings.json`). It holds exactly two vars:

- `VITE_API_BASE_URL`, `https://api.productive.io/api/v2`
- `VITE_ENABLE_MSW`, `true` to run against MSW instead of the real API

Credentials are never in `.env`, the repo or the build. The token and organization ID are typed on the login screen and live in `localStorage` (ADR-0004).

## Rules, skills, agents

- `.claude/rules/guidebook.md`, code conventions, scoped to `src/**`
- `.claude/rules/api-client.md`, JSON:API client constraints and how to settle an unanswered API question, scoped to `src/api/**`
- `.claude/rules/git.md`, commit and PR format, unscoped
- `.claude/rules/testing.md`, scoped to test files and `e2e/`
- Skills: `feature` (build a story), `pr` (open one), `release` (cut one through the version PR)
- Agents: `api-explorer` (Productive endpoints), `reviewer` (diff against SPEC and guidebook)

## Working rules

- One user story per branch and PR (SPEC 12). Every commit carries a scope and, for behaviour changes, a `Refs:` footer
- Never edit `src/routeTree.gen.ts` or `public/mockServiceWorker.js`; both are generated
- Tests are colocated with the unit under test. MSW is configured to error on unhandled requests, so every request a test makes needs a handler
- Every behaviour change adds a changeset; CI enforces this on `feat/`, `fix/` and `perf/` branches
- Releases go through the Version Packages PR that `.github/workflows/release.yml` opens; merging it tags `vX.Y.Z`. See the `release` skill
- Do not add a dependency without an ADR. `docs/adr/0005-scope-cuts.md` lists what was deliberately rejected
- An unanswered API question is settled by recording a real response into `docs/api/samples/`; that is the procedure and it needs nothing extra. The Productive MCP server in `.mcp.json` is an **optional accelerator on top of it** — it needs Productive's Ultimate plan, which this project's demo account does not have, so expect it to be unavailable and do not block on it. `.claude/rules/api-client.md` rules 25-28 cover it, including that it can write to a real organization and so needs per-change approval
- MCP servers irrelevant to this project (`adloop`, `chrome-devtools`) are disabled per project, not globally; re-enable either with `/mcp` if you need it here
