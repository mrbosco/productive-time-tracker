---
description: Test conventions for Vitest unit/component tests and Playwright e2e
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - 'e2e/**'
---

# Testing

Strategy in SPEC 8; conventions are guidebook rules 19-23. ADR-0003 holds the reasoning.

## Levels

| Level     | Tool                            | Covers                                                                                   |
| --------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| Unit      | Vitest                          | `lib/duration`, `lib/date`, JSON:API parsing, error mapping, the quick-add parser        |
| Component | Vitest + Testing Library + MSW  | Forms (validation, submit, error rendering) and list states: loading, empty, error, data |
| E2E       | Playwright + MSW in the browser | One spec per user story: login and persistence, list by date, create, edit, delete       |

Every list-rendering component gets all four states tested. R-7 and R-8 make empty and error states requirements, not polish.

## Rules

1. **Colocate.** `TimeEntryCard/TimeEntryCard.test.tsx` next to the component. Mocks in `__mocks__`, shared helpers in `src/__tests__/test-utils.tsx` (render with providers; extend it rather than re-wiring providers per file).
2. **Query by role and accessible name first**: `getByRole('button', { name: /save/i })`, `getByRole('textbox', { name: /description/i })`. Fall back to label, then text. Reach for `data-testid` only when there is no accessible handle, and treat needing one as an accessibility bug (guidebook 18).
3. **`user-event`, never `fireEvent`.** `const user = userEvent.setup()` then `await user.click(...)`. It fires the full event sequence a real user produces.
4. **Assert behaviour and rendered output**, never internal state, hook internals or implementation details. A refactor that preserves behaviour must not break a test.
5. **Async**: `findBy*` or `waitFor`, never a bare timeout. Use fake timers deliberately (the timer and idle-detection features, X-4 and X-5, need them) and restore real timers afterwards.
6. **One behaviour per test.** The name states the behaviour: `shows the empty state when the day has no entries`.

## What the runner already provides

- `globals: true` — `describe`, `it`, `expect`, `vi` need no import.
- Setup is `src/__tests__/setup.ts`: it starts the MSW server, runs `cleanup()` and `resetHandlers()` after each test. Do not re-register those per file.
- **MSW runs with `onUnhandledRequest: 'error'`.** Any request without a handler fails the test. Add handlers to `src/mocks/handlers.ts` for the shared happy path; override per test with `server.use(...)` for error and edge cases.
- Environment is `jsdom`, CSS is not processed (`css: false`), so do not assert on computed styles.
- Vitest excludes `e2e/**`. Playwright specs never run under Vitest.
- `@` resolves to `./src` in tests as in app code.

## Playwright

- Specs live in `e2e/`, named per user story. `playwright.config.ts` boots `pnpm dev:mock` on `http://localhost:5173` itself; do not start a server in the test.
- **E2E never touches the real Productive API** (ADR-0003): no secrets in CI, deterministic runs. Traffic is MSW handlers in the browser.
- Two projects run every spec: `desktop-chromium` and `mobile-chrome` (Pixel 5). Mobile is a requirement (N-4), not an extra, so no spec may assume a desktop-only layout.
- Use `baseURL`-relative paths: `page.goto('/day/2026-09-15')`.
- Prefer `getByRole` locators and Playwright's auto-waiting assertions (`await expect(locator).toBeVisible()`). No manual `waitForTimeout`.

## Before review

`pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` all pass, and coverage has not dropped (guidebook 29).
