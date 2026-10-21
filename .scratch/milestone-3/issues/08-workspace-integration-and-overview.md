# 08: Workspace Integration, Overview Tab Updates & End-to-End Tests

**Status:** closed  
**Blocked by:** 05, 06, 07

## What to build
Integrate the three new modules into the workspace shell, update the Overview dashboard with live M3 summaries, and write end-to-end integration tests.

## Acceptance Criteria
- [x] `WorkspaceNavigation.tsx`:
  - Active tabs for `vendors`, `guests`, and `seating` without placeholder labels.
- [x] `WorkspaceShell.tsx`:
  - Renders `VendorsTab`, `GuestsTab`, and `SeatingTab` when selected.
- [x] `OverviewTab.tsx`:
  - Live Vendor Summary card: Total Quoted vs Agreed vs Paid.
  - Live Attendance Summary card: Expected Attendees (named + plus-ones), RSVP breakdown, and Dietary summary.
  - Live Seating Summary card: Total Tables, Seating Capacity, and Unassigned Queue count.
- [x] End-to-End and Integration tests in `src/app/__tests__/page.test.tsx` verifying navigation to all tabs and verifying interactions.
- [x] Verify quality gates: `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.

## Verification
- Verified with 10 end-to-end workflow tests in `src/app/__tests__/page.test.tsx`.
- All quality gates pass: 0 type errors, 109 passing tests, 0 lint errors, clean production build.
