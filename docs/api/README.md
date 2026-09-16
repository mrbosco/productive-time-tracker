# Productive API notes (Phase 1 extract; Phase 4 verifies against the live API)

Sources: `api-master.yaml` (OpenAPI 3.1, kept out of the repo because of size; link in README) and https://developer.productive.io/reference/resources/time-entries

## Auth and headers

- `X-Auth-Token: <token>` (OpenAPI securitySchemes.header_token)
- `X-Organization-Id: <id>` (required on every endpoint, parameter `header_organization`)
- `Content-Type: application/vnd.api+json` for POST/PATCH
- Base URL: `https://api.productive.io/api/v2`

## Endpoints in use

| Purpose                     | Method + path                                                       | operationId                    |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| Resolve person              | `GET /organization_memberships`                                     | organization_memberships-index |
| List entries                | `GET /time_entries` (filters: `person_id`, `after`, `before`; sort) | time_entries-index             |
| Read one                    | `GET /time_entries/{id}`                                            | time_entries-show              |
| Create                      | `POST /time_entries`                                                | time_entries-create            |
| Update                      | `PATCH /time_entries/{id}`                                          | time_entries-update            |
| Delete                      | `DELETE /time_entries/{id}`                                         | time_entries-destroy           |
| Services (for `service_id`) | `GET /services`                                                     | services-index                 |

## TimeEntry shape

- attributes: `date` (YYYY-MM-DD), `time` (integer minutes), `note` (string), plus many read-only fields
- required on create: `service_id`, `person_id`, `date`, `time` (OpenAPI `requestBodies.time_entry`)
- relationships used: `person`, `service`

## Filters

`filter` is a deepObject query param: `filter[person_id]=123&filter[after]=2026-09-15&filter[before]=2026-09-15`. Operator objects (`eq`, `not_eq`, ...) exist; plain values are accepted. Pagination: `page[number]`, `page[size]`; `meta.total_pages` in responses.

## Observed in Productive's own web app (2026-09-15)

- Day list: `GET /time_entries?filter[person_id]=P&filter[with_draft][eq]=true&filter[date][gt_eq]=D&filter[date][lt_eq]=D&include=…&page=1&per_page=200`
- Running timer: `GET /timers?filter[stopped_at][eq]=&filter[person_id]=P&include=time_entry&per_page=1`; timers link to a time entry
- Services: `GET /services?include=deal.@,section.@,service_type.@…`; suggestions via `GET /service_suggestions`
- Week totals: `GET /timesheet_reports` (we compute client-side instead)

## To verify in Phase 4 (record samples into `docs/api/samples/`)

1. Exact response of `GET /organization_memberships` including `relationships.person` (and whether `include=person` is needed for the name).
2. Whether `after`/`before` are inclusive for a single-day query.
3. How to list services the person may track time on (filter name), and the 422 error body when `service_id` is missing.
4. 401 vs 403 bodies for a bad token vs a wrong organization.
5. Whether `after`/`before` behave like `date[gt_eq]`/`date[lt_eq]`; whether `page[size]` or `per_page` is the accepted pagination param on this API version (the web app sends `per_page`).
6. Timer resource: how a timer is started for a service/time entry (`POST /timers` body) and stopped (`/timers/{id}/stop`), and whether stopping writes `time` on the linked entry.
7. Whether `note` returned for UI-created entries contains HTML (A-9).
