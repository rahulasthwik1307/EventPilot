# Spec: Milestone 0 — Repository, Tooling & Baseline

## Problem Statement
Event Pilot is being built from scratch for Prompt Wars Challenge 5. We need a reliable Next.js App Router baseline with TypeScript, Tailwind CSS with design tokens, Vitest test runner, and a local markdown issue tracker before implementing database schemas or feature components.

## Solution
Initialize a clean Next.js 15 App Router project in TypeScript, configure Tailwind CSS matching `DESIGN.md` (Panchang & Utsav Almanac), set up Vitest with React Testing Library, and configure local issue tracking in `.scratch/`.

## Seams Tested
- Build and compilation seam: `npm run build` and `npm run typecheck`
- Component rendering and DOM assertion seam: Vitest with `@testing-library/react` and `@testing-library/jest-dom`
- Runtime server seam: `npm run dev`
