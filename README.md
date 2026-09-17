# Productive Time Tracker

A client-side time tracker for [Productive](https://www.productive.io/). Log in with an API token
and organization ID, then list, add, edit and delete your own time entries for any day. No
server-side code: the browser talks to the Productive API directly.

![The day view on desktop](docs/screenshots/day-desktop.png)

Technical specification: [`docs/SPEC.md`](docs/SPEC.md) · Decisions: [`docs/adr/`](docs/adr/) ·
API notes: [`docs/api/README.md`](docs/api/README.md), what the Productive API actually does,
established by recording real responses into [`docs/api/samples/`](docs/api/samples/)

## Quick start

```sh
nvm use                # Node 22 (.nvmrc)
corepack enable        # pnpm 12
pnpm install
```

**Without a Productive account** — runs against mock handlers, no credentials needed:

```sh
pnpm dev:mock          # http://localhost:5173, any token and org ID will do
```

**Against the real API:**

```sh
cp .env.example .env   # sets VITE_API_BASE_URL=https://api.productive.io/api/v2
pnpm dev
```

Then log in with an **API token** and an **organization ID**. Both are in Productive under
**Settings → API integrations**: the organization ID is shown at the top of that screen, and the
token is created there too.

Credentials are never in the repo, the `.env` file or the build. You type them on the login screen
and they live in `localStorage` ([ADR-0004](docs/adr/0004-credentials-in-browser.md)); logging out
clears them.

## What it does

|                |                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Log in**     | API token and organization ID, resolved to the person who owns the entries. Survives a refresh; logout clears it |
| **View a day** | The entries for a date, with the surrounding week and totals by service. Empty, loading and error states         |
| **Add**        | Duration, date and description. The person is set from the session, never typed                                  |
| **Edit**       | In its own route (`/entries/:id/edit`), deep-linkable                                                            |
| **Delete**     | Behind a confirmation naming the entry, from the list or the edit form                                           |

Beyond the assignment: a running timer with idle detection, a week strip and timesheet grid,
keyboard shortcuts (`?` lists them), duplicate and copy-a-day-forward, start/end range entry, and
rich-text descriptions that round-trip with Productive's own editor
([ADR-0010](docs/adr/0010-rich-text-notes.md)).

<p>
  <img src="docs/screenshots/day-mobile.png" alt="The day view on a phone" width="240">
  <img src="docs/screenshots/entry-form-mobile.png" alt="The entry form on a phone" width="240">
</p>

More screens: [`docs/screenshots/`](docs/screenshots/).

## Scripts

| Script           | What it does                                                  |
| ---------------- | ------------------------------------------------------------- |
| `pnpm dev`       | Vite dev server against the real Productive API               |
| `pnpm dev:mock`  | Same, but against MSW handlers — no credentials needed        |
| `pnpm build`     | Type-check, then build to `dist/`                             |
| `pnpm preview`   | Serve the production build                                    |
| `pnpm typecheck` | `tsc -b`, no emit                                             |
| `pnpm lint`      | ESLint, type-aware rules plus Prettier                        |
| `pnpm format`    | Prettier over the repo                                        |
| `pnpm test`      | Vitest: unit and component tests                              |
| `pnpm test:e2e`  | Playwright, desktop and mobile projects, served by `dev:mock` |

End-to-end tests never hit the real API — they run against MSW so CI stays deterministic and
secret-free ([ADR-0003](docs/adr/0003-testing.md)).

## Notes

The interface deliberately reuses Productive's wordmark and accent purple: this is a tool for
Productive's own product, and matching the parent app is the point rather than a liberty taken.
Swap the tokens in `src/styles/index.css` to rebrand it.

Code conventions follow [Infinum's Frontend Handbook](https://infinum.com/handbook/frontend).
Commits follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by
`commitlint`.
