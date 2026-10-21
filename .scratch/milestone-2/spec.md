# Specification: Milestone 2 — Budget & Timeline Engine

**Slug:** `milestone-2`  
**Status:** In-Planning  
**Target Delivery:** Budget Ledger, Expense CRUD & Payment States, Timeline Milestones, Task Matrix with Overdue Handling, Event-Date Recalculation Preservation, and Storage Migration.

---

## 1. Product Scope & Guardrails

Milestone 2 activates two central planning modules in the Event Pilot workspace:
1. **Budget Ledger:** Managing planned category allocations, individual expenses, payment states (`projected`, `deposit_paid`, `settled`), variance analysis, and deterministic financial arithmetic.
2. **Timeline & Tasks:** Managing chronological milestones with relative day offsets (`offset_days`), checklist tasks with priorities, due dates, overdue detection, and event-date rescheduling integrity.

### Mandatory Exclusions
- **No Supabase or PostgreSQL:** 100% browser `localStorage`.
- **No Authentication:** Runs in the user's browser profile.
- **No Gemini API integration:** All calculations and starter templates are deterministic TypeScript logic.
- **No Vendor or Guest management yet:** Handled in Milestone 3.

---

## 2. Budget Ledger Architecture

### 2.1 Domain Models
```typescript
export type PaymentStatus = 'projected' | 'deposit_paid' | 'settled';

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
}

export interface Expense {
  id: string;
  categoryId: string;
  title: string;
  estimatedAmount: number;
  actualAmount?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  budgetCap: number;
  totalAllocated: number;
  totalEstimated: number;
  totalActual: number;
  unallocatedBudget: number; // budgetCap - totalAllocated
  budgetCapVariance: number; // budgetCap - totalActual
  costPerGuest: number;
  isOverAllocated: boolean;
  isOverBudget: boolean;
  currency: CurrencyCode;
}
```

### 2.2 Deterministic Calculation Rules
- `totalAllocated` = sum of `category.allocatedAmount` across all categories.
- `totalEstimated` = sum of `expense.estimatedAmount` across all expenses.
- `totalActual` = sum of `expense.actualAmount` for all expenses where `typeof expense.actualAmount === 'number' && Number.isFinite(expense.actualAmount) && expense.actualAmount >= 0`.
- **Actual Spending Rule:** Payment status alone never double-counts spending. Only recorded `actualAmount` contributes to actual spending. If an expense is `settled` without an explicit `actualAmount`, the UI highlights it as "Actual pending record" and offers a one-click "Set to Estimate" action without inventing data silently.
- `unallocatedBudget` = `budgetCap - totalAllocated`.
- `budgetCapVariance` = `budgetCap - totalActual`.
- `costPerGuest` = `guestTarget > 0 ? Math.round(budgetCap / guestTarget) : 0`.
- All monetary formatting respects the event's selected currency (`INR`, `USD`, `EUR`, `GBP`) with Indian number grouping for INR (`₹25,00,000`).

### 2.3 Starter Category Allocations
Deterministic percentage templates matching celebration archetypes:
- **Wedding:** Venue & Catering (45%), Decor & Florals (18%), Photography & Film (12%), Attire & Styling (10%), Music & Rituals (6%), Contingency & Logistics (9%). Total = 100%.
- **Birthday:** Venue & Catering (45%), Theme & Decor (20%), Entertainment (15%), Gifts & Favors (10%), Contingency (10%). Total = 100%.
- **Community:** Stage, Sound & Light (35%), Catering & Refreshments (30%), Permits & Security (15%), Signage & Decor (10%), Contingency (10%). Total = 100%.

### 2.4 Category Deletion Safety
Deleting a category with associated expenses requires an explicit choice: reassign expenses to another category or delete expenses with confirmation. Silently orphaning expenses is strictly prohibited.

---

## 3. Timeline & Tasks Architecture

