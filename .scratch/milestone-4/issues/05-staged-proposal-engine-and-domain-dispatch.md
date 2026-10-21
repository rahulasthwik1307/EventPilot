# 05: Staged Proposal Engine & Deterministic Dispatcher

**Status:** closed  
**Blocked by:** 03, 04

## What to build
Implement proposal staging, revalidation, and deterministic application in `src/features/ai/proposal-engine.ts`.

## Acceptance Criteria
- [x] Staging state: Proposals start as `staged`.
- [x] User can accept or dismiss individual proposals independently.
- [x] Revalidation before application: verifies target category or milestone still exists and dates are valid.
- [x] Deterministic application:
  - Budget adjustments use existing `budget-engine` allocation logic and recalculate variances without touching expenses.
  - Tasks/Milestones use existing `timeline-engine` reanchoring and preserve manual due date overrides (`isDueDateOverridden: true`).
- [x] Rejection of stale/conflicting proposals with human-readable reason (`status: 'conflict'`).
- [x] 100% test coverage in `src/features/ai/__tests__/proposal-engine.test.ts`.

## Resolution Notes
- Created `src/features/ai/proposal-engine.ts` supporting `detectProposalConflicts`, `applyProposalToEvent`, `markProposalAccepted`, `dismissProposal`, and fuzzy category resolution via `findMatchingCategoryIndex`.
- Verified deterministic budget adjustments (zero expense alterations), task insertions with milestone offset anchor dates, manual due date preservation, conflict detection on deleted categories.
- 7 test cases passing in `src/features/ai/__tests__/proposal-engine.test.ts`.
