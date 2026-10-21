# 01: Vendor Domain Model, Financial Calculations & Category Guardrails

**Status:** closed  
**Blocked by:** None

## What to build
Implement the Vendor domain types, validation schemas, and pure deterministic calculations in `src/features/vendors/`.

## Acceptance Criteria
- [x] Explicit TypeScript types: `Vendor`, `VendorCategory`, `VendorStatus`, `VendorFinancialSummary`.
- [x] Pure financial calculations: `calculateVendorFinancials(vendors)` computing quoted total, agreed commitments, paid total, outstanding balance, and status breakdown.
- [x] Deterministic rules:
  - If `agreedCost` is undefined, remaining balance is not established.
  - If `amountPaid > agreedCost`, remaining balance is 0 and overpaid amount is detectable.
  - Deposits and payments are validated non-negative numbers.
- [x] Critical Accounting Rule: Vendor commitments and payments do not create expenses or modify `event.expenses` or `event.categories`.
- [x] Helper `reconcileBudgetCategoryDeletion(vendors, deletedCategoryId)` safely unlinking deleted categories.
- [x] 100% unit test coverage in `src/features/vendors/__tests__/vendor-engine.test.ts`.

## Verification
- Verified with 7 passing unit tests in `src/features/vendors/__tests__/vendor-engine.test.ts`.
- Validated exact calculations for quoted, agreed, paid, and remaining commitments.
