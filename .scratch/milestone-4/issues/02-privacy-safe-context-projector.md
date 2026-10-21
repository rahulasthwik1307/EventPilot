# 02: Privacy-Safe Context Projector

**Status:** closed  
**Blocked by:** 01

## What to build
Implement `projectEventContextForAI(event, intent)` in `src/features/ai/context-projector.ts`.

## Acceptance Criteria
- [x] Whitelists only relevant non-PII attributes: archetype, date, city, currency, budget cap, category totals, aggregate attendance count.
- [x] Strictly excludes: guest names, phone numbers, emails, household names, dietary preferences, food allergies, personal notes, full vendor records.
- [x] Complete event object is never serialized or sent to Gemini.
- [x] Context differs appropriately by request intent (`budget`, `timeline`, `vendors`, `guests`, `ideas`).
- [x] 100% test coverage in `src/features/ai/__tests__/context-projector.test.ts`.

## Verification
- Verified with 6 unit tests in `src/features/ai/__tests__/context-projector.test.ts`.
- Validated that serialized context when running on sample event with 14 guests contains 0 guest names, 0 phone numbers, 0 emails, and 0 dietary notes.
