'use client';

import React, { useMemo, useState } from 'react';
import { Event } from '@/features/events/types';
import { VendorQuotation } from '@/features/vendors/types';
import {
  createQuoteDerivedProposal,
  applyQuoteDerivedProposal,
} from '@/features/vendors/quotations/proposal-adapter';
import { formatCurrency } from '@/features/events/validation';
import { Button } from '../../ui/Button';
import { CouponBadge } from '../../ui/Badge';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileCheck,
  ShieldCheck,
  X,
} from 'lucide-react';

interface QuoteProposalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  quote: VendorQuotation | null;
  onUpdateEvent: (updated: Event) => void;
}

export function QuoteProposalReviewModal({
  isOpen,
  onClose,
  event,
  quote,
  onUpdateEvent,
}: QuoteProposalReviewModalProps) {
  const [promoteToContract, setPromoteToContract] = useState(false);
  const [targetExpenseId, setTargetExpenseId] = useState<string>('');
  const [applyError, setApplyError] = useState<string | null>(null);

  // Eligible expenses in the same category
  const eligibleExpenses = useMemo(() => {
    if (!quote) return [];
    return (event.expenses || []).filter(
      (e) =>
        e.title.toLowerCase().includes(quote.serviceCategory.toLowerCase()) ||
        e.title.toLowerCase().includes(quote.vendorName.toLowerCase())
    );
  }, [event.expenses, quote]);

  // Default targetExpenseId if exactly 1 eligible expense found
  React.useEffect(() => {
    if (eligibleExpenses.length === 1 && !targetExpenseId) {
      setTargetExpenseId(eligibleExpenses[0].id);
    }
  }, [eligibleExpenses, targetExpenseId]);

  const proposal = useMemo(() => {
    if (!quote) return null;
    return createQuoteDerivedProposal(event, quote, {
      promoteToAgreedContract: promoteToContract,
      targetExpenseId: targetExpenseId || undefined,
    });
  }, [event, quote, promoteToContract, targetExpenseId]);

  if (!isOpen || !quote || !proposal) return null;

  const handleApply = () => {
    setApplyError(null);

    const result = applyQuoteDerivedProposal(event, proposal, {
      expectedVersion: event.version,
      expectedUpdatedAt: event.updatedAt,
    });

    if ('error' in result) {
      setApplyError(result.error);
      return;
    }

    onUpdateEvent(result.updatedEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Quotation Staging &amp; Acceptance
              </span>
              <CouponBadge variant="marigold">Contract Safeguards</CouponBadge>
            </div>
            <h3 className="font-serif text-2xl font-medium text-amber-100">
              Review Quote-Derived Proposal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-amber-200 transition-colors p-2 rounded-lg hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quote summary card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block">
                  {quote.vendorName}
                </span>
                <span className="font-serif text-lg text-amber-100 font-medium">
                  {quote.title}
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-amber-300">
                {formatCurrency(quote.quotedTotal, quote.currency)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Category: <span className="capitalize text-slate-200">{quote.serviceCategory}</span> • {quote.includedServices.length} deliverables
            </p>
          </div>

          {/* Configuration Options */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block">
              Staging Options
            </span>

            <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={promoteToContract}
                onChange={(e) => setPromoteToContract(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-amber-100 block">
                  Promote to Confirmed Agreed Contract
                </span>
                <span className="text-slate-400">
                  Marks this vendor as booked with agreedCost = {formatCurrency(quote.quotedTotal, quote.currency)}.
                </span>
              </div>
            </label>

            {eligibleExpenses.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  Link &amp; Update Budget Ledger Expense Estimate
                </label>
                <select
                  value={targetExpenseId}
                  onChange={(e) => setTargetExpenseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Do not adjust ledger expense --</option>
                  {eligibleExpenses.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title} (Currently: {formatCurrency(exp.estimatedAmount, event.currency)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Invariant Failure Warning */}
          {!proposal.canApply && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-semibold mb-1">Contract Invariant Violation</strong>
                {proposal.validationError}
              </div>
            </div>
          )}

          {/* Concurrency / Application Error */}
          {applyError && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{applyError}</span>
            </div>
          )}

          {/* Before & After Diff Box */}
          {proposal.canApply && (
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                Proposed State Changes
              </span>

              {proposal.vendorProposal && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>VENDOR RECORD: {proposal.vendorProposal.vendorName}</span>
                    <span>{proposal.vendorProposal.isNewVendor ? 'NEW' : 'UPDATE'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>
                      Status: <strong className="text-slate-400">{proposal.vendorProposal.before?.status || 'none'}</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Status: <strong className="text-amber-300">{proposal.vendorProposal.after.status}</strong>
                    </span>
                  </div>
                  {proposal.vendorProposal.after.agreedCost !== undefined && (
                    <div className="flex items-center justify-between text-slate-200">
                      <span>Agreed Contract</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(proposal.vendorProposal.after.agreedCost, quote.currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {proposal.expenseProposal && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>EXPENSE LEDGER: {proposal.expenseProposal.expenseTitle}</span>
                    <span>ESTIMATE ADJUSTMENT</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>
                      Estimate: {formatCurrency(proposal.expenseProposal.before.estimatedAmount, event.currency)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300 font-bold">
                      Estimate: {formatCurrency(proposal.expenseProposal.after.estimatedAmount, event.currency)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 italic">
                {proposal.impactSummary}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!proposal.canApply}
            className="text-xs font-mono"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Apply Changes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
