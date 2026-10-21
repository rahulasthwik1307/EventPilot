# 06: Guest & RSVP Management UI & Modal Dialogs

**Status:** closed  
**Blocked by:** 02, 04

## What to build
Build the complete Guests & RSVP tab and management dialogs in `src/components/guests/`.

## Acceptance Criteria
- [x] `GuestsTab.tsx`:
  - Attendance metric cards: Total Registered, Expected Attending (Named + Plus-Ones), Pending RSVPs, Declined RSVPs, and Dietary breakdown.
  - Search input and multi-axis filters: RSVP status, Household group, and Dietary preference.
  - Household grouping view showing household relationship and member list.
  - Quick RSVP status toggle buttons directly on guest cards.
- [x] `GuestDialog.tsx`:
  - First name, last name, household selector, relationship, phone, email, RSVP status, invitation status, plus-one toggle, plus-one expected toggle, plus-one name, dietary preference, dietary notes, and personal notes.
  - Validation: Names required, phone/email format check, plus-one expected cannot be enabled if plus-one allowed is false.
- [x] `HouseholdDialog.tsx`:
  - Household name, relationship type, and coordination notes.
- [x] `HouseholdDeleteDialog.tsx`:
  - Explains that deleting the household unlinks guests without deleting them.
- [x] Component tests in `src/components/guests/__tests__/GuestsTab.test.tsx`.

## Verification
- Verified with 5 tests in `src/components/guests/__tests__/GuestsTab.test.tsx`.
- Validated household dialogs, guest registration, quick RSVP toggles, and sample data rendering.
