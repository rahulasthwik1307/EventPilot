'use client';

import React, { useMemo, useState } from 'react';
import { Event } from '@/features/events/types';
import { VendorCategory } from '@/features/vendors/types';
import { generateVendorRequirementBrief } from '@/features/vendors/quotations/brief-engine';
import { VENDOR_CATEGORIES } from '@/features/vendors/vendor-engine';
import { Button } from '../../ui/Button';
import { CouponBadge } from '../../ui/Badge';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';

interface RequirementBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  initialCategory?: VendorCategory;
}

export function RequirementBriefModal({
  isOpen,
  onClose,
  event,
  initialCategory,
}: RequirementBriefModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory>(
    initialCategory || 'photography'
  );
  const [copied, setCopied] = useState(false);

  const brief = useMemo(() => {
    return generateVendorRequirementBrief(event, selectedCategory);
  }, [event, selectedCategory]);

  const [briefText, setBriefText] = useState(brief.formattedBriefText);

  // Sync briefText when selectedCategory or event changes
  React.useEffect(() => {
    setBriefText(brief.formattedBriefText);
  }, [brief]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(briefText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Requirement-Brief-${selectedCategory}-${event.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto text-amber-50">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Vendor Procurement
              </span>
              <CouponBadge variant="marigold">Requirement Brief</CouponBadge>
            </div>
            <h2 className="font-serif text-2xl font-medium text-amber-100">
              Vendor Requirement Brief Generator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Professional, privacy-safe scope summary tailored to your event parameters and confirmed preferences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as VendorCategory)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-100 focus:outline-none focus:border-amber-400"
            >
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-amber-200 transition-colors p-2 rounded-lg hover:bg-slate-800"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-xs font-mono text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Privacy Shield Active: Private guest lists, individual contact details, and internal host notes are strictly excluded from this brief.
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Parameters Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block mb-1">Target Date</span>
              <span className="text-amber-200 font-semibold">{brief.eventDate}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block mb-1">Headcount Target</span>
              <span className="text-amber-200 font-semibold">{brief.guestTarget} guests</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block mb-1">Location</span>
              <span className="text-amber-200 font-semibold">{brief.location || 'To be finalized'}</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block mb-1">Category Budget</span>
              <span className="text-amber-300 font-semibold">
                {brief.allocatedCategoryBudgetFormatted || 'Envelope open'}
              </span>
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Brief Text (Editable for Custom Requests)
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Markdown formatted • Ready to copy &amp; send
              </span>
            </div>
            <textarea
              rows={14}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-amber-100 leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
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
            Close
          </button>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleDownload} className="text-xs font-mono">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Download .txt</span>
            </Button>
            <Button variant="primary" onClick={handleCopy} className="text-xs font-mono">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  <span>Copy Brief</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
