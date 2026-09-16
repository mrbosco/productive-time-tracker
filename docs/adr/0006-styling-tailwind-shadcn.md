# ADR-0006: Tailwind CSS v4 + shadcn/ui for styling

Status: accepted (2026-09-15)

## Context

The handbook documents Infinum's move from Chakra UI to Tailwind and adopts shadcn/ui (Radix primitives) with `@theme` design tokens. N-3 requires client-ready visual quality; N-4 requires mobile usability; the handbook has a full accessibility chapter.

## Decision

Tailwind v4 with a small `@theme` token set (colours, radii, spacing) and shadcn/ui components copied into `src/components/core` (Button, Input, Textarea, Dialog, Toast, Card, Calendar/DatePicker).

## Rationale

- Direct handbook alignment, including the stated rationale (no runtime CSS-in-JS cost, tokens as CSS variables).
- shadcn/ui gives accessible dialog/focus/keyboard behaviour for free, which matters for the confirm-delete flow (R-12) and the accessibility chapter.
- Utility classes keep the mobile-first responsive work fast.

## Consequences

- Tailwind's ESLint plugin is not v4-compatible (handbook warning); class ordering is handled by `prettier-plugin-tailwindcss` instead.
