# 06: AI Assistant Workspace Tab & Proposal Review UI

**Status:** closed  
**Blocked by:** 05

## What to build
Build `src/components/ai/AiAssistantTab.tsx`, `StagedProposalCard.tsx`, and supporting UI components.

## Acceptance Criteria
- [x] Intent selection chips (Ideas, Budget, Timeline, Vendors, Guests, General).
- [x] Accessible prompt input with suggested starter questions based on event archetype.
- [x] Loading state with duplicate-submission prevention and calm progress indicator.
- [x] Conversational answer section with bulleted recommendations.
- [x] Staged Proposal Cards:
  - [x] Clear visual distinction between Staged, Accepted, Dismissed, and Conflict.
  - [x] Old vs. Proposed value diffs (e.g. Budget Category: ₹2,00,000 -> ₹2,50,000).
  - [x] Explicit Accept and Dismiss action buttons.
- [x] Clear error banners with retry action when provider is unavailable.
- [x] Keyboard accessible, responsive mobile/desktop layout.
- [x] Component tests in `src/components/ai/__tests__/AiAssistantTab.test.tsx`.

## Resolution Notes
- Created `src/components/ai/StagedProposalCard.tsx` featuring visual Old vs Proposed diffs, action type badges, status pills, explicit Accept & Apply / Dismiss actions, and navigation jump links.
- Created `src/components/ai/AiAssistantTab.tsx` featuring intent radio chips, archetype-aware starter questions, prompt form with loading states, conversational guidance, staged proposal cards list with bulk Accept/Dismiss, error/retry resilience banner, and safe context inspector dialog.
- 6 tests passing in `src/components/ai/__tests__/AiAssistantTab.test.tsx`.
