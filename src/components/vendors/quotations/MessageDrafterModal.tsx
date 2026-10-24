'use client';

import React, { useMemo, useState } from 'react';
import { Event } from '@/features/events/types';
import {
  VendorQuotation,
  VendorMessageScenario,
} from '@/features/vendors/types';
import { generateVendorMessageDraft } from '@/features/vendors/quotations/message-drafts';
import { Button } from '../../ui/Button';
import { CouponBadge } from '../../ui/Badge';
import {
  AlertCircle,
  Check,
  Copy,
  Mail,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

interface MessageDrafterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  initialQuotation?: VendorQuotation;
  initialScenario?: VendorMessageScenario;
}

const SCENARIO_OPTIONS: Array<{ value: VendorMessageScenario; label: string; desc: string }> = [
  {
    value: 'initial_inquiry',
    label: '1. Initial Inquiry',
    desc: 'Request initial packages and deliverables for your event date.',
  },
  {
    value: 'scope_clarification',
    label: '2. Scope Clarification',
    desc: 'Clarify unincluded items, overtime rates, or missing terms.',
  },
  {
    value: 'revised_quote',
    label: '3. Revised Quote / Budget',
    desc: 'Propose scope or schedule trims to align with your budget cap.',
  },
  {
    value: 'payment_terms',
    label: '4. Payment Terms',
    desc: 'Negotiate milestone schedules or lower upfront deposit.',
  },
  {
    value: 'scope_confirmation',
    label: '5. Pre-Contract Confirmation',
    desc: 'Confirm accepted terms and request a formal service agreement.',
  },
  {
    value: 'expiry_extension',
    label: '6. Expiry Extension',
    desc: 'Request a temporary date hold while finalizing decisions.',
  },
];

export function MessageDrafterModal({
  isOpen,
  onClose,
  event,
  initialQuotation,
  initialScenario = 'scope_clarification',
}: MessageDrafterModalProps) {
  const quotations = useMemo(() => event.quotations || [], [event.quotations]);

  const [selectedScenario, setSelectedScenario] = useState<VendorMessageScenario>(initialScenario);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(
    initialQuotation?.id || (quotations[0]?.id || '')
  );
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedQuote = useMemo(() => {
    return quotations.find((q) => q.id === selectedQuoteId) || initialQuotation;
  }, [quotations, selectedQuoteId, initialQuotation]);

  // Generate initial draft
  const draft = useMemo(() => {
    return generateVendorMessageDraft(selectedScenario, event, selectedQuote, customNotes);
  }, [selectedScenario, event, selectedQuote, customNotes]);

  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);

  // Sync subject and body when draft regenerated
  React.useEffect(() => {
    setSubject(draft.subject);
    setBody(draft.body);
  }, [draft]);

  // Unfilled placeholders in current body/subject
  const remainingPlaceholders = useMemo(() => {
    const combined = `${subject} ${body}`;
    const matches = combined.match(/\[([^[\]]+)\]/g);
    return matches ? Array.from(new Set(matches)) : [];
  }, [subject, body]);

  if (!isOpen) return null;

  const handleCopyMessage = async () => {
    try {
      const fullText = `Subject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto text-amber-50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Vendor Coordination
              </span>
              <CouponBadge variant="marigold">Message Drafter</CouponBadge>
            </div>
            <h2 className="font-serif text-2xl font-medium text-amber-100">
              Vendor Coordination Message Drafter
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Context-aware message templates for 6 procurement scenarios with customizable terms.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-amber-200 transition-colors p-2 rounded-lg hover:bg-slate-800 self-end sm:self-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls row */}
        <div className="p-6 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Select Coordination Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as VendorMessageScenario)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
            >
              {SCENARIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Associated Quotation / Vendor
            </label>
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
            >
              <option value="">-- Generic / No specific quote --</option>
              {quotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.vendorName} — {q.title} ({q.currency} {q.quotedTotal.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Placeholder alert banner */}
          {remainingPlaceholders.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">
                  {remainingPlaceholders.length} Placeholder{remainingPlaceholders.length > 1 ? 's' : ''} to Fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {remainingPlaceholders.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subject field */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Email / Message Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-amber-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Body field */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Message Body (Editable)
            </label>
            <textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3.5 font-mono text-xs text-amber-100 leading-relaxed focus:outline-none focus:border-amber-400"
            />
          </div>
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

          <Button variant="primary" onClick={handleCopyMessage} className="text-xs font-mono">
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                <span>Copied Subject &amp; Body!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                <span>Copy Message</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
