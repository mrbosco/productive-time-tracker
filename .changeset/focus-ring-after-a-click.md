---
'tracktive': patch
---

Stop a focus ring being left behind on whatever opened a menu or dialog.

Closing an overlay by clicking outside it drew an accent ring on the control that had opened it -
the account menu, an entry's actions, the delete confirmation, the date picker - with nothing on
screen to explain why that control was suddenly outlined.

Returning focus to the trigger is correct and stays: without it, dismissing a dialog would drop a
keyboard user at the top of the document. What was wrong is that the ring came with it. Chrome
counts every focus moved by code as keyboard-driven, so the ring appeared whether or not a keyboard
was involved. It is now suppressed while the last thing the user did was point, and the next key
press brings it straight back. Text fields keep theirs either way.
