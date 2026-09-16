# ADR-0003: Vitest + Testing Library, Playwright, MSW

Status: accepted (2026-09-15)

## Context

The handbook recommends Jest + Testing Library and colocated test files. Productive's own E2E stack is Puppeteer + Cucumber. CI must run without secrets.

## Decision

- Unit and component tests: Vitest + @testing-library/react + user-event + jest-dom matchers, colocated (`Component.test.tsx`), mocks in `__mocks__`.
- E2E: Playwright with a mobile viewport project, running against MSW in the browser.
- API mocking everywhere: MSW handlers built from recorded real responses; also powers `pnpm dev:mock`.

## Rationale

- Vitest is Jest-API compatible (handbook guidance applies unchanged) and shares the Vite config, removing a second transform pipeline.
- Playwright is the modern equivalent of Puppeteer with auto-waiting, trace viewer and built-in mobile emulation (N-4). Cucumber/Gherkin is omitted: no non-technical stakeholders read the scenarios in this project.
- MSW keeps CI deterministic and secret-free; the same fixtures serve tests and local development.

## Consequences

- The real API is exercised manually (smoke checklist in the PR template) and in local development, not in CI.
