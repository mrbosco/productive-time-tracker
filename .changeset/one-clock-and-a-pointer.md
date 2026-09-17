---
'tracktive': minor
---

One clock, a pointer on everything clickable, and three smaller corrections.

A running timer now reads the same in all three places it appears - the app bar, the timesheet's
header pill, and the cell it is running in. Two of those were showing something else entirely: the
entry's stored total and the day's sum, so a timesheet with a timer on it printed three different
durations and left you to work out which one was the clock.

It is also written in units now - `9m 20s`, `1h 9m 20s` - because `9:20` on a timer and `9h 20m` on
the card below it are the same glyphs meaning wildly different amounts of time.

Every clickable thing has a pointer cursor again. Tailwind 4 leaves a `<button>` with the arrow
where v3 gave it a hand, and menu items shipped with `cursor-default` on top of that.

Also: the play button moved to the left of the duration, so the space it reserves at rest is
absorbed by the note rather than left as a hole beside the kebab; a tracking row's indigo edge is a
border rather than a bar, so it follows the row's rounded corners instead of poking out square; and
the quick-add row drops `Start` on any day but today, where a timer cannot sensibly run.
