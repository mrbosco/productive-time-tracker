<!--
Title: type(scope): subject (US-n)   e.g. feat(time-entries): add entry form (US-2)
Scopes: .claude/rules/git.md. Sections below are guidebook rule 28 - keep all six.
Use US-n, never UC-n.
-->

## Summary

What this adds, in two or three sentences.

## Reasoning

Why this approach. Alternatives rejected and why. Cite the ADR if one governs it.

## Spec and design

- Story: US-n
- Feature:
- Route: `/...`
- Screens: mobile and desktop captures of the change

## Screenshots

Both viewports are required (N-4).

| Mobile (390px) | Desktop |
| -------------- | ------- |
|                |         |

## Test plan

- Unit:
- Component: loading, empty, error, data
- E2E: `e2e/....spec.ts`, both projects
- Manual smoke against the real API (e2e is MSW-only, ADR-0003):

## Open questions

Anything you want the reviewer to decide. "None" is a valid answer.

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all green
- [ ] Changeset added (every behaviour change, guidebook 31)
- [ ] Docs updated if behaviour changed
- [ ] No token, organization ID or other secret in the diff
- [ ] `US-n` / `R-n` / `X-n` / `P-n` in the title and in every `Refs:` footer
