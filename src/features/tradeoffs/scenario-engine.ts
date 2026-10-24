import { Event } from '../events/types';
import { ContractDiscrepancy, ScenarioCategoryImpact, ScenarioFinancials, ScenarioInput } from './types';

/**
 * Pure deterministic scenario calculation engine for Event Pilot.
 * Calculates financial impacts of budget cap or guest target changes.
 * Guaranteed: Zero side effects, no mutation of input snapshot, exact integer rounding,
 * clean distinction between commitments, actuals, payments, and projections.
 */
export function calculateScenarioFinancials(
  event: Event,
  scenario: ScenarioInput
): ScenarioFinancials {
  const baselineBudgetCap = Math.max(0, Math.round(event.budgetCap || 0));
  const baselineGuestTarget = Math.max(0, Math.round(event.guestTarget || 0));

  const scenarioBudgetCap =
    typeof scenario.budgetCap === 'number' && Number.isFinite(scenario.budgetCap) && scenario.budgetCap > 0
      ? Math.max(0, Math.round(scenario.budgetCap))
      : baselineBudgetCap;

  const scenarioGuestTarget =
    typeof scenario.guestTarget === 'number' && Number.isFinite(scenario.guestTarget) && scenario.guestTarget >= 0
      ? Math.max(0, Math.round(scenario.guestTarget))
      : baselineGuestTarget;

  const warnings: string[] = [];

  if (scenarioGuestTarget === 0) {
    warnings.push('Scenario guest target is 0; variable guest-dependent costs are evaluated at zero.');
  }

  // 1. Process Expenses & Category Breakdown
  const categories = event.categories || [];
  const expenses = event.expenses || [];

  let baselineTotalProjected = 0;
  let scenarioTotalProjected = 0;
  let fixedProjectedCost = 0;
  let variableProjectedCost = 0;
  let historicalActualSpend = 0;

  // Track per-category impacts
  const categoryMap = new Map<
    string,
    {
      name: string;
      allocated: number;
      baselineProjected: number;
      scenarioProjected: number;
      fixedCost: number;
      variableCost: number;
    }
  >();

  for (const cat of categories) {
    const candidateAlloc = scenario.categoryAllocations?.[cat.id];
    const allocAmount =
      typeof candidateAlloc === 'number' && Number.isFinite(candidateAlloc) && candidateAlloc >= 0
        ? Math.round(candidateAlloc)
        : Math.max(0, Math.round(cat.allocatedAmount || 0));

    categoryMap.set(cat.id, {
      name: cat.name,
      allocated: allocAmount,
      baselineProjected: 0,
      scenarioProjected: 0,
      fixedCost: 0,
      variableCost: 0,
    });
  }

  for (const exp of expenses) {
    // Record historical actual spend if present
    if (typeof exp.actualAmount === 'number' && Number.isFinite(exp.actualAmount)) {
      historicalActualSpend += Math.max(0, Math.round(exp.actualAmount));
    }

    const isVariable = exp.costModel === 'per_guest' && typeof exp.unitCost === 'number' && exp.unitCost > 0;

    // Baseline projected amount
    const baselineExp = isVariable
      ? Math.round((exp.unitCost || 0) * baselineGuestTarget)
      : Math.max(0, Math.round(exp.estimatedAmount || 0));

    // Scenario projected amount
    const scenarioExp = isVariable
      ? Math.round((exp.unitCost || 0) * scenarioGuestTarget)
      : Math.max(0, Math.round(exp.estimatedAmount || 0));

    baselineTotalProjected += baselineExp;
    scenarioTotalProjected += scenarioExp;

    if (isVariable) {
      variableProjectedCost += scenarioExp;
    } else {
      fixedProjectedCost += scenarioExp;
    }

    // Accumulate into category
    const catEntry = categoryMap.get(exp.categoryId);
    if (catEntry) {
      catEntry.baselineProjected += baselineExp;
      catEntry.scenarioProjected += scenarioExp;
      if (isVariable) {
        catEntry.variableCost += scenarioExp;
      } else {
        catEntry.fixedCost += scenarioExp;
      }
    }
  }

  const baselineTotalAllocated = categories.reduce(
    (sum, c) => sum + Math.max(0, Math.round(c.allocatedAmount || 0)),
    0
  );

  const categoryImpacts: ScenarioCategoryImpact[] = Array.from(categoryMap.entries()).map(
    ([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      allocatedAmount: data.allocated,
      baselineProjected: data.baselineProjected,
      scenarioProjected: data.scenarioProjected,
      projectedDelta: data.scenarioProjected - data.baselineProjected,
      fixedCost: data.fixedCost,
      variableCost: data.variableCost,
      isOverAllocated: data.scenarioProjected > data.allocated,
    })
  );

  // 2. Vendor Commitments & Payment Tracking (Active Vendors Only, Per-Vendor Balances)
  let totalCommittedContract = 0;
  let totalPaidToDate = 0;
  let remainingContractBalance = 0;
  const vendors = event.vendors || [];
  const activeVendors = vendors.filter((v) => v.status !== 'cancelled');

  for (const v of activeVendors) {
    const agreed =
      typeof v.agreedCost === 'number' && Number.isFinite(v.agreedCost)
        ? Math.max(0, Math.round(v.agreedCost))
        : 0;

    // W3-08: Canonical paid amount resolution.
    // If amountPaid is defined as a finite number, use it. Otherwise fall back to depositPaid.
    const paid = Math.max(
      0,
      typeof v.amountPaid === 'number' && Number.isFinite(v.amountPaid)
        ? Math.round(v.amountPaid)
        : typeof v.depositPaid === 'number' && Number.isFinite(v.depositPaid)
        ? Math.round(v.depositPaid)
        : 0
    );

    totalCommittedContract += agreed;
    totalPaidToDate += paid;

    // W3-05: Calculate outstanding balance per vendor to prevent negative netting
    const vendorRemaining = Math.max(0, agreed - paid);
    remainingContractBalance += vendorRemaining;
  }

  // 3. Uncommitted Projected Cost & Discrepancy Warnings (W3-06)
  // Projected expenses in categories that exceed vendor contracts or have no contracts
  let uncommittedProjectedCost = 0;
  const contractDiscrepancyCategories: ContractDiscrepancy[] = [];

  for (const cat of categoryImpacts) {
    const linkedVendors = activeVendors.filter((v) => v.linkedCategoryId === cat.categoryId);
    const linkedAgreed = linkedVendors.reduce(
      (sum, v) => sum + (typeof v.agreedCost === 'number' ? Math.max(0, Math.round(v.agreedCost)) : 0),
      0
    );

    if (linkedAgreed > cat.scenarioProjected) {
      const discrepancy = linkedAgreed - cat.scenarioProjected;
      contractDiscrepancyCategories.push({
        categoryName: cat.categoryName,
        agreed: linkedAgreed,
        projected: cat.scenarioProjected,
        discrepancy,
      });
      warnings.push(
        `Agreed vendor contracts in "${cat.categoryName}" (₹${linkedAgreed.toLocaleString(
          'en-IN'
        )}) exceed scenario projected spend (₹${cat.scenarioProjected.toLocaleString(
          'en-IN'
        )}) by ₹${discrepancy.toLocaleString('en-IN')}.`
      );
    }

    const uncommitted = Math.max(0, cat.scenarioProjected - linkedAgreed);
    uncommittedProjectedCost += uncommitted;
  }

  // W3-06: Check for active vendors without a valid category link
  const knownCategoryIds = new Set(categories.map((c) => c.id));
  let unlinkedContractCommitment = 0;
  for (const v of activeVendors) {
    if (!v.linkedCategoryId || !knownCategoryIds.has(v.linkedCategoryId)) {
      const agreed =
        typeof v.agreedCost === 'number' && Number.isFinite(v.agreedCost)
          ? Math.max(0, Math.round(v.agreedCost))
          : 0;
      unlinkedContractCommitment += agreed;
    }
  }

  if (unlinkedContractCommitment > 0) {
    warnings.push(
      `Unlinked vendor contracts total ₹${unlinkedContractCommitment.toLocaleString(
        'en-IN'
      )} across active vendors with no matching budget category.`
    );
  }

  // 4. Summaries and Derived Metrics
  const scenarioTotalAllocated = categoryImpacts.reduce(
    (sum, c) => sum + c.allocatedAmount,
    0
  );
  const isOverAllocated = scenarioTotalAllocated > scenarioBudgetCap;
  const allocationGap = Math.max(0, scenarioTotalAllocated - scenarioBudgetCap);

  if (isOverAllocated) {
    warnings.push(
      `Category allocations (₹${scenarioTotalAllocated.toLocaleString(
        'en-IN'
      )}) exceed the scenario budget cap (₹${scenarioBudgetCap.toLocaleString(
        'en-IN'
      )}) by ₹${allocationGap.toLocaleString('en-IN')}.`
    );
  }

  const baselineHeadroom = baselineBudgetCap - baselineTotalProjected;
  const scenarioHeadroom = scenarioBudgetCap - scenarioTotalProjected;
  const scenarioShortfall = Math.max(0, scenarioTotalProjected - scenarioBudgetCap);

  const baselineCostPerGuest =
    baselineGuestTarget > 0 ? Math.round(baselineTotalProjected / baselineGuestTarget) : 0;
  const scenarioCostPerGuest =
    scenarioGuestTarget > 0 ? Math.round(scenarioTotalProjected / scenarioGuestTarget) : 0;

  const budgetCapDelta = scenarioBudgetCap - baselineBudgetCap;
  const guestTargetDelta = scenarioGuestTarget - baselineGuestTarget;
  const projectedCostDelta = scenarioTotalProjected - baselineTotalProjected;
  const headroomDelta = scenarioHeadroom - baselineHeadroom;

  // Identify top category contributing to overage or savings
  let topImpactCategory: { categoryName: string; delta: number } | undefined;
  if (categoryImpacts.length > 0) {
    const sorted = [...categoryImpacts].sort(
      (a, b) => Math.abs(b.projectedDelta) - Math.abs(a.projectedDelta)
    );
    if (sorted[0] && Math.abs(sorted[0].projectedDelta) > 0) {
      topImpactCategory = {
        categoryName: sorted[0].categoryName,
        delta: sorted[0].projectedDelta,
      };
    }
  }

  if (scenarioShortfall > 0) {
    warnings.push(
      `Scenario projected costs exceed the budget cap by ₹${scenarioShortfall.toLocaleString(
        'en-IN'
      )}; trade-offs or allocation adjustments are required.`
    );
  }

  return {
    baselineBudgetCap,
    baselineGuestTarget,
    baselineTotalProjected,
    baselineTotalAllocated,
    baselineCostPerGuest,
    baselineHeadroom,

    scenarioBudgetCap,
    scenarioGuestTarget,
    scenarioTotalProjected,
    scenarioTotalAllocated,
    scenarioCostPerGuest,
    scenarioHeadroom,
    scenarioShortfall,
    isOverAllocated,
    allocationGap,

    budgetCapDelta,
    guestTargetDelta,
    projectedCostDelta,
    headroomDelta,

    fixedProjectedCost,
    variableProjectedCost,

    totalCommittedContract,
    totalPaidToDate,
    remainingContractBalance,
    uncommittedProjectedCost,
    historicalActualSpend,
    unlinkedContractCommitment,
    contractDiscrepancyCategories,

    categoryImpacts,
    topImpactCategory,

    currency: event.currency,
    warnings,
  };
}
