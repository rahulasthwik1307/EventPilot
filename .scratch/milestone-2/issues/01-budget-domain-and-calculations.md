# 01: Budget Domain Model, Deterministic Calculations & Starter Templates

**Status:** closed  
**Blocked by:** None

## What to build
Implement the Budget domain types, pure deterministic calculations, starter category percentage templates for the three event archetypes, and expense CRUD helpers.

## Acceptance Criteria
- [x] Explicit TypeScript types for `BudgetCategory`, `Expense`, `PaymentStatus`, and `BudgetSummary`.
- [x] Pure calculation functions: `calculateBudgetSummary`, `calculateCategorySummaries`, `generateStarterCategories`.
- [x] Explicit actual spending rule: strictly counts valid positive `actualAmount` without double counting deposits or projected amounts.
- [x] Safe category deletion logic checking for associated expenses.
- [x] 100% test coverage for all budget calculations, variance signs, rounding, and small/zero budget boundaries.
