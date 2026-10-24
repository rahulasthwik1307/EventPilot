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
import { Dialog } from '../../ui/Dialog';
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
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B45309] font-semibold">
              Quotation Staging &amp; Acceptance
            </span>
            <CouponBadge variant="marigold">Contract Safeguards</CouponBadge>
          </div>
          <span className="font-serif text-xl font-medium text-[#1C1917]">
            Review Quote-Derived Proposal
          </span>
        </div>
      }
      maxWidth="lg"
      accentBar
      contentPadding={false}
    >
      <div className="flex flex-col flex-1 min-h-0 bg-white">

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Quote summary card */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg space-y-1.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold block">
                  {quote.vendorName}
                </span>
                <span className="font-serif text-lg text-[#1C1917] font-medium">
                  {quote.title}
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-[#D97706]">
                {formatCurrency(quote.quotedTotal, quote.currency)}
              </span>
            </div>
            <p className="text-xs text-[#78716C]">
              Category: <span className="capitalize text-[#1C1917] font-medium">{quote.serviceCategory}</span> • {quote.includedServices.length} deliverables
            </p>
          </div>

          {/* Configuration Options */}
          <div className="space-y-3 p-4 bg-[#FDFBF7] border border-[#E7DFD5] rounded-lg">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B45309] font-semibold block">
              Staging Options
            </span>

            <label className="flex items-start gap-2.5 text-xs text-[#1C1917] cursor-pointer">
              <input
                type="checkbox"
                checked={promoteToContract}
                onChange={(e) => setPromoteToContract(e.target.checked)}
                className="mt-0.5 rounded border-[#E7DFD5] text-[#D97706] focus:ring-[#D97706]"
              />
              <div>
                <span className="font-medium text-[#1C1917] block">
                  Promote to Confirmed Agreed Contract
                </span>
                <span className="text-[#78716C]">
                  Marks this vendor as booked with agreedCost = {formatCurrency(quote.quotedTotal, quote.currency)}.
                </span>
              </div>
            </label>

            {eligibleExpenses.length > 0 && (
              <div className="pt-2 border-t border-[#E7DFD5] space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#78716C] font-semibold">
                  Link &amp; Update Budget Ledger Expense Estimate
                </label>
                <select
                  value={targetExpenseId}
                  onChange={(e) => setTargetExpenseId(e.target.value)}
                  className="w-full bg-white border border-[#E7DFD5] rounded-lg p-2 text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 transition-all shadow-sm"
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
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-semibold mb-1">Contract Invariant Violation</strong>
                {proposal.validationError}
              </div>
            </div>
          )}

          {/* Concurrency / Application Error */}
          {applyError && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{applyError}</span>
            </div>
          )}

          {/* Before & After Diff Box */}
          {proposal.canApply && (
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#B45309] font-semibold block">
                Proposed State Changes
              </span>

              {proposal.vendorProposal && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-[#78716C] text-[11px]">
                    <span className="font-semibold">VENDOR RECORD: {proposal.vendorProposal.vendorName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#E7DFD5]/50 text-[10px] font-bold">
                      {proposal.vendorProposal.isNewVendor ? 'NEW' : 'UPDATE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#1C1917]">
                    <span>
                      Status: <strong className="text-[#78716C]">{proposal.vendorProposal.before?.status || 'none'}</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>
                      Status: <strong className="text-[#D97706]">{proposal.vendorProposal.after.status}</strong>
                    </span>
                  </div>
                  {proposal.vendorProposal.after.agreedCost !== undefined && (
                    <div className="flex items-center justify-between text-[#1C1917]">
                      <span>Agreed Contract</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="text-emerald-700 font-bold">
                        {formatCurrency(proposal.vendorProposal.after.agreedCost, quote.currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {proposal.expenseProposal && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-[#78716C] text-[11px]">
                    <span className="font-semibold">EXPENSE LEDGER: {proposal.expenseProposal.expenseTitle}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#E7DFD5]/50 text-[10px] font-bold">ESTIMATE ADJUSTMENT</span>
                  </div>
                  <div className="flex items-center justify-between text-[#1C1917]">
                    <span>
                      Estimate: {formatCurrency(proposal.expenseProposal.before.estimatedAmount, event.currency)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                    <span className="text-[#D97706] font-bold">
                      Estimate: {formatCurrency(proposal.expenseProposal.after.estimatedAmount, event.currency)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-[#78716C] italic">
                {proposal.impactSummary}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E7DFD5] flex items-center justify-between bg-[#FAF8F5]">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            Cancel
          </button>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!proposal.canApply}
            className="text-xs font-mono shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Apply Changes</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
