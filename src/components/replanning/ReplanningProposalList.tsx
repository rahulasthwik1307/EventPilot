'use client';

import React from 'react';
import {
  Check,
  Calendar,
  Clock,
  Wallet,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';
import { CurrencyCode } from '../../features/events/types';
import { formatCurrency, formatDateDisplay } from '../../features/events/validation';
import { ReplanningProposal, ReplanningProposalEntity } from '../../features/replanning/types';
import { CouponBadge, StatusPill } from '../ui/Badge';

export interface ReplanningProposalListProps {
  proposals: ReplanningProposal[];
  selectedIds: string[];
  onToggleProposal: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  currency: CurrencyCode;
}

export function ReplanningProposalList({
  proposals,
  selectedIds,
  onToggleProposal,
  onSelectAll,
  onDeselectAll,
  currency,
}: ReplanningProposalListProps) {
  if (proposals.length === 0) {
    return (
      <div
        data-testid="empty-proposals-message"
        className="p-8 text-center bg-neutral-surface border border-neutral-border rounded-lg text-neutral-muted"
      >
        <p className="text-sm font-medium">No proposals generated for current parameters.</p>
        <p className="text-xs mt-1">Adjust candidate inputs above to see proposed changes.</p>
      </div>
    );
  }

  const allSelected = proposals.length > 0 && proposals.every((p) => selectedIds.includes(p.id));
  const someSelected = selectedIds.length > 0;

  const entityConfig: Record<
    ReplanningProposalEntity,
    { label: string; icon: React.ComponentType<{ className?: string }>; badgeVariant: 'marigold' | 'terracotta' | 'stone' | 'forest' }
  > = {
    event: { label: 'Event Parameter', icon: Calendar, badgeVariant: 'marigold' },
    task: { label: 'Timeline Schedule', icon: Clock, badgeVariant: 'terracotta' },
    expense: { label: 'Expense Adjustment', icon: Wallet, badgeVariant: 'forest' },
    category: { label: 'Budget Envelope', icon: Layers, badgeVariant: 'stone' },
    milestone: { label: 'Ceremony Milestone', icon: Clock, badgeVariant: 'stone' },
  };

  const formatValue = (field: string, val: unknown): string => {
    if (val === undefined || val === null) return '—';
    if (field === 'budgetCap' || field === 'allocatedAmount' || field === 'estimatedAmount') {
      return typeof val === 'number' ? formatCurrency(val, currency) : String(val);
    }
    if (field === 'guestTarget') {
      return `${val} guests`;
    }
    if (field === 'date' || field === 'dueDate') {
      return formatDateDisplay(String(val));
    }
    return String(val);
  };

  return (
    <div className="space-y-3" data-testid="replanning-proposal-list">
      {/* List Header & Batch Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-border text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-text uppercase tracking-wider">
            Reviewable Proposals ({proposals.length})
          </span>
          <StatusPill status={someSelected ? 'success' : 'neutral'}>
            {selectedIds.length} of {proposals.length} selected
          </StatusPill>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            {allSelected ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Proposals Stack */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {proposals.map((proposal) => {
          const isSelected = selectedIds.includes(proposal.id);
          const config = entityConfig[proposal.entity] || {
            label: 'Adjustment',
            icon: Sparkles,
            badgeVariant: 'stone' as const,
          };
          const Icon = config.icon;

          // Check if any prerequisite dependency is unselected
          const hasMissingDependency =
            proposal.dependsOnProposalIds &&
            proposal.dependsOnProposalIds.some((depId) => !selectedIds.includes(depId));

          return (
            <div
              key={proposal.id}
              data-testid={`proposal-card-${proposal.id}`}
              onClick={() => onToggleProposal(proposal.id)}
              className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary-subtle/30 shadow-xs ring-1 ring-primary/60'
                  : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Controlled by container click
                  aria-label={`Select proposal: ${proposal.title}`}
                  className="mt-1 h-4 w-4 rounded border-neutral-border text-primary focus:ring-primary cursor-pointer shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CouponBadge variant={config.badgeVariant}>
                        <Icon className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {config.label}
                      </CouponBadge>
                      <span className="font-semibold text-neutral-text text-sm">
                        {proposal.title}
                      </span>
                    </div>

                    {proposal.status === 'conflict' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-status-danger-subtle text-status-danger border border-status-danger/40">
                        Conflict
                      </span>
                    )}
                  </div>

                  <p className="text-neutral-muted leading-relaxed">
                    {proposal.explanation}
                  </p>

                  {/* Value Transition Comparison */}
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="px-2 py-1 rounded bg-neutral-subtle border border-neutral-border/70 text-neutral-text">
                      {formatValue(proposal.field, proposal.previousValue)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-muted shrink-0" />
                    <span className="px-2 py-1 rounded bg-neutral-surface border border-primary/50 text-neutral-text font-bold shadow-2xs">
                      {formatValue(proposal.field, proposal.proposedValue)}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-muted pt-0.5">
                    Impact: {proposal.impactDescription}
                  </p>

                  {/* Dependency & Missing Prerequisite Warning */}
                  {proposal.dependsOnProposalIds && proposal.dependsOnProposalIds.length > 0 && (
                    <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-neutral-muted italic">
                        Prerequisite: Parent change required
                      </span>
                      {hasMissingDependency && isSelected && (
                        <span
                          role="alert"
                          className="inline-flex items-center gap-1 text-status-warning font-semibold bg-status-warning-subtle px-2 py-0.5 rounded border border-status-warning/40"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Requires parent proposal selected</span>
                        </span>
                      )}
                    </div>
                  )}

                  {proposal.conflictReason && (
                    <div className="pt-1 text-[11px] text-status-danger flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{proposal.conflictReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
