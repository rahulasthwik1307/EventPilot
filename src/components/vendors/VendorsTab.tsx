'use client';

import React, { useMemo, useState } from 'react';
import {
  Vendor,
  VendorCategory,
  VendorInput,
  VendorStatus,
  VendorQuotation,
} from '../../features/vendors/types';
import { Event } from '../../features/events/types';
import {
  calculateVendorFinancials,
  calculateVendorRemainingBalance,
  filterVendors,
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
} from '../../features/vendors/vendor-engine';
import { formatCurrency } from '../../features/events/validation';
import { CouponBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { VendorDialog } from './VendorDialog';
import { VendorDeleteDialog } from './VendorDeleteDialog';
import { QuotationDialog } from './quotations/QuotationDialog';
import { QuotationComparisonView } from './quotations/QuotationComparisonView';
import { RequirementBriefModal } from './quotations/RequirementBriefModal';
import { MessageDrafterModal } from './quotations/MessageDrafterModal';
import { QuoteProposalReviewModal } from './quotations/QuoteProposalReviewModal';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Scale,
  Search,
  Sparkles,
  Tag,
  User,
  XCircle,
  MapPin,
  Utensils,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Check,
} from 'lucide-react';

export interface VendorsTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

function getVendorCategoryIcon(category: string) {
  switch (category) {
    case 'venue':
      return <MapPin className="w-3.5 h-3.5 text-primary" />;
    case 'catering':
      return <Utensils className="w-3.5 h-3.5 text-secondary" />;
    case 'photography':
      return <Layers className="w-3.5 h-3.5 text-primary" />;
    case 'decor':
      return <Sparkles className="w-3.5 h-3.5 text-secondary" />;
    case 'music':
      return <Sparkles className="w-3.5 h-3.5 text-primary" />;
    case 'attire':
    case 'makeup':
      return <Sparkles className="w-3.5 h-3.5 text-secondary" />;
    default:
      return <Briefcase className="w-3.5 h-3.5 text-neutral-muted" />;
  }
}

