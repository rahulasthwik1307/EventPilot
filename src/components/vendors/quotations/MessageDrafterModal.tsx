'use client';

import React, { useMemo, useState } from 'react';
import { Event } from '@/features/events/types';
import {
  VendorQuotation,
  VendorMessageScenario,
} from '@/features/vendors/types';
import { generateVendorMessageDraft } from '@/features/vendors/quotations/message-drafts';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
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
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B45309] font-semibold">
              Vendor Coordination
            </span>
            <CouponBadge variant="marigold">Message Drafter</CouponBadge>
          </div>
          <span className="font-serif text-xl font-medium text-[#1C1917]">
            Vendor Coordination Message Drafter
          </span>
        </div>
      }
      description="Context-aware message templates for 6 procurement scenarios with customizable terms."
      maxWidth="xl"
      accentBar
      contentPadding={false}
    >
      <div className="flex flex-col flex-1 min-h-0 bg-white">

        {/* Controls row */}
        <div className="px-6 py-3.5 border-b border-[#E7DFD5] grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FDFBF7]">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#78716C] font-semibold mb-1">
              Select Coordination Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as VendorMessageScenario)}
              className="w-full bg-white border border-[#E7DFD5] rounded-lg p-2.5 text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 transition-all shadow-sm"
            >
              {SCENARIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#78716C] font-semibold mb-1">
              Associated Quotation / Vendor
            </label>
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              className="w-full bg-white border border-[#E7DFD5] rounded-lg p-2.5 text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 transition-all shadow-sm"
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Placeholder alert banner */}
          {remainingPlaceholders.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-[#78716C] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-900 block mb-1">
                  {remainingPlaceholders.length} Placeholder{remainingPlaceholders.length > 1 ? 's' : ''} to Fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {remainingPlaceholders.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[11px]"
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
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#78716C] font-semibold mb-1">
              Email / Message Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg p-2.5 font-mono text-xs text-[#1C1917] focus:bg-white focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 transition-all"
            />
          </div>

          {/* Body field */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#78716C] font-semibold mb-1">
              Message Body (Editable)
            </label>
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg p-3.5 font-mono text-xs text-[#1C1917] leading-relaxed focus:bg-white focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/20 transition-all"
            />
          </div>
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

          <Button variant="primary" onClick={handleCopyMessage} className="text-xs font-mono shadow-sm">
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
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
    </Dialog>
  );
}
