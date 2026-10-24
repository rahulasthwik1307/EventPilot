/**
 * Event Pilot Deterministic Trade-Off & Scenario Engine Types
 * Pure domain interfaces for variable-cost calculations, commitments, and trade-off options.
 */

import { CurrencyCode } from '../events/types';

export interface ScenarioInput {
  budgetCap?: number;
  guestTarget?: number;
  categoryAllocations?: Record<string, number>;
}

export interface ScenarioCategoryImpact {
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  baselineProjected: number;
  scenarioProjected: number;
  projectedDelta: number; // scenarioProjected - baselineProjected
  fixedCost: number;
  variableCost: number;
  isOverAllocated: boolean; // scenarioProjected > allocatedAmount
}

export interface ContractDiscrepancy {
  categoryName: string;
  agreed: number;
  projected: number;
  discrepancy: number;
}

export interface ScenarioFinancials {
  // Baseline snapshot
  baselineBudgetCap: number;
  baselineGuestTarget: number;
  baselineTotalProjected: number;
  baselineTotalAllocated: number;
  baselineCostPerGuest: number;
  baselineHeadroom: number; // baselineBudgetCap - baselineTotalProjected

  // Scenario snapshot
  scenarioBudgetCap: number;
  scenarioGuestTarget: number;
  scenarioTotalProjected: number;
  scenarioTotalAllocated: number;
  scenarioCostPerGuest: number;
  scenarioHeadroom: number; // scenarioBudgetCap - scenarioTotalProjected
  scenarioShortfall: number; // Math.max(0, scenarioTotalProjected - scenarioBudgetCap)
  isOverAllocated: boolean; // scenarioTotalAllocated > scenarioBudgetCap (W3-07)
  allocationGap: number; // Math.max(0, scenarioTotalAllocated - scenarioBudgetCap) (W3-07)

  // Deltas
  budgetCapDelta: number; // scenarioBudgetCap - baselineBudgetCap
  guestTargetDelta: number; // scenarioGuestTarget - baselineGuestTarget
  projectedCostDelta: number; // scenarioTotalProjected - baselineTotalProjected
  headroomDelta: number; // scenarioHeadroom - baselineHeadroom

  // Cost model breakdown under scenario
  fixedProjectedCost: number;
  variableProjectedCost: number;

  // Commitments & actuals (never altered by scenario simulations)
  totalCommittedContract: number; // Sum of agreed vendor contracts (active only)
  totalPaidToDate: number; // Sum of recorded payments
  remainingContractBalance: number; // Per-vendor remaining balance: sum(max(0, agreed - paid)) (W3-05)
  uncommittedProjectedCost: number; // Projected expenses not tied to agreed contracts
  historicalActualSpend: number; // Sum of recorded actual expense amounts
  unlinkedContractCommitment: number; // Active agreed vendor contracts not matched to any budget category (W3-06)
  contractDiscrepancyCategories: ContractDiscrepancy[]; // Categories where agreed > scenarioProjected (W3-06)

  // Category breakdown
  categoryImpacts: ScenarioCategoryImpact[];

  // Top category contributing to overage or savings
  topImpactCategory?: {
    categoryName: string;
    delta: number;
  };

  // Currency
  currency: CurrencyCode;

  // Caveats, assumptions, and explicit warnings
  warnings: string[];
}

export type TradeOffImpactType =
  | 'budget_reduction'
  | 'allocation_shift'
  | 'guest_scaling'
  | 'scope_adjustment';

export interface TradeOffOption {
  id: string;
  title: string;
  description: string;
  impactType: TradeOffImpactType;
  targetCategoryName?: string;
  targetExpenseId?: string;
  currentAmount: number;
  proposedAmount: number;
  estimatedSavings: number;
  isSavingsProjected: boolean; // true if projected estimate, false if contractual
  assumptions: string;
  isConflictWithPreference: boolean;
  preferenceConflictReason?: string;
  affectsNonNegotiable: boolean;
  isEconomizeArea: boolean;
  isSpendingPriority: boolean;
  applied: boolean;
}
