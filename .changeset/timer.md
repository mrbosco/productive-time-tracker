---
'tracktive': minor
---

Track time as it happens, with a timer in the app bar.

`Start timer` runs against your default service and shows the elapsed time on every screen, in the
bar and in the browser tab, so a timer left running in a background window is still visible. It
survives a refresh: the running indicator is back before the app has finished asking the API about
it. `s` stops it from anywhere, and so does the pill itself.

Starting a timer puts its entry on today immediately, as `0h`, because that is what Productive does
— the timer and the entry are one thing. Stopping opens a sheet with the tracked minutes and the
time it ran, where the duration can be corrected and the work described; saving edits that entry
rather than adding a second one, and `Discard` removes it. A timer stopped inside a minute really
does come back as `0h`, since whole minutes are all that is stored, which is why the duration is
editable there.

The row a timer is running against says so: an indigo edge, a `Tracking` label beside a breathing
dot, a duration that counts up live, and a stop control of its own — the app bar can be scrolled a
long way from it on a full day, and both stop the same timer.

An entry's menu gains `Continue timer`, and it is a real continuation: the timer attaches to that
entry, so the row you clicked is the row that counts up — on its own day, from the time it already
holds — and stopping adds to it rather than leaving a second entry beside it. Discarding a
continuation puts the entry back to what it held; discarding a timer you started from the bar
deletes the entry it created. Only one timer runs at a time, so the item is greyed out while one is
going.
