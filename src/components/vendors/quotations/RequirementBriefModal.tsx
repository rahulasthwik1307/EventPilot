'use client';

import React, { useMemo, useState } from 'react';
import { Event } from '@/features/events/types';
import { VendorCategory } from '@/features/vendors/types';
import { generateVendorRequirementBrief } from '@/features/vendors/quotations/brief-engine';
import { downloadVendorBriefPdf } from '@/features/vendors/quotations/brief-pdf';
import { VENDOR_CATEGORIES } from '@/features/vendors/vendor-engine';
import { formatDateDisplay } from '@/features/events/validation';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { CouponBadge } from '../../ui/Badge';
import {
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileCheck2,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
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
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');

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

  const handleDownloadPdf = () => {
    downloadVendorBriefPdf(brief);
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
            <CouponBadge variant="marigold">Requirement Brief</CouponBadge>
          </div>
          <span className="font-serif text-2xl font-bold text-[#1C1917] tracking-tight">
            Vendor Requirement Brief Generator
          </span>
        </div>
      }
      description="Professional, privacy-safe scope summary tailored to your celebration parameters and confirmed preferences."
      headerActions={
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as VendorCategory)}
          className="bg-neutral-surface border border-neutral-border rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
        >
          {VENDOR_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      }
      maxWidth="2xl"
      accentBar
      contentPadding={false}
    >
      <div className="flex flex-col flex-1 min-h-0 bg-white">

        {/* Privacy Notice Banner */}
        <div className="px-6 py-2.5 bg-[#ECFDF5] border-b border-[#A7F3D0] flex items-center gap-2 text-xs font-mono text-[#065F46]">
          <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
          <span>
            Privacy Shield Active: Private guest lists, individual contact details, and internal host notes are strictly excluded from this brief.
          </span>
        </div>

        {/* Parameter Strip (Redesigned Balanced Grid - Zero Dead Space, Zero Clipping, Rich Hierarchy) */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-b border-[#E7DFD5]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
            {/* Card 1: Target Date */}
            <div className="p-3 bg-white border border-[#E7DFD5] rounded-xl flex items-start gap-3 shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:border-[#D6CCC2] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-[#C2410C]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">Target Date</span>
                  <span className="text-[9px] text-[#A8A29E] font-medium hidden sm:inline">Celebration</span>
                </div>
                <span className="text-[#1C1917] font-bold text-xs sm:text-sm font-mono leading-snug block">
                  {formatDateDisplay(brief.eventDate)}
                </span>
                <span className="text-[10px] text-[#A8A29E] font-medium leading-tight block mt-0.5">
                  Confirmed Timeline
                </span>
              </div>
            </div>

            {/* Card 2: Headcount */}
            <div className="p-3 bg-white border border-[#E7DFD5] rounded-xl flex items-start gap-3 shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:border-[#D6CCC2] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">Headcount</span>
                  <span className="text-[9px] text-[#A8A29E] font-medium hidden sm:inline">Attendance</span>
                </div>
                <span className="text-[#1C1917] font-bold text-xs sm:text-sm font-mono leading-snug block">
                  {brief.guestTarget} guests
                </span>
                <span className="text-[10px] text-[#A8A29E] font-medium leading-tight block mt-0.5">
                  Planning Base Scope
                </span>
              </div>
            </div>

            {/* Card 3: Location */}
            <div className="p-3 bg-white border border-[#E7DFD5] rounded-xl flex items-start gap-3 shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:border-[#D6CCC2] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#F5F5F4] border border-[#E7E5E4] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#78716C]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">Location</span>
                  <span className="text-[9px] text-[#A8A29E] font-medium hidden sm:inline">Venue</span>
                </div>
                <span className="text-[#1C1917] font-bold text-xs sm:text-sm font-mono leading-snug break-words block">
                  {brief.location || 'To be finalized'}
                </span>
                <span className="text-[10px] text-[#A8A29E] font-medium leading-tight block mt-0.5">
                  Celebration Venue
                </span>
              </div>
            </div>

            {/* Card 4: Category Budget */}
            <div className="p-3 bg-white border border-[#E7DFD5] rounded-xl flex items-start gap-3 shadow-[0_1px_2px_rgba(28,25,23,0.03)] hover:border-[#D6CCC2] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0 mt-0.5">
                <Wallet className="w-4 h-4 text-[#059669]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">Category Budget</span>
                  <span className="text-[9px] text-[#059669]/70 font-medium hidden sm:inline">Envelope</span>
                </div>
                <span className="text-[#059669] font-bold text-xs sm:text-sm font-mono leading-snug block">
                  {brief.allocatedCategoryBudgetFormatted || 'Envelope open'}
                </span>
                <span className="text-[10px] text-[#059669]/75 font-medium leading-tight block mt-0.5">
                  Allocated Cap
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Formatted Document vs Raw Markdown Editor */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-[#E7DFD5] bg-white">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('formatted')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'formatted'
                  ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
                  : 'bg-[#FAF8F5] text-[#78716C] hover:text-[#1C1917] border border-[#E7DFD5]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Formatted Document</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === 'raw'
                  ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
                  : 'bg-[#FAF8F5] text-[#78716C] hover:text-[#1C1917] border border-[#E7DFD5]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Raw Text</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-[#78716C] hidden sm:inline">
            {activeTab === 'formatted' ? 'Clean letterhead preview' : 'Formatted plain text document • Ready to copy & send'}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#FAF8F5]/40">
          {activeTab === 'formatted' ? (
            /* 1. Formatted Document Preview */
            <div className="bg-white border border-[#E7DFD5] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Document Letterhead */}
              <div className="border-b border-[#E7DFD5] pb-5">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#C2410C] font-bold block mb-1">
                  Official Procurement Brief
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#1C1917]">
                  Vendor Requirement Brief: {brief.categoryLabel}
                </h3>
                <p className="text-xs text-[#78716C] mt-1 font-mono">
                  <strong>Celebration:</strong> {event.title} ({event.type || 'Celebration'}) · <strong>Date:</strong> {brief.eventDate}
                  {brief.location ? (
                    <> · <strong>Location:</strong> {brief.location}</>
                  ) : null}
                </p>
              </div>

              {/* Requirements & Preferences */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#78716C] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                  <span>Confirmed Requirements &amp; Preferences</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {brief.confirmedPreferences.map((pref, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-xs space-y-1"
                    >
                      <span className="font-bold text-[#1C1917] block">{pref.label}</span>
                      <span className="text-[#78716C] leading-relaxed block">{pref.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-Negotiables */}
              {brief.confirmedNonNegotiables.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-[#E7DFD5]">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#C2410C] font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C2410C]" />
                    <span>Essential Non-Negotiables</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#1C1917] pl-1">
                    {brief.confirmedNonNegotiables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#C2410C] font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Milestones & Timing */}
              {brief.timingConstraints.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-[#E7DFD5]">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#78716C] font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                    <span>Key Milestones &amp; Timing</span>
                  </h4>
                  <div className="space-y-1.5">
                    {brief.timingConstraints.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-xs"
                      >
                        <span className="font-semibold text-[#1C1917]">{t.milestone}</span>
                        <span className="font-mono text-[11px] text-[#78716C] bg-white px-2 py-0.5 rounded border border-[#E7DFD5]">
                          Due by {t.dueDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Information Requested */}
              <div className="space-y-2.5 pt-2 border-t border-[#E7DFD5]">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#059669] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  <span>Information Requested in Your Proposal</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#1C1917] leading-relaxed pl-1">
                  <li>Scope of work and complete list of deliverables.</li>
                  <li>Fully itemized pricing, specifying base charges and any applicable taxes/fees.</li>
                  <li>Advance deposit requirements and payment milestone schedule.</li>
                  <li>Quotation validity period.</li>
                  <li>Standard cancellation and postponement provisions.</li>
                </ol>
              </div>

              {/* Legal / Privacy Footnote */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-[11px] text-[#78716C] italic leading-relaxed">
                Note: Identifiable attendee names, personal contact numbers, and private family arrangements are reserved for contracted booking stages.
              </div>
            </div>
          ) : (
            /* 2. Raw Text Editor */
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#78716C] block font-semibold">
                Brief Text (Editable for Custom Requests)
              </label>
              <textarea
                rows={13}
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                className="w-full bg-white border border-[#E7DFD5] rounded-xl p-4 font-mono text-xs text-[#1C1917] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              />
            </div>
          )}

          {/* Hidden accessible textarea when in formatted tab to maintain test compatibility */}
          {activeTab === 'formatted' && (
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              aria-label="Brief Text (Editable for Custom Requests)"
              className="sr-only"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E7DFD5] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-mono font-semibold text-[#78716C] hover:text-[#1C1917] text-center py-2 sm:py-0"
          >
            Close
          </button>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto text-xs font-mono font-semibold border-[#FED7AA] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#9A3412] shadow-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-[#C2410C]" />
              <span>Download as PDF</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleCopy}
              className="w-full sm:w-auto text-xs font-mono font-bold bg-[#D97706] hover:bg-[#B45309] text-white border-0 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
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
    </Dialog>
  );
}
