---
'tracktive': minor
---

Write descriptions the way Productive does.

The description field is a real editor now. Start a line with `- ` and it becomes a bullet list,
`1. ` an ordered one, and Ctrl/Cmd+B, I and Shift+X bold, italicise and strike the selection. What
you write is stored as the same HTML Productive's own editor produces, so an entry written here
opens unchanged there.

Entries written in Productive read correctly too. A description saved as a list is drawn as a list
on the day view instead of being flattened to a line, and opening one to edit no longer quietly
throws its formatting away on save.

Nothing from the API is ever trusted as markup: the card renders an allowlist of tags as elements
and drops everything else, and the editor keeps only what its own schema defines, so a note
carrying a script tag arrives as prose.
