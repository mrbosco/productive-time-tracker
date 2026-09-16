# Productive Time Tracker — design handoff

Source of truth for the visuals is the **Productive Time design system** (Figma file
"Productive — Time, redesigned" + productive.io brand guidelines). Everything below was
designed against its tokens; nothing was invented except the four semantic colours marked
_derived_ and the duration format, both explained under "Decisions that differ from the brief".

Files in this project:

The authoritative source is the Claude Design project **"Design system accent conflicts"**
(`1292b384-b318-467c-a2b9-1d92d5629a33`), read through the design MCP. `Login.dc.html` is a board;
the markup it renders lives in `TimeTracker.dc.html` under `screen="login"`, and the tokens under
`_ds/productive-time-design-system-.../`. When a PNG and that source disagree, the source wins —
the PNGs are exports, and two of the sizing rules above were wrong because they were read off one.

| File                        | What it is                                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mobile Prototype.dc.html`  | The clickable mobile prototype at 390 × 844. Primary deliverable.                                                                                                                                  |
| `TimeTracker.dc.html`       | The screen component every deliverable renders. State is prop-driven (`screen`, `device`, `dayState`, `overlay`, `timer`, `banner`, `toast`, `formMode`, `formErrors`, `loginState`, `editState`). |
| `Screens Board.dc.html`     | Flat board: every screen and state side by side, mobile 390 and desktop 1440.                                                                                                                      |
| `Component Sheet.dc.html`   | Every component from section 4, once per state, captioned.                                                                                                                                         |
| `docs/design/screens/*.png` | Exports, named per the brief.                                                                                                                                                                      |
| `docs/design/screens/implemented/*.png` | The built screens, captured from the running app at 390 and 1440. Evidence for a pull request, not a design source - where one disagrees with the design, the design wins. |

## 1. Design tokens

Paste into a Tailwind `@theme` block. Values resolve to the design system's
`tokens/brand.css` + `tokens/fig-tokens.css`; the right-hand column names the design-system
variable so the two stay in sync.

```css
@theme {
  /* Colour — surfaces and ink */
  --color-canvas: #f8f7fb; /* --bg      page ground */
  --color-surface: #ffffff; /* --surface-2  cards, app bar, sheets */
  --color-subtle: #efedf5; /* --subtle  skeletons, quiet fills, key caps */
  --color-line: #e2dfec; /* --border  1px hairline, the only structure */
  --color-ink: #111111; /* --text */
  --color-muted: #6b687a; /* --muted-2  meta text, labels, captions */

  /* Colour — accent (one accent, one accented object per view) */
  --color-accent: #5d2bff; /* --accent  indigo: primary fill, links, focus */
  --color-accent-dark: #2d00ad; /* --indigo-dark  text on the selection wash */
  --color-selection: #efeaff; /* --selection  selected day, timer pill, avatar */
  --color-on-accent: #ffffff; /* --on-accent */

  /* Colour — semantic (derived: the design system publishes no semantics) */
  --color-danger: #b3261e; /* destructive text, border, Delete button */
  --color-danger-bg: #fdf2f2;
  --color-danger-border: #f0cfcc;
  --color-warning-fg: #8a5a12; /* activity banner icon */
  --color-warning-ink: #6b4406; /* activity banner text */
  --color-warning-bg: #fdf6e7;
  --color-warning-border: #efdcb2;
  --color-success: #157a52; /* toast check only */

  /* Type — Inter (brand typeface); tabular numerals on every duration */
  --font-sans: "Inter", system-ui, sans-serif;
  --text-display: 32px; /* board and desktop screen titles, 700, -.02em */
  --text-title: 22px; /* screen titles, 700 */
  --text-duration: 17px; /* entry card duration, 500, tabular */
  --text-base: 16px; /* mobile body, inputs, menu items */
  --text-list: 15px; /* desktop lists, notes, buttons */
  --text-meta: 14px; /* summary line, dialog body */
  --text-label: 13px; /* field labels, pills, helper text */
  --text-caption: 12px; /* service meta, week-cell totals, footnotes */
  --text-micro: 11px; /* week-cell weekday and total on mobile */

  /* Space — 4 / 8 / 12 / 16 / 24 / 32 / 48 (design system scale) */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  /* gutters: 16 mobile, 48 desktop · card padding 16–20 · field gap 22 · label-to-field 6 */

  /* Radius — semantic, not a scale */
  --radius-input: 12px; /* inputs, menus, popovers, toasts, key caps */
  --radius-entry: 20px; /* entry cards, dialogs, list states */
  --radius-panel: 28px; /* login card, bottom sheets */
  --radius-pill: 999px; /* every button and pill */

  /* Elevation — hairlines carry structure; shadow only for overlays */
  --shadow-menu: 0 8px 24px rgba(17, 17, 17, 0.12);
  --shadow-popover: 0 10px 30px rgba(17, 17, 17, 0.14);
  --shadow-dialog: 0 12px 40px rgba(17, 17, 17, 0.2);
  --shadow-fab: 0 6px 20px rgba(93, 43, 255, 0.3);

  /* Motion */
  --ease-ui: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-ui: 140ms; /* colour and background only */
}
```

Sizing rules used everywhere: tap targets 44px minimum (icon buttons are 44 × 44 even when
the glyph is 18–20px), primary buttons **52px at every width** — the desktop screens centre the
mobile card rather than resizing its controls — FAB 56px, app bar 56px mobile / 64px desktop,
week cell 56 × 68 mobile / 88px tall desktop. Focus is a 2px `--color-accent` outline at 2px
offset on every focusable element, including entry cards.

Input height is **per screen, not global**: 52px on Login, 56px in the entry form, 48px in the
compact rows. Take the height from the screen being built rather than from a single default.

## 2. Screens: what is reference, what is placeholder

| File                                                 | Reference (build this)                                                                               | Placeholder                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `01-login-mobile.png`                                | Card, field order, show/hide toggle, disabled primary until both fields are filled, footer line      | —                                                 |
| `01-login-mobile-submitting.png`                     | In-button spinner, label "Logging in"                                                                | Masked token value                                |
| `01-login-mobile-error.png`                          | Error banner position and treatment inside the card                                                  | Which of the three messages shows                 |
| `01-login-desktop.png`                               | Same card centred on the 1440 canvas                                                                 | —                                                 |
| `02-day-mobile-data.png`                             | Full day layout, order of blocks, entry card anatomy                                                 | Entries, services, person, 3h 45m totals          |
| `02-day-mobile-loading.png`                          | 3 skeleton cards + skeleton week strip; no strip totals while loading                                | —                                                 |
| `02-day-mobile-empty.png`                            | One sentence + `Add entry` + `Copy from yesterday`; no illustration                                  | Presence of yesterday's entries (drives the link) |
| `02-day-mobile-error.png`                            | Message + `Retry`                                                                                    | —                                                 |
| `02-day-mobile-timer-banner.png`                     | Amber activity banner above the list, two actions + dismiss; running timer pill                      | 15-minute threshold copy                          |
| `02-day-mobile-menu.png`                             | Kebab menu items and the separated destructive item                                                  | —                                                 |
| `02-day-mobile-calendar.png`                         | Calendar popover from the date label                                                                 | September 2026 only; no month navigation wired    |
| `02-day-mobile-avatar.png`                           | Avatar menu: person, `Default service…`, `Log out`                                                   | Name and email                                    |
| `02-day-desktop-data.png`                            | Two-column layout, full-width week strip, totals-by-service card, header `Add entry`                 | Service names and totals                          |
| `02-day-desktop-timer.png`                           | Toast bottom-right on desktop, running timer in the app bar                                          | —                                                 |
| `03-new-entry-mobile.png`                            | Three fields in order, live duration preview, helper caption, read-only meta line, sticky bar        | Date value, service name                          |
| `03-new-entry-mobile-range.png`                      | P-2 toggle swapping duration for From / To with the computed preview                                 | —                                                 |
| `03-new-entry-mobile-errors.png`                     | Field error treatment, API error banner above the buttons, error toast                               | Which validation message fires                    |
| `03-new-entry-desktop.png`                           | Same form, 560px column, buttons inline bottom-right instead of sticky                               | —                                                 |
| `04-edit-entry-mobile.png`                           | Prefilled form, title `Edit entry`, primary `Save changes`, destructive `Delete entry` at the bottom | Entry content                                     |
| `04-edit-entry-mobile-loading.png`                   | Field-shaped skeletons                                                                               | —                                                 |
| `04-edit-entry-mobile-notfound.png`                  | Sentence + link to today                                                                             | —                                                 |
| `05-global-confirm-delete.png`                       | Dialog copy, duration + first note line, destructive right                                           | Entry shown                                       |
| `05-global-toasts.png`, `05-global-toast-copied.png` | Toast anatomy, bottom-centre on mobile, success and error icons                                      | Counts in the copy                                |
| `05-global-default-service.png`                      | Bottom sheet, one select, helper line                                                                | Service list                                      |
| `05-global-default-service-desktop.png`              | Same as a right side sheet at 420px                                                                  | Service list                                      |
| `05-global-shortcuts.png`                            | Key / action rows, desktop side sheet, `?` opens it                                                  | —                                                 |
| `05-global-stop-timer.png`                           | Sheet title `Save tracked time`, duration prefilled from elapsed, tracked-from line                  | 42m sample, 09:18–10:00                           |
| `05-global-404.png`                                  | Sentence + link to today                                                                             | —                                                 |
| `06-components.png`                                  | All components × states with captions                                                                | Sample copy throughout                            |

## 3. Decisions that differ from the brief

1. **Accent is the design system's indigo `#5D2BFF`**, not the brief's `#6E3FF3` — confirmed
   with the requester. The rest of the palette (canvas, surface, line, muted, selection wash)
   comes from the same token set.
