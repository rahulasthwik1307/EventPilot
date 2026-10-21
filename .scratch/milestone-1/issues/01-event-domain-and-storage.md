# 01: Event Domain Model, Deterministic Validation & Local Storage Adapter

**Status:** done  
**Blocked by:** None

## What to build
Implement the core domain model, pure TypeScript validation functions, sample celebration fixture, and browser `localStorage` persistence adapter behind a clean, testable interface.

## Acceptance Criteria
- [x] Explicit TypeScript types for `Event`, `EventType`, `CurrencyCode`, `StorageResult` in `src/features/events/types.ts`.
- [x] Pure deterministic validation in `src/features/events/validation.ts` checking required fields, date formats, string lengths, positive numbers, and date countdown calculations without timezone shift.
- [x] Realistic sample celebration fixture ("Aarav & Meera's Vivaha Celebration") in `src/features/events/sample-event.ts`.
- [x] Safe `localStorage` adapter in `src/features/events/storage.ts` with SSR guards, versioned keys, JSON error handling, quota handling, sample event isolation, and sample reset.
- [x] 100% test coverage for domain validation and storage operations in Vitest.

## Comments
- Implemented `validateEventInput`, `validateEvent`, `calculateDaysRemaining`, `formatCurrency` in pure deterministic TypeScript without external libraries.
- Implemented `LocalStorageEventStorage` handling `QUOTA_EXCEEDED`, corrupted JSON recovery, version mismatch checks, and sample isolation.
- Verified with 24 unit tests across `validation.test.ts` and `storage.test.ts`.