### 3.1 Domain Models
```typescript
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'completed';

export interface TimelineMilestone {
  id: string;
  title: string;
  offsetDays: number; // Relative to celebration date (e.g. -90, -30, 0)
  description?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  description?: string;
  milestoneId?: string;
  category?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  isDueDateOverridden?: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Event-Date Change & Data Integrity Rule
When the celebration date changes:
1. Milestones recalculate: `date = calculateMilestoneDate(eventDate, offsetDays)` without timezone drift.
2. Tasks:
   - If `isDueDateOverridden === true`: The custom user-entered `dueDate` is **strictly preserved**.
   - If `isDueDateOverridden !== true` and `milestoneId` is set: The task's `dueDate` dynamically updates to match the milestone's new calendar date.
   - Task ID, title, description, priority, completion status (`pending`/`completed`), and `completedAt` are **never lost or reset**.

### 3.3 Dynamic Overdue Evaluation
- A task is overdue if and only if: `task.status !== 'completed' && task.dueDate < todayString`.
- Completed tasks are **never overdue**.
- Overdue status is evaluated dynamically on render and never stored as a stale boolean.

---

## 4. Local Persistence & Schema Migration

### 4.1 Schema Evolution
Milestone 1 stored:
```typescript
{ categories?: BudgetCategoryAllocation[] }
```
Milestone 2 upgrades `Event` to:
```typescript
{
  categories: BudgetCategory[];
  expenses: Expense[];
  milestones: TimelineMilestone[];
  tasks: ChecklistTask[];
}
```

### 4.2 Migration Strategy (`migrateEventToM2`)
1. If `categories` exists in M1 format (`BudgetCategoryAllocation[]`), convert to `BudgetCategory[]` and preserve planned allocations.
2. If `categories` is empty, generate starter categories for `event.type`.
3. If `expenses` is missing, initialize `[]` (never fabricate recorded expenses).
4. If `milestones` is missing, generate starter milestones for `event.type`.
5. If `tasks` is missing, generate starter tasks associated with milestones.
6. Existing IDs, titles, dates, locations, guest targets, and budget caps are completely preserved.
7. Corrupted JSON and quota errors continue to be handled safely without wiping user data.

---

## 5. UI/UX Design & Impeccable Standards

In accordance with `DESIGN.md`:
- **Palette:** Papyrus Canvas (`#FDFBF7`), Card Surface (`#FFFFFF`), Sandstone (`#F5EFEB`), Ceremonial Hairline (`#E7DFD5`), Strong Border (`#D6CCC2`), Deep Ink (`#1C1917`), Marigold Amber (`#D97706`), Terracotta (`#C2410C`).
- **Typography:**
  - Display: `Eczar` (600) for module headlines.
  - Body: `Plus Jakarta Sans` for labels, descriptions, and inputs.
  - Numbers: `JetBrains Mono` with `tabular-nums` for financial ledgers, guest counts, and dates.
- **Button Contrast:** Deep Ink text (`#1C1917`) on Marigold Amber (`#D97706`) button (WCAG 2.1 AA certified).
- **Coupon Stamps:** `PROJECTED`, `DEPOSIT PAID`, `SETTLED`, `OVERDUE` badges with clear non-color indicators.
- **Responsive:** Full mobile adaptation with touch targets >= 44px and no horizontal text overflow.

---

## 6. Acceptance Criteria Matrix (Six Mandatory Evaluator Parameters)

| Parameter | Weight | Acceptance Criteria | Verification Method |
|---|---|---|---|
| **1. Code Quality** | High | Strict TypeScript (0 `any`), pure deterministic calculations for budget and dates, modular separation of domain/storage/UI, 0 lint/type errors. | `npm run typecheck`, ESLint, Vitest. |
| **2. Security** | Medium | No credentials in client/storage; localStorage treated as untrusted; no XSS; no premature database or auth introduced. | Storage unit tests, static code review. |
| **3. Efficiency** | Medium | No unneeded dependencies; pure TS calculation engine; memoized summaries; fast initial render; low bundle size. | `npm run build`, bundle trace inspection. |
| **4. Testing** | Low (Req) | Comprehensive Vitest suite: starter templates, variance math, payment states, category deletion safety, milestone offsets, date change preservation, overdue detection, schema migration, and UI component tests. | `npm test` with 100% green tests. |
| **5. Accessibility** | Low (Req) | WCAG 2.1 AA: 4.5:1 text contrast, semantic HTML tables and headings, accessible form labels, visible focus rings, modal focus traps, no color-only state communication. | Automated DOM assertions & keyboard review. |
| **6. Problem Alignment** | Very High | Real budget ledger with category & expense CRUD; real timeline milestone & task management; deterministic arithmetic; date rescheduling integrity; sample event updated. | Functional walkthrough & Impeccable review. |
