# Diagrams

Mermaid sources for the app's structure. GitHub renders Mermaid inside fenced code blocks in
Markdown, not in a bare `.mmd` file, so these are read either in an editor with a Mermaid preview or
by pasting the source into a ```` ```mermaid ```` block.

| File                       | What                                                   |
| -------------------------- | ------------------------------------------------------ |
| `01-use-cases.mmd`         | Use-case overview: actor, use cases, include relations |
| `02-domain-model.mmd`      | Entity relationships from the assignment               |
| `03-login-sequence.mmd`    | Token + org ID resolve to a Person                     |
| `04-day-crud-sequence.mmd` | List, create, edit, delete with cache invalidation     |
| `05-navigation.mmd`        | Route map                                              |

`UC-n` in `01-use-cases.mmd` numbers the assignment's user stories in order: login, view a day, add,
edit, delete.
