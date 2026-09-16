# Design brief: Productive Time Tracker

Input for Claude Design. Status: final (Phase 1 + research folded in). Everything below is a hard requirement unless marked "nice to have".

## 0. What to produce and how it is handed off

Produce, in this order:
1. **Mobile prototype at 390 px** for the four screens and all global states listed in section 3. This is the primary deliverable (assignment: must be usable on a mobile device).
2. **Desktop variant at 1280 px** for Day view and the entry form (Login and Edit reuse the mobile layout centered).
3. **Component sheet**: every component from section 4 rendered once in each of its states, with a caption naming the component and the state.
4. **Design tokens**: a list of the colours, spacing steps, radii and type sizes used, as CSS custom property names and values, so they can be pasted into a Tailwind `@theme` block.

Handoff format (this is what the coding agent will read):
- Export each screen and the component sheet as PNG into `docs/design/screens/` using the file names given in sections 3 and 4.
- Export the HTML/CSS of the prototype into `docs/design/prototype/` if the tool offers it.
- Write `docs/design/README.md` with: the token list from item 4, one line per screen stating what is reference and what is placeholder, and a "not designed" list.

## 1. Product context

A client-side web app that lets one person manage their Productive time entries for a selected day: log in with an API token and organization ID, see the entries for a date, add, edit (own route), delete (with confirmation). Reviewers judge UI/UX quality explicitly. Reference material: `docs/research/productive-app-analysis.md` (Productive's own screen) and `docs/research/competitive-analysis.md` (Harvest, Toggl). Borrow the patterns named there; do not copy Productive's layout or iconography.

## 2. Visual direction

- Tone: calm, dense enough for daily use, generous tap targets (min 44 px), looks like a screen inside a professional services tool.
- Palette: neutral near-white surface, one accent (violet, e.g. `#6E3FF3`), semantic green (success), red (destructive), amber (warning banner), muted grey for meta text. Contrast AA everywhere.
- Typography: Inter or system UI stack; 16 px base on mobile, 14 to 15 px in desktop lists; headings semibold; tabular numerals for durations.
- Radius 8 to 12 px, 1 px borders, minimal shadows, no gradients.
- Components are shadcn/ui primitives: Button, Input, Textarea, Card, Dialog, Sheet, Popover + Calendar, Toast, DropdownMenu, Skeleton. Design within those.
- No dark mode.
- Duration format everywhere: `1h 30m`, `45m`, `0h` (never `00:00`, never decimals).

## 3. Screens

### 3.1 Login (`/login`) - files `01-login-mobile.png`, `01-login-desktop.png`
Goal: enter credentials, get in.
- Centered card: app name "Productive Time Tracker", one line "Find these under Settings > API integrations in Productive."
- Fields: API token (password type, show/hide toggle), Organization ID (numeric keyboard on mobile).
- Primary button `Log in`, disabled until both fields are filled.
- States: idle; submitting (spinner in button); error banner inside the card with one of: "Invalid API token", "This token is not a member of organization 1234", "Network error. Try again."
- Footer: "Credentials are stored in this browser only. Log out to remove them."

### 3.2 Day view (`/day/:date`) - files `02-day-mobile-*.png`, `02-day-desktop-*.png`
The main screen. Mobile is a single column, list first.

App bar
- Left: app name (short: "Time Tracker"). Right: timer control (X-4), `?` shortcuts button (desktop only), avatar menu (person name, `Default service...`, `Log out`).
- Timer control states: `idle` = pill button "Start timer"; `running` = pill with pulsing dot, elapsed `0:42`, and a stop icon.

Date navigator
- `‹` and `›` icon buttons around a label in words: `Today, Tue 15 Sep`; `Yesterday, Mon 14 Sep`; otherwise `Wed 10 Sep 2026`. Tapping the label opens a calendar popover.
- A text-labelled `Today` button, hidden when today is selected.

Week strip (X-1)
- 7 cells Mon..Sun around the selected date plus an 8th `Week` total cell. Each cell: weekday initial, day number, total.
- Cell states to design: `selected` (accent underline, bold), `logged` (bold total), `past workday, nothing logged` (muted `—`), `weekend or future` (muted `0h`), `today marker` (small dot).
- Horizontally scrollable on mobile with the selected cell centered; full width on desktop.

Day summary
- One line: `3h 45m logged · 3 entries`. Desktop: a right-hand card also listing totals grouped by service.

Quick add (P-1, nice to have, design it collapsed)
- One input above the list, placeholder `Quick add: 1.5h client call yesterday`, with a helper caption "Opens the form prefilled". Nothing else.

Entry list
- One card per entry: duration prominent left (`1h 30m`), note as multiline text (preserve line breaks, clamp at 3 lines with `More`), service name as muted meta line. Right: kebab menu.
- Kebab menu items: `Edit`, `Continue timer`, `Duplicate`, `Delete` (destructive, separated).
- Cards are focusable (visible focus ring) because keyboard navigation moves between them.
- Primary action: `Add entry` floating button bottom-right on mobile; header button on desktop.

States (each is a separate file)
- `loading`: 3 skeleton cards and a skeleton week strip. File `02-day-mobile-loading.png`.
- `empty`: one sentence "Nothing logged for this day yet." plus `Add entry` button plus, when yesterday has entries, a secondary link `Copy from yesterday`. No illustration alone. File `02-day-mobile-empty.png`.
- `error`: message "Could not load entries." plus `Retry`. File `02-day-mobile-error.png`.
- `data`: three entries, one with a long multiline note. Files `02-day-mobile-data.png`, `02-day-desktop-data.png`.
- `timer running` with the activity banner (X-5) above the list: soft amber, icon, "The timer is running but we have not seen activity for 15 minutes." Buttons `Pause and discard idle time` (primary) and `Keep running` (ghost). Dismiss icon. File `02-day-mobile-timer-banner.png`.

### 3.3 New entry (`/entries/new?date=`) - files `03-new-entry-mobile.png`, `03-new-entry-desktop.png`
Exactly three fields, in this order.
- `Date`: button showing `Tue 15 Sep 2026`, opens calendar popover; prefilled from the route.
- `Duration`: text input, placeholder `1h 30m`, live preview to the right `= 1h 30m` (or `= 90 min`), helper caption "Accepts 1h 30m, 1:30, 1.5h or 90". A small toggle `Enter start and end instead` (P-2) swaps the field for two time inputs `From` / `To` with the computed preview `= 1h 30m`.
- `Description`: textarea, 4 rows, autogrow, placeholder "What did you work on?".
- Read-only meta line below the fields: `Logging as Alem Tatarević · Service: Administrative work` (the service is not a field; it links to the Default service sheet).
- Buttons: `Save entry` primary, `Cancel` secondary; sticky bottom bar on mobile.
- States: field validation errors (duration required, must be more than 0 and at most 24h; end before start); API error banner above the buttons; submitting. File `03-new-entry-mobile-errors.png`.

### 3.4 Edit entry (`/entries/:id/edit`) - file `04-edit-entry-mobile.png`
Same layout as New entry, prefilled, title `Edit entry`, primary `Save changes`, plus a destructive `Delete` text button at the bottom that opens the confirm dialog. Extra states: loading skeleton; not found ("This entry no longer exists." plus link to today). File `04-edit-entry-mobile-notfound.png`.

### 3.5 Global - files `05-global-*.png`
- Confirm delete dialog: title `Delete this entry?`, body shows duration and the first line of the note, `Delete` destructive + `Cancel`. `05-global-confirm-delete.png`
- Toasts: bottom-center on mobile, bottom-right on desktop: `Entry saved`, `Entry deleted`, `3 entries copied from yesterday`, error variant. `05-global-toasts.png`
- Default service sheet (from the avatar menu): bottom sheet on mobile, side sheet on desktop; one select `Default service` listing services as `Project · Service`; helper "Used for new entries and the timer." `05-global-default-service.png`
- Shortcuts sheet (`?`): two-column list of keys and actions (`n` new entry, `←` `→` previous/next day, `t` today, `↑` `↓` move between entries, `e` edit, `Del` delete, `s` stop timer, `?` this sheet, `Esc` close). `05-global-shortcuts.png`
- Stop-timer sheet: opened when the timer stops; same form as New entry prefilled with elapsed minutes, title `Save tracked time`. `05-global-stop-timer.png`
- 404: "Page not found" plus link to today.

## 4. Component sheet - file `06-components.png`
Render each once per state, captioned:
AppBar (idle timer, running timer) · TimerButton (idle, running, stopping) · DateNavigator (today, past day) · WeekStrip cell (selected, logged, past-empty, weekend, future, today-marker) · DaySummary · QuickAddInput · TimeEntryCard (short note, long note clamped, focused, with menu open) · TimeEntryList empty / error / loading · TimeEntryForm (duration mode, range mode, with errors) · DurationField (empty, valid with preview, invalid) · ConfirmDialog · ActivityBanner · Toast (success, error) · SettingsSheet · ShortcutsSheet · LoginForm (idle, error).

## 5. Navigation
`login → day → (new | edit) → day`; delete stays on day behind the dialog; timer stop opens the stop-timer sheet on the current route.

## 6. Out of scope
Timesheet grid, calendar view, projects and tasks, approvals, multiple organizations, dark mode, illustrations.
