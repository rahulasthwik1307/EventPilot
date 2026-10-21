# 03: Seating & Table Planner Domain Engine

**Status:** closed  
**Blocked by:** None

## What to build
Implement the Seating Table, Assignment, and Capacity rules in `src/features/seating/`.

## Acceptance Criteria
- [x] Explicit TypeScript types: `SeatingTable`, `SeatingAssignment`, `TableOccupancyMetrics`, `UnassignedAttendee`.
- [x] Capacity Validation Rule:
  - Table capacity must be a positive integer between 1 and 50.
  - If a user reduces table capacity below currently seated attendees, do NOT discard assignments. Flag with an over-capacity warning badge and alert.
- [x] Pure seating metrics function `calculateTableOccupancy(tables, assignments, guests, households)`:
  - Seats used per table (distinguishing named guests from plus-ones)
  - Remaining seats per table
  - Table over-capacity state (`isOverCapacity: boolean`, `overflowCount: number`)
  - Aggregated dietary summary per table for banquet catering coordinators
- [x] Unassigned queue generator `getUnassignedExpectedAttendees(guests, assignments, households)`:
  - Only confirmed named guests and confirmed plus-ones can be seated.
  - Returns clear display labels: named guest vs. partner plus-one.
- [x] Safe deletion helpers:
  - `deleteTableAndUnassign(tables, assignments, tableId)`: removes table and releases assignments to unassigned queue.
  - `unseatAttendee(assignments, tableId, guestId, isPlusOne)`: unseats a single seat.
- [x] 100% unit test coverage in `src/features/seating/__tests__/seating-engine.test.ts`.

## Verification
- Verified with 8 unit tests in `src/features/seating/__tests__/seating-engine.test.ts`.
- Validated overflow handling, attendee unseating, dietary compilation per table, and unassigned queues.
