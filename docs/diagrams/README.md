# Diagrams

Mermaid sources (`.mmd`) render natively on GitHub and in the published SPEC. Use-case IDs (UC-n) match `docs/SPEC.md` requirement IDs.

| File                       | What                                                   |
| -------------------------- | ------------------------------------------------------ |
| `01-use-cases.mmd`         | Use-case overview: actor, use cases, include relations |
| `02-domain-model.mmd`      | Entity relationships from the assignment               |
| `03-login-sequence.mmd`    | Token + org ID resolve to a Person                     |
| `04-day-crud-sequence.mmd` | List, create, edit, delete with cache invalidation     |
| `05-navigation.mmd`        | Route map                                              |

Note: `UC-n` in `01-use-cases.mmd` maps 1:1 to `US-n` in SPEC 2.1. `US-n` is the canonical form used in commits, PR titles and tests.
