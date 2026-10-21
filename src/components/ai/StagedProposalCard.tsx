'use client';

import React from 'react';
import {
  Wallet,
  Clock,
  Briefcase,
  CheckSquare,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Milestone,
} from 'lucide-react';
import { StagedProposal } from '../../features/ai/types';
import { CurrencyCode } from '../../features/events/types';
import { formatCurrency } from '../../features/events/validation';
import { CouponBadge, StatusPill } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface StagedProposalCardProps {
  proposal: StagedProposal;
  currency?: CurrencyCode;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigateTab?: (tab: 'budget' | 'timeline' | 'vendors') => void;
}

export function StagedProposalCard({
  proposal,
  currency = 'INR',
  onAccept,
  onDismiss,
  onNavigateTab,
}: StagedProposalCardProps) {
  const { id, actionType, title, explanation, status, conflictReason, payload } = proposal;

  // Icon and badge styling per proposal action type
  const typeConfig = {
    adjust_budget_allocation: {
      label: 'Budget Allocation',
      icon: Wallet,
      badgeVariant: 'marigold' as const,
    },
    add_task: {
      label: 'Milestone Task',
      icon: Clock,
      badgeVariant: 'terracotta' as const,
    },
    add_milestone: {
      label: 'Ceremony Milestone',
      icon: Milestone,
      badgeVariant: 'stone' as const,
    },
    add_checklist_item: {
      label: 'Logistics Checklist',
      icon: CheckSquare,
      badgeVariant: 'marigold' as const,
    },
    suggest_vendor_followup: {
      label: 'Vendor Vetting',
      icon: Briefcase,
      badgeVariant: 'forest' as const,
    },
  }[actionType] || {
    label: 'Planning Action',
    icon: Clock,
    badgeVariant: 'stone' as const,
  };

  const TypeIcon = typeConfig.icon;

  const statusPillConfig = {
    staged: { label: 'Needs Review', status: 'warning' as const },
    accepted: { label: 'Applied', status: 'success' as const },
    dismissed: { label: 'Dismissed', status: 'neutral' as const },
    conflict: { label: 'Conflict', status: 'danger' as const },
  }[status];

  return (
    <article
      data-testid={`staged-proposal-${id}`}
      className={`bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-sm transition-all hover:border-primary/40 ${
        status === 'dismissed' ? 'opacity-60 bg-neutral-subtle/50' : ''
      }`}
    >
      {/* Header: Type, Title, and Status */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-neutral-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-neutral-subtle text-neutral-text">
            <TypeIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CouponBadge variant={typeConfig.badgeVariant}>
                {typeConfig.label}
              </CouponBadge>
              <h4 className="font-semibold text-neutral-text text-sm sm:text-base">
                {title}
              </h4>
            </div>
            <p className="text-xs text-neutral-muted mt-0.5">{explanation}</p>
          </div>
        </div>

        <StatusPill status={statusPillConfig.status}>
          {statusPillConfig.label}
        </StatusPill>
      </div>

      {/* Body: Visual Diff or Structured Details based on actionType */}
      <div className="py-3">
        {actionType === 'adjust_budget_allocation' && payload.actionType === 'adjust_budget_allocation' && (
          <div className="bg-neutral-subtle/70 rounded-md p-3.5 border border-neutral-border">
            <div className="text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">
              Target Category: <span className="text-neutral-text font-bold">{payload.categoryName}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-muted">Current Allocation</span>
                <span className="font-mono text-neutral-text line-through opacity-75">
                  {formatCurrency(payload.currentAllocated, currency)}
                </span>
              </div>

              <div className="flex items-center justify-center text-neutral-muted">
                <ArrowRight className="w-4 h-4 text-primary hidden sm:inline" />
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-neutral-muted">Proposed Allocation</span>
                <span className="font-mono font-bold text-primary">
                  {formatCurrency(payload.proposedAllocated, currency)}
                </span>
              </div>
            </div>

            {payload.rationale && (
              <p className="text-xs text-neutral-muted mt-2.5 pt-2 border-t border-neutral-border/50 italic">
                Rationale: {payload.rationale}
              </p>
            )}
          </div>
        )}

        {actionType === 'add_task' && payload.actionType === 'add_task' && (
          <div className="bg-neutral-subtle/70 rounded-md p-3.5 border border-neutral-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-neutral-text">
                Task Title: <strong className="font-semibold">{payload.title}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-neutral-muted font-mono bg-neutral-surface px-2 py-0.5 rounded border border-neutral-border">
                <Calendar className="w-3 h-3 text-secondary" />
                {payload.offsetDays >= 0 ? `+${payload.offsetDays}` : payload.offsetDays} days relative anchor
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-muted">
              {payload.milestoneTitle && (
                <span>Anchor Milestone: <strong className="text-neutral-text">{payload.milestoneTitle}</strong></span>
              )}
              <span>Priority: <strong className="capitalize text-neutral-text">{payload.priority}</strong></span>
            </div>

            {payload.description && (
              <p className="text-xs text-neutral-muted pt-1 italic">
                Description: {payload.description}
              </p>
            )}
          </div>
        )}

        {actionType === 'add_milestone' && payload.actionType === 'add_milestone' && (
          <div className="bg-neutral-subtle/70 rounded-md p-3.5 border border-neutral-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-neutral-text">
                Milestone: <strong className="font-semibold">{payload.title}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-neutral-muted font-mono bg-neutral-surface px-2 py-0.5 rounded border border-neutral-border">
                <Calendar className="w-3 h-3 text-secondary" />
                {payload.offsetDays >= 0 ? `+${payload.offsetDays}` : payload.offsetDays} days from date
              </span>
            </div>
            {payload.description && (
              <p className="text-xs text-neutral-muted pt-1 italic">
                {payload.description}
              </p>
            )}
          </div>
        )}

        {actionType === 'add_checklist_item' && payload.actionType === 'add_checklist_item' && (
          <div className="bg-neutral-subtle/70 rounded-md p-3.5 border border-neutral-border space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-muted">
              <span>Operational Area: <strong className="capitalize text-neutral-text">{payload.area}</strong></span>
            </div>
            <p className="text-sm font-medium text-neutral-text">
              {payload.itemText}
            </p>
          </div>
        )}

        {actionType === 'suggest_vendor_followup' && payload.actionType === 'suggest_vendor_followup' && (
          <div className="bg-neutral-subtle/70 rounded-md p-3.5 border border-neutral-border space-y-2">
            <div className="text-sm font-medium text-neutral-text">
              Vendor Domain: <strong className="font-semibold">{payload.vendorCategory}</strong>
            </div>

            {payload.suggestedQuestions && payload.suggestedQuestions.length > 0 && (
              <div className="text-xs text-neutral-muted mt-2">
                <p className="font-semibold text-neutral-text mb-1">Recommended Discovery &amp; Vetting Questions:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {payload.suggestedQuestions.map((q: string, idx: number) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {payload.checklistNotes && (
              <p className="text-xs text-neutral-muted italic pt-1">
                Notes: {payload.checklistNotes}
              </p>
            )}

            <p className="text-xs text-secondary-hover mt-1 font-medium">
              Action on accept: Adds this vendor qualification checklist as an actionable task to your Timeline. (Does not create fake vendor contacts).
            </p>
          </div>
        )}

        {/* Conflict message if present */}
        {status === 'conflict' && conflictReason && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded bg-status-danger-subtle text-status-danger text-xs border border-status-danger/30">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cannot Apply Proposal</p>
              <p>{conflictReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer: User Decision Controls */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-neutral-muted">
          {status === 'accepted' && (
            <span className="inline-flex items-center gap-1.5 text-status-success font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Applied to celebration
            </span>
          )}
          {status === 'dismissed' && (
            <span className="text-neutral-muted italic">
              Dismissed by planner
            </span>
          )}
          {status === 'conflict' && (
            <span className="text-status-danger">
              Stale target item
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'staged' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(id)}
                className="text-neutral-muted hover:text-neutral-text"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Dismiss
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept(id)}
                className="shadow-sm"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Accept &amp; Apply
              </Button>
            </>
          )}

          {status === 'conflict' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDismiss(id)}
            >
              Dismiss Obsolete
            </Button>
          )}

          {status === 'accepted' && onNavigateTab && (
            <>
              {actionType === 'adjust_budget_allocation' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('budget')}
                >
                  View in Budget
                </Button>
              )}
              {(actionType === 'add_task' || actionType === 'add_milestone' || actionType === 'add_checklist_item' || actionType === 'suggest_vendor_followup') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('timeline')}
                >
                  View in Timeline
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
