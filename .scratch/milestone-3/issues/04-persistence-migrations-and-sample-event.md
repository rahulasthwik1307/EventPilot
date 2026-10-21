# 04: Schema Migrations, Persistence Upgrades & Sample Event Expansion

**Status:** closed  
**Blocked by:** 01, 02, 03

## What to build
Update `src/features/events/types.ts`, `src/features/events/storage.ts`, `src/features/events/validation.ts`, and `src/features/events/sample-event.ts`.

## Acceptance Criteria
- [x] Extend `Event` interface with `vendors: Vendor[]`, `households: GuestHousehold[]`, `guests: Guest[]`, `tables: SeatingTable[]`, `assignments: SeatingAssignment[]`.
- [x] Backward-Compatible Migration `migrateEventToM3(event)` in `storage.ts`:
  - Preserves all M1 and M2 data verbatim.
  - Initializes empty arrays if fields are missing in older payloads.
  - Cleans orphaned seating assignments referencing non-existent tables or guests.
  - Strict Rule: Never fabricates vendors, guests, tables, or expenses in personal events.
- [x] Expand `createFreshSampleEvent()` with realistic Indian celebration data:
  - 6 realistic vendors across categories (Venue, Decor, Catering, Photography, Music, Transit).
  - 4 households with distinct relationship types.
  - 14 guests across RSVP states (confirmed, pending, declined) and dietary restrictions (vegetarian, jain, halal, gluten-free, none).
  - 4 banquet tables with capacities and 12 seating assignments.
- [x] 100% test coverage for migration and storage in `src/features/events/__tests__/migration.test.ts` and `storage.test.ts`.

## Verification
- Verified with unit tests in `src/features/events/__tests__/migration.test.ts` (3 tests) and `storage.test.ts` (11 tests).
- Validated backwards compatibility from M1/M2 saved events to M3 schema.
