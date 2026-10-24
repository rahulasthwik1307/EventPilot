'use client';

import React, { useMemo, useState } from 'react';
import {
  VendorQuotation,
  VendorCategory,
  QuotationComparisonResult,
} from '@/features/vendors/types';
import { Event } from '@/features/events/types';
import {
  compareVendorQuotations,
  mergeAiComparisonInsights,
} from '@/features/vendors/quotations/comparison-engine';
import { formatCurrency } from '@/features/events/validation';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { CouponBadge } from '../../ui/Badge';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  DollarSign,
  FileText,
  Mail,
  MinusCircle,
  Plus,
  Scale,
  ShieldAlert,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

interface QuotationComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  initialCategory?: VendorCategory;
  onPromoteQuote: (quote: VendorQuotation) => void;
  onDraftMessage: (quote: VendorQuotation) => void;
  onEditQuote: (quote: VendorQuotation) => void;
  onAddNewQuote: (category?: VendorCategory) => void;
}

export function QuotationComparisonView({
  isOpen,
  onClose,
  event,
  initialCategory,
  onPromoteQuote,
  onDraftMessage,
  onEditQuote,
  onAddNewQuote,
}: QuotationComparisonViewProps) {
  const allQuotations = useMemo(() => event.quotations || [], [event.quotations]);

  // Distinct categories present in quotations
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(allQuotations.map((q) => q.serviceCategory)));
    return cats.length > 0 ? cats : (['photography'] as VendorCategory[]);
  }, [allQuotations]);

  const [selectedCategory, setSelectedCategory] = useState<VendorCategory>(
    initialCategory || availableCategories[0] || 'photography'
  );

  const [isFetchingAiInsights, setIsFetchingAiInsights] = useState(false);
  const [aiFindingsAdded, setAiFindingsAdded] = useState(false);

  // Filter quotations for active category
  const categoryQuotes = useMemo(() => {
    return allQuotations.filter((q) => q.serviceCategory === selectedCategory && q.status !== 'archived');
  }, [allQuotations, selectedCategory]);

  // Deterministic side-by-side comparison result
  const baseComparison = useMemo(() => {
    return compareVendorQuotations(categoryQuotes, event.currency);
  }, [categoryQuotes, event.currency]);

  const [comparisonResult, setComparisonResult] = useState<QuotationComparisonResult>(baseComparison);

  // Sync comparisonResult when base changes
  React.useEffect(() => {
    setComparisonResult(baseComparison);
    setAiFindingsAdded(false);
  }, [baseComparison]);

  if (!isOpen) return null;

  const handleFetchAiInsights = async () => {
    if (categoryQuotes.length < 2) return;
    setIsFetchingAiInsights(true);

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare_insights',
          payload: {
            quotations: categoryQuotes,
            eventContext: {
              title: event.title,
              eventType: event.type,
              guestTarget: event.guestTarget,
              date: event.date,
            },
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.findings) {
        const merged = mergeAiComparisonInsights(comparisonResult, json.data.findings);
        setComparisonResult(merged);
        setAiFindingsAdded(true);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsFetchingAiInsights(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#C2410C] font-bold">
              Vendor Procurement
            </span>
            <CouponBadge variant="marigold">Side-by-Side Comparison</CouponBadge>
          </div>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Quotation Comparison &amp; Scope Alignment
          </span>
        </div>
      }
      description="Objective side-by-side comparison across pricing, scope deliverables, hidden charges, and contract terms."
      headerActions={
        <Button
          variant="outline"
          onClick={() => onAddNewQuote(selectedCategory)}
          className="text-xs font-mono font-bold border-neutral-border bg-neutral-surface text-neutral-text hover:bg-neutral-subtle shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5 text-primary" />
          <span>Add Quotation</span>
        </Button>
      }
      maxWidth="3xl"
      accentBar
      contentPadding={false}
    >
      <div className="flex flex-col flex-1 min-h-0 bg-white">

        {/* Category Tabs */}
        {availableCategories.length > 1 && (
          <div className="flex border-b border-[#E7DFD5] px-6 overflow-x-auto gap-2 py-2.5 bg-[#FAF8F5]">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FFEDD5] text-[#9A3412] font-bold border border-[#FED7AA]'
                    : 'text-[#78716C] hover:text-[#1C1917] hover:bg-white border border-transparent'
                }`}
              >
                {cat} ({allQuotations.filter((q) => q.serviceCategory === cat && q.status !== 'archived').length})
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF8F5]/30">
          {categoryQuotes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E7DFD5] rounded-xl space-y-3 bg-white">
              <FileText className="w-10 h-10 text-[#A8A29E] mx-auto opacity-60" />
              <p className="text-sm font-semibold text-[#1C1917]">
                No quotations recorded for {selectedCategory}.
              </p>
              <p className="text-xs text-[#78716C] max-w-md mx-auto leading-relaxed">
                Record quotations to compare deliverables, unincluded taxes, payment milestones, and negotiate effectively.
              </p>
              <Button
                variant="primary"
                onClick={() => onAddNewQuote(selectedCategory)}
                className="mt-2 bg-[#D97706] hover:bg-[#B45309] text-white border-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Record First Quotation</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Variance & Metrics Header Card */}
              {categoryQuotes.length > 1 && !comparisonResult.hasCurrencyMismatch && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-white border border-[#E7DFD5] rounded-xl p-4 shadow-sm">
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold block mb-1">
                      Lowest Quoted Total
                    </span>
                    <span className="font-mono text-xl font-bold text-[#059669]">
                      {formatCurrency(comparisonResult.basePriceComparison.lowestQuotedTotal, comparisonResult.currency)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold block mb-1">
                      Highest Quoted Total
                    </span>
                    <span className="font-mono text-xl font-bold text-[#1C1917]">
                      {formatCurrency(comparisonResult.basePriceComparison.highestQuotedTotal, comparisonResult.currency)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C2410C] font-semibold block mb-1">
                      Price Variance
                    </span>
                    <span className="font-mono text-xl font-bold text-[#C2410C]">
                      {formatCurrency(comparisonResult.basePriceComparison.variance, comparisonResult.currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Currency Mismatch Warning Banner */}
              {comparisonResult.hasCurrencyMismatch && (
                <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs flex items-start gap-3 font-mono">
                  <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-semibold mb-1">Currency Mismatch Detected</strong>
                    These quotations are denominated in different currencies. Direct mathematical netting is disabled to prevent misleading exchange approximations. Evaluate each package against local rate standards.
                  </div>
                </div>
              )}

              {/* Side-by-side Columns */}
              <div
                className={`grid gap-4 ${
                  categoryQuotes.length === 1
                    ? 'grid-cols-1'
                    : categoryQuotes.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-3'
                }`}
              >
                {categoryQuotes.map((quote) => {
                  const isCheapest =
                    !comparisonResult.hasCurrencyMismatch &&
                    quote.quotedTotal === comparisonResult.basePriceComparison.lowestQuotedTotal &&
                    categoryQuotes.length > 1;

                  const unincludedTaxes = (quote.taxesAndFees || []).filter((t: { isIncludedInTotal: boolean }) => !t.isIncludedInTotal);
                  const unincludedSum = unincludedTaxes.reduce((s: number, t: { amount: number }) => s + t.amount, 0);
                  const effectiveTotal = quote.quotedTotal + unincludedSum;

                  const uniqueItems = comparisonResult.scopeAlignment.uniqueDeliverables[quote.id] || [];
                  const missingTerms = comparisonResult.exclusionsAnalysis.missingInformation[quote.id] || [];

                  return (
                    <div
                      key={quote.id}
                      className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                        isCheapest
                          ? 'border-[#D97706] shadow-sm ring-1 ring-[#D97706]/30 bg-[#FEF3C7]/10'
                          : 'border-[#E7DFD5] hover:border-[#D6C7B2]'
                      }`}
                    >
                      {/* Top Meta */}
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] block">
                              {quote.vendorName}
                            </span>
                            <h4 className="font-serif text-lg font-bold text-[#1C1917] tracking-tight">
                              {quote.title}
                            </h4>
                          </div>
                          {isCheapest && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shrink-0">
                              Lowest Base
                            </span>
                          )}
                        </div>

                        {/* Price Block */}
                        <div className="p-3 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg">
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono text-2xl font-bold text-[#1C1917]">
                              {formatCurrency(quote.quotedTotal, quote.currency)}
                            </span>
                            <span className="text-[11px] font-mono text-[#78716C]">
                              {quote.currency}
                            </span>
                          </div>

                          {unincludedTaxes.length > 0 ? (
                            <p className="text-[11px] font-mono text-[#C2410C] mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Excl. {formatCurrency(unincludedSum, quote.currency)} taxes (Effective: {formatCurrency(effectiveTotal, quote.currency)})
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11px] font-mono text-[#059669] mt-1 font-medium">
                              ✓ All taxes included in total
                            </p>
                          )}
                        </div>

                        {/* Deposit & Valid dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 bg-[#FAF8F5] rounded border border-[#E7DFD5]">
                            <span className="text-[10px] text-[#78716C] block uppercase font-semibold">Deposit Required</span>
                            <span className="text-[#1C1917] font-medium">
                              {quote.depositRequired
                                ? `${formatCurrency(quote.depositRequired, quote.currency)} (${Math.round((quote.depositRequired / quote.quotedTotal) * 100)}%)`
                                : 'Not specified'}
                            </span>
                          </div>
                          <div className="p-2 bg-[#FAF8F5] rounded border border-[#E7DFD5]">
                            <span className="text-[10px] text-[#78716C] block uppercase font-semibold">Quote Validity</span>
                            <span className="text-[#1C1917] font-medium">
                              {quote.validUntilDate || 'No date set'}
                            </span>
                          </div>
                        </div>

                        {/* Deliverables Section */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#D97706] font-bold block">
                            Deliverables ({quote.includedServices.length})
                          </span>
                          <ul className="space-y-1 text-xs text-[#1C1917]">
                            {(quote.includedServices || []).map((svc: { description: string; itemizedCost?: number }, sIdx: number) => {
                              const isUnique = uniqueItems.includes(svc.description);
                              return (
                                <li key={sIdx} className="flex items-start gap-1.5">
                                  {isUnique ? (
                                    <Star className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                                  )}
                                  <span className={isUnique ? 'text-[#92400E] font-bold' : ''}>
                                    {svc.description}
                                    {svc.itemizedCost !== undefined && (
                                      <span className="font-mono text-[#78716C] ml-1">
                                        ({formatCurrency(svc.itemizedCost, quote.currency)})
                                      </span>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {/* Exclusions Section */}
                        {quote.exclusions && quote.exclusions.length > 0 && (
                          <div className="space-y-1 border-t border-[#E7DFD5] pt-2.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2410C] font-bold block">
                              Explicit Exclusions
                            </span>
                            <ul className="space-y-0.5 text-xs text-[#C2410C]">
                              {(quote.exclusions || []).map((ex: string, eIdx: number) => (
                                <li key={eIdx} className="flex items-start gap-1.5">
                                  <MinusCircle className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Information Alerts */}
                        {missingTerms.length > 0 && (
                          <div className="space-y-1 border-t border-[#E7DFD5] pt-2.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D97706] font-bold block">
                              Missing Terms to Clarify
                            </span>
                            <ul className="space-y-0.5 text-xs text-[#92400E]">
                              {missingTerms.map((m, mIdx) => (
                                <li key={mIdx} className="flex items-start gap-1.5">
                                  <AlertCircle className="w-3 h-3 text-[#D97706] shrink-0 mt-0.5" />
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-4 border-t border-[#E7DFD5] space-y-2 mt-4">
                        <Button
                          variant="primary"
                          onClick={() => onPromoteQuote(quote)}
                          className="w-full justify-center text-xs font-mono font-bold bg-[#D97706] hover:bg-[#B45309] text-white border-0 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          <span>Accept &amp; Stage Proposal</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onDraftMessage(quote)}
                            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#E7DFD5] rounded-lg text-xs font-mono text-[#1C1917] flex items-center justify-center gap-1 transition-colors font-medium"
                          >
                            <Mail className="w-3 h-3 text-[#78716C]" />
                            <span>Message</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuote(quote)}
                            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#E7DFD5] rounded-lg text-xs font-mono text-[#1C1917] flex items-center justify-center gap-1 transition-colors font-medium"
                          >
                            <FileText className="w-3 h-3 text-[#78716C]" />
                            <span>Edit Quote</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Findings & Qualitative Insights Section */}
              <div className="border-t border-[#E7DFD5] pt-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1C1917] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D97706]" />
                      <span>Comparative Findings &amp; Trade-Offs</span>
                    </h3>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Direct mathematical facts and qualitative trade-offs to help you decide.
                    </p>
                  </div>

                  {!aiFindingsAdded && categoryQuotes.length >= 2 && (
                    <Button
                      variant="outline"
                      onClick={handleFetchAiInsights}
                      disabled={isFetchingAiInsights}
                      className="text-xs font-mono self-start sm:self-auto border-[#E7DFD5] bg-white text-[#1C1917] hover:bg-[#FAF8F5]"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#D97706]" />
                      <span>{isFetchingAiInsights ? 'Analyzing Insights...' : 'Analyze Qualitative Insights'}</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {comparisonResult.findings.map((f, idx) => {
                    const isAi = f.isAiInterpretation;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                          f.severity === 'alert'
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                            : f.severity === 'warning'
                            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                            : 'bg-white border-[#E7DFD5] text-[#1C1917]'
                        }`}
                      >
                        <div className="mt-0.5">
                          {f.severity === 'alert' ? (
                            <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
                          ) : f.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1C1917]">{f.summary}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold ${
                                isAi
                                  ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]'
                                  : 'bg-[#FAF8F5] text-[#78716C] border border-[#E7DFD5]'
                              }`}
                            >
                              {isAi ? 'AI Qualitative Insight' : 'Direct Quote Fact'}
                            </span>
                          </div>
                          <p className="leading-relaxed text-[#78716C]">{f.detail}</p>
                          {f.sourceEvidence && (
                            <p className="font-mono text-[10px] text-[#A8A29E]">
                              Basis: {f.sourceEvidence}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7DFD5] flex items-center justify-end bg-[#FAF8F5]">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-mono font-bold border-[#E7DFD5] bg-white text-[#1C1917] hover:bg-[#FAF8F5]"
          >
            <span>Done</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
