# 02: Guest & RSVP Domain Engine and Deterministic Attendance

**Status:** closed  
**Blocked by:** None

## What to build
Implement the Guest, Household, RSVP, and Dietary types, validation, and attendance math in `src/features/guests/`.

## Acceptance Criteria
- [x] Explicit TypeScript types: `Guest`, `GuestHousehold`, `RsvpStatus`, `DietaryPreference`, `AttendanceSummary`.
- [x] Deterministic Attendance Rule:
  - Expected attendance = Confirmed named guests + Confirmed plus-ones (`plusOneExpected === true`).
  - Pending / declined guests and potential plus-ones (`plusOneAllowed === true && plusOneExpected === false`) must NEVER count toward expected attendance or consume table seats.
- [x] Pure metrics function `calculateAttendanceSummary(guests)`:
  - Total registered records
  - Total confirmed named attendees
  - Confirmed plus-one attendees
  - Total expected attendees (named + plus-ones)
  - Pending responses count
  - Declined responses count
  - Dietary breakdown mapping diet to count of confirmed attendees
- [x] Household deletion handler `safeDeleteHousehold(households, guests, householdId)` unlinking guests to ungrouped without deleting guest records.
- [x] 100% unit test coverage in `src/features/guests/__tests__/guest-engine.test.ts`.

## Verification
- Verified with 6 unit tests in `src/features/guests/__tests__/guest-engine.test.ts`.
- Validated attendance formula, diet breakdown, and household dissociation.
