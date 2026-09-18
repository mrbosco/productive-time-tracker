---
'tracktive': patch
---

Refetch the week after a failed duration edit, not only a successful one.

The optimistic write cancels whatever week fetch is in flight before it writes, and a cancel reverts
rather than resumes - so a first fetch dropped there had nothing left to finish it, and invalidating
on success alone left a day behind a failed save on its loading skeleton until the route changed. The
duration restored by the rollback was also of unknown age and was never read again. Both weeks are
now invalidated after either outcome, which is what deleting has always done.

The week total also carries a role that can hold its accessible name. Its two children are hidden
from assistive technology and ARIA forbids naming a bare `div`, so the label was being dropped and
the total reached a screen reader as nothing at all. The login wordmark goes back to an empty `alt`:
the heading underneath already says the name.
