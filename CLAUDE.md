# Tracktive

Client-side SPA (no server code) for managing a person's [Productive](https://www.productive.io/) time entries for a selected day: log in with an API token and organization ID, list entries for a date, create, edit and delete them. Built for the Productive Frontend Engineer take-home assignment; the PDF in `docs/assignment/` is the source of truth.

**Status: US-1 (with X-1).** Tooling and the API layer are complete; login, the session and the auth-guarded route tree are in place, and the day view lists a selected date's entries with the week strip and totals around them. Add an entry (US-2) is the next story.

## Source of truth

Authoritative over anything inferred from code. Read before changing.

| Document                                       | Holds                                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/SPEC.md`                                 | Requirements (2), domain model (3), API flows (4), assumptions (5), architecture and folder layout (6), UI (7), testing strategy (8), out of scope (9), extras (10), delivery (12)                                    |
| `docs/adr/0001..0009`                          | Decisions and their reasoning. Do not relitigate a decided ADR in code                                                                                                                                                |
| `docs/guidebook/RULES_DRAFT.md`                | The 32 code conventions, distilled from `docs/guidebook/infinum-handbook.md`                                                                                                                                          |
| `docs/api/README.md`                           | Productive JSON:API endpoints, auth headers, filter shape                                                                                                                                                             |
| Claude Design project (live)                   | **Authoritative UI reference.** `Day View.dc.html` and the `TimeTracker` component it imports are the source the screens were rendered from; read them through the `DesignSync` MCP before changing a screen's markup |
| `docs/design/BRIEF.md`, `docs/design/screens/` | The brief the design was made from, and PNG exports of it. Behind the live project where they disagree                                                                                                                |
| `docs/diagrams/*.mmd`                          | Use cases, domain model, login and CRUD sequences, navigation                                                                                                                                                         |
| `docs/research/`                               | Competitive and Productive-app analysis behind the extras                                                                                                                                                             |

## Identifiers

IDs appear in commits, PR titles and tests. Unpadded decimal, except ADRs.

- `R-1`..`R-12` functional requirements (SPEC 2.1)
- `N-1`..`N-7` non-functional requirements (SPEC 2.2)
- `US-0`..`US-4` user stories. Canonical form in commits and PRs. US-1 to US-4 are the assignment's; `US-0` (login and session) is this project's, because the assignment states login as a paragraph rather than a story (SPEC 2)
- `UC-n` in `docs/diagrams/01-use-cases.mmd` maps 1:1 to `US-n`
- `A-1`..`A-10` assumptions (SPEC 5)
- `X-1`..`X-5`, `P-1`, `P-2` extra features (SPEC 10)
- `ADR-0001`..`ADR-0009` decisions, zero-padded to four

## Stack

React 19, TypeScript 6 strict, Vite 8, TanStack Router (file-based, `autoCodeSplitting`), TanStack Query, react-hook-form + zod 4, Tailwind CSS 4 + shadcn/ui (new-york, Radix), react-day-picker (the calendar only; ADR-0009), Vitest 5 + Testing Library + jsdom, Playwright, MSW 2, pnpm 12, Node 22 (`.nvmrc`).

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
  lib/          date.ts, duration.ts, note.ts, storage.ts, query-client.ts
  mocks/        MSW handlers and fixtures, shared by tests and dev:mock
  styles/       index.css with the @theme tokens
  __tests__/    setup.ts, test-utils.tsx
e2e/            Playwright specs, one per user story
```

`api/` is complete and is infrastructure, not a story: `client.ts` plus one typed module per resource, with MSW handlers built from the recorded responses in `docs/api/samples/`. Stories add hooks in `components/features/` that call these functions; they do not add API functions. Extending it means recording a sample first (`.claude/rules/api-client.md`).

`components/shared/` and `components/features/` are specified in SPEC 6.1 and get created as stories land. `features/auth/` (session context, login form), `features/settings/useDefaultService.ts` (A-1) and `shared/layouts/AppLayout.tsx` (app bar, logout) landed with US-0. `features/time-entries/` (`useTimeEntries`, `DateNavigator`, `DaySummary`, `ServiceTotals`, `TimeEntryList`, `TimeEntryCard`), `features/week/` (X-1), `features/quick-add/`, `shared/DatePicker/` and `shared/Illustration/` landed with US-1; the list's empty and error states live inside `TimeEntryList` rather than as `shared/EmptyState` and `shared/ErrorState`, which get extracted when US-3 gives them a second caller.

Parts of the day view are **drawn but inert**, because the design puts them on this screen and a bar or card that gained a control later would reflow around it: the timer pill and the `?` sheet in the app bar, `Default service...` in the account menu, the quick-add line (it opens the form without parsing), the entry card's kebab menu, and `Copy from yesterday`. Each belongs to US-2, US-3, US-4, X-2, X-3 or X-4 and is wired there.

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
