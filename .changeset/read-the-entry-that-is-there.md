---
'tracktive': patch
---

Read the entry a form opens on, rather than whatever the cache still holds.

`ensureQueryData` returns cached data however old it is, so an entry changed in Productive itself, or
in another tab, opened the edit form on the values from before that change - and a duplicate started
from them. Both form loaders now use `fetchQuery`, which honours the client's 30-second staleness:
reopening a form straight after closing it still costs no request, and anything older is read again.

An inline duration correction also cancels any week fetch already in flight before it writes, the way
deleting already did - an answer landing afterwards put the old number back. Its rollback now restores
that one duration instead of the whole week as it was, so a row deleted while the correction was in
flight no longer reappears when the correction fails.
