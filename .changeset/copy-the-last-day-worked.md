---
'tracktive': patch
---

Offer to copy the last day that was worked, not whichever day happens to be before this one.

An empty Sunday offered to copy Saturday, and on an empty Saturday that is an offer to copy nothing -
the day worth copying was Friday. The empty state now names the most recent day in the week on screen
that has time on it, and the copy takes that day. The week is already loaded for the strip, so this
costs no request; a week with nothing earlier in it still offers the day before, as before.
