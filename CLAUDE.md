# Tracktive

Client-side SPA (no server code) for managing a person's [Productive](https://www.productive.io/) time entries for a selected day: log in with an API token and organization ID, list entries for a date, create, edit and delete them. Built for the Productive Frontend Engineer take-home assignment; the PDF in `docs/assignment/` is the source of truth.

**Status: scaffold.** Tooling is complete; no features and no commits yet.

## Source of truth

Authoritative over anything inferred from code. Read before changing.

| Document                                       | Holds                                                                                                                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/SPEC.md`                                 | Requirements (2), domain model (3), API flows (4), assumptions (5), architecture and folder layout (6), UI (7), testing strategy (8), out of scope (9), extras (10), delivery (12) |
| `docs/adr/0001..0008`                          | Decisions and their reasoning. Do not relitigate a decided ADR in code                                                                                                             |
| `docs/guidebook/RULES_DRAFT.md`                | The 32 code conventions, distilled from `docs/guidebook/infinum-handbook.md`                                                                                                       |
| `docs/api/README.md`                           | Productive JSON:API endpoints, auth headers, filter shape                                                                                                                          |
| `docs/design/BRIEF.md`, `docs/design/screens/` | Visual target: 24 screens, mobile and desktop                                                                                                                                      |
| `docs/diagrams/*.mmd`                          | Use cases, domain model, login and CRUD sequences, navigation                                                                                                                      |
| `docs/research/`                               | Competitive and Productive-app analysis behind the extras                                                                                                                          |

## Identifiers

IDs appear in commits, PR titles and tests. Unpadded decimal, except ADRs.

- `R-1`..`R-12` functional requirements (SPEC 2.1)
- `N-1`..`N-7` non-functional requirements (SPEC 2.2)
- `US-1`..`US-4` user stories from the assignment. Canonical form in commits and PRs
- `UC-n` in `docs/diagrams/01-use-cases.mmd` maps 1:1 to `US-n`
- `A-1`..`A-10` assumptions (SPEC 5)
- `X-1`..`X-5`, `P-1`, `P-2` extra features (SPEC 10)
- `ADR-0001`..`ADR-0008` decisions, zero-padded to four

## Stack

React 19, TypeScript 6 strict, Vite 8, TanStack Router (file-based, `autoCodeSplitting`), TanStack Query, react-hook-form + zod 4, Tailwind CSS 4 + shadcn/ui (new-york, Radix), Vitest 5 + Testing Library + jsdom, Playwright, MSW 2, pnpm 12, Node 22 (`.nvmrc`).

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
    shared/     DatePicker, PageHeader, EmptyState, ErrorState, ConfirmDialog, layouts/
    features/   auth, time-entries, settings, timer, week, quick-add
  routes/       TanStack Router file routes; routeTree.gen.ts is generated, never edited
  lib/          date.ts, duration.ts, storage.ts, query-client.ts
  mocks/        MSW handlers and fixtures, shared by tests and dev:mock
  styles/       index.css with the @theme tokens
  __tests__/    setup.ts, test-utils.tsx
e2e/            Playwright specs, one per user story
```

Only `components/core/`, `lib/`, `mocks/`, `routes/`, `styles/` and `__tests__/` exist today. `api/`, `components/shared/` and `components/features/` are specified in SPEC 6.1 and get created as stories land.

## Environment

`.env` is unreadable to Claude by design (`.claude/settings.json`). It holds exactly two vars:

- `VITE_API_BASE_URL`, `https://api.productive.io/api/v2`
- `VITE_ENABLE_MSW`, `true` to run against MSW instead of the real API

Credentials are never in `.env`, the repo or the build. The token and organization ID are typed on the login screen and live in `localStorage` (ADR-0004).

## Rules, skills, agents

- `.claude/rules/guidebook.md`, code conventions, scoped to `src/**`
- `.claude/rules/git.md`, commit and PR format, unscoped
- `.claude/rules/testing.md`, scoped to test files and `e2e/`
- Skills: `feature` (build a story), `pr` (open one), `release` (tag one)
- Agents: `api-explorer` (Productive endpoints), `reviewer` (diff against SPEC and guidebook)

## Working rules

- One user story per branch and PR (SPEC 12). Every commit carries a scope and, for behaviour changes, a `Refs:` footer
- Never edit `src/routeTree.gen.ts` or `public/mockServiceWorker.js`; both are generated
- Tests are colocated with the unit under test. MSW is configured to error on unhandled requests, so every request a test makes needs a handler
- Every behaviour change adds a changeset
- Do not add a dependency without an ADR. `docs/adr/0005-scope-cuts.md` lists what was deliberately rejected
- MCP servers irrelevant to this project (`adloop`, `chrome-devtools`) are disabled per project, not globally; re-enable either with `/mcp` if you need it here
