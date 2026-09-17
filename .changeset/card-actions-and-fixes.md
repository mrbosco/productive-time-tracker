---
'tracktive': minor
---

Rebuild the entry row's actions to the approved desktop design, and fix what was reported.

The duration is now a proper field where it sits — 112px, right-aligned, with the parsed result and
the nudge chips in a panel beneath it, its text selected on open so typing replaces rather than
appends. It refuses what the entry form refuses, in the same words, and Escape puts the original
back. Saving is optimistic, so the number changes at once instead of after a round trip. The play
button and the pencil now reserve their space at rest, so hovering a row no longer shifts the
column.

Both are a pointer's affordances: touch keeps `Continue timer` and `Edit` in the kebab, because
there is no hover to reveal a control and no room for a field beside the note.

Also fixed: the default-service search had two clear crosses and would not visibly change the
default when you picked one; the day's quick-add row vanished while the day reloaded around it; the
hover panels now open after a second on the week strip and straight away on a project name; the
timesheet lost its `Add row` and its per-cell count, and its totals sit on the middle of their rows.
