# Tracktive

A client-side time tracker for [Productive](https://www.productive.io/): log in with an API
token and organization ID, then list, add, edit and delete your own time entries for a chosen
day. No server-side code — the browser talks to the Productive API directly.

Full specification: [`docs/SPEC.md`](docs/SPEC.md). Decisions: [`docs/adr/`](docs/adr/).

> **Status: scaffold.** Tooling only — no features yet. Routes, API client and screens land in
> the pull requests that follow.

## Requirements

- Node 22 (`.nvmrc`; `nvm use`)
- pnpm 12 (`corepack enable`)

## Setup

```sh
pnpm install
cp .env.example .env
pnpm dev
```

`.env` holds the API base URL only. Your token and organization ID are never stored in the
repo or the build: you enter them on the login screen and they live in `localStorage`
([ADR-0004](docs/adr/0004-credentials-in-browser.md)).

## Scripts

| Script           | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server against the real Productive API               |
| `pnpm dev:mock`  | Same, but against MSW handlers — no credentials needed        |
| `pnpm build`     | Type-check the project, then build to `dist/`                 |
| `pnpm preview`   | Serve the production build                                    |
| `pnpm typecheck` | `tsc -b`, no emit                                             |
| `pnpm lint`      | ESLint (type-aware rules + Prettier as a rule)                |
| `pnpm format`    | Prettier over the repo                                        |
| `pnpm test`      | Vitest: unit and component tests                              |
| `pnpm test:e2e`  | Playwright: desktop and mobile projects, served by `dev:mock` |
| `pnpm changeset` | Record a changeset for the current change                     |

E2E never hits the real API: it runs against MSW so CI stays deterministic and secret-free
([ADR-0003](docs/adr/0003-testing.md)). The real API is exercised manually against a smoke
checklist before release.

## Optional: Productive MCP server

`.mcp.json` configures [Productive's MCP server](https://help.productive.io/en/articles/14817386-mcp-server)
so an agent working in this repo can ask the API questions directly. It is **entirely optional** and
nothing here depends on it.

- It requires Productive's **Ultimate** plan. On any other plan the connection simply will not
  authorise, which is harmless — decline the approval prompt and carry on.
- There is no key to add. The file holds only the server URL; authentication is a browser OAuth
  sign-in, per user, bound to one organization.
- Connect with `/mcp` inside Claude Code, or remove it entirely with
  `claude mcp remove productive -s project`.

API questions this repo cannot answer are settled by recording a real response into
[`docs/api/samples/`](docs/api/samples/), which needs no subscription. The MCP only makes that
faster.

## Conventions

- Component layout, naming, hooks, a11y and testing rules:
  [`docs/guidebook/RULES_DRAFT.md`](docs/guidebook/RULES_DRAFT.md), distilled from the Infinum
  Frontend Handbook.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), no emoji;
  `commitlint` enforces it and `lint-staged` runs on every commit.
- Every behaviour change carries a changeset.
