# ADR-0001: React 19 + Vite as the frontend framework

Status: accepted (2026-09-15)

## Context

The assignment allows any framework and requires a strong justification. The application is a pure client-side API consumer: no SSR, no SEO, no server-side technology allowed (N-1). Productive's product is built with Ember.js; the company's Front-End Development Guidebook (Infinum handbook) is React/Next.js oriented and lists React, TanStack Query, react-hook-form, Tailwind and shadcn/ui as the recommended stack.

## Decision

React 19 with Vite, TypeScript strict. Not Next.js, not Ember.

## Rationale

- Guidebook alignment: the handbook's component organisation (core/shared/features), naming rules, testing layout and library choices are React-based, so React lets the solution follow the guidebook literally rather than by analogy.
- Vite instead of Next.js: Next.js adds a server runtime, routing conventions and build complexity whose benefits (SSR, RSC, ISR) are forbidden or irrelevant here. Vite gives a fast SPA build, first-class Vitest integration and a trivial static deploy.
- Not Ember: Ember would mirror Productive's stack, but 10 hours is not enough to produce idiomatic Ember without prior production experience, and the evaluation criteria reward architecture and code quality over stack mimicry. The conceptual parallels are known and documented (Ember Data ≈ TanStack Query cache; routes ≈ React Router routes; services ≈ context/hooks).
- Author expertise: nine years of React means idiomatic code, correct hook usage (handbook chapter on hooks) and fewer defects under the time budget.

## Consequences

- The edit-in-its-own-route requirement (R-11) is satisfied with React Router.
- Ember proficiency is not demonstrated by the code; the technical interview should cover the Ember parallels explicitly.
