# AGENTS.md

Navigation and orientation pointers for AI agents working in Event Pilot.

## Agent skills

### Issue tracker

Issues and specs live in `.scratch/` as local markdown files. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `GLOSSARY.md`, `PRODUCT.md`, `DESIGN.md`, and `docs/adr/`. See `docs/agents/domain.md`.

## Core Guardrails

- All financial arithmetic, date math, and attendance calculations must live in deterministic TypeScript logic. Never delegate math to LLMs.
- Strict adherence to `DESIGN.md` tokens (Panchang & Utsav Almanac). Do not introduce ad-hoc CSS colors or generic styles.
- Do not modify or interact with the unrelated `factor-attendance` Supabase project.
