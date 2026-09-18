# Productive Time Tracker

Client-side SPA (no server code) for managing a person's [Productive](https://www.productive.io/)
time entries for a selected day: log in with an API token and organization ID, list entries for a
date, create, edit and delete them. Built for the Productive Frontend Engineer take-home. The
assignment PDF is Productive's document and is not in the repo; `docs/SPEC.md` section 9 restates
every requirement it sets.

**Status: complete.** The assignment's five features plus the extras — week strip and timesheet,
keyboard shortcuts, timer with idle awareness, range entry, duplicate and copy-day-forward, and
rich-text descriptions.

## Source of truth

Authoritative over anything inferred from code. Read before changing.

| Document              | Holds                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| `docs/SPEC.md`        | Architecture, UI components, API communication, assumptions, decisions     |
| `docs/adr/0001..0010` | Decisions and their reasoning. Do not relitigate a decided ADR in code     |
| `docs/api/README.md`  | Productive JSON:API endpoints, auth headers, filter shape, verified quirks |
| `docs/diagrams/*.mmd` | Use cases, domain model, login and CRUD sequences, navigation              |
| `docs/screenshots/`   | The app as built                                                           |

## Stack

React 19, TypeScript 6 strict, Vite 8, TanStack Router (file-based, `autoCodeSplitting`), TanStack
Query, react-hook-form + zod 4, Tailwind CSS 4 + shadcn/ui (new-york, Radix), react-day-picker (the
calendar only), TipTap 3 (the description field only), Vitest 5 + Testing Library + jsdom,
Playwright, MSW 2, pnpm 12, Node 22 (`.nvmrc`).

No state library. Session is React context over `localStorage`, server state is TanStack Query, UI
state is local.

## Commands

| Command          | Does                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server on `:5173`, real API                              |
| `pnpm dev:mock`  | Same with `VITE_ENABLE_MSW=true`; MSW handlers instead of the API |
| `pnpm build`     | `tsc -b && vite build`                                            |
| `pnpm lint`      | `eslint .`                                                        |
| `pnpm typecheck` | `tsc -b`                                                          |
| `pnpm test`      | `vitest run`                                                      |
| `pnpm test:e2e`  | `playwright test` (boots `dev:mock` itself)                       |
| `pnpm format`    | `prettier --write .`                                              |
| `pnpm changeset` | Add a changeset                                                   |

## Layout

`@` resolves to `./src`. The folder layout and each component's responsibility are described in
`docs/SPEC.md` sections 1 and 2 — that is the canonical description, not this file.

```
src/
  api/          client.ts (fetch wrapper, headers, JSON:API parsing, ApiError), and one typed
                module per resource: time-entries, organization-memberships, services, timers
  components/
    core/       shadcn primitives, copied in and edited here
    shared/     ConfirmDialog, DatePicker, Illustration, ShortcutsSheet, layouts/, hooks
    features/   auth, time-entries, settings, timer, week, quick-add
  routes/       TanStack Router file routes; routeTree.gen.ts is generated, never edited
  lib/          date, duration, note, storage, availability, activity, focus-modality
  mocks/        MSW handlers and fixtures, shared by tests and dev:mock
  styles/       index.css with the @theme tokens
  __tests__/    setup.ts, test-utils.tsx
e2e/            Playwright specs
```

`src/api/` is infrastructure and is complete: plain async functions, no React. Features add hooks
that call them; they do not add API functions. Extending it means recording a real response into
`docs/api/samples/` first (`.claude/rules/api-client.md`).

Two writes are **optimistic**: deleting, and an edit that changes the duration alone without moving
the entry off its day. Nothing else is - a POST or PATCH response carries only the `organization`
relationship, so an optimistically-inserted row could not render the service name every card shows.

Descriptions are **rich text** (ADR-0010). `components/features/time-entries/Note` renders a stored
note as elements by walking the parsed DOM against an allowlist, so `dangerouslySetInnerHTML`
appears nowhere. ProseMirror does not receive input under jsdom, so typing a list or bolding a word
is covered in `e2e/entry-create.spec.ts` rather than in a component test.

## Environment

`.env` is unreadable to Claude by design (`.claude/settings.json`). It holds exactly two vars:

- `VITE_API_BASE_URL`, `https://api.productive.io/api/v2`
- `VITE_ENABLE_MSW`, `true` to run against MSW instead of the real API

Credentials are never in `.env`, the repo or the build. The token and organization ID are typed on
the login screen and live in `localStorage` (ADR-0004).

## Rules, skills, agents

- `.claude/rules/guidebook.md`, code conventions, scoped to `src/**`
- `.claude/rules/api-client.md`, JSON:API client constraints, scoped to `src/api/**`
- `.claude/rules/git.md`, commit and PR format
- `.claude/rules/testing.md`, scoped to test files and `e2e/`
- Skills: `feature`, `pr`, `release`
- Agents: `api-explorer` (Productive endpoints), `reviewer` (diff against SPEC and conventions)

## Working rules

- One feature per branch and PR. Every commit carries a scope; behaviour changes carry a `Refs:`
  footer naming the assignment feature
- Never edit `src/routeTree.gen.ts` or `public/mockServiceWorker.js`; both are generated
- Tests are colocated with the unit under test. MSW errors on unhandled requests, so every request
  a test makes needs a handler
- Test the important behaviour, not every detail. Pure logic exhaustively and cheaply; error paths
  once each at component level, because the MSW worker takes no per-test override and answers inside
  the page; one end-to-end pass per user story
- Every behaviour change adds a changeset; CI enforces this on `feat/`, `fix/` and `perf/` branches
- Do not add a dependency without an ADR. `docs/adr/0005-scope-cuts.md` lists what was rejected
- An unanswered API question is settled by recording a real response into `docs/api/samples/`. The
  Productive MCP server in `.mcp.json` is an optional accelerator that needs Productive's Ultimate
  plan, which this project's demo account does not have — expect it to be unavailable
