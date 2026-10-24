'use client';

import React from 'react';
import {
  Wallet,
  Users,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Event } from '../../features/events/types';
import { formatCurrency } from '../../features/events/validation';
import { ScenarioFinancials, TradeOffOption } from '../../features/tradeoffs/types';
import { CouponBadge, StatusPill } from '../ui/Badge';

export interface ScenarioImpactPreviewProps {
  financials: ScenarioFinancials;
  tradeOffOptions: TradeOffOption[];
  selectedTradeOffIds: string[];
  onToggleTradeOff: (id: string) => void;
  isStale?: boolean;
  onRefreshStale?: () => void;
}

export function ScenarioImpactPreview({
  financials,
  tradeOffOptions,
  selectedTradeOffIds,
  onToggleTradeOff,
  isStale = false,
  onRefreshStale,
}: ScenarioImpactPreviewProps) {
  const {
    currency,
    baselineBudgetCap,
    scenarioBudgetCap,
    budgetCapDelta,
    baselineGuestTarget,
    scenarioGuestTarget,
    guestTargetDelta,
    baselineTotalProjected,
    scenarioTotalProjected,
    projectedCostDelta,
    scenarioHeadroom,
    scenarioShortfall,
    baselineCostPerGuest,
    scenarioCostPerGuest,
    fixedProjectedCost,
    variableProjectedCost,
    totalCommittedContract,
    totalPaidToDate,
    remainingContractBalance,
    warnings,
  } = financials;

  const hasShortfall = scenarioShortfall > 0;
  const isBudgetChanged = budgetCapDelta !== 0;
  const isGuestsChanged = guestTargetDelta !== 0;

  // Compute total selected savings
  const selectedSavings = tradeOffOptions
    .filter((o) => selectedTradeOffIds.includes(o.id))
    .reduce((sum, o) => sum + o.estimatedSavings, 0);

  const effectiveShortfall = Math.max(0, scenarioShortfall - selectedSavings);

  return (
    <div className="space-y-4 pt-2 border-t border-neutral-border/70 text-neutral-text" data-testid="scenario-impact-preview">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-subtle/80 p-3.5 rounded-md border border-neutral-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary-subtle text-primary">
            <Sliders className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-text">
              Deterministic Impact Preview
            </h4>
            <p className="text-[11px] text-neutral-muted">
              Live consequences of proposed changes before saving to your plan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {financials.isOverAllocated && (
            <StatusPill status="warning">
              Allocations: {formatCurrency(financials.allocationGap, currency)} over cap
            </StatusPill>
          )}
          {hasShortfall ? (
            <StatusPill status={effectiveShortfall > 0 ? 'danger' : 'success'}>
              {effectiveShortfall > 0
                ? `Deficit: ${formatCurrency(effectiveShortfall, currency)} over cap`
                : 'Resolved via Selected Trade-Offs'}
            </StatusPill>
          ) : (
            <StatusPill status="success">
              {formatCurrency(scenarioHeadroom, currency)} Headroom
            </StatusPill>
          )}
        </div>
      </div>

      {/* Allocation Overage Notice (W3-07) */}
      {financials.isOverAllocated && (
        <div
          data-testid="allocation-overage-alert"
          className="flex items-start gap-2.5 p-3 rounded-md bg-status-warning-subtle text-status-warning border border-status-warning/40 text-xs"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Category Allocations Exceed Budget Cap</p>
            <p className="opacity-90">
              Total category allocations ({formatCurrency(financials.scenarioTotalAllocated, currency)}) exceed the scenario budget cap ({formatCurrency(scenarioBudgetCap, currency)}) by {formatCurrency(financials.allocationGap, currency)}. Even if projected expenses fit within the cap, allocated envelope allowances must be rebalanced.
            </p>
          </div>
        </div>
      )}

      {/* Contract & Commitment Discrepancy Warnings (W3-06) */}
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

      {/* Stale Event State Notice */}
      {isStale && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-md bg-status-warning-subtle text-status-warning border border-status-warning/40 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Celebration State Changed Elsewhere</p>
              <p className="opacity-90">
                The underlying celebration data was updated since opening this window. Please recalculate baseline values.
              </p>
            </div>
          </div>
          {onRefreshStale && (
            <button
              type="button"
              onClick={onRefreshStale}
              className="px-2.5 py-1 rounded bg-neutral-surface border border-neutral-border text-neutral-text font-semibold hover:bg-neutral-subtle"
            >
              Recalculate
            </button>
          )}
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Budget Cap Shift */}
        <div className="p-3 rounded-md bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Proposed Budget Cap</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold text-neutral-text">
              {formatCurrency(scenarioBudgetCap, currency)}
            </span>
            {isBudgetChanged && (
              <span
                className={`text-[11px] font-semibold ${
                  budgetCapDelta > 0 ? 'text-status-success' : 'text-secondary'
                }`}
              >
                {budgetCapDelta > 0 ? `+${formatCurrency(budgetCapDelta, currency)}` : formatCurrency(budgetCapDelta, currency)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {formatCurrency(baselineBudgetCap, currency)}
          </span>
        </div>

        {/* Guest Target Shift */}
        <div className="p-3 rounded-md bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Target Attendance</span>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm font-bold text-neutral-text">
              {scenarioGuestTarget} guests
            </span>
            {isGuestsChanged && (
              <span
                className={`text-[11px] font-semibold ${
                  guestTargetDelta > 0 ? 'text-primary' : 'text-neutral-muted'
                }`}
              >
                {guestTargetDelta > 0 ? `+${guestTargetDelta}` : guestTargetDelta}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {baselineGuestTarget} guests
          </span>
        </div>

        {/* Cost Per Guest Metric */}
        <div className="p-3 rounded-md bg-neutral-surface border border-neutral-border">
          <span className="text-neutral-muted block mb-1 font-medium">Derived Cost / Guest</span>
          <div className="font-mono text-sm font-bold text-neutral-text">
            {formatCurrency(scenarioCostPerGuest, currency)}
          </div>
          <span className="text-[10px] text-neutral-muted mt-1 block">
            Baseline: {formatCurrency(baselineCostPerGuest, currency)}
          </span>
        </div>
      </div>

      {/* Cost Model Breakdown: Fixed vs Per-Guest */}
      <div className="bg-neutral-surface border border-neutral-border p-3.5 rounded-md text-xs space-y-2">
        <div className="flex items-center justify-between text-neutral-muted pb-1 border-b border-neutral-border/60">
          <span className="font-semibold text-neutral-text">Cost Model Composition</span>
          <span className="font-mono text-[11px]">
            Total Projected: {formatCurrency(scenarioTotalProjected, currency)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
          <div className="flex items-center justify-between bg-neutral-subtle/50 p-2 rounded border border-neutral-border/60">
            <span className="text-neutral-muted font-sans">Fixed Commitments:</span>
            <span className="font-semibold text-neutral-text">
              {formatCurrency(fixedProjectedCost, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between bg-neutral-subtle/50 p-2 rounded border border-neutral-border/60">
            <span className="text-neutral-muted font-sans">Guest-Dependent Variable:</span>
            <span className="font-semibold text-neutral-text">
              {formatCurrency(variableProjectedCost, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Guardrails Notice */}
      <div className="p-3 rounded-md bg-neutral-subtle/60 border border-neutral-border flex items-start gap-2.5 text-xs text-neutral-muted">
        <ShieldCheck className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-neutral-text">Contract &amp; Payment Guard Active:</span>{' '}
          Agreed vendor contracts ({formatCurrency(totalCommittedContract, currency)}), recorded payments ({formatCurrency(totalPaidToDate, currency)}), and remaining vendor balances ({formatCurrency(remainingContractBalance, currency)}) are strictly protected. Simulating a scenario never alters contract obligations or settled bank actuals.
        </div>
      </div>

      {/* Preference-Aware Trade-Off Options */}
      {tradeOffOptions.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-neutral-text flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Intelligent Trade-Off Proposals ({tradeOffOptions.length})
            </span>
            {selectedSavings > 0 && (
              <span className="font-mono text-status-success font-semibold">
                Selected Savings: -{formatCurrency(selectedSavings, currency)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {tradeOffOptions.map((opt) => {
              const isSelected = selectedTradeOffIds.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => onToggleTradeOff(opt.id)}
                  className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-subtle/40 shadow-xs ring-1 ring-primary/60'
                      : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container click
                        className="mt-0.5 h-4 w-4 rounded border-neutral-border text-primary focus:ring-primary"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-neutral-text">{opt.title}</span>
                          {opt.isEconomizeArea && (
                            <CouponBadge variant="marigold">Economize Priority</CouponBadge>
                          )}
                          {opt.isSpendingPriority && (
                            <CouponBadge variant="terracotta">Protected Priority</CouponBadge>
                          )}
                          {opt.impactType === 'guest_scaling' && (
                            <CouponBadge variant="forest">Guest Scaling</CouponBadge>
                          )}
                        </div>
                        <p className="text-neutral-muted leading-relaxed">{opt.description}</p>
                        <p className="text-[11px] text-neutral-muted/80 mt-1 italic">
                          Assumption: {opt.assumptions}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="font-bold text-status-success block">
                        -{formatCurrency(opt.estimatedSavings, currency)}
                      </span>
                      <span className="text-[10px] text-neutral-muted">
                        {opt.isSavingsProjected ? 'Projected' : 'Reallocated'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings & Assumptions */}
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
