# ADR-0005: Deliberate scope cuts under the 10-hour budget

Status: accepted (2026-09-15)

## Decision and rationale

| Cut                              | Why                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storybook                        | Component tests plus the Claude Design export in `docs/design/` cover documentation and visual review; Storybook would cost ~1h with no evaluation upside. |
| Global state library             | Two pieces of client state (session, UI) do not justify one; TanStack Query owns server state.                                                             |
| OpenAPI type generation          | The spec is 130k lines; generating it all adds noise. Types come from recorded samples for the four resources in use.                                      |
| i18n                             | Single language; `Intl` for date/number formatting keeps locale correctness without a library.                                                             |
| Timer, approvals, projects/tasks | Assignment states other TimeEntry relations are irrelevant.                                                                                                |
| Cucumber layer on E2E            | No non-technical readers of scenarios.                                                                                                                     |

## Consequences

Each item is a known next step and is listed in the README "What I would do with more time" section.
