/**
 * Event Pilot Deterministic Replanning Engine
 * Pure application logic for multi-variable impact calculation,
 * granular proposal synthesis, dependency validation, and safe state transitions.
 * Guaranteed: Zero side effects, strict adherence to financial and date invariants.
 */

import { Event, ChecklistTask } from '../events/types';
import { calculateMilestoneDate, reanchorTimelineOnDateChange } from '../events/timeline-engine';
import { calculateScenarioFinancials } from '../tradeoffs/scenario-engine';
import { generateTradeOffOptions } from '../tradeoffs/tradeoff-generator';
import { validateEventInput } from '../events/validation';
import {
  ApplyReplanningResult,
  ProposalValidationResult,
  ReplanningAttendanceImpact,
  ReplanningFlaggedTask,
  ReplanningFullImpact,
  ReplanningInput,
  ReplanningPlan,
  ReplanningProposal,
  ReplanningSchedulingImpact,
  ReplanningTrigger,
} from './types';

/**
 * Calculates calendar day delta between two YYYY-MM-DD strings.
 */
function calculateDayDelta(dateA: string, dateB: string): number {
  const tA = new Date(dateA + 'T00:00:00Z').getTime();
  const tB = new Date(dateB + 'T00:00:00Z').getTime();
  return Math.round((tA - tB) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates whether a due date falls in an urgent window (within 7 days of today).
 */
function isTaskUrgent(dueDateStr: string, todayStr: string): boolean {
  if (dueDateStr < todayStr) return false; // Overdue, not merely urgent
  const delta = calculateDayDelta(dueDateStr, todayStr);
  return delta >= 0 && delta <= 7;
}

/**
 * Generates a complete deterministic replanning plan with granular proposals and impact summaries.
 */
export function generateReplanningPlan(
  event: Event,
  input: ReplanningInput
): ReplanningPlan {
  const originalEventUpdatedAt = event.updatedAt || new Date().toISOString();
  const originalEventVersion =
    typeof event.version === 'number' && event.version > 0 ? event.version : 1;
  const todayStr = new Date().toISOString().slice(0, 10);
  const triggers: ReplanningTrigger[] = [];
  const warnings: string[] = [];
  const proposals: ReplanningProposal[] = [];

  const baselineBudgetCap = Math.max(0, Math.round(event.budgetCap || 0));
  const baselineGuestTarget = Math.max(0, Math.round(event.guestTarget || 0));
  const baselineDate = event.date;

  const candidateDate = input.candidateDate && input.candidateDate.trim() ? input.candidateDate.trim() : baselineDate;
  const isDateChanged = candidateDate !== baselineDate;
  if (isDateChanged) triggers.push('date_change');

  const candidateGuestTarget =
    typeof input.candidateGuestTarget === 'number' && Number.isFinite(input.candidateGuestTarget) && input.candidateGuestTarget >= 0
      ? Math.round(input.candidateGuestTarget)
      : baselineGuestTarget;
  const isGuestsChanged = candidateGuestTarget !== baselineGuestTarget;
  if (isGuestsChanged) triggers.push('guest_target_change');

  const candidateBudgetCap =
    typeof input.candidateBudgetCap === 'number' && Number.isFinite(input.candidateBudgetCap) && input.candidateBudgetCap > 0
      ? Math.round(input.candidateBudgetCap)
      : baselineBudgetCap;
  const isBudgetChanged = candidateBudgetCap !== baselineBudgetCap;
  if (isBudgetChanged) triggers.push('budget_cap_change');

  if (input.candidateCategoryAllocations && Object.keys(input.candidateCategoryAllocations).length > 0) {
    triggers.push('category_allocation_change');
  }

  if (input.candidateExpenseAdjustments && Object.keys(input.candidateExpenseAdjustments).length > 0) {
    triggers.push('expense_adjustment');
  }

  if (input.selectedTradeOffIds && input.selectedTradeOffIds.length > 0) {
    triggers.push('tradeoff_recommendation');
  }

  if (triggers.length > 1) {
    triggers.push('composite_replan');
  }

  // 1. Financial Impact & Trade-Offs (reusing Workstream 3.1 Scenario Engine)
  const scenarioFinancials = calculateScenarioFinancials(event, {
    guestTarget: candidateGuestTarget,
    budgetCap: candidateBudgetCap,
    categoryAllocations: input.candidateCategoryAllocations,
  });

  const tradeOffOptions = generateTradeOffOptions(event, scenarioFinancials);

  // 2. Scheduling & Task Impact
  let calendarDateShiftDays = 0;
  let milestonesShiftedCount = 0;
  let tasksShiftedCount = 0;
  let overdueTasksCount = 0;
  let urgentTasksCount = 0;
  let preservedManualOverridesCount = 0;
  let preservedCompletedTasksCount = 0;
  const flaggedTasks: ReplanningFlaggedTask[] = [];

  const milestones = event.milestones || [];
  const tasks = event.tasks || [];
  const milestoneMap = new Map(milestones.map((m) => [m.id, m]));

  if (isDateChanged) {
    calendarDateShiftDays = calculateDayDelta(candidateDate, baselineDate);
    milestonesShiftedCount = milestones.length;

    for (const task of tasks) {
      if (task.status === 'completed') {
        preservedCompletedTasksCount++;
        continue;
      }

      if (task.isDueDateOverridden) {
        preservedManualOverridesCount++;
        continue;
      }

      if (task.milestoneId && milestoneMap.has(task.milestoneId)) {
        const milestone = milestoneMap.get(task.milestoneId)!;
        const newDueDate = calculateMilestoneDate(candidateDate, milestone.offsetDays);

        if (newDueDate !== task.dueDate) {
          tasksShiftedCount++;
          const isOverdue = newDueDate < todayStr;
          const isUrgent = isTaskUrgent(newDueDate, todayStr);

          if (isOverdue) overdueTasksCount++;
          if (isUrgent) urgentTasksCount++;

          if (isOverdue || isUrgent) {
            flaggedTasks.push({
              taskId: task.id,
              title: task.title,
              previousDueDate: task.dueDate,
              newDueDate,
              isOverdue,
              isUrgent,
            });
          }
        }
      }
    }

    if (overdueTasksCount > 0) {
      warnings.push(
        `${overdueTasksCount} task deadline(s) fall in the past under the proposed celebration date.`
      );
    }
  }

  const schedulingImpact: ReplanningSchedulingImpact = {
    calendarDateShiftDays,
    milestonesShiftedCount,
    tasksShiftedCount,
    overdueTasksCount,
    urgentTasksCount,
    preservedManualOverridesCount,
    preservedCompletedTasksCount,
    flaggedTasks,
  };

  // 3. Attendance & Seating Impact
  const tables = event.tables || [];
  const totalTableCapacity = tables.reduce(
    (sum, t) => sum + (typeof t.capacity === 'number' && Number.isFinite(t.capacity) ? t.capacity : 0),
    0
  );
  const capacityShortfall = Math.max(0, candidateGuestTarget - totalTableCapacity);
  const isCapacityExceeded = totalTableCapacity > 0 && candidateGuestTarget > totalTableCapacity;

  if (isCapacityExceeded) {
    warnings.push(
      `Proposed guest count (${candidateGuestTarget}) exceeds current table seating capacity (${totalTableCapacity}) by ${capacityShortfall} seats.`
    );
  }

  const attendanceImpact: ReplanningAttendanceImpact = {
    baselineGuestTarget,
    candidateGuestTarget,
    guestDelta: candidateGuestTarget - baselineGuestTarget,
    totalTableCapacity,
    capacityShortfall,
    isCapacityExceeded,
  };

  // 4. Synthesize Granular Proposals with Explicit Dependencies

  // A. Event Date Proposal
  if (isDateChanged) {
    proposals.push({
      id: 'prop-date-shift',
      entity: 'event',
      field: 'date',
      title: `Reschedule Celebration Date (${calendarDateShiftDays > 0 ? `+${calendarDateShiftDays}` : calendarDateShiftDays} days)`,
      explanation: `Shift celebration date from ${baselineDate} to ${candidateDate}.`,
      previousValue: baselineDate,
      proposedValue: candidateDate,
      impactDescription: `Re-anchors ${milestonesShiftedCount} milestones and ${tasksShiftedCount} dependent task deadlines. Preserves ${preservedManualOverridesCount} manual overrides and ${preservedCompletedTasksCount} completed tasks.`,
      status: 'staged',
      originalEventUpdatedAt,
      originalEventVersion,
      expectedCurrentValue: baselineDate,
    });

    // Sub-proposals: Task shifts dependent on date shift
    for (const task of tasks) {
      if (task.status === 'completed' || task.isDueDateOverridden) continue;
      if (task.milestoneId && milestoneMap.has(task.milestoneId)) {
        const milestone = milestoneMap.get(task.milestoneId)!;
        const newDueDate = calculateMilestoneDate(candidateDate, milestone.offsetDays);
        if (newDueDate !== task.dueDate) {
          const isOverdue = newDueDate < todayStr;
          proposals.push({
            id: `prop-task-${task.id}`,
            entity: 'task',
            entityId: task.id,
            field: 'dueDate',
            title: `Reschedule Task: ${task.title}`,
            explanation: `Anchored to milestone "${milestone.title}" (${milestone.offsetDays} days from celebration).`,
            previousValue: task.dueDate,
            proposedValue: newDueDate,
            impactDescription: isOverdue
              ? `Warning: Due date moves to ${newDueDate}, which is already past.`
              : `Due date shifts from ${task.dueDate} to ${newDueDate}.`,
            dependsOnProposalIds: ['prop-date-shift'],
            status: 'staged',
            originalEventUpdatedAt,
            originalEventVersion,
            expectedCurrentValue: task.dueDate,
          });
        }
      }
    }
  }

  // B. Guest Target Proposal
  if (isGuestsChanged) {
    proposals.push({
      id: 'prop-guest-target',
      entity: 'event',
      field: 'guestTarget',
      title: `Adjust Attendance Target (${candidateGuestTarget > baselineGuestTarget ? `+${candidateGuestTarget - baselineGuestTarget}` : candidateGuestTarget - baselineGuestTarget} guests)`,
      explanation: `Update planned attendance from ${baselineGuestTarget} to ${candidateGuestTarget} guests.`,
      previousValue: baselineGuestTarget,
      proposedValue: candidateGuestTarget,
      impactDescription: `Updates derived cost per guest to ₹${scenarioFinancials.scenarioCostPerGuest.toLocaleString(
        'en-IN'
      )}/guest and automatically rescales guest-dependent catering expenses.`,
      status: 'staged',
      originalEventUpdatedAt,
      originalEventVersion,
      expectedCurrentValue: baselineGuestTarget,
    });

    // Sub-proposals: Per-guest variable expenses dependent on guest count
    const expenses = event.expenses || [];
    for (const exp of expenses) {
      if (exp.costModel === 'per_guest' && typeof exp.unitCost === 'number' && exp.unitCost > 0) {
        const newEstimated = Math.round(exp.unitCost * candidateGuestTarget);
        if (newEstimated !== exp.estimatedAmount) {
          proposals.push({
            id: `prop-exp-variable-${exp.id}`,
            entity: 'expense',
            entityId: exp.id,
            field: 'estimatedAmount',
            title: `Scale Catering: ${exp.title}`,
            explanation: `Calculated from rate of ₹${exp.unitCost.toLocaleString('en-IN')}/guest × ${candidateGuestTarget} guests.`,
            previousValue: exp.estimatedAmount,
            proposedValue: newEstimated,
            impactDescription: `Projected spend adjusts from ₹${exp.estimatedAmount.toLocaleString(
              'en-IN'
            )} to ₹${newEstimated.toLocaleString('en-IN')}.`,
            dependsOnProposalIds: ['prop-guest-target'],
            status: 'staged',
            originalEventUpdatedAt,
            originalEventVersion,
            expectedCurrentValue: exp.estimatedAmount,
          });
        }
      }
    }
  }

  // C. Budget Cap Proposal
  if (isBudgetChanged) {
    const budgetDelta = candidateBudgetCap - baselineBudgetCap;
    proposals.push({
      id: 'prop-budget-cap',
      entity: 'event',
      field: 'budgetCap',
      title: `Update Budget Cap (${budgetDelta > 0 ? `+₹${budgetDelta.toLocaleString('en-IN')}` : `₹${budgetDelta.toLocaleString('en-IN')}`})`,
      explanation: `Set overall celebration budget cap to ₹${candidateBudgetCap.toLocaleString('en-IN')}.`,
      previousValue: baselineBudgetCap,
      proposedValue: candidateBudgetCap,
      impactDescription: scenarioFinancials.scenarioHeadroom >= 0
        ? `Provides ₹${scenarioFinancials.scenarioHeadroom.toLocaleString('en-IN')} headroom against projected costs.`
        : `Results in ₹${scenarioFinancials.scenarioShortfall.toLocaleString('en-IN')} deficit against projected costs.`,
      status: 'staged',
      originalEventUpdatedAt,
      originalEventVersion,
      expectedCurrentValue: baselineBudgetCap,
    });
  }

  // D. Category Allocations Proposals
  if (input.candidateCategoryAllocations) {
    const categories = event.categories || [];
    for (const cat of categories) {
      const candidateAlloc = input.candidateCategoryAllocations[cat.id];
      if (
        typeof candidateAlloc === 'number' &&
        Number.isFinite(candidateAlloc) &&
        candidateAlloc >= 0 &&
        Math.round(candidateAlloc) !== cat.allocatedAmount
      ) {
        const proposedAlloc = Math.round(candidateAlloc);
        proposals.push({
          id: `prop-alloc-${cat.id}`,
          entity: 'category',
          entityId: cat.id,
          field: 'allocatedAmount',
          title: `Rebalance Category: ${cat.name}`,
          explanation: `Adjust allocated allowance envelope from ₹${cat.allocatedAmount.toLocaleString(
            'en-IN'
          )} to ₹${proposedAlloc.toLocaleString('en-IN')}.`,
          previousValue: cat.allocatedAmount,
          proposedValue: proposedAlloc,
          impactDescription: `Envelope shifts by ₹${(proposedAlloc - cat.allocatedAmount).toLocaleString('en-IN')}.`,
          status: 'staged',
          originalEventUpdatedAt,
          originalEventVersion,
          expectedCurrentValue: cat.allocatedAmount,
        });
      }
    }
  }

  // E. Trade-Off Recommendations Proposals (Respecting W3-02 contract locks & W3-03 actuals floors)
  if (input.selectedTradeOffIds && input.selectedTradeOffIds.length > 0) {
    for (const tradeOffId of input.selectedTradeOffIds) {
      const option = tradeOffOptions.find((o) => o.id === tradeOffId);
      if (option && option.targetExpenseId && typeof option.proposedAmount === 'number') {
        const exp = (event.expenses || []).find((e) => e.id === option.targetExpenseId);
        if (exp) {
          proposals.push({
            id: `prop-tradeoff-${option.id}`,
            entity: 'expense',
            entityId: exp.id,
            field: 'estimatedAmount',
            title: `Trade-Off: ${option.title}`,
            explanation: option.description,
            previousValue: option.currentAmount,
            proposedValue: option.proposedAmount,
            impactDescription: `Saves ₹${option.estimatedSavings.toLocaleString(
              'en-IN'
            )}. ${option.assumptions}`,
            status: 'staged',
            originalEventUpdatedAt,
            originalEventVersion,
            expectedCurrentValue: exp.estimatedAmount,
          });
        }
      }
    }
  }

  const fullImpact: ReplanningFullImpact = {
    financials: scenarioFinancials,
    scheduling: schedulingImpact,
    attendance: attendanceImpact,
    triggers,
    warnings: [...warnings, ...scenarioFinancials.warnings],
  };

  return {
    proposals,
    impact: fullImpact,
    tradeOffOptions,
    generatedAt: new Date().toISOString(),
    originalEventUpdatedAt,
  };
}

/**
 * Validates selected proposal IDs against dependency constraints, entity presence, and concurrency freshness.
 */
export function validateSelectedProposals(
  event: Event,
  proposals: ReplanningProposal[],
  selectedIds: string[]
): ProposalValidationResult {
  const errors: string[] = [];
  const selectedSet = new Set(selectedIds);
  const proposalMap = new Map(proposals.map((p) => [p.id, p]));
  const validSelectedIds: string[] = [];

  for (const id of selectedIds) {
    const proposal = proposalMap.get(id);
    if (!proposal) {
      errors.push(`Proposal "${id}" is not recognized in the current replanning plan.`);
      continue;
    }

    // 1. Concurrency freshness check (timestamp and monotonic version)
    const isTimestampStale =
      event.updatedAt &&
      proposal.originalEventUpdatedAt &&
      event.updatedAt !== proposal.originalEventUpdatedAt;
    const isVersionStale =
      typeof event.version === 'number' &&
      typeof proposal.originalEventVersion === 'number' &&
      event.version !== proposal.originalEventVersion;

    if (isTimestampStale || isVersionStale) {
      errors.push(
        `Celebration was modified in another session (last updated ${event.updatedAt || `v${event.version}`}). Please recalculate proposals.`
      );
      break;
    }

    // 2. Dependency resolution check
    if (proposal.dependsOnProposalIds && proposal.dependsOnProposalIds.length > 0) {
      let missingDep = false;
      for (const depId of proposal.dependsOnProposalIds) {
        if (!selectedSet.has(depId)) {
          const parent = proposalMap.get(depId);
          errors.push(
            `"${proposal.title}" cannot be applied without prerequisite "${parent?.title || depId}".`
          );
          missingDep = true;
        }
      }
      if (missingDep) continue;
    }

    // 3. Entity and expectedCurrentValue verification
    if (proposal.entity === 'expense' && proposal.entityId) {
      const exp = (event.expenses || []).find((e) => e.id === proposal.entityId);
      if (!exp) {
        errors.push(`Expense "${proposal.title}" no longer exists in celebration ledger.`);
        continue;
      }
      if (
        proposal.expectedCurrentValue !== undefined &&
        exp[proposal.field as keyof typeof exp] !== proposal.expectedCurrentValue
      ) {
        errors.push(
          `Expense "${exp.title}" was modified in the workspace since proposal was generated.`
        );
        continue;
      }
    } else if (proposal.entity === 'category' && proposal.entityId) {
      const cat = (event.categories || []).find((c) => c.id === proposal.entityId);
      if (!cat) {
        errors.push(`Category "${proposal.title}" no longer exists in celebration ledger.`);
        continue;
      }
      if (
        proposal.expectedCurrentValue !== undefined &&
        cat[proposal.field as keyof typeof cat] !== proposal.expectedCurrentValue
      ) {
        errors.push(
          `Category "${cat.name}" was modified in the workspace since proposal was generated.`
        );
        continue;
      }
    } else if (proposal.entity === 'task' && proposal.entityId) {
      const task = (event.tasks || []).find((t) => t.id === proposal.entityId);
      if (!task) {
        errors.push(`Task "${proposal.title}" no longer exists in timeline.`);
        continue;
      }
      if (
        proposal.expectedCurrentValue !== undefined &&
        task[proposal.field as keyof typeof task] !== proposal.expectedCurrentValue
      ) {
        errors.push(
          `Task "${task.title}" was modified in the workspace since proposal was generated.`
        );
        continue;
      }
    }

    validSelectedIds.push(id);
  }

  return {
    isValid: errors.length === 0,
    errors,
    validSelectedIds,
  };
}

/**
 * Deterministically applies selected replanning proposals to the event model.
 * Produces a validated updated Event snapshot without mutating unselected fields.
 */
export function applyReplanningProposals(
  event: Event,
  proposals: ReplanningProposal[],
  selectedIds: string[]
): ApplyReplanningResult {
  const validation = validateSelectedProposals(event, proposals, selectedIds);
  if (!validation.isValid) {
    return {
      success: false,
      event,
      appliedProposalIds: [],
      error: validation.errors.join(' '),
      code: validation.errors.some((e) => e.includes('another session'))
        ? 'CONCURRENCY_CONFLICT'
        : 'DEPENDENCY_MISSING',
    };
  }

  const now = new Date().toISOString();
  const selectedProposalList = proposals.filter((p) => validation.validSelectedIds.includes(p.id));

  let updatedDate = event.date;
  let updatedGuestTarget = event.guestTarget;
  let updatedBudgetCap = event.budgetCap;
  let updatedCategories = event.categories ? [...event.categories] : [];
  let updatedExpenses = event.expenses ? [...event.expenses] : [];
  let updatedMilestones = event.milestones ? [...event.milestones] : [];
  let updatedTasks = event.tasks ? [...event.tasks] : [];

  for (const proposal of selectedProposalList) {
    if (proposal.entity === 'event') {
      if (proposal.field === 'date' && typeof proposal.proposedValue === 'string') {
        updatedDate = proposal.proposedValue;
      } else if (proposal.field === 'guestTarget' && typeof proposal.proposedValue === 'number') {
        updatedGuestTarget = proposal.proposedValue;
      } else if (proposal.field === 'budgetCap' && typeof proposal.proposedValue === 'number') {
        updatedBudgetCap = proposal.proposedValue;
      }
    } else if (proposal.entity === 'category' && proposal.entityId) {
      if (proposal.field === 'allocatedAmount' && typeof proposal.proposedValue === 'number') {
        updatedCategories = updatedCategories.map((c) =>
          c.id === proposal.entityId ? { ...c, allocatedAmount: proposal.proposedValue as number } : c
        );
      }
    } else if (proposal.entity === 'expense' && proposal.entityId) {
      if (proposal.field === 'estimatedAmount' && typeof proposal.proposedValue === 'number') {
        updatedExpenses = updatedExpenses.map((exp) => {
          if (exp.id === proposal.entityId) {
            // If expense has unitCost, update unit cost if guestTarget changed
            let newUnitCost = exp.unitCost;
            if (exp.costModel === 'per_guest' && exp.unitCost && updatedGuestTarget > 0) {
              newUnitCost = Math.round((proposal.proposedValue as number) / updatedGuestTarget);
            }
            return {
              ...exp,
              estimatedAmount: proposal.proposedValue as number,
              unitCost: newUnitCost,
              updatedAt: now,
            };
          }
          return exp;
        });
      }
    } else if (proposal.entity === 'task' && proposal.entityId) {
      if (proposal.field === 'dueDate' && typeof proposal.proposedValue === 'string') {
        updatedTasks = updatedTasks.map((t) =>
          t.id === proposal.entityId
            ? { ...t, dueDate: proposal.proposedValue as string, updatedAt: now }
            : t
        );
      }
    }
  }

  const updatedCandidate: Event = {
    ...event,
    date: updatedDate,
    guestTarget: updatedGuestTarget,
    budgetCap: updatedBudgetCap,
    categories: updatedCategories,
    expenses: updatedExpenses,
    milestones: updatedMilestones,
    tasks: updatedTasks,
    version: typeof event.version === 'number' && event.version > 0 ? event.version : 1,
    updatedAt: now,
  };

  // Run canonical event validation
  const eventValidation = validateEventInput({
    type: updatedCandidate.type,
    title: updatedCandidate.title,
    date: updatedCandidate.date,
    location: updatedCandidate.location,
    guestTarget: updatedCandidate.guestTarget,
    budgetCap: updatedCandidate.budgetCap,
    currency: updatedCandidate.currency,
    culturalContext: updatedCandidate.culturalContext,
    preferences: updatedCandidate.preferences,
  });

  if (!eventValidation.isValid) {
    return {
      success: false,
      event,
      appliedProposalIds: [],
      error: Object.values(eventValidation.errors).join(' '),
      code: 'VALIDATION_ERROR',
    };
  }

  return {
    success: true,
    event: updatedCandidate,
    appliedProposalIds: validation.validSelectedIds,
  };
}
