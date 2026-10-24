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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col my-auto text-amber-50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Vendor Procurement
              </span>
              <CouponBadge variant="marigold">Side-by-Side Comparison</CouponBadge>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-amber-100">
              Quotation Comparison &amp; Scope Alignment
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Objective side-by-side comparison across pricing, scope deliverables, hidden charges, and contract terms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => onAddNewQuote(selectedCategory)}
              className="text-xs font-mono"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Quotation</span>
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-amber-200 transition-colors p-2 rounded-lg hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        {availableCategories.length > 1 && (
          <div className="flex border-b border-slate-800 px-6 overflow-x-auto gap-2 py-2.5 bg-slate-950/40">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat} ({allQuotations.filter((q) => q.serviceCategory === cat && q.status !== 'archived').length})
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {categoryQuotes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-amber-200">
                No quotations recorded for {selectedCategory}.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Record quotations to compare deliverables, unincluded taxes, payment milestones, and negotiate effectively.
              </p>
              <Button
                variant="primary"
                onClick={() => onAddNewQuote(selectedCategory)}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Record First Quotation</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Variance & Metrics Header Card */}
              {categoryQuotes.length > 1 && !comparisonResult.hasCurrencyMismatch && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Lowest Quoted Total
                    </span>
                    <span className="font-mono text-xl font-bold text-amber-300">
                      {formatCurrency(comparisonResult.basePriceComparison.lowestQuotedTotal, comparisonResult.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Highest Quoted Total
                    </span>
                    <span className="font-mono text-xl font-bold text-amber-300">
                      {formatCurrency(comparisonResult.basePriceComparison.highestQuotedTotal, comparisonResult.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      Price Variance
                    </span>
                    <span className="font-mono text-xl font-bold text-secondary">
                      {formatCurrency(comparisonResult.basePriceComparison.variance, comparisonResult.currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Currency Mismatch Warning Banner */}
              {comparisonResult.hasCurrencyMismatch && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 font-mono">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
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
                      className={`bg-slate-950/70 border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-amber-500/40 ${
                        isCheapest ? 'border-amber-500/50 shadow-md ring-1 ring-amber-500/20' : 'border-slate-800'
                      }`}
                    >
                      {/* Top Meta */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                              {quote.vendorName}
                            </span>
                            <h4 className="font-serif text-lg font-medium text-amber-100">
                              {quote.title}
                            </h4>
                          </div>
                          {isCheapest && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Lowest Base
                            </span>
                          )}
                        </div>

                        {/* Price Block */}
                        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono text-2xl font-bold text-amber-300">
                              {formatCurrency(quote.quotedTotal, quote.currency)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {quote.currency}
                            </span>
                          </div>

                          {unincludedTaxes.length > 0 ? (
                            <p className="text-[11px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                Excl. {formatCurrency(unincludedSum, quote.currency)} taxes (Effective: {formatCurrency(effectiveTotal, quote.currency)})
                              </span>
                            </p>
                          ) : (
                            <p className="text-[11px] font-mono text-emerald-400 mt-1">
                              ✓ All taxes included in total
                            </p>
                          )}
                        </div>

                        {/* Deposit & Valid dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 bg-slate-900/50 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 block uppercase">Deposit Required</span>
                            <span className="text-slate-200">
                              {quote.depositRequired
                                ? `${formatCurrency(quote.depositRequired, quote.currency)} (${Math.round((quote.depositRequired / quote.quotedTotal) * 100)}%)`
                                : 'Not specified'}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900/50 rounded border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 block uppercase">Quote Validity</span>
                            <span className="text-slate-200">
                              {quote.validUntilDate || 'No date set'}
                            </span>
                          </div>
                        </div>

                        {/* Deliverables Section */}
                        <div className="space-y-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                            Deliverables ({quote.includedServices.length})
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-300">
                            {(quote.includedServices || []).map((svc: { description: string; itemizedCost?: number }, sIdx: number) => {
                              const isUnique = uniqueItems.includes(svc.description);
                              return (
                                <li key={sIdx} className="flex items-start gap-1.5">
                                  {isUnique ? (
                                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  )}
                                  <span className={isUnique ? 'text-amber-200 font-medium' : ''}>
                                    {svc.description}
                                    {svc.itemizedCost !== undefined && (
                                      <span className="font-mono text-slate-400 ml-1">
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
                          <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block">
                              Explicit Exclusions
                            </span>
                            <ul className="space-y-1 text-xs text-rose-300">
                              {(quote.exclusions || []).map((ex: string, eIdx: number) => (
                                <li key={eIdx} className="flex items-start gap-1.5">
                                  <MinusCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Information Alerts */}
                        {missingTerms.length > 0 && (
                          <div className="space-y-1 border-t border-slate-800/80 pt-3">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                              Missing Terms to Clarify
                            </span>
                            <ul className="space-y-0.5 text-xs text-amber-300/80">
                              {missingTerms.map((m, mIdx) => (
                                <li key={mIdx} className="flex items-start gap-1.5">
                                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-5 border-t border-slate-800/80 space-y-2 mt-4">
                        <Button
                          variant="primary"
                          onClick={() => onPromoteQuote(quote)}
                          className="w-full justify-center text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          <span>Accept &amp; Stage Proposal</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onDraftMessage(quote)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-amber-200 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Message</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuote(quote)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Edit Quote</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Findings & Qualitative Insights Section */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-amber-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Comparative Findings &amp; Trade-Offs</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct mathematical facts and qualitative trade-offs to help you decide.
                    </p>
                  </div>

                  {!aiFindingsAdded && categoryQuotes.length >= 2 && (
                    <Button
                      variant="secondary"
                      onClick={handleFetchAiInsights}
                      disabled={isFetchingAiInsights}
                      className="text-xs font-mono self-start sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      <span>{isFetchingAiInsights ? 'Analyzing Insights...' : 'Analyze Qualitative Insights'}</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {comparisonResult.findings.map((f, idx) => {
                    const isAi = f.isAiInterpretation;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
                          f.severity === 'alert'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : f.severity === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5">
                          {f.severity === 'alert' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : f.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-amber-100">{f.summary}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                                isAi
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {isAi ? 'AI Qualitative Insight' : 'Direct Quote Fact'}
                            </span>
                          </div>
                          <p className="leading-relaxed">{f.detail}</p>
                          {f.sourceEvidence && (
                            <p className="font-mono text-[10px] text-slate-500">
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
        <div className="p-6 border-t border-slate-800 flex items-center justify-end bg-slate-950/60">
          <Button variant="secondary" onClick={onClose}>
            <span>Done</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
