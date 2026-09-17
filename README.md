# Tracktive

A client-side time tracker for [Productive](https://www.productive.io/): log in with an API
token and organization ID, then list, add, edit and delete your own time entries for a chosen
day. No server-side code — the browser talks to the Productive API directly.

Full specification: [`docs/SPEC.md`](docs/SPEC.md). Decisions: [`docs/adr/`](docs/adr/).

## What shipped

All four assignment stories, the login and session they rest on, and every extra from
[`docs/SPEC.md`](docs/SPEC.md) section 10 except one.

|          |                                                                                        |
| -------- | -------------------------------------------------------------------------------------- |
| **US-0** | Log in with an API token and organization ID, stay logged in across refreshes, log out |
| **US-1** | The entries for a selected date, with the week around it and totals by service         |
| **US-2** | Add an entry: duration, description, date                                              |
| **US-3** | Edit an entry in its own route                                                         |
| **US-4** | Delete an entry, behind one confirmation                                               |
| **X-1**  | Week strip and totals: seven days and a weekly total, one request, three cell states   |
| **X-2**  | Keyboard shortcuts: `n`, `←` `→`, `t`, `↑` `↓`, `e`, `Del`, `s`, `?`, `Esc`            |
| **P-2**  | Start/end range mode: log an entry as "nine to half ten" instead of a duration         |
| **X-3**  | Duplicate an entry, and fill an empty day from the day before it                       |
| **X-4**  | Timer: start, stop, continue an existing entry, and survive a refresh                  |
| **X-5**  | Activity awareness: notice a timer running with nobody there, and offer a choice       |

Descriptions are rich text in both directions (ADR-0010): a list written here is stored as the HTML
Productive's own editor produces, and one written there renders as a list.

## What was cut

**P-1, the quick-add line.** SPEC 10 ranks it last and says to cut it first; it is the only extra
that needed a parser of its own (`1.5h client call yesterday` into a date, a duration and a note)
rather than reusing what was already there. The input is still on the day view, because the design
puts it there and it does something useful without the parser: it opens the entry form. It does not
read what you typed.

**The synthetic-input heuristic is built but off.** X-5 can also notice input that looks automated -
regular as a metronome, barely moving - and `detectSyntheticInput` in
`src/components/features/timer/useActivityMonitor.ts` turns it on. It ships `false`, and that is the
decision rather than the default: Harvest and Toggl both advertise that they do not watch how you
type, and this is a tool people use to bill clients. It is written and tested so the choice is
reversible and so it can be argued about with something real; idle detection, which needs no such
watching, is on.

**Two smaller things worth knowing.** A stored entry does not remember that it was entered as a
range - Productive stores minutes and nothing else - so an entry logged as 09:00 to 10:30 reopens as
`1h 30m`. And the timer control in the app bar does not animate its width between states; everything
else from the design's motion spec is there.

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
