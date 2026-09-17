---
'tracktive': minor
---

Tell the week strip's cells apart.

Every cell used to be drawn the same way, including the week total, which is not a day and cannot
be navigated to. A day nobody is expected to work now carries a hatched fill and a dashed border,
and the total sits in the selection wash as a panel with no border, no hover and no tab stop, over
the label it needed: `= 10h`, `Weekly total`.

The dash and the zero swapped meanings with it. A dash now means no work was expected on that day
and `0h` means it was and none of it is logged, which is the distinction the strip was missing - a
Saturday and a Tuesday you forgot to fill in used to look identical. The selected day takes the
tint the design system had been reserving for it all along, rather than resting on a 3px rule that
is easy to mistake for a neighbour's border.
