/**
 * Event Pilot Dynamic Replanning Domain Types
 * Canonical interfaces for multi-variable replanning, granular proposals,
 * dependency tracking, and multi-domain impact summaries.
 */

import { CurrencyCode, Event } from '../events/types';
import { ScenarioFinancials, TradeOffOption } from '../tradeoffs/types';

export type ReplanningTrigger =
  | 'date_change'
  | 'guest_target_change'
  | 'budget_cap_change'
  | 'category_allocation_change'
  | 'expense_adjustment'
  | 'tradeoff_recommendation'
  | 'composite_replan';

export interface ReplanningInput {
  candidateDate?: string;
  candidateGuestTarget?: number;
  candidateBudgetCap?: number;
  candidateCategoryAllocations?: Record<string, number>;
  candidateExpenseAdjustments?: Record<string, number>; // expenseId -> proposedAmount
  selectedTradeOffIds?: string[];
}

export type ReplanningProposalEntity =
  | 'event'
  | 'category'
  | 'expense'
  | 'milestone'
  | 'task';

export interface ReplanningProposal {
  id: string; // Stable identifier, e.g., 'prop-date-shift', 'prop-task-123', 'prop-exp-456'
  entity: ReplanningProposalEntity;
  entityId?: string; // ID of the specific category, expense, or task (undefined for event-level)
  field: string; // e.g., 'date', 'guestTarget', 'budgetCap', 'dueDate', 'allocatedAmount', 'estimatedAmount'
  title: string;
  explanation: string; // Why this change was suggested or derived
  previousValue: unknown;
  proposedValue: unknown;
  impactDescription: string; // Human-readable summary of consequences
  dependsOnProposalIds?: string[]; // IDs of prerequisite proposals that must also be selected
  status: 'staged' | 'accepted' | 'rejected' | 'conflict';
  conflictReason?: string;
  originalEventUpdatedAt: string; // Snapshot timestamp when proposal was generated
  originalEventVersion?: number; // Snapshot monotonic sequence version when proposal was generated
  expectedCurrentValue?: unknown; // Snapshot value of the target field to detect concurrent modifications
}

export interface ReplanningFlaggedTask {
  taskId: string;
  title: string;
  previousDueDate: string;
  newDueDate: string;
  isOverdue: boolean;
  isUrgent: boolean; // Due within 7 days of today
}

export interface ReplanningSchedulingImpact {
  calendarDateShiftDays: number;
  milestonesShiftedCount: number;
  tasksShiftedCount: number;
  overdueTasksCount: number;
  urgentTasksCount: number;
  preservedManualOverridesCount: number;
  preservedCompletedTasksCount: number;
  flaggedTasks: ReplanningFlaggedTask[];
}

export interface ReplanningAttendanceImpact {
  baselineGuestTarget: number;
  candidateGuestTarget: number;
  guestDelta: number;
  totalTableCapacity: number;
  capacityShortfall: number; // Math.max(0, candidateGuestTarget - totalTableCapacity)
  isCapacityExceeded: boolean;
}

export interface ReplanningFullImpact {
  financials: ScenarioFinancials;
  scheduling: ReplanningSchedulingImpact;
  attendance: ReplanningAttendanceImpact;
  triggers: ReplanningTrigger[];
  warnings: string[];
}

export interface ReplanningPlan {
  proposals: ReplanningProposal[];
  impact: ReplanningFullImpact;
  tradeOffOptions: TradeOffOption[];
  generatedAt: string;
  originalEventUpdatedAt: string;
}

export interface ProposalValidationResult {
  isValid: boolean;
  errors: string[];
  validSelectedIds: string[];
}

export interface ApplyReplanningResult {
  success: boolean;
  event: Event;
  appliedProposalIds: string[];
  error?: string;
  code?: 'VALIDATION_ERROR' | 'CONCURRENCY_CONFLICT' | 'DEPENDENCY_MISSING';
}
