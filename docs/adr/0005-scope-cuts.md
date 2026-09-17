# ADR-0005: Deliberate scope cuts under the 10-hour budget

Status: accepted (2026-09-15)

## Decision and rationale

| Cut                              | Why                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storybook                        | Component tests plus the captures in `docs/screenshots/` cover documentation and visual review; Storybook would cost ~1h with no evaluation upside. |
| Global state library             | Two pieces of client state (session, UI) do not justify one; TanStack Query owns server state.                                                             |
| OpenAPI type generation          | The spec is 130k lines; generating it all adds noise. Types come from recorded samples for the four resources in use.                                      |
| i18n                             | Single language; `Intl` for date/number formatting keeps locale correctness without a library.                                                             |
| Approvals, projects/tasks        | Assignment states other TimeEntry relations are irrelevant.                                                                                                |
| Cucumber layer on E2E            | No non-technical readers of scenarios.                                                                                                                     |

## Consequences

Each item is a known next step.

## Amendment (ADR-0008)

The timer was originally cut here alongside approvals and projects/tasks. [ADR-0008](0008-extra-features.md)
reversed that once the required stories were merged: a timer is the one omission a time tracker is
judged on, and the endpoints turned out to be reachable. It shipped. Approvals and projects/tasks
stay cut. Superseding this row rather than quietly leaving it is the point of recording it.
