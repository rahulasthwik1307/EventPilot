/**
 * Event Pilot Budget Calculation Engine
 * Pure deterministic calculations for category allocations, expenses, and summaries.
 * Guardrail: Never delegate arithmetic to language models.
 */

import {
  BudgetCategory,
  BudgetSummary,
  CategorySummary,
  CurrencyCode,
  EventType,
  Expense,
} from './types';

interface ArchetypeCategoryTemplate {
  name: string;
  percentage: number;
}

const STARTER_CATEGORY_TEMPLATES: Record<EventType, ArchetypeCategoryTemplate[]> = {
  wedding: [
    { name: 'Venue & Traditional Catering', percentage: 0.45 },
    { name: 'Decor, Mandap & Floral Ambience', percentage: 0.18 },
    { name: 'Photography & Cinematography', percentage: 0.12 },
    { name: 'Ceremonial Attire & Styling', percentage: 0.10 },
    { name: 'Nadaswaram, Sound & Sangeet', percentage: 0.06 },
    { name: 'Contingency & Guest Transit', percentage: 0.09 },
  ],
  birthday: [
    { name: 'Venue & Custom Catering', percentage: 0.45 },
    { name: 'Theme Decor, Backdrop & Cake', percentage: 0.20 },
    { name: 'Entertainment, Games & Host', percentage: 0.15 },
    { name: 'Favors & Return Gifts', percentage: 0.10 },
    { name: 'Contingency & Incidentals', percentage: 0.10 },
  ],
  community: [
    { name: 'Stage, Sound & Illumination', percentage: 0.35 },
    { name: 'Community Feast & Refreshments', percentage: 0.30 },
    { name: 'Civic Permits, Security & Sanitation', percentage: 0.15 },
    { name: 'Signage, Banners & Stage Decor', percentage: 0.10 },
    { name: 'Emergency Contingency Reserve', percentage: 0.10 },
  ],
};

/**
 * Deterministically generates starting category allocations based on budget cap and archetype.
 * Ensures total allocation sums exactly to budgetCap without rounding drift or negative amounts.
 */
export function generateStarterCategories(
  budgetCap: number,
  type: EventType
): BudgetCategory[] {
  const safeCap = Number.isFinite(budgetCap) && budgetCap > 0 ? Math.round(budgetCap) : 0;
  const templates = STARTER_CATEGORY_TEMPLATES[type] || STARTER_CATEGORY_TEMPLATES.wedding;

  if (safeCap === 0) {
    return templates.map((tmpl, index) => ({
      id: `cat-${type}-${index + 1}`,
      name: tmpl.name,
      allocatedAmount: 0,
    }));
  }

  let allocatedRunningSum = 0;
  const categories: BudgetCategory[] = [];

  for (let i = 0; i < templates.length; i++) {
    const tmpl = templates[i];
    const isLast = i === templates.length - 1;

    let allocated: number;
    if (isLast) {
      // Last category absorbs any rounding difference to ensure exact budget cap match
      allocated = Math.max(0, safeCap - allocatedRunningSum);
    } else {
      allocated = Math.round(safeCap * tmpl.percentage);
      allocatedRunningSum += allocated;
    }

    categories.push({
      id: `cat-${type}-${i + 1}`,
      name: tmpl.name,
      allocatedAmount: allocated,
    });
  }

  return categories;
}

/**
 * Calculates authoritative budget totals, variances, and safety indicators.
 * Deterministic Actual Spending Rule: Only expenses with a valid numeric actualAmount contribute
 * to recorded actual spending. Settled status without an actualAmount does not invent spending.
 */
export function calculateBudgetSummary(
  budgetCap: number,
  categories: BudgetCategory[],
  expenses: Expense[],
  guestTarget: number,
  currency: CurrencyCode
): BudgetSummary {
  const safeCap = Number.isFinite(budgetCap) ? Math.max(0, Math.round(budgetCap)) : 0;

  const totalAllocated = categories.reduce((sum, c) => {
    return sum + (Number.isFinite(c.allocatedAmount) ? Math.max(0, Math.round(c.allocatedAmount)) : 0);
  }, 0);

  const totalEstimated = expenses.reduce((sum, e) => {
    return sum + (Number.isFinite(e.estimatedAmount) ? Math.max(0, Math.round(e.estimatedAmount)) : 0);
  }, 0);

  const totalActual = expenses.reduce((sum, e) => {
    if (typeof e.actualAmount === 'number' && Number.isFinite(e.actualAmount) && e.actualAmount >= 0) {
      return sum + Math.round(e.actualAmount);
    }
    return sum;
  }, 0);

  const unallocatedBudget = safeCap - totalAllocated;
  const budgetCapVariance = safeCap - totalActual;
  const safeGuests = Number.isFinite(guestTarget) && guestTarget > 0 ? Math.round(guestTarget) : 0;
  const costPerGuest = safeGuests > 0 ? Math.round(safeCap / safeGuests) : 0;

  return {
    budgetCap: safeCap,
    totalAllocated,
    totalEstimated,
    totalActual,
    unallocatedBudget,
    budgetCapVariance,
    costPerGuest,
    isOverAllocated: totalAllocated > safeCap,
    isOverBudget: totalActual > safeCap,
    currency,
  };
}

/**
 * Calculates per-category allocations, expenses, actuals, and variance.
 */
export function calculateCategorySummaries(
  categories: BudgetCategory[],
  expenses: Expense[]
): CategorySummary[] {
  return categories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.categoryId === cat.id);

    const totalEstimated = catExpenses.reduce((sum, e) => {
      return sum + (Number.isFinite(e.estimatedAmount) ? Math.max(0, Math.round(e.estimatedAmount)) : 0);
    }, 0);

    const totalActual = catExpenses.reduce((sum, e) => {
      if (typeof e.actualAmount === 'number' && Number.isFinite(e.actualAmount) && e.actualAmount >= 0) {
        return sum + Math.round(e.actualAmount);
      }
      return sum;
    }, 0);

    const variance = cat.allocatedAmount - totalActual;

    return {
      category: cat,
      allocatedAmount: cat.allocatedAmount,
      totalEstimated,
      totalActual,
      variance,
      expenseCount: catExpenses.length,
    };
  });
}

/**
 * Checks if a category can be deleted safely without leaving orphaned expenses.
 */
export function canDeleteCategory(
  categoryId: string,
  expenses: Expense[]
): { canDelete: boolean; associatedCount: number } {
  const associated = expenses.filter((e) => e.categoryId === categoryId);
  return {
    canDelete: associated.length === 0,
    associatedCount: associated.length,
  };
}

/**
 * Deterministically recalculates estimated amounts for variable (per-guest) expenses
 * whenever the event's guest target changes.
 * Pure function: Does not mutate input array or objects.
 */
export function recalculatePerGuestExpenses(
  expenses: Expense[],
  guestTarget: number
): Expense[] {
  const safeGuests =
    Number.isFinite(guestTarget) && guestTarget >= 0 ? Math.round(guestTarget) : 0;
  return expenses.map((exp) => {
    if (
      exp.costModel === 'per_guest' &&
      typeof exp.unitCost === 'number' &&
      Number.isFinite(exp.unitCost) &&
      exp.unitCost >= 0
    ) {
      const recalculatedEstimate = Math.round(exp.unitCost * safeGuests);
      return {
        ...exp,
        estimatedAmount: recalculatedEstimate,
      };
    }
    return exp;
  });
}

