'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sliders, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { Event } from '../../features/events/types';
import { formatCurrency } from '../../features/events/validation';
import { calculateScenarioFinancials } from '../../features/tradeoffs/scenario-engine';
import { generateTradeOffOptions } from '../../features/tradeoffs/tradeoff-generator';
import { Dialog } from '../ui/Dialog';
import { ScenarioImpactPreview } from './ScenarioImpactPreview';
import { eventStorage } from '../../features/events/storage';

export interface ScenarioSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onApplyScenario: (updatedEvent: Event) => void;
}

export function ScenarioSimulationModal({
  isOpen,
  onClose,
  event,
  onApplyScenario,
}: ScenarioSimulationModalProps) {
  const [candidateGuestTarget, setCandidateGuestTarget] = useState<number>(event.guestTarget);
  const [candidateBudgetCap, setCandidateBudgetCap] = useState<number>(event.budgetCap);
  const [selectedTradeOffIds, setSelectedTradeOffIds] = useState<string[]>([]);
  const [applyError, setApplyError] = useState<string | null>(null);

  const initialEventUpdatedAtRef = useRef(event.updatedAt);
  const initialEventVersionRef = useRef(event.version ?? 1);
  const isStale = Boolean(
    (event.updatedAt && event.updatedAt !== initialEventUpdatedAtRef.current) ||
    (typeof event.version === 'number' && event.version !== initialEventVersionRef.current)
  );

  useEffect(() => {
    if (isOpen) {
      setCandidateGuestTarget(event.guestTarget);
      setCandidateBudgetCap(event.budgetCap);
      setSelectedTradeOffIds([]);
      setApplyError(null);
      initialEventUpdatedAtRef.current = event.updatedAt;
      initialEventVersionRef.current = event.version ?? 1;
    }
  }, [isOpen, event]);

  const financials = useMemo(() => {
    return calculateScenarioFinancials(event, {
      guestTarget: candidateGuestTarget,
      budgetCap: candidateBudgetCap,
    });
  }, [event, candidateGuestTarget, candidateBudgetCap]);

  const tradeOffOptions = useMemo(() => {
    return generateTradeOffOptions(event, financials);
  }, [event, financials]);

  const handleToggleTradeOff = (tradeOffId: string) => {
    setSelectedTradeOffIds((prev) =>
      prev.includes(tradeOffId) ? prev.filter((id) => id !== tradeOffId) : [...prev, tradeOffId]
    );
  };

  const handleResetToBaseline = () => {
    setCandidateGuestTarget(event.guestTarget);
    setCandidateBudgetCap(event.budgetCap);
    setSelectedTradeOffIds([]);
  };

  const handleApplyScenario = () => {
    setApplyError(null);

    // W3-01: Block applying scenario if state is stale
    if (isStale) {
      setApplyError(
        'This celebration was updated in another session or window. Please recalculate baseline values before applying scenario changes.'
      );
      return;
    }

    let finalGuestTarget = candidateGuestTarget;
    let updatedExpenses = event.expenses ? [...event.expenses] : [];

    // Apply any selected trade-off adjustments deterministically
    if (selectedTradeOffIds.length > 0 && tradeOffOptions.length > 0) {
      for (const option of tradeOffOptions) {
        if (!selectedTradeOffIds.includes(option.id)) continue;

        if (option.impactType === 'guest_scaling' && typeof option.proposedAmount === 'number') {
          finalGuestTarget = option.proposedAmount;
        } else if (
          option.impactType === 'budget_reduction' &&
          option.targetExpenseId &&
          typeof option.proposedAmount === 'number'
        ) {
          updatedExpenses = updatedExpenses.map((exp) => {
            if (exp.id === option.targetExpenseId) {
              if (exp.costModel === 'per_guest' && exp.unitCost && finalGuestTarget > 0) {
                const newUnitCost = Math.round(option.proposedAmount / finalGuestTarget);
                return {
                  ...exp,
                  unitCost: newUnitCost,
                  estimatedAmount: option.proposedAmount,
                  updatedAt: new Date().toISOString(),
                };
              }
              return {
                ...exp,
                estimatedAmount: option.proposedAmount,
                updatedAt: new Date().toISOString(),
              };
            }
            return exp;
          });
        }
      }
    }

    const updated: Event = {
      ...event,
      guestTarget: finalGuestTarget,
      budgetCap: candidateBudgetCap,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    };

    const saveOptions = {
      expectedUpdatedAt: initialEventUpdatedAtRef.current,
      expectedVersion: initialEventVersionRef.current,
    };
    let saveRes;
    if (event.isSample) {
      saveRes = eventStorage.saveSampleEvent(updated, saveOptions);
    } else {
      saveRes = eventStorage.savePersonalEvent(updated, saveOptions);
    }

    if (!saveRes.success) {
      if (saveRes.error?.code === 'CONCURRENCY_CONFLICT') {
        setApplyError(
          'This celebration was updated in another session or window. Please recalculate baseline values before applying scenario changes.'
        );
      } else {
        setApplyError(saveRes.error?.message || 'Failed to persist scenario updates.');
      }
      return;
    }

    onApplyScenario(saveRes.data || updated);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="What-If Scenario Simulation"
      description="Simulate the financial consequences of guest count and budget cap adjustments without mutating your plan until confirmed."
      maxWidth="lg"
    >
      <div className="space-y-5" data-testid="scenario-simulation-modal">
        {applyError && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3 rounded-md text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{applyError}</span>
          </div>
        )}

        {/* Candidate Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-subtle/50 p-4 rounded-lg border border-neutral-border">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="sim-guest-target"
                className="text-xs font-semibold uppercase tracking-wider text-neutral-text"
              >
                Candidate Guest Count
              </label>
              <span className="text-xs font-mono font-semibold text-primary">
                {candidateGuestTarget} guests
              </span>
            </div>
            <input
              id="sim-guest-target"
              type="range"
              min="20"
              max="1000"
              step="10"
              value={candidateGuestTarget}
              onChange={(e) => setCandidateGuestTarget(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-muted mt-1 font-mono">
              <span>Baseline: {event.guestTarget}</span>
              <span>
                Delta:{' '}
                {candidateGuestTarget - event.guestTarget >= 0
                  ? `+${candidateGuestTarget - event.guestTarget}`
                  : candidateGuestTarget - event.guestTarget}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="sim-budget-cap"
                className="text-xs font-semibold uppercase tracking-wider text-neutral-text"
              >
                Candidate Budget Cap
              </label>
              <span className="text-xs font-mono font-semibold text-primary">
                {formatCurrency(candidateBudgetCap, event.currency)}
              </span>
            </div>
            <input
              id="sim-budget-cap"
              type="range"
              min="100000"
              max="10000000"
              step="50000"
              value={candidateBudgetCap}
              onChange={(e) => setCandidateBudgetCap(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-muted mt-1 font-mono">
              <span>Baseline: {formatCurrency(event.budgetCap, event.currency)}</span>
              <span>
                Delta:{' '}
                {candidateBudgetCap - event.budgetCap >= 0
                  ? `+${formatCurrency(candidateBudgetCap - event.budgetCap, event.currency)}`
                  : formatCurrency(candidateBudgetCap - event.budgetCap, event.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Live Scenario Impact Preview */}
        <ScenarioImpactPreview
          financials={financials}
          tradeOffOptions={tradeOffOptions}
          selectedTradeOffIds={selectedTradeOffIds}
          onToggleTradeOff={handleToggleTradeOff}
          isStale={isStale}
          onRefreshStale={() => {
            initialEventUpdatedAtRef.current = event.updatedAt;
            initialEventVersionRef.current = event.version ?? 1;
          }}
        />

        {/* Footer actions */}
        <div className="border-t border-neutral-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToBaseline}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-muted hover:text-neutral-text transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors"
            >
              Discard Simulation
            </button>
            <button
              type="button"
              onClick={handleApplyScenario}
              disabled={isStale}
              title={isStale ? 'Celebration updated elsewhere. Please recalculate before applying.' : undefined}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-bold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-xs active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              <Check className="w-4 h-4" />
              <span>Apply Scenario to Plan</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
