# Domain Docs

How engineering skills consume Event Pilot's domain documentation when exploring the codebase.

## Before exploring, read these

- `GLOSSARY.md` at the repo root
- `PRODUCT.md` at the repo root
- `DESIGN.md` at the repo root
- `docs/adr/`: read ADRs that touch the area you're about to work in

## File structure

Single-context repo:

```
/
├── GLOSSARY.md
├── PRODUCT.md
├── DESIGN.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When naming a domain concept (in an issue title, refactor proposal, hypothesis, or test name), use the exact canonical term defined in `GLOSSARY.md`. Don't drift to synonyms.

## Flag ADR conflicts

If an implementation or proposal contradicts an existing ADR, surface it explicitly rather than silently overriding.
