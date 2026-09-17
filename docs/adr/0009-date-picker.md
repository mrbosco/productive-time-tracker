# ADR-0009: react-day-picker for the date picker

Status: accepted (2026-09-16)

## Context

A-3 fixes the date navigation for the day view: previous/next day buttons around a label in words, and **the label opens a calendar popover**. The popover is a month grid.

ADR-0006 already named "Calendar/DatePicker" among the shadcn primitives to copy in, but shadcn's `calendar` is a wrapper: the grid, the month arithmetic and the keyboard model come from `react-day-picker`, which is not installed. Nothing else in the tree can draw a calendar. `docs/adr/0005-scope-cuts.md` cut i18n in favour of `Intl`, and this project records an ADR before any dependency is added, so the choice is recorded here rather than made silently by `shadcn add`.

Three options were considered: a native `<input type="date">` opened with `showPicker()`, a hand-built month grid on the Radix Popover already in the tree, and shadcn's `calendar`.

## Decision

`shadcn add popover calendar`, which adds **`react-day-picker@10`** as the only new direct dependency. It brings `date-fns@4` and `@date-fns/tz` transitively.

`Popover` costs nothing new: the unified `radix-ui@1.6.7` package already bundles `@radix-ui/react-popover`. Both components are copied into `src/components/core` and edited there (guidebook 16) - lucide chevrons swapped for the design system's own inline paths, shadcn's `bg-accent`/`bg-muted` rewritten to this project's `-surface` names.

## Rationale

- The calendar is the one piece of this UI with a genuinely non-trivial accessibility contract: a grid with roving focus, `aria-selected`, month announcements, Home/End/PageUp/PageDown. `react-day-picker` implements it and is tested; hand-writing it would be ~120 lines of date arithmetic plus a keyboard model, for a screen that already has to ship four list states.
- It is the same trade already accepted for Radix in ADR-0006: buy the accessible primitive, style it locally.
- The popover renders identically on both breakpoints, so one component serves mobile and desktop (N-4).

## Rejected: native `<input type="date">`

The laziest option, and genuinely attractive - zero dependencies, and mobile gets the OS picker. Rejected because the trigger is not a plain field: A-3's control is a **words label** (`Today, Tue 15 Sep`) that the design gives a dropdown affordance, and `showPicker()` can only be called from a user gesture on a visible-or-hidden input whose popup position the app does not control. The result would sit somewhere other than where the design puts it, and would look like a different control on every platform - against N-3.

## Rejected: hand-built grid on Radix Popover

No new dependency, but it reimplements the accessibility contract above by hand and needs its own test suite. The saving is one dependency; the cost is the most bug-prone widget on the screen.

## Rejected: importing `date-fns` directly

`date-fns` now sits in the tree as a transitive dependency, so `lib/date.ts` could use its `addDays`/`format` instead of being hand-written. Not done: a transitive dependency carries no version guarantee and is not declared in `package.json`, so importing it would break the moment `react-day-picker` changed its own dependency. `lib/date.ts` stays on `Intl` per ADR-0005, which is also what keeps A-6 ("never convert through UTC") under this project's own control rather than a library's.

## Consequences

- One new direct dependency and two transitive ones, in a project that has otherwise added none since the scaffold. Dependabot already covers them.
- `lucide-react` still has no importer: the generated calendar's icons are replaced on copy-in, as the design README requires.
- US-2's date field reuses `shared/DatePicker`, so the cost is amortised over two stories.
