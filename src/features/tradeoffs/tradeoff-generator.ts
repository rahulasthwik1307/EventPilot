import { Event } from '../events/types';
import { ScenarioFinancials, TradeOffOption } from './types';

function matchesKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const cleanText = text.trim().toLowerCase();
  const cleanKeyword = keyword.trim().toLowerCase();
  return cleanText.includes(cleanKeyword) || cleanKeyword.includes(cleanText);
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => matchesKeyword(text, kw));
}

/**
 * Generates deterministic, preference-aware trade-off recommendations.
 * INVARIANTS:
 * - Confirmed non-negotiables are NEVER targeted for automatic reductions.
 * - Confirmed economize areas are prioritized for budget adjustments.
 * - Spending priorities are protected unless mathematically impossible.
 * - Inferred/unknown preferences are never treated as confirmed instructions.
 * - Agreed vendor contracts are never cut below committed prices.
 */
export function generateTradeOffOptions(
  event: Event,
  financials: ScenarioFinancials
): TradeOffOption[] {
  const options: TradeOffOption[] = [];
  const shortfall = financials.scenarioShortfall;

  // Extract confirmed preference constraints
  const budgetRecord = event.preferences?.budget;
  const isBudgetConfirmed =
    budgetRecord?.provenance === 'confirmed' || budgetRecord?.provenance === 'explicit';

  const nonNegotiables =
    isBudgetConfirmed && Array.isArray(budgetRecord?.value?.nonNegotiables)
      ? budgetRecord.value.nonNegotiables
      : [];

  const economizeAreas =
    isBudgetConfirmed && Array.isArray(budgetRecord?.value?.economizeAreas)
      ? budgetRecord.value.economizeAreas
      : [];

  const spendingPriorities =
    isBudgetConfirmed && Array.isArray(budgetRecord?.value?.spendingPriorities)
      ? budgetRecord.value.spendingPriorities
      : [];

  const categories = event.categories || [];
  const expenses = event.expenses || [];
  const vendors = event.vendors || [];

  // 1. Guest Scaling Option (if guest target was increased and caused a shortfall)
  if (financials.guestTargetDelta > 0 && shortfall > 0) {
    const perGuestExpenses = expenses.filter(
      (e) => e.costModel === 'per_guest' && typeof e.unitCost === 'number' && e.unitCost > 0
    );

    if (perGuestExpenses.length > 0) {
      const combinedUnitCost = perGuestExpenses.reduce((sum, e) => sum + (e.unitCost || 0), 0);
      if (combinedUnitCost > 0) {
        const attendeesToTrim = Math.min(
          financials.guestTargetDelta,
          Math.max(5, Math.ceil(shortfall / combinedUnitCost))
        );
        const estimatedSavings = Math.round(attendeesToTrim * combinedUnitCost);

        options.push({
          id: 'tradeoff-guest-buffer',
          title: `Buffer Guest Count by ${attendeesToTrim} Attendees`,
          description: `Scaling guest target down by ${attendeesToTrim} attendees aligns variable catering with the available budget headroom.`,
          impactType: 'guest_scaling',
          currentAmount: financials.scenarioGuestTarget,
          proposedAmount: financials.scenarioGuestTarget - attendeesToTrim,
          estimatedSavings,
          isSavingsProjected: true,
          assumptions: `Based on combined per-guest catering/dining rate of ₹${combinedUnitCost.toLocaleString(
            'en-IN'
          )}/guest.`,
          isConflictWithPreference: false,
          affectsNonNegotiable: false,
          isEconomizeArea: false,
          isSpendingPriority: false,
          applied: false,
        });
      }
    }
  }

  // 2. Identify candidate expenses for reduction
  interface Candidate {
    expense: (typeof expenses)[0];
    categoryName: string;
    currentAmount: number;
    spentFloor: number;
    eligibleBase: number;
    isNonNegotiable: boolean;
    isEconomize: boolean;
    isPriority: boolean;
  }

  const candidates: Candidate[] = [];
  const activeVendors = vendors.filter((v) => v.status !== 'cancelled');

  for (const exp of expenses) {
    const cat = categories.find((c) => c.id === exp.categoryId);
    const categoryName = cat?.name || 'General';

    // W3-02: Strict contract-lock protection
    // Check if the category has agreed vendor contracts
    const catImpact = financials.categoryImpacts.find((c) => c.categoryId === exp.categoryId);
    const categoryAgreed = activeVendors
      .filter((v) => v.linkedCategoryId === exp.categoryId)
      .reduce(
        (sum, v) =>
          sum + (typeof v.agreedCost === 'number' && v.agreedCost > 0 ? Math.round(v.agreedCost) : 0),
        0
      );

    if (categoryAgreed > 0 && catImpact && categoryAgreed >= catImpact.scenarioProjected) {
      // The category is already fully or over-committed by agreed vendor contracts
      continue;
    }

    // Settled expenses cannot be reduced
    if (exp.paymentStatus === 'settled') {
      continue;
    }

    const currentAmount =
      exp.costModel === 'per_guest' && exp.unitCost
        ? Math.round(exp.unitCost * financials.scenarioGuestTarget)
        : Math.round(exp.estimatedAmount || 0);

    if (currentAmount <= 0) continue;

    // W3-03: Historical actual spend establishes an absolute non-reducible floor
    const spentFloor = Math.max(
      0,
      typeof exp.actualAmount === 'number' && Number.isFinite(exp.actualAmount)
        ? Math.round(exp.actualAmount)
        : 0
    );

    const categoryUncommitted =
      categoryAgreed > 0 && catImpact
        ? Math.max(0, catImpact.scenarioProjected - categoryAgreed)
        : currentAmount;

    const eligibleBase = Math.min(
      Math.max(0, currentAmount - spentFloor),
      categoryUncommitted
    );

    if (eligibleBase < 5000) {
      // Discretionary headroom above actuals/contracts is under ₹5,000 threshold
      continue;
    }

    const isNonNeg =
      matchesAny(exp.title, nonNegotiables) || matchesAny(categoryName, nonNegotiables);

    const isEcon =
      matchesAny(exp.title, economizeAreas) || matchesAny(categoryName, economizeAreas);

    const isPrio =
      matchesAny(exp.title, spendingPriorities) || matchesAny(categoryName, spendingPriorities);

    // Strictly skip non-negotiables: NEVER recommend cutting confirmed non-negotiables
    if (isNonNeg) {
      continue;
    }

    candidates.push({
      expense: exp,
      categoryName,
      currentAmount,
      spentFloor,
      eligibleBase,
      isNonNegotiable: isNonNeg,
      isEconomize: isEcon,
      isPriority: isPrio,
    });
  }

  // Sort candidates:
  // 1. Economize areas first
  // 2. Unprioritized areas second
  // 3. Spending priorities last
  // Secondary: Largest eligible reducible base first
  candidates.sort((a, b) => {
    if (a.isEconomize && !b.isEconomize) return -1;
    if (!a.isEconomize && b.isEconomize) return 1;
    if (!a.isPriority && b.isPriority) return -1;
    if (a.isPriority && !b.isPriority) return 1;
    return b.eligibleBase - a.eligibleBase;
  });

  // Generate options from candidates
  for (const c of candidates) {
    if (options.length >= 4) break;

    const { expense, categoryName, currentAmount, eligibleBase, isEconomize, isPriority } = c;

    // Suggest a 15% to 25% reduction of the eligible discretionary base (or target shortfall)
    const percentage = isEconomize ? 0.25 : 0.15;
    const proposedCut = Math.min(
      Math.round(eligibleBase * percentage),
      shortfall > 0 ? shortfall : Math.round(eligibleBase * percentage)
    );

    if (proposedCut < 5000) continue; // Skip negligible trimmings

    const proposedAmount = currentAmount - proposedCut;

    let reasoning = `Adjust "${expense.title}" in ${categoryName}.`;
    if (isEconomize) {
      reasoning += ` Aligns with your confirmed preference to economize on ${categoryName}.`;
    } else if (isPriority) {
      reasoning += ` Note: ${categoryName} is marked as a spending priority; evaluate alternatives first.`;
    }

    options.push({
      id: `tradeoff-exp-${expense.id}`,
      title: `Optimize ${categoryName}: ${expense.title}`,
      description: reasoning,
      impactType: 'budget_reduction',
      targetCategoryName: categoryName,
      targetExpenseId: expense.id,
      currentAmount,
      proposedAmount,
      estimatedSavings: proposedCut,
      isSavingsProjected: true,
      assumptions: isEconomize
        ? `Trims 25% of discretionary uncommitted spend (above historical actuals) based on confirmed flexibility.`
        : `Trims 15% of discretionary scope while preserving historical actual commitments.`,
      isConflictWithPreference: isPriority,
      preferenceConflictReason: isPriority
        ? `"${categoryName}" is marked as a preferred spending priority.`
        : undefined,
      affectsNonNegotiable: false,
      isEconomizeArea: isEconomize,
      isSpendingPriority: isPriority,
      applied: false,
    });
  }

  // 3. Category Allocation Shift Option (if there is headroom in another category)
  const overAllocatedCats = financials.categoryImpacts.filter((c) => c.isOverAllocated);
  const underAllocatedCats = financials.categoryImpacts.filter(
    (c) => c.allocatedAmount > c.scenarioProjected && c.allocatedAmount - c.scenarioProjected >= 10000
  );

  if (overAllocatedCats.length > 0 && underAllocatedCats.length > 0) {
    const surplusCat = underAllocatedCats[0];
    const deficitCat = overAllocatedCats[0];
    const shiftAmount = Math.min(
      surplusCat.allocatedAmount - surplusCat.scenarioProjected,
      deficitCat.scenarioProjected - deficitCat.allocatedAmount
    );

    if (shiftAmount >= 10000) {
      options.push({
        id: `tradeoff-shift-${surplusCat.categoryId}-${deficitCat.categoryId}`,
        title: `Reallocate Surplus from ${surplusCat.categoryName} to ${deficitCat.categoryName}`,
        description: `Shift ₹${shiftAmount.toLocaleString(
          'en-IN'
        )} in unused category allocation from ${surplusCat.categoryName} into ${deficitCat.categoryName}.`,
        impactType: 'allocation_shift',
        targetCategoryName: deficitCat.categoryName,
        currentAmount: deficitCat.allocatedAmount,
        proposedAmount: deficitCat.allocatedAmount + shiftAmount,
        estimatedSavings: shiftAmount,
        isSavingsProjected: false, // Internal allocation rebalance
        assumptions: `Rebalances internal category headroom without increasing overall event budget cap.`,
        isConflictWithPreference: false,
        affectsNonNegotiable: false,
        isEconomizeArea: matchesAny(surplusCat.categoryName, economizeAreas),
        isSpendingPriority: matchesAny(deficitCat.categoryName, spendingPriorities),
        applied: false,
      });
    }
  }

  return options;
}