export function VendorsTab({ event, onUpdateEvent }: VendorsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);

  // Quotations and vendor coordination state
  const quotations = useMemo(() => event.quotations || [], [event.quotations]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isMessageDrafterOpen, setIsMessageDrafterOpen] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [isProposalReviewOpen, setIsProposalReviewOpen] = useState(false);

  const [activeQuoteForProposal, setActiveQuoteForProposal] = useState<VendorQuotation | null>(null);
  const [activeQuoteForMessage, setActiveQuoteForMessage] = useState<VendorQuotation | null>(null);
  const [activeQuoteForEdit, setActiveQuoteForEdit] = useState<VendorQuotation | null>(null);
  const [defaultVendorIdForQuote, setDefaultVendorIdForQuote] = useState<string | undefined>(undefined);
  const [defaultCategoryForQuote, setDefaultCategoryForQuote] = useState<VendorCategory | undefined>(undefined);
  const [activeCategoryForBrief, setActiveCategoryForBrief] = useState<VendorCategory | undefined>(undefined);

  const vendors = useMemo(() => event.vendors || [], [event.vendors]);
  const categories = useMemo(() => event.categories || [], [event.categories]);

  // Pure deterministic calculations
  const financials = useMemo(
    () => calculateVendorFinancials(vendors),
    [vendors]
  );

  const filteredVendors = useMemo(
    () => filterVendors(vendors, searchQuery, categoryFilter, statusFilter),
    [vendors, searchQuery, categoryFilter, statusFilter]
  );

  // Category map for quick label lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  const handleSaveVendor = (vendorData: VendorInput) => {
    const now = new Date().toISOString();

    let updatedVendors: Vendor[];
    if (editingVendor) {
      updatedVendors = vendors.map((v) =>
        v.id === editingVendor.id
          ? {
              ...editingVendor,
              ...vendorData,
              updatedAt: now,
            }
          : v
      );
    } else {
      const newVendor: Vendor = {
        id: `vnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...vendorData,
        createdAt: now,
        updatedAt: now,
      };
      updatedVendors = [...vendors, newVendor];
    }

    onUpdateEvent({
      ...event,
      vendors: updatedVendors,
      updatedAt: now,
    });

    setEditingVendor(null);
  };

  const handleDeleteVendor = (vendorId: string) => {
    const now = new Date().toISOString();
    const updatedVendors = vendors.filter((v) => v.id !== vendorId);

    onUpdateEvent({
      ...event,
      vendors: updatedVendors,
      updatedAt: now,
    });

    setDeletingVendor(null);
  };

  const handleSaveQuotation = (savedQuote: VendorQuotation) => {
    const now = new Date().toISOString();
    const existingQuotations = event.quotations || [];
    const existingIdx = existingQuotations.findIndex((q) => q.id === savedQuote.id);

    let nextQuotations: VendorQuotation[];
    if (existingIdx >= 0) {
      nextQuotations = existingQuotations.map((q, idx) =>
        idx === existingIdx ? { ...savedQuote, updatedAt: now } : q
      );
    } else {
      nextQuotations = [savedQuote, ...existingQuotations];
    }

    const nextVersion = (event.version ?? 0) + 1;
    onUpdateEvent({
      ...event,
      quotations: nextQuotations,
      version: nextVersion,
      updatedAt: now,
    });
  };

  const handlePromoteQuote = (quote: VendorQuotation) => {
    setActiveQuoteForProposal(quote);
    setIsProposalReviewOpen(true);
  };

  const handleDraftMessage = (quote?: VendorQuotation) => {
    setActiveQuoteForMessage(quote || null);
    setIsMessageDrafterOpen(true);
  };

  const handleEditQuote = (quote: VendorQuotation) => {
    setActiveQuoteForEdit(quote);
    setDefaultVendorIdForQuote(quote.vendorId);
    setDefaultCategoryForQuote(quote.serviceCategory);
    setIsQuotationDialogOpen(true);
  };

  const handleAddNewQuote = (category?: VendorCategory, vendorId?: string) => {
    setActiveQuoteForEdit(null);
    setDefaultCategoryForQuote(category);
    setDefaultVendorIdForQuote(vendorId);
    setIsQuotationDialogOpen(true);
  };

  const handleOpenBrief = (category?: VendorCategory) => {
    setActiveCategoryForBrief(category || 'photography');
    setIsBriefOpen(true);
  };

  const getStatusBadge = (status: VendorStatus) => {
    switch (status) {
      case 'booked':
        return <CouponBadge variant="marigold">Booked</CouponBadge>;
      case 'negotiating':
        return <CouponBadge variant="terracotta">Negotiating</CouponBadge>;
      case 'quote_received':
        return <CouponBadge variant="stone">Quote Received</CouponBadge>;
      case 'contacted':
        return <CouponBadge variant="stone">Contacted</CouponBadge>;
      case 'cancelled':
        return <CouponBadge variant="stone">Cancelled</CouponBadge>;
      default:
        return <CouponBadge variant="stone">Researching</CouponBadge>;
    }
  };

  const overallSettlementPct =
    financials.totalAgreed > 0
      ? Math.min(100, Math.round((financials.totalPaid / financials.totalAgreed) * 100))
      : 0;

  return (
    <div className="space-y-7">
      {/* =========================================================================
          1. HEADER & COMMERCIAL COMMITMENTS MASTER DECK
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-7 shadow-card relative overflow-hidden space-y-5">
        {/* Panchang Ceremonial Accent Header Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold">
                Celebration Operations
              </span>
              <CouponBadge variant="marigold">Contracts &amp; Commitments</CouponBadge>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Vendor Directory &amp; Contracts
            </h2>
            <p className="text-xs text-neutral-muted mt-1 max-w-2xl leading-relaxed">
              Authoritative tracking of quotations, contract commitments, and deposit disbursements. Isolated from internal budget ledgers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setIsComparisonOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-all active:scale-[0.98] shadow-xs"
            >
              <Scale className="w-3.5 h-3.5 text-secondary" />
              <span>Compare Quotes ({quotations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBrief()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-all active:scale-[0.98] shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-secondary" />
              <span>Requirement Brief</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddNewQuote()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-all active:scale-[0.98] shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Record Quote</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingVendor(null);
                setIsVendorDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-md transition-all active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Vendor</span>
            </button>
          </div>
        </div>

        {/* 4 Commercial Metrics Stations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Quotes Received */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Total Quotes Received
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-surface border border-neutral-border text-neutral-muted">
                  Market
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {formatCurrency(financials.totalQuoted, event.currency)}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              {financials.vendorCount} tracked suppliers
            </span>
          </div>

          {/* Card 2: Agreed Commitments */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Agreed Commitments
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-primary-subtle border border-primary/30 text-primary">
                  {financials.bookedCount} Booked
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {formatCurrency(financials.totalAgreed, event.currency)}
              </p>
            </div>
            <span className="text-[11px] text-primary font-mono mt-2 block">
              Contractually committed
            </span>
          </div>

          {/* Card 3: Total Paid to Date */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Total Paid to Date
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-status-success-subtle border border-status-success/30 text-status-success">
                  {overallSettlementPct}%
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-status-success tracking-tight">
                {formatCurrency(financials.totalPaid, event.currency)}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Includes all recorded advances
            </span>
          </div>

          {/* Card 4: Outstanding Balances */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Outstanding Balances
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-secondary-subtle border border-secondary/30 text-secondary">
                  Payable
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-secondary tracking-tight">
                {formatCurrency(financials.totalRemaining, event.currency)}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Remaining under contracts
            </span>
          </div>
        </div>

        {/* Overall Commercial Settlement Bar */}
        {financials.totalAgreed > 0 && (
          <div className="pt-2 border-t border-neutral-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-muted">
              <span>Overall Contract Settlement Progress</span>
              <span>
                <strong>{overallSettlementPct}%</strong> settled ({formatCurrency(financials.totalPaid, event.currency)} of {formatCurrency(financials.totalAgreed, event.currency)})
              </span>
            </div>
            <div className="w-full bg-neutral-subtle rounded-full h-2 overflow-hidden border border-neutral-border/60">
              <div
                className="h-full bg-status-success transition-all duration-500 rounded-full"
                style={{ width: `${overallSettlementPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Overpaid Warning Alert if applicable */}
        {financials.overpaidCount > 0 && (
          <div
            role="alert"
            className="bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3.5 rounded-lg text-xs flex items-center gap-2 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Payment Alert:</strong> {financials.overpaidCount} vendor(s) have payments recorded exceeding their agreed contract amount. Review their payment records below.
            </span>
          </div>
        )}
      </section>

      {/* =========================================================================
          2. FILTERS & SEARCH COMMAND BAR
      ========================================================================= */}
      <div className="bg-neutral-surface border border-neutral-border rounded-xl p-4 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by name, contact, notes, phone, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-subtle/50 border border-neutral-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-medium shadow-xs"
              aria-label="Filter by vendor category"
            >
              <option value="all">All Categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-medium shadow-xs"
              aria-label="Filter by engagement status"
            >
              <option value="all">All Statuses</option>
              {VENDOR_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-muted pt-2 border-t border-neutral-border/50 font-mono">
          <span>
            Showing {filteredVendors.length} of {vendors.length} vendors
          </span>
          {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="text-secondary hover:underline font-semibold font-sans"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. VENDOR DOSSIER CARDS GRID
      ========================================================================= */}
      {filteredVendors.length === 0 ? (
        <div className="bg-neutral-surface border border-neutral-border rounded-xl p-12 text-center shadow-card">
          <Briefcase className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-lg font-bold text-neutral-text mb-1">
            {vendors.length === 0 ? 'No Vendors Recorded Yet' : 'No Vendors Match Your Filter'}
          </h3>
          <p className="text-xs text-neutral-muted max-w-md mx-auto mb-5 leading-relaxed">
            {vendors.length === 0
              ? 'Begin tracking quotes, contract terms, deposit receipts, and contact personnel for your celebration.'
              : 'Try clearing your search query or selecting a different category/status filter.'}
          </p>
          {vendors.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingVendor(null);
                setIsVendorDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-md transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Record First Vendor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.map((vendor) => {
            const balance = calculateVendorRemainingBalance(vendor);
            const categoryLabel =
              VENDOR_CATEGORIES.find((c) => c.id === vendor.category)?.label || vendor.category;
            const linkedCatName = vendor.linkedCategoryId
              ? categoryMap.get(vendor.linkedCategoryId)
              : null;

            const agreed = vendor.agreedCost ?? 0;
            const paid = vendor.amountPaid;
            const percentPaid = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 0;

            const vendorQuoteCount = quotations.filter(
              (q) => q.vendorId === vendor.id || q.vendorName.toLowerCase() === vendor.name.toLowerCase()
            ).length;

            return (
              <div
                key={vendor.id}
                className="bg-neutral-surface border border-neutral-border rounded-xl p-5 shadow-card flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div>
                  {/* Card Header: Category Icon, Status Badge, Quick Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(vendor.status)}
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-subtle border border-neutral-border text-neutral-text">
                        {getVendorCategoryIcon(vendor.category)}
                        <span>{categoryLabel}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {vendorQuoteCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategoryForBrief(vendor.category);
                            setIsComparisonOpen(true);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary-subtle border border-primary/30 text-primary-hover hover:bg-primary hover:text-neutral-text transition-colors"
                        >
                          {vendorQuoteCount} quote{vendorQuoteCount !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddNewQuote(vendor.category, vendor.id)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-subtle border border-neutral-border text-neutral-muted hover:text-neutral-text transition-colors"
                        >
                          + Quote
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const vQuote = quotations.find((q) => q.vendorId === vendor.id);
                          handleDraftMessage(vQuote);
                        }}
                        title="Draft coordination message"
                        className="p-1.5 rounded-md text-neutral-muted hover:text-secondary hover:bg-neutral-subtle transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingVendor(vendor);
                          setIsVendorDialogOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-neutral-text hover:text-primary bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingVendor(vendor)}
                        className="px-2.5 py-1 text-xs font-semibold text-status-danger hover:bg-status-danger-subtle border border-transparent hover:border-status-danger/30 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Vendor Name */}
                  <h3 className="font-display text-lg font-bold text-neutral-text mb-2 leading-tight">
                    {vendor.name}
                  </h3>

                  {/* Contact Info Pills */}
                  {(vendor.contactPerson || vendor.phone || vendor.email || vendor.website) && (
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-muted mb-3.5 font-sans">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-1 text-neutral-text font-medium">
                          <User className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1 font-mono text-neutral-text">
                          <Phone className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <a href={`tel:${vendor.phone}`} className="hover:underline">
                            {vendor.phone}
                          </a>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1 text-neutral-text">
                          <Mail className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <a href={`mailto:${vendor.email}`} className="hover:underline">
                            {vendor.email}
                          </a>
                        </div>
                      )}
                      {vendor.website && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-secondary font-medium"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Breakdown Card */}
                  <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3 text-xs space-y-2 mb-3">
                    <div className="flex justify-between items-center text-neutral-muted">
                      <span>Initial Quote:</span>
                      <span className="font-mono font-bold text-neutral-text">
                        {formatCurrency(vendor.quotedCost, event.currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-neutral-muted">
                      <span>Agreed Contract:</span>
                      <span className="font-mono font-bold text-neutral-text">
                        {vendor.agreedCost != null
                          ? formatCurrency(vendor.agreedCost, event.currency)
                          : 'Not established'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-neutral-muted">
                      <span>Total Paid to Date:</span>
                      <span className="font-mono font-bold text-status-success">
                        {formatCurrency(vendor.amountPaid, event.currency)}
                        {vendor.depositPaid > 0 && (
                          <span className="text-neutral-muted font-normal text-[11px] ml-1">
                            (incl. {formatCurrency(vendor.depositPaid, event.currency)} deposit)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="border-t border-neutral-border/60 pt-2 flex justify-between items-center font-semibold">
                      <span>Remaining Balance:</span>
                      {balance.isEstablished ? (
                        balance.isOverpaid ? (
                          <span className="font-mono text-status-danger font-bold">
                            Overpaid by {formatCurrency(balance.overpaidAmount, event.currency)}
                          </span>
                        ) : (
                          <span className="font-mono text-secondary font-bold">
                            {formatCurrency(balance.remaining, event.currency)}
                          </span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-muted italic font-normal">
                          Awaiting agreed rate
                        </span>
                      )}
                    </div>

                    {/* Progress Bar for Paid Settlement */}
                    {vendor.agreedCost != null && vendor.agreedCost > 0 && (
                      <div className="pt-1 space-y-1">
                        <div className="w-full bg-neutral-border/60 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              percentPaid >= 100 ? 'bg-status-success' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, percentPaid)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-muted font-mono">
                          <span>{percentPaid}% cleared</span>
                          <span className="font-medium text-neutral-text">
                            {percentPaid >= 100 ? 'Contract Settled' : 'Payment in Progress'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Private Notes if provided */}
                  {vendor.notes && (
                    <p className="text-xs text-neutral-muted italic mb-3 bg-neutral-bg p-2.5 rounded-lg border border-neutral-border/50 leading-relaxed">
                      &ldquo;{vendor.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Footer: Category Linkage */}
                <div className="pt-2.5 border-t border-neutral-border/60 flex items-center justify-between text-xs">
                  {linkedCatName ? (
                    <div className="flex items-center gap-1.5 text-neutral-muted">
                      <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Linked Category: </span>
                      <span className="font-semibold text-neutral-text">{linkedCatName}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-muted italic">Unlinked to budget category</span>
                  )}
                  <span className="font-mono text-neutral-muted text-[11px]">
                    Updated {vendor.updatedAt ? vendor.updatedAt.slice(0, 10) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODALS & DIALOGS
      ========================================================================= */}
      <VendorDialog
        isOpen={isVendorDialogOpen}
        onClose={() => {
          setIsVendorDialogOpen(false);
          setEditingVendor(null);
        }}
        onSave={handleSaveVendor}
        vendor={editingVendor}
        categories={categories}
        currency={event.currency}
      />

      <VendorDeleteDialog
        isOpen={Boolean(deletingVendor)}
        onClose={() => setDeletingVendor(null)}
        onConfirm={() => {
          if (deletingVendor) {
            handleDeleteVendor(deletingVendor.id);
          }
        }}
        vendor={deletingVendor}
      />

      {/* Quotation & Coordination Modals */}
      <QuotationComparisonView
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        event={event}
        initialCategory={activeCategoryForBrief}
        onPromoteQuote={handlePromoteQuote}
        onDraftMessage={handleDraftMessage}
        onEditQuote={handleEditQuote}
        onAddNewQuote={(cat) => handleAddNewQuote(cat)}
      />

      <QuotationDialog
        isOpen={isQuotationDialogOpen}
        onClose={() => {
          setIsQuotationDialogOpen(false);
          setActiveQuoteForEdit(null);
        }}
        event={event}
        editingQuote={activeQuoteForEdit}
        defaultVendorId={defaultVendorIdForQuote}
        defaultCategory={defaultCategoryForQuote}
        onSave={handleSaveQuotation}
      />

      <RequirementBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        event={event}
        initialCategory={activeCategoryForBrief}
      />

      <MessageDrafterModal
        isOpen={isMessageDrafterOpen}
        onClose={() => {
          setIsMessageDrafterOpen(false);
          setActiveQuoteForMessage(null);
        }}
        event={event}
        initialQuotation={activeQuoteForMessage || undefined}
      />

      <QuoteProposalReviewModal
        isOpen={isProposalReviewOpen}
        onClose={() => {
          setIsProposalReviewOpen(false);
          setActiveQuoteForProposal(null);
        }}
        event={event}
        quote={activeQuoteForProposal}
        onUpdateEvent={onUpdateEvent}
      />
    </div>
  );
}
