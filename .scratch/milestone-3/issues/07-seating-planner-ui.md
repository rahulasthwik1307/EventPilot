# 07: Practical Seating Planner UI & Table Layout

**Status:** closed  
**Blocked by:** 03, 04

## What to build
Build the Seating Planner tab and table management dialogs in `src/components/seating/`.

## Acceptance Criteria
- [x] `SeatingTab.tsx`:
  - Seating metric cards: Total Tables, Configured Seat Capacity, Expected Seated, Unassigned Attendees, and Seating Completion rate.
  - Interactive table cards showing occupancy ratio, progress bar, seated guest list (with plus-one indicators and dietary tags), and table-level dietary breakdown for caterers.
  - Over-capacity alert banners when seats assigned exceed table capacity.
  - Interactive Unassigned Queue: Lists all confirmed attendees not yet assigned to a table, with quick table assignment dropdown selector.
- [x] `TableDialog.tsx`:
  - Table name, capacity (enforced positive integer 1-50), table shape/type (round, rectangular, banquet, high_top), location notes.
- [x] `TableDeleteDialog.tsx`:
  - Confirmation modal warning that deleting the table unseats its occupants back to the unassigned queue.
- [x] Component tests in `src/components/seating/__tests__/SeatingTab.test.tsx`.

## Verification
- Verified with 4 tests in `src/components/seating/__tests__/SeatingTab.test.tsx`.
- Validated table creation, seat assignment, unseating, over-capacity warning state, and dietary breakdown.
