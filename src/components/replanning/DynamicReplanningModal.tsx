'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Users,
  Wallet,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Event } from '../../features/events/types';
import { formatCurrency, formatDateDisplay } from '../../features/events/validation';
import { eventStorage } from '../../features/events/storage';
import {
  applyReplanningProposals,
  generateReplanningPlan,
  validateSelectedProposals,
} from '../../features/replanning/replanning-engine';
import { Dialog } from '../ui/Dialog';
import { ReplanningImpactSummary } from './ReplanningImpactSummary';
import { ReplanningProposalList } from './ReplanningProposalList';

export interface DynamicReplanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onApplyPlan: (updatedEvent: Event) => void;
  initialView?: 'summary' | 'proposals';
}

export function DynamicReplanningModal({
  isOpen,
  onClose,
  event,
  onApplyPlan,
  initialView = 'summary',
}: DynamicReplanningModalProps) {
  const [candidateDate, setCandidateDate] = useState<string>(event.date);
  const [candidateGuestTarget, setCandidateGuestTarget] = useState<number>(event.guestTarget);
  const [candidateBudgetCap, setCandidateBudgetCap] = useState<number>(event.budgetCap);
  const [candidateAllocations, setCandidateAllocations] = useState<Record<string, number>>({});
  const [selectedTradeOffIds, setSelectedTradeOffIds] = useState<string[]>([]);
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'summary' | 'proposals'>(initialView);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const initialEventUpdatedAtRef = useRef<string>(event.updatedAt);
  const initialEventVersionRef = useRef<number>(event.version ?? 1);
  const isStale = Boolean(
    (event.updatedAt && event.updatedAt !== initialEventUpdatedAtRef.current) ||
    (typeof event.version === 'number' && event.version !== initialEventVersionRef.current)
  );

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setCandidateDate(event.date);
      setCandidateGuestTarget(event.guestTarget);
      setCandidateBudgetCap(event.budgetCap);

      const initialAllocMap: Record<string, number> = {};
      for (const cat of event.categories || []) {
        initialAllocMap[cat.id] = cat.allocatedAmount;
      }
      setCandidateAllocations(initialAllocMap);

      setSelectedTradeOffIds([]);
      setApplyError(null);
      setIsSaving(false);
      setActiveView(initialView);
      initialEventUpdatedAtRef.current = event.updatedAt;
      initialEventVersionRef.current = event.version ?? 1;
    }
  }, [isOpen, event, initialView]);

  // Live deterministic replanning plan calculation
  const plan = useMemo(() => {
    return generateReplanningPlan(event, {
      candidateDate,
      candidateGuestTarget,
      candidateBudgetCap,
      candidateCategoryAllocations: candidateAllocations,
      selectedTradeOffIds,
    });
  }, [event, candidateDate, candidateGuestTarget, candidateBudgetCap, candidateAllocations, selectedTradeOffIds]);

  // Synchronize default selected proposals when new proposals are generated
  useEffect(() => {
    if (plan.proposals.length > 0) {
      // By default, select all non-conflicting proposals
      setSelectedProposalIds((prev) => {
        const availableIds = new Set(plan.proposals.map((p) => p.id));
        const kept = prev.filter((id) => availableIds.has(id));
        if (kept.length === 0) {
          return plan.proposals.filter((p) => p.status !== 'conflict').map((p) => p.id);
        }
        return kept;
      });
    } else {
      setSelectedProposalIds([]);
    }
  }, [plan.proposals]);

  const handleToggleProposal = (id: string) => {
    setSelectedProposalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedProposalIds(plan.proposals.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProposalIds([]);
  };

  const handleResetToBaseline = () => {
    setCandidateDate(event.date);
    setCandidateGuestTarget(event.guestTarget);
    setCandidateBudgetCap(event.budgetCap);
    const initialAllocMap: Record<string, number> = {};
    for (const cat of event.categories || []) {
      initialAllocMap[cat.id] = cat.allocatedAmount;
    }
    setCandidateAllocations(initialAllocMap);
    setSelectedTradeOffIds([]);
    setApplyError(null);
  };

  const handleRefreshStale = () => {
    initialEventUpdatedAtRef.current = event.updatedAt;
    initialEventVersionRef.current = event.version ?? 1;
    setApplyError(null);
  };

  const handleApplyChanges = () => {
    setApplyError(null);

    // Concurrency check before applying
    if (isStale) {
      setApplyError(
        'This celebration was updated in another session or window. Please recalculate impacts before applying changes.'
      );
      return;
    }

    if (selectedProposalIds.length === 0) {
      setApplyError('Please select at least one proposal to apply.');
      return;
    }

    // Dependency and validation check
    const validation = validateSelectedProposals(event, plan.proposals, selectedProposalIds);
    if (!validation.isValid) {
      setApplyError(validation.errors.join(' '));
      setActiveView('proposals');
      return;
    }

    setIsSaving(true);

    const applyResult = applyReplanningProposals(event, plan.proposals, selectedProposalIds);
    if (!applyResult.success) {
      setApplyError(applyResult.error || 'Failed to apply selected replanning proposals.');
      setIsSaving(false);
      return;
    }

    // Persist to storage with concurrency guard
    const saveOptions = {
      expectedUpdatedAt: initialEventUpdatedAtRef.current,
      expectedVersion: initialEventVersionRef.current,
    };
    let saveRes;
    if (event.isSample) {
      saveRes = eventStorage.saveSampleEvent(applyResult.event, saveOptions);
    } else {
      saveRes = eventStorage.savePersonalEvent(applyResult.event, saveOptions);
    }

    if (!saveRes.success) {
      if (saveRes.error?.code === 'CONCURRENCY_CONFLICT') {
        setApplyError(
          'This celebration was updated in another session or window. Please recalculate impacts before applying changes.'
        );
      } else {
        setApplyError(saveRes.error?.message || 'Failed to persist replanning changes.');
      }
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onApplyPlan(applyResult.event);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Celebration Replanner"
      description="Simulate consequential changes across dates, attendance, and budgets with deterministic impact analysis and granular proposal approval."
      maxWidth="xl"
    >
      <div className="space-y-5" data-testid="dynamic-replanning-modal">
        {applyError && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3 rounded-md text-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{applyError}</span>
          </div>
        )}

        {/* Candidate Controls Bar */}
        <div className="bg-neutral-subtle/60 p-4 rounded-lg border border-neutral-border space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-border/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-text flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              Candidate Replanning Triggers
            </span>
            <button
              type="button"
              onClick={handleResetToBaseline}
              className="inline-flex items-center gap-1 text-xs text-neutral-muted hover:text-neutral-text transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Baseline</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1. Date Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="replan-date" className="font-semibold text-neutral-text flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Celebration Date</span>
                </label>
                {candidateDate !== event.date && (
                  <span className="font-mono text-[11px] text-secondary font-semibold">
                    Modified
                  </span>
                )}
              </div>
              <input
                id="replan-date"
                type="date"
                value={candidateDate}
                onChange={(e) => setCandidateDate(e.target.value)}
                className="w-full bg-neutral-surface border border-neutral-border px-3 py-1.5 rounded-md text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-[11px] text-neutral-muted block font-mono">
                Baseline: {formatDateDisplay(event.date)}
              </span>
            </div>

            {/* 2. Guest Target Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="replan-guests" className="font-semibold text-neutral-text flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Target Attendance</span>
                </label>
                <span className="font-mono font-bold text-neutral-text">
                  {candidateGuestTarget} guests
                </span>
              </div>
              <input
                id="replan-guests"
                type="range"
                min="10"
                max="1000"
                step="10"
                value={candidateGuestTarget}
                onChange={(e) => setCandidateGuestTarget(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-neutral-muted font-mono">
                <span>Baseline: {event.guestTarget}</span>
                <span>
                  Delta:{' '}
                  {candidateGuestTarget - event.guestTarget >= 0
                    ? `+${candidateGuestTarget - event.guestTarget}`
                    : candidateGuestTarget - event.guestTarget}
                </span>
              </div>
            </div>

            {/* 3. Budget Cap Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="replan-budget" className="font-semibold text-neutral-text flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span>Budget Cap</span>
                </label>
                <span className="font-mono font-bold text-neutral-text">
                  {formatCurrency(candidateBudgetCap, event.currency)}
                </span>
              </div>
              <input
                id="replan-budget"
                type="range"
                min="50000"
                max="10000000"
                step="25000"
                value={candidateBudgetCap}
                onChange={(e) => setCandidateBudgetCap(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-neutral-muted font-mono">
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
        </div>

        {/* Tab navigation between Impact Summary and Proposals */}
        <div className="flex items-center justify-between border-b border-neutral-border pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('summary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors border-b-2 ${
                activeView === 'summary'
                  ? 'border-primary text-neutral-text bg-neutral-surface'
                  : 'border-transparent text-neutral-muted hover:text-neutral-text'
              }`}
            >
              Impact Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveView('proposals')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors border-b-2 flex items-center gap-1.5 ${
                activeView === 'proposals'
                  ? 'border-primary text-neutral-text bg-neutral-surface'
                  : 'border-transparent text-neutral-muted hover:text-neutral-text'
              }`}
            >
              <span>Review Proposals</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-subtle font-mono text-[10px]">
                {plan.proposals.length}
              </span>
            </button>
          </div>
        </div>

        {/* Active Panel View */}
        {activeView === 'summary' ? (
          <ReplanningImpactSummary
            impact={plan.impact}
            currency={event.currency}
            isStale={isStale}
            onRefreshStale={handleRefreshStale}
          />
        ) : (
          <ReplanningProposalList
            proposals={plan.proposals}
            selectedIds={selectedProposalIds}
            onToggleProposal={handleToggleProposal}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            currency={event.currency}
          />
        )}

        {/* Footer Actions */}
        <div className="border-t border-neutral-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors w-full sm:w-auto"
          >
            Discard Replan
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={isSaving || isStale || selectedProposalIds.length === 0}
              title={
                isStale
                  ? 'Celebration data changed elsewhere. Please recalculate.'
                  : selectedProposalIds.length === 0
                  ? 'Select at least one proposal to apply.'
                  : undefined
              }
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover transition-all shadow-xs active:scale-[0.98] disabled:opacity-60 w-full sm:w-auto"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Applying...'
                  : `Apply Selected Proposals (${selectedProposalIds.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
