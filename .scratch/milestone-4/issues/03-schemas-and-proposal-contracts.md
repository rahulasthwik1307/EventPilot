# 03: Request & Structured Response Schemas with Zod

**Status:** closed  
**Blocked by:** 02

## What to build
Implement Zod schemas and TypeScript types for AI assistant requests, structured Gemini responses, and proposal payloads in `src/features/ai/types.ts` and `src/features/ai/schemas.ts`.

## Acceptance Criteria
- [x] Explicit request schema with bounds: prompt length limits, valid intents.
- [x] Structured Gemini output schema with discriminated proposal actions:
  - `add_task`: title, offsetDays, priority, description.
  - `add_milestone`: title, offsetDays, description.
  - `adjust_budget_allocation`: targetCategoryName, newAmount, rationale.
  - `add_checklist_item`: category, itemText.
  - `suggest_vendor_followup`: vendorCategory, suggestedQuestions.
- [x] Server-side Zod validation rejecting malformed outputs, negative amounts, out-of-range dates.
- [x] 100% test coverage in `src/features/ai/__tests__/schemas.test.ts`.

## Verification
- Verified with 6 unit tests in `src/features/ai/__tests__/schemas.test.ts`.
- Validated request schema bounds (min 1, max 1000 chars), discriminated proposal schemas, and rejection of negative budget amounts.