2. **Duration format stays the brief's** `1h 30m` / `45m` / `0h`. The design system writes
   durations as `05:00`; the brief's format wins because it is a hard requirement, and the
   parser accepts `1h 30m`, `1:30`, `1.5h`, `90`.
3. **shadcn/ui primitives are the implementation target, not the visual reference.** Each
   component here maps to one: Button → pill, Input / Textarea, Card → entry card,
   Dialog → confirm, Sheet → default service / shortcuts / stop timer, Popover + Calendar →
   date picker, Toast, DropdownMenu → kebab and avatar, Skeleton → loading. Restyle the
   shadcn defaults with the tokens above rather than using them as-is.
4. **Icons are the design system's own solid monochrome paths**, drawn inline at 18–20px inside
   44px targets and painted with `currentColor`. No CDN icon set. This reverts an earlier decision
   to standardise on `lucide-react`: that call was made from the PNG exports, before the design
   source was available. The source draws every glyph as a filled path, and the design system's
   readme is explicit that a stroked set reads wrong beside the solid play triangle. `lucide-react`
   is still installed because `components.json` points shadcn at it, but nothing imports it.
5. **Semantic colours are derived.** The design system publishes no success / warning /
   danger colours (its green and lime both resolve to indigo). The four above are additions
   and are used only where the brief demands them.
6. **Week strip**: the `past workday, nothing logged` cell (muted `—`) appears only on the
   component sheet — the sample week (Mon 14 – Sun 20, today Tue 15) has no past workday
   without entries.

## 4. Not designed

- Timesheet grid, calendar view, projects and tasks, approvals, multiple organizations,
  dark mode, illustrations (out of scope in the brief).
- Service picker itself: the default-service select shows the closed control only; the option
  list, search and `Project · Service` tree are not designed.
- Calendar popover month navigation, keyboard grid behaviour and out-of-month days.
- Quick add parsing feedback (P-1 is designed collapsed only, per the brief).
- Entry-level `Continue timer` state on the card (the timer surfaces in the app bar only).
- Real 404 route chrome: the 404 renders without the app bar.
- Roving focus visuals between cards beyond the focus ring (`↑` `↓` behaviour is specified
  in the shortcuts sheet but the intermediate states are not drawn).
