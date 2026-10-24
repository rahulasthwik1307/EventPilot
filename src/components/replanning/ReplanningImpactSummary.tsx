'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Armchair,
  Sliders,
} from 'lucide-react';
import { CurrencyCode } from '../../features/events/types';
import { formatCurrency, formatDateDisplay } from '../../features/events/validation';
import { ReplanningFullImpact } from '../../features/replanning/types';
import { StatusPill } from '../ui/Badge';

export interface ReplanningImpactSummaryProps {
  impact: ReplanningFullImpact;
  currency: CurrencyCode;
  isStale?: boolean;
  onRefreshStale?: () => void;
}

export function ReplanningImpactSummary({
  impact,
  currency,
  isStale = false,
  onRefreshStale,
}: ReplanningImpactSummaryProps) {
  const [showFlaggedTasks, setShowFlaggedTasks] = useState(false);
  const { financials, scheduling, attendance, warnings } = impact;

  const hasFinancialDeficit = financials.scenarioShortfall > 0;
  const isBudgetChanged = financials.budgetCapDelta !== 0;
  const isGuestsChanged = attendance.guestDelta !== 0;
  const isDateChanged = scheduling.calendarDateShiftDays !== 0;

  return (
    <div
      className="space-y-4 text-neutral-text"
      data-testid="replanning-impact-summary"
    >
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-neutral-subtle/80 p-3.5 rounded-lg border border-neutral-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary-subtle text-primary">
            <Sliders className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-text">
              Multi-Domain Impact Analysis
            </h4>
            <p className="text-[11px] text-neutral-muted">
              Deterministic evaluation across financial headroom, chronological deadlines, and seating.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {financials.isOverAllocated && (
            <StatusPill status="warning">
              Allocations: {formatCurrency(financials.allocationGap, currency)} over cap
            </StatusPill>
          )}

          {hasFinancialDeficit ? (
            <StatusPill status="danger">
              Deficit: {formatCurrency(financials.scenarioShortfall, currency)} over cap
            </StatusPill>
          ) : (
            <StatusPill status="success">
              {formatCurrency(financials.scenarioHeadroom, currency)} Headroom
            </StatusPill>
          )}

          {isDateChanged && (
            <StatusPill status="neutral">
              Date: {scheduling.calendarDateShiftDays > 0 ? `+${scheduling.calendarDateShiftDays}d` : `${scheduling.calendarDateShiftDays}d`}
            </StatusPill>
          )}

          {isGuestsChanged && (
            <StatusPill status="neutral">
              Attendance: {attendance.guestDelta > 0 ? `+${attendance.guestDelta}` : attendance.guestDelta}
            </StatusPill>
          )}
        </div>
      </div>

      {/* Stale State Notice */}
      {isStale && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-md bg-status-warning-subtle text-status-warning border border-status-warning/40 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Celebration State Changed Elsewhere</p>
              <p className="opacity-90">
                The underlying celebration was updated since opening this window. Please recalculate impacts to avoid stale overwrites.
              </p>
            </div>
          </div>
          {onRefreshStale && (
            <button
              type="button"
              onClick={onRefreshStale}
              className="px-2.5 py-1 rounded bg-neutral-surface border border-neutral-border text-neutral-text font-semibold hover:bg-neutral-subtle transition-colors shrink-0"
            >
              Recalculate
            </button>
          )}
        </div>
      )}

      {/* Contract & Commitment Discrepancy Warnings */}
      {((financials.contractDiscrepancyCategories && financials.contractDiscrepancyCategories.length > 0) ||
        (financials.unlinkedContractCommitment && financials.unlinkedContractCommitment > 0)) && (
        <div
          data-testid="contract-discrepancy-banner"
          className="p-3 rounded-md bg-status-danger-subtle text-status-danger border border-status-danger/40 text-xs space-y-1.5"
          role="alert"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Contract Commitment Discrepancies</span>
          </div>
          {financials.contractDiscrepancyCategories?.map((cd, idx) => (
            <p key={idx} className="pl-6 text-[11px] leading-relaxed">
              Agreed vendor contracts in &ldquo;{cd.categoryName}&rdquo; ({formatCurrency(cd.agreed, currency)}) exceed scenario projected spend ({formatCurrency(cd.projected, currency)}) by {formatCurrency(cd.discrepancy, currency)}.
            </p>
          ))}
          {financials.unlinkedContractCommitment > 0 && (
            <p className="pl-6 text-[11px] leading-relaxed">
              Active vendor contracts totaling {formatCurrency(financials.unlinkedContractCommitment, currency)} are not linked to any valid budget category.
            </p>
          )}
        </div>
      )}

      {/* Allocation Overage Notice */}
      {financials.isOverAllocated && (
        <div
          data-testid="allocation-overage-alert"
          className="flex items-start gap-2.5 p-3 rounded-md bg-status-warning-subtle text-status-warning border border-status-warning/40 text-xs"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Category Allocations Exceed Budget Cap</p>
            <p className="opacity-90">
              Total category allocations ({formatCurrency(financials.scenarioTotalAllocated, currency)}) exceed the scenario budget cap ({formatCurrency(financials.scenarioBudgetCap, currency)}) by {formatCurrency(financials.allocationGap, currency)}. Category allowance ceilings must be rebalanced.
            </p>
          </div>
        </div>
      )}

      {/* Seating Capacity Warning */}
      {attendance.isCapacityExceeded && (
        <div
          data-testid="seating-capacity-alert"
          className="flex items-start gap-2.5 p-3 rounded-md bg-status-warning-subtle text-status-warning border border-status-warning/40 text-xs"
        >
          <Armchair className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Table Seating Capacity Exceeded</p>
            <p className="opacity-90">
              Target attendance ({attendance.candidateGuestTarget} guests) exceeds current table seating capacity ({attendance.totalTableCapacity} seats) by {attendance.capacityShortfall} seats. Additional seating tables or larger capacities will be required.
            </p>
          </div>
        </div>
      )}

      {/* Scheduling & Deadlines Alert */}
      {isDateChanged && (
        <div
          data-testid="scheduling-impact-card"
          className="p-3.5 rounded-lg bg-neutral-surface border border-neutral-border text-xs space-y-2.5"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-border/60">
            <div className="flex items-center gap-2 font-semibold text-neutral-text">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>Timeline Re-Anchoring Impact</span>
            </div>
            <span className="font-mono text-[11px] text-neutral-muted">
              Shift: {scheduling.calendarDateShiftDays > 0 ? `+${scheduling.calendarDateShiftDays} days` : `${scheduling.calendarDateShiftDays} days`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
            <div className="p-2 rounded bg-neutral-subtle/60 border border-neutral-border/50">
              <span className="block text-sm font-bold text-neutral-text">
                {scheduling.tasksShiftedCount}
              </span>
              <span className="text-[10px] text-neutral-muted font-sans">Tasks Rescheduled</span>
            </div>
            <div className="p-2 rounded bg-neutral-subtle/60 border border-neutral-border/50">
              <span className="block text-sm font-bold text-neutral-text">
                {scheduling.preservedManualOverridesCount}
              </span>
              <span className="text-[10px] text-neutral-muted font-sans">Overrides Preserved</span>
            </div>
            <div className="p-2 rounded bg-neutral-subtle/60 border border-neutral-border/50">
              <span className={`block text-sm font-bold ${scheduling.urgentTasksCount > 0 ? 'text-status-warning' : 'text-neutral-text'}`}>
                {scheduling.urgentTasksCount}
              </span>
              <span className="text-[10px] text-neutral-muted font-sans">Urgent (&lt;7 days)</span>
            </div>
            <div className="p-2 rounded bg-neutral-subtle/60 border border-neutral-border/50">
              <span className={`block text-sm font-bold ${scheduling.overdueTasksCount > 0 ? 'text-status-danger' : 'text-neutral-text'}`}>
                {scheduling.overdueTasksCount}
              </span>
              <span className="text-[10px] text-neutral-muted font-sans">Past Deadlines</span>
            </div>
          </div>

          {scheduling.flaggedTasks.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFlaggedTasks((prev) => !prev)}
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                <span>
                  {showFlaggedTasks ? 'Hide' : 'Review'} {scheduling.flaggedTasks.length} affected critical deadline(s)
                </span>
                {showFlaggedTasks ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showFlaggedTasks && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {scheduling.flaggedTasks.map((t) => (
                    <div
                      key={t.taskId}
                      className="p-2 rounded bg-neutral-subtle border border-neutral-border flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="font-medium text-neutral-text truncate">{t.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                        <span className="line-through text-neutral-muted">{t.previousDueDate}</span>
                        <span>&rarr;</span>
                        <span
                          className={`font-semibold ${
                            t.isOverdue
                              ? 'text-status-danger'
                              : t.isUrgent
                              ? 'text-status-warning'
                              : 'text-neutral-text'
                          }`}
                        >
                          {t.newDueDate} {t.isOverdue ? '(Past)' : t.isUrgent ? '(Urgent)' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Core Comparison Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Budget Cap */}
        <div className="p-3 rounded-lg bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Budget Cap</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold text-neutral-text">
              {formatCurrency(financials.scenarioBudgetCap, currency)}
            </span>
            {isBudgetChanged && (
              <span
                className={`text-[11px] font-semibold ${
                  financials.budgetCapDelta > 0 ? 'text-status-success' : 'text-secondary'
                }`}
              >
                {financials.budgetCapDelta > 0
                  ? `+${formatCurrency(financials.budgetCapDelta, currency)}`
                  : formatCurrency(financials.budgetCapDelta, currency)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {formatCurrency(financials.baselineBudgetCap, currency)}
          </span>
        </div>

        {/* Target Attendance */}
        <div className="p-3 rounded-lg bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Guest Target</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold text-neutral-text">
              {attendance.candidateGuestTarget} guests
            </span>
            {isGuestsChanged && (
              <span
                className={`text-[11px] font-semibold ${
                  attendance.guestDelta > 0 ? 'text-primary' : 'text-neutral-muted'
                }`}
              >
                {attendance.guestDelta > 0 ? `+${attendance.guestDelta}` : attendance.guestDelta}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {attendance.baselineGuestTarget} guests
          </span>
        </div>

        {/* Derived Cost per Guest */}
        <div className="p-3 rounded-lg bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Cost / Guest</span>
          <div className="font-mono text-sm font-bold text-neutral-text">
            {formatCurrency(financials.scenarioCostPerGuest, currency)}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {formatCurrency(financials.baselineCostPerGuest, currency)}
          </span>
        </div>

        {/* Total Projected Spend */}
        <div className="p-3 rounded-lg bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Total Projected</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold text-neutral-text">
              {formatCurrency(financials.scenarioTotalProjected, currency)}
            </span>
            {financials.projectedCostDelta !== 0 && (
              <span
                className={`text-[11px] font-semibold ${
                  financials.projectedCostDelta < 0 ? 'text-status-success' : 'text-secondary'
                }`}
              >
                {financials.projectedCostDelta > 0
                  ? `+${formatCurrency(financials.projectedCostDelta, currency)}`
                  : formatCurrency(financials.projectedCostDelta, currency)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {formatCurrency(financials.baselineTotalProjected, currency)}
          </span>
        </div>
      </div>

      {/* Cost Model Breakdown */}
      <div className="bg-neutral-surface border border-neutral-border p-3.5 rounded-lg text-xs space-y-2">
        <div className="flex items-center justify-between text-neutral-muted pb-1 border-b border-neutral-border/60">
          <span className="font-semibold text-neutral-text">Cost Composition Model</span>
          <span className="font-mono text-[11px]">
            Total Projected: {formatCurrency(financials.scenarioTotalProjected, currency)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
          <div className="flex items-center justify-between bg-neutral-subtle/50 p-2.5 rounded border border-neutral-border/60">
            <span className="text-neutral-muted font-sans">Fixed Commitments:</span>
            <span className="font-semibold text-neutral-text">
              {formatCurrency(financials.fixedProjectedCost, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between bg-neutral-subtle/50 p-2.5 rounded border border-neutral-border/60">
            <span className="text-neutral-muted font-sans">Guest-Dependent Variable:</span>
            <span className="font-semibold text-neutral-text">
              {formatCurrency(financials.variableProjectedCost, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Guardrails Notice */}
      <div className="p-3 rounded-lg bg-neutral-subtle/60 border border-neutral-border flex items-start gap-2.5 text-xs text-neutral-muted">
        <ShieldCheck className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-neutral-text">Financial Safeguard Guardrails Active:</span>{' '}
          Agreed vendor contracts ({formatCurrency(financials.totalCommittedContract, currency)}), recorded actual spending ({formatCurrency(financials.historicalActualSpend, currency)}), and remaining vendor liabilities ({formatCurrency(financials.remainingContractBalance, currency)}) establish absolute non-reducible floors. Replanning simulations never violate contract commitments or historical bank actuals.
        </div>
      </div>

      {/* Warning List */}
      {warnings.length > 0 && (
        <div className="p-2.5 rounded bg-neutral-subtle border border-neutral-border/70 text-[11px] text-neutral-muted space-y-1">
          {warnings.map((w, idx) => (
            <p key={idx} className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-neutral-muted shrink-0" />
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
