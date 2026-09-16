# Productive: reverse-engineering notes (Time > My time)

Date: 2026-09-15. Source: productive.io/time-tracking marketing page and a live session in a trial organisation (app.productive.io/…/time/me), desktop 1568 px and mobile 390 px. Screenshots referenced below live in `docs/research/screenshots/` (see the mapping table at the end).

## 1. What Productive offers (marketing page)

Six entry modes: Daily (log after the fact), Weekly timesheets, Calendar (entries from Google/Outlook events), Desktop timer, Automatic tracking from scheduled bookings, tracking inside tasks. Around it: time approvals (approve / request changes), billable vs non-billable per service, profitability reports, Jira worklog sync. Their own "alternatives" pages name the competitors they benchmark against: Harvest, Scoro, Kantata, Teamwork, BigTime, Avaza, ClickUp, WorkflowMax, Accelo.

## 2. The "My time" screen, desktop (Day view)

- Header: `My time`, prev/next week arrows, week range picker, view switch **Day / Timesheet / Calendar**, `Work log`, settings gear.
- **Week strip** with a per-day total (`00:00`), the selected day underlined in violet, and a `Weekly total` column at the right. Weekends have a hatched background; today has a marker.
- Left column: **entry form** (service picker, time input `00:00` with a live `= 0h` preview, `Set range` toggle for start/end instead of a duration, rich-text note, buttons `Save` / `Start timer` / `Close`) and a **Suggestions** card ("Your services from Resourcing and recently tracked time will appear here").
- Right column: entry list or empty state ("There's no tracked time for 15 Sep, 2026 / Select the service you worked on, input the hours, or confirm a scheduled entry.").
- Service picker is a tree: Company > Project (budget) > Section > Service, each service showing `tracked / budgeted hrs` and a progress ring; search box; Collapse all / Expand all. A pin icon keeps a service on top.
- With `00:00` time the primary button becomes **Save as draft**; Productive allows zero-duration drafts.
- Entry card: service name + `Project: Section` breadcrumb, note, inline editable time input, a **play button** (timer for that entry) and a `•••` menu: Edit, Pin service, Duplicate, View timer logs, Delete.
- Edit opens a **modal** (Date, Service, Time with `= 0h` and `Set range`, Note, Save / Cancel / Delete). The modal state is in the URL: `?date=2026-09-15&time-entry-edit=162902366`.
- Delete has **no confirmation dialog**; it removes the entry immediately and shows a toast "Time entry deleted [UNDO]".
- Running timer shows elapsed time in the global header and turns the card's time input red with a stop icon and a "Stop timer" tooltip. Deleting the entry stops and removes the timer.
- Timesheet view: rows per pinned service, columns Mon..Sun with editable cells, `Add service` button, tabs Pinned / Scheduled / Recent.

## 3. Mobile (390 px)

- Top bar collapses to hamburger + search + timer/star/bell icons.
- Week strip becomes a horizontally scrollable row; `Weekly total: 00:00` line under it.
- Content is a single column; the entry form is hidden behind a **bottom sheet** with two buttons: `Manual entry` (primary) and `Suggestions`.

## 4. Network behaviour (what their Ember app actually calls)

Observed on load and interaction (URLs only; bodies are JSON:API):

| Call                                                                                                                                                                                         | Purpose                                  | Notes for our app                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /organization_memberships/{id}?include=user,person.…,organization.…`                                                                                                                    | session bootstrap                        | We only need `GET /organization_memberships` + `person` relationship                                                                                                         |
| `GET /time_entries?filter[person_id]=P&filter[with_draft][eq]=true&filter[date][gt_eq]=D&filter[date][lt_eq]=D&include=person.manager,approver,…,service.deal.company,…&page=1&per_page=200` | day list                                 | They filter by `date` range, not `after`/`before`; both exist in the schema. They include ~12 relationships; we include only `service`. Explicit `per_page` is a good habit. |
| `GET /timers?filter[stopped_at][eq]=&filter[person_id]=P&include=time_entry&page=1&per_page=1`                                                                                               | running timer, polled                    | Timers are a separate resource linked to a `time_entry`; empty `stopped_at` means running                                                                                    |
| `GET /services?include=…&page=1&per_page=1`, `GET /service_suggestions`                                                                                                                      | service picker and suggestions           | We need the list of services the person can track on; confirm the right filter in Phase 4                                                                                    |
| `GET /timesheet_reports`, `GET /reports/booking_reports`, `GET /holidays`                                                                                                                    | week totals, scheduled entries, holidays | We compute day/week totals client-side from one `time_entries` range query (X-1)                                                                                             |
| `GET /organization_membership_counts/{id}`, `GET /notifications`, `GET /custom_fields`, `GET /integrations`                                                                                  | badges, settings                         | out of scope                                                                                                                                                                 |
| `PATCH /users/{id}`                                                                                                                                                                          | persists the chosen view (Day/Timesheet) | we persist the selected view/date in the URL instead                                                                                                                         |
| `https://api.productive.io/api/preflight` (iframe), `/config`                                                                                                                                | app config                               | not needed                                                                                                                                                                   |
| Amplitude `POST`                                                                                                                                                                             | analytics                                | none in our app                                                                                                                                                              |

