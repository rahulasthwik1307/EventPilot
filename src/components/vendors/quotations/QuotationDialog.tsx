'use client';

import React, { useState } from 'react';
import {
  VendorQuotation,
  VendorQuotationInput,
  VendorCategory,
} from '@/features/vendors/types';
import { Event } from '@/features/events/types';
import {
  validateVendorQuotation,
  calculateQuotationItemizedTotal,
} from '@/features/vendors/quotations/quotation-engine';
import { VENDOR_CATEGORIES } from '@/features/vendors/vendor-engine';
import { formatCurrency } from '@/features/events/validation';
import { Button } from '../../ui/Button';
import { CouponBadge } from '../../ui/Badge';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface QuotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  editingQuote?: VendorQuotation | null;
  defaultVendorId?: string;
  defaultCategory?: VendorCategory;
  onSave: (quote: VendorQuotation) => void;
}

export function QuotationDialog({
  isOpen,
  onClose,
  event,
  editingQuote,
  defaultVendorId,
  defaultCategory,
  onSave,
}: QuotationDialogProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'extract'>('form');
  const [pasteText, setPasteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Form state
  const [vendorName, setVendorName] = useState(
    editingQuote?.vendorName ||
      (defaultVendorId ? event.vendors.find((v) => v.id === defaultVendorId)?.name || '' : '')
  );
  const [vendorId, setVendorId] = useState(editingQuote?.vendorId || defaultVendorId || '');
  const [serviceCategory, setServiceCategory] = useState<VendorCategory>(
    editingQuote?.serviceCategory || defaultCategory || 'photography'
  );
  const [title, setTitle] = useState(editingQuote?.title || '');
  const [quotedTotal, setQuotedTotal] = useState<string>(
    editingQuote ? String(editingQuote.quotedTotal) : ''
  );
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>(
    editingQuote?.currency || event.currency || 'INR'
  );
  const [quoteDate, setQuoteDate] = useState(
    editingQuote?.quoteDate || new Date().toISOString().split('T')[0]
  );
  const [validUntilDate, setValidUntilDate] = useState(editingQuote?.validUntilDate || '');
  const [depositRequired, setDepositRequired] = useState<string>(
    editingQuote?.depositRequired ? String(editingQuote.depositRequired) : ''
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    editingQuote?.cancellationPolicy || ''
  );
  const [guestCountAssumption, setGuestCountAssumption] = useState<string>(
    editingQuote?.guestCountAssumption ? String(editingQuote.guestCountAssumption) : ''
  );
  const [notes, setNotes] = useState(editingQuote?.notes || '');

  // Sub-items
  const [includedServices, setIncludedServices] = useState<
    Array<{ description: string; itemizedCost?: number }>
  >(
    editingQuote?.includedServices?.map((s) => ({
      description: s.description,
      itemizedCost: s.itemizedCost,
    })) || [{ description: '', itemizedCost: undefined }]
  );

  const [exclusions, setExclusions] = useState<string[]>(editingQuote?.exclusions || []);
  const [newExclusion, setNewExclusion] = useState('');

  const [taxesAndFees, setTaxesAndFees] = useState<
    Array<{ name: string; amount: number; isIncludedInTotal: boolean }>
  >(
    editingQuote?.taxesAndFees?.map((t) => ({
      name: t.name,
      amount: t.amount,
      isIncludedInTotal: t.isIncludedInTotal,
    })) || []
  );

  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  // Live itemized total calculation
  const parsedTotal = parseFloat(quotedTotal) || 0;
  const itemizedCalc = calculateQuotationItemizedTotal({
    quotedTotal: parsedTotal,
    includedServices: includedServices.filter((s) => s.description.trim().length > 0),
    taxesAndFees,
  });

  const handleAiExtract = async () => {
    if (!pasteText.trim() || pasteText.trim().length < 10) {
      setExtractError('Please paste at least 10 characters of quotation text.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract',
          payload: {
            sourceText: pasteText,
            category: serviceCategory,
            currency,
            eventId: event.id,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract quotation data.');
      }

      const d = json.data;
      if (d.vendorName) setVendorName(d.vendorName);
      if (d.serviceCategory) setServiceCategory(d.serviceCategory);
      if (d.title) setTitle(d.title);
      if (typeof d.quotedTotal === 'number') setQuotedTotal(String(d.quotedTotal));
      if (d.currency) setCurrency(d.currency);
      if (d.quoteDate) setQuoteDate(d.quoteDate);
      if (d.validUntilDate) setValidUntilDate(d.validUntilDate);
      if (typeof d.depositRequired === 'number') setDepositRequired(String(d.depositRequired));
      if (d.cancellationPolicy) setCancellationPolicy(d.cancellationPolicy);
      if (typeof d.guestCountAssumption === 'number') setGuestCountAssumption(String(d.guestCountAssumption));
      if (Array.isArray(d.includedServices) && d.includedServices.length > 0) {
        setIncludedServices(d.includedServices);
      }
      if (Array.isArray(d.exclusions)) {
        setExclusions(d.exclusions);
      }
      if (Array.isArray(d.taxesAndFees)) {
        setTaxesAndFees(d.taxesAndFees);
      }

      setActiveTab('form');
    } catch (err: any) {
      setExtractError(err.message || 'Error occurred during extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = () => {
    const rawQuote: Partial<VendorQuotationInput | VendorQuotation> = {
      ...(editingQuote || {}),
      vendorId: vendorId || (event.vendors.find((v) => v.name.toLowerCase() === vendorName.toLowerCase())?.id || ''),
      vendorName: vendorName.trim(),
      serviceCategory,
      title: title.trim(),
      quotedTotal: parseFloat(quotedTotal) || 0,
      currency,
      quoteDate,
      validUntilDate: validUntilDate.trim() ? validUntilDate : undefined,
      depositRequired: depositRequired ? parseFloat(depositRequired) || undefined : undefined,
      cancellationPolicy: cancellationPolicy.trim() ? cancellationPolicy.trim() : undefined,
      guestCountAssumption: guestCountAssumption ? parseInt(guestCountAssumption, 10) || undefined : undefined,
      includedServices: includedServices.filter((s) => s.description.trim().length > 0),
      exclusions: exclusions.filter((e) => e.trim().length > 0),
      taxesAndFees,
      paymentMilestones: depositRequired
        ? [{ stage: 'Booking Deposit', amount: parseFloat(depositRequired) || 0 }]
        : [],
      notes: notes.trim() ? notes.trim() : undefined,
      provenance: activeTab === 'extract' || pasteText ? 'ai_extracted' : 'user_manual',
      sourceText: pasteText.trim() ? pasteText.trim() : undefined,
      status: editingQuote?.status || 'active',
    };

    const validation = validateVendorQuotation(rawQuote);
    if (!validation.isValid || !validation.quotation) {
      setErrors(validation.errors);
      return;
    }

    onSave(validation.quotation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-auto text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Quotation Modeling
              </span>
              <CouponBadge variant="stone">
                {editingQuote ? 'Edit Quotation' : 'New Vendor Quotation'}
              </CouponBadge>
            </div>
            <h3 className="font-serif text-2xl font-medium text-amber-100">
              {editingQuote ? `Edit: ${editingQuote.title}` : 'Record Vendor Quotation'}
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'form'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Structured Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('extract')}
            className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'extract'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Paste &amp; Extract (AI)</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errors.length > 0 && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
              <div className="flex items-center gap-2 font-medium mb-1">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Please correct the following:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'extract' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Paste Quotation Text, Email, or WhatsApp Quote
                </label>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste raw vendor proposal text here... e.g.:&#10;Studio Memoir&#10;Signature Wedding Photography&#10;Total: ₹1,80,000&#10;Inclusions:&#10;- 2 Lead Photographers&#10;- 1 Cinematographer&#10;Exclusions: Outstation travel&#10;Deposit: ₹50,000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm font-mono text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {extractError && (
                <p className="text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  {extractError}
                </p>
              )}

              <Button
                variant="primary"
                onClick={handleAiExtract}
                disabled={isExtracting}
                className="w-full justify-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isExtracting ? 'Extracting Fields...' : 'Extract Quotation Fields'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Primary metadata row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Studio Memoir"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Service Category *
                  </label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as VendorCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Package / Quotation Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Signature Vivaha Photography & Cinematic Film"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Headline Quoted Total *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    <input
                      type="number"
                      value={quotedTotal}
                      onChange={(e) => setQuotedTotal(e.target.value)}
                      placeholder="180000"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Quote Date *
                  </label>
                  <input
                    type="date"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Quotation Expiry Date
                  </label>
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Advance Deposit Required
                  </label>
                  <input
                    type="number"
                    value={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Inclusions list */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    Included Services &amp; Deliverables
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludedServices([...includedServices, { description: '', itemizedCost: undefined }])}
                    className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {includedServices.map((service, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. 2 Lead Candid Photographers (10 hrs)"
                      value={service.description}
                      onChange={(e) => {
                        const next = [...includedServices];
                        next[idx].description = e.target.value;
                        setIncludedServices(next);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="number"
                      placeholder="Item Cost (optional)"
                      value={service.itemizedCost !== undefined ? service.itemizedCost : ''}
                      onChange={(e) => {
                        const next = [...includedServices];
                        const val = parseFloat(e.target.value);
                        next[idx].itemizedCost = isNaN(val) ? undefined : val;
                        setIncludedServices(next);
                      }}
                      className="w-36 bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                    />
                    {includedServices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIncludedServices(includedServices.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Exclusions list */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                  Explicit Exclusions
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Outstation hotel stay, Drone permissions"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newExclusion.trim()) {
                          setExclusions([...exclusions, newExclusion.trim()]);
                          setNewExclusion('');
                        }
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newExclusion.trim()) {
                        setExclusions([...exclusions, newExclusion.trim()]);
                        setNewExclusion('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-amber-200"
                  >
                    Add
                  </button>
                </div>

                {exclusions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {exclusions.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-rose-500/10 border border-rose-500/20 text-rose-300"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => setExclusions(exclusions.filter((_, i) => i !== idx))}
                          className="hover:text-rose-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancellation policy & notes */}
              <div className="border-t border-slate-800 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Cancellation Policy
                  </label>
                  <input
                    type="text"
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="e.g. 50% deposit refundable up to 45 days prior"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Guest Headcount Assumption
                  </label>
                  <input
                    type="number"
                    value={guestCountAssumption}
                    onChange={(e) => setGuestCountAssumption(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-amber-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Itemized math discrepancy banner */}
              {itemizedCalc.hasDiscrepancy && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Itemized Sum Discrepancy</span>
                    Sum of itemized deliverables ({formatCurrency(itemizedCalc.calculatedTotal, currency)}) differs from declared headline total ({formatCurrency(parsedTotal, currency)}) by {formatCurrency(Math.abs(itemizedCalc.discrepancy), currency)}.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs font-mono text-slate-400">
            {parsedTotal > 0 && (
              <span>
                Total: <strong className="text-amber-300">{formatCurrency(parsedTotal, currency)}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <Button variant="primary" onClick={handleSave}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Save Quotation</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
