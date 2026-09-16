# ADR-0008: Extra features and the activity-awareness heuristic

Status: accepted (2026-09-15)

## Context

The evaluation explicitly says CRUD alone is incomplete. The assignment allows additions that the Productive API supports. The budget is 10 hours, so extras must be small, independent and cuttable.

## Decision

Implement, after all required stories are merged and in this order: X-1 week strip with totals, X-2 keyboard shortcuts, P-2 start/end range mode, X-3 duplicate and copy-from-yesterday, X-4 timer, X-5 activity awareness while a timer runs, P-1 quick add line. Scope of each is defined in SPEC section 10 (refined by the competitive analysis). Each is one PR and one changeset; any can be dropped, and P-1 is cut first.

## Rationale

- X-1 to X-3 reuse existing endpoints and components; each is under 45 minutes.
- X-4 uses Productive's own timer resource, showing the API was explored beyond the four listed calls.
- X-5 addresses the product's purpose (billing clients from tracked time) with a client-only heuristic. It is framed as a nudge to the user, not as reporting: nothing is sent to the API, the timer is never stopped automatically, and the banner offers a choice.

## Constraints on X-5

- Idle detection is on by default and gated on tab visibility; the synthetic-input heuristic is implemented and tested but off by default behind a config flag, because Harvest and Toggl explicitly position themselves against input monitoring and the same applies to a client-facing product.
- Heuristic only, false positives acknowledged in the UI copy and in the spec.
- Thresholds exposed as configuration (guidebook rule 13), defaults conservative (15 minutes idle; synthetic score needs both regular intervals and near-zero displacement).
- The monitor is mounted only while a timer runs and unmounts with it; no listeners otherwise.
- Unit-tested with recorded synthetic and human-like event streams.

## Consequences

- Adds roughly 3 hours if all five ship; the README states which ones shipped.
- X-5 is a talking point for the technical interview: intent, limits and why it is not surveillance.