Session handling: the web app uses cookie/session auth for app.productive.io; the public API uses `X-Auth-Token` + `X-Organization-Id`, which is what our app must use.

## 5. What we adopt, adapt, or deliberately do differently

| Topic               | Productive                                                      | Our app                                                                                                 | Why                                                                  |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Date in URL         | `?date=YYYY-MM-DD`                                              | `/day/:date` path param, validated                                                                      | Same idea, typed at the route boundary (ADR-0007)                    |
| Edit state in URL   | `?time-entry-edit=ID` modal                                     | `/entries/:id/edit` own route                                                                           | Assignment requires its own route; deep-linkable and mobile-friendly |
| Week strip + totals | yes                                                             | yes (X-1), computed client-side                                                                         | Mirrors the product, one request per week                            |
| Delete              | immediate + toast with UNDO                                     | **confirm dialog** (assignment R-12) plus toast                                                         | Requirement wins; UNDO noted as a possible enhancement               |
| Time input          | masked `HH:MM` with `= Xh` preview, alternative start/end range | free-text duration (`1h 30m`, `1:30`, `90`) normalised to minutes with the same `= 1h 30m` live preview | Faster on mobile; keep the preview pattern                           |
| Zero-duration draft | allowed ("Save as draft")                                       | not allowed (validation: duration > 0)                                                                  | Assignment lists no draft concept; documented as A-8                 |
| Note                | rich-text (bullets), so `note` may arrive as HTML               | plain-text textarea; **sanitise / strip HTML when rendering notes created in Productive**               | Security and correctness (new A-9)                                   |
| Service             | tree picker + pin + suggestions                                 | default service resolved at login, changeable in Settings sheet (A-1)                                   | Assignment limits the form to three fields                           |
| Timer               | per-entry play button, global header indicator                  | X-4: start a timer for the default service, elapsed time in the app bar, stop creates/updates the entry | Same mental model, smaller scope                                     |
| Duplicate           | in card menu                                                    | X-3 in card menu                                                                                        | Mirrors the product                                                  |
| Mobile              | bottom sheet "Manual entry"                                     | floating "Add entry" button opening the New entry route                                                 | Same affordance, route instead of sheet                              |
| Empty state copy    | "There's no tracked time for {date}"                            | same tone                                                                                               |                                                                      |

## 6. Screenshot mapping

Copy the files from the temporary folder into `docs/research/screenshots/` with these names:

| Original (temp path)        | Save as                      | Shows                                               |
| --------------------------- | ---------------------------- | --------------------------------------------------- |
| screenshot-…-0.jpg          | `01-day-empty.jpg`           | Day view, empty state, week strip                   |
| screenshot-…-2.jpg          | `02-timesheet-empty.jpg`     | Timesheet view                                      |
| screenshot-…-3.jpg / -4.jpg | `03-service-picker-tree.jpg` | Service tree picker                                 |
| screenshot-…-5.jpg          | `04-timesheet-row.jpg`       | Timesheet with a pinned service row                 |
| screenshot-…-9.jpg          | `05-entry-form.jpg`          | Entry form with time, range, note, timer            |
| screenshot-…-11.jpg         | `06-entry-card.jpg`          | Saved entry card                                    |
| screenshot-…-15.jpg         | `07-entry-menu.jpg`          | Card menu: Edit, Pin, Duplicate, Timer logs, Delete |
| screenshot-…-16.jpg         | `08-timer-running.jpg`       | Running timer (card + header)                       |
| screenshot-…-17.jpg         | `09-edit-modal.jpg`          | Edit modal, URL with time-entry-edit                |
| screenshot-…-18.jpg         | `10-delete-undo-toast.jpg`   | Delete with UNDO toast                              |
| screenshot-…-19.jpg         | `11-mobile-day.jpg`          | Mobile layout with bottom sheet                     |
