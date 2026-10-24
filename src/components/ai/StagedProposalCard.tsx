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
  Sparkles,
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
    update_preference: {
      label: 'Preference Proposal',
      icon: Sparkles,
      badgeVariant: 'marigold' as const,
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
      className={`bg-white border rounded-xl p-5 sm:p-6 shadow-sm transition-all hover:shadow-md ${
        status === 'dismissed'
          ? 'opacity-60 bg-[#FAF8F5]/60 border-[#E7DFD5]'
          : status === 'accepted'
          ? 'border-[#A7F3D0] bg-[#ECFDF5]/10'
          : status === 'conflict'
          ? 'border-[#FCA5A5] bg-[#FEF2F2]/20'
          : 'border-[#E7DFD5] hover:border-[#D6C7B2]'
      }`}
    >
      {/* Header: Type, Title, and Status */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-[#E7DFD5]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#FAF8F5] text-[#D97706] border border-[#E7DFD5]">
            <TypeIcon className="w-4 h-4 text-[#D97706]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CouponBadge variant={typeConfig.badgeVariant}>
                {typeConfig.label}
              </CouponBadge>
              <h4 className="font-serif font-bold text-[#1C1917] text-sm sm:text-base">
                {title}
              </h4>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">{explanation}</p>
          </div>
        </div>

        <StatusPill status={statusPillConfig.status}>
          {statusPillConfig.label}
        </StatusPill>
      </div>

      {/* Body: Visual Diff or Structured Details based on actionType */}
      <div className="py-3.5">
        {actionType === 'adjust_budget_allocation' && payload.actionType === 'adjust_budget_allocation' && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7DFD5]">
            <div className="text-[11px] font-mono font-bold text-[#78716C] uppercase tracking-wider mb-2.5">
              Target Category: <span className="text-[#1C1917] font-bold">{payload.categoryName}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-sm">
              <div className="flex flex-col bg-white p-2.5 rounded-lg border border-[#E7DFD5]">
                <span className="text-[11px] font-mono text-[#78716C]">Current Allocation</span>
                <span className="font-mono text-[#78716C] line-through font-medium mt-0.5">
                  {formatCurrency(payload.currentAllocated, currency)}
                </span>
              </div>

              <div className="flex items-center justify-center text-[#D97706]">
                <ArrowRight className="w-4 h-4 text-[#D97706] hidden sm:inline" />
              </div>

              <div className="flex flex-col bg-white p-2.5 rounded-lg border border-[#FDE68A]">
                <span className="text-[11px] font-mono text-[#D97706] font-bold">Proposed Allocation</span>
                <span className="font-mono font-bold text-[#92400E] mt-0.5">
                  {formatCurrency(payload.proposedAllocated, currency)}
                </span>
              </div>
            </div>

            {payload.rationale && (
              <p className="text-xs text-[#78716C] mt-3 pt-2.5 border-t border-[#E7DFD5] italic leading-relaxed">
                Rationale: {payload.rationale}
              </p>
            )}
          </div>
        )}

        {actionType === 'add_task' && payload.actionType === 'add_task' && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7DFD5] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-[#1C1917]">
                Task Title: <strong className="font-bold">{payload.title}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#78716C] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E7DFD5]">
                <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
                {payload.offsetDays >= 0 ? `+${payload.offsetDays}` : payload.offsetDays} days relative anchor
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C]">
              {payload.milestoneTitle && (
                <span>Anchor Milestone: <strong className="text-[#1C1917]">{payload.milestoneTitle}</strong></span>
              )}
              <span>Priority: <strong className="capitalize text-[#1C1917]">{payload.priority}</strong></span>
            </div>

            {payload.description && (
              <p className="text-xs text-[#78716C] pt-1.5 border-t border-[#E7DFD5] italic leading-relaxed">
                Description: {payload.description}
              </p>
            )}
          </div>
        )}

        {actionType === 'add_milestone' && payload.actionType === 'add_milestone' && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7DFD5] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-[#1C1917]">
                Milestone: <strong className="font-bold">{payload.title}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#78716C] font-mono bg-white px-2.5 py-1 rounded-lg border border-[#E7DFD5]">
                <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
                {payload.offsetDays >= 0 ? `+${payload.offsetDays}` : payload.offsetDays} days from date
              </span>
            </div>
            {payload.description && (
              <p className="text-xs text-[#78716C] pt-1.5 border-t border-[#E7DFD5] italic leading-relaxed">
                {payload.description}
              </p>
            )}
          </div>
        )}

        {actionType === 'add_checklist_item' && payload.actionType === 'add_checklist_item' && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7DFD5] space-y-1">
            <div className="flex items-center justify-between text-xs text-[#78716C]">
              <span>Operational Area: <strong className="capitalize text-[#1C1917]">{payload.area}</strong></span>
            </div>
            <p className="text-sm font-semibold text-[#1C1917]">
              {payload.itemText}
            </p>
          </div>
        )}

        {actionType === 'suggest_vendor_followup' && payload.actionType === 'suggest_vendor_followup' && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7DFD5] space-y-2.5">
            <div className="text-sm font-semibold text-[#1C1917]">
              Vendor Domain: <strong className="font-bold text-[#047857]">{payload.vendorCategory}</strong>
            </div>

            {payload.suggestedQuestions && payload.suggestedQuestions.length > 0 && (
              <div className="text-xs text-[#78716C] mt-2">
                <p className="font-bold text-[#1C1917] mb-1">Recommended Discovery &amp; Vetting Questions:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  {payload.suggestedQuestions.map((q: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {payload.checklistNotes && (
              <p className="text-xs text-[#78716C] italic pt-1 border-t border-[#E7DFD5]">
                Notes: {payload.checklistNotes}
              </p>
            )}

            <p className="text-[11px] text-[#C2410C] mt-1 font-mono font-medium">
              Action on accept: Adds this vendor qualification checklist as an actionable task to your Timeline. (Does not create fake vendor contacts).
            </p>
          </div>
        )}

        {actionType === 'update_preference' && payload.actionType === 'update_preference' && (
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7DFD5] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                Category: <strong className="capitalize text-[#D97706]">{payload.category}</strong> · Field: <strong>{payload.field}</strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  payload.provenance === 'explicit'
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                }`}
              >
                {payload.provenance === 'explicit' ? 'Explicit User Statement' : 'AI Inferred (Requires Confirmation)'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E7DFD5] text-xs">
              <span className="text-[#78716C] font-mono block mb-1">Proposed Setting:</span>
              <pre className="font-mono text-[#1C1917] text-xs whitespace-pre-wrap break-words">
                {typeof payload.proposedValue === 'object'
                  ? JSON.stringify(payload.proposedValue, null, 2)
                  : String(payload.proposedValue)}
              </pre>
            </div>

            {payload.userEvidence && (
              <p className="text-xs text-[#78716C] italic border-l-2 border-[#D97706] pl-2.5">
                User Quote: &ldquo;{payload.userEvidence}&rdquo;
              </p>
            )}

            {payload.rationale && (
              <p className="text-xs text-[#78716C] leading-relaxed">
                <strong>Why this is suggested:</strong> {payload.rationale}
              </p>
            )}

            <p className="text-[11px] text-[#78716C] pt-1">
              Action on accept: Persists this verified preference to your canonical celebration record. (Does not modify financial contracts or expenses).
            </p>
          </div>
        )}

        {/* Conflict message if present */}
        {status === 'conflict' && conflictReason && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] text-[#DC2626] text-xs border border-[#FCA5A5]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cannot Apply Proposal</p>
              <p className="mt-0.5 leading-relaxed">{conflictReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer: User Decision Controls */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7DFD5]/70">
        <div className="text-xs text-[#78716C]">
          {status === 'accepted' && (
            <span className="inline-flex items-center gap-1.5 text-[#059669] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Applied to celebration
            </span>
          )}
          {status === 'dismissed' && (
            <span className="text-[#A8A29E] italic font-mono text-xs">
              Dismissed by planner
            </span>
          )}
          {status === 'conflict' && (
            <span className="text-[#DC2626] font-mono text-xs font-semibold">
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
                className="text-xs font-mono text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5]"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Dismiss</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept(id)}
                className="text-xs font-mono font-bold bg-[#D97706] hover:bg-[#B45309] text-white border-0 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>Accept &amp; Apply</span>
              </Button>
            </>
          )}

          {status === 'conflict' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDismiss(id)}
              className="text-xs font-mono border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2]"
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
                  className="text-xs font-mono border-[#E7DFD5] bg-[#FAF8F5] text-[#1C1917] hover:bg-[#F5F2EB]"
                >
                  View in Budget
                </Button>
              )}
              {(actionType === 'add_task' || actionType === 'add_milestone' || actionType === 'add_checklist_item' || actionType === 'suggest_vendor_followup') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab('timeline')}
                  className="text-xs font-mono border-[#E7DFD5] bg-[#FAF8F5] text-[#1C1917] hover:bg-[#F5F2EB]"
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
