---
'tracktive': patch
---

Stop the day jumping to the top when the entry form closes.

Opening the form already left the day exactly where it was, but every way back out of it - Cancel,
Escape, the backdrop, the close icon, a save, a delete - navigated without saying so, and the router
reset the scroll position. A day read halfway down snapped to the top on close. Saving an entry whose
date changed still lands at the top of the new day, which is the one case where the day underneath is
not the day you were reading.
