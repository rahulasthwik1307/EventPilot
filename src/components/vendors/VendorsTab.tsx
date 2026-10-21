'use client';

import React, { useMemo, useState } from 'react';
import {
  Vendor,
  VendorCategory,
  VendorInput,
  VendorStatus,
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
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Search,
  Tag,
  User,
  XCircle,
} from 'lucide-react';

export interface VendorsTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

export function VendorsTab({ event, onUpdateEvent }: VendorsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);

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

  return (
    <div className="space-y-8">
      {/* 1. Header & Financial Overview */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-secondary font-semibold">
                Celebration Operations · Milestone 3
              </span>
              <CouponBadge variant="marigold">LIVE</CouponBadge>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Vendor Management Book
            </h2>
            <p className="text-xs text-neutral-muted mt-1">
              Authoritative tracking of quotes, contract commitments, and deposits. Separated from budget actuals.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingVendor(null);
              setIsVendorDialogOpen(true);
            }}
            className="self-start sm:self-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Record Vendor</span>
          </Button>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-subtle/70 border border-neutral-border p-4 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Total Quotes Received
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
              {formatCurrency(financials.totalQuoted, event.currency)}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-1 block">
              {financials.vendorCount} tracked vendors
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-4 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Agreed Commitments
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
              {formatCurrency(financials.totalAgreed, event.currency)}
            </p>
            <span className="text-xs text-status-success font-mono mt-1 block">
              {financials.bookedCount} booked / contracted
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-4 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Total Paid to Date
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-status-success">
              {formatCurrency(financials.totalPaid, event.currency)}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-1 block">
              Includes all recorded advances
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-4 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Outstanding Balances
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-secondary">
              {formatCurrency(financials.totalRemaining, event.currency)}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-1 block">
              Remaining under agreed contracts
            </span>
          </div>
        </div>

        {/* Overpaid Warning Alert if applicable */}
        {financials.overpaidCount > 0 && (
          <div
            role="alert"
            className="mt-4 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3.5 rounded-md text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Payment Alert:</strong> {financials.overpaidCount} vendor(s) have payments recorded exceeding their agreed contract amount. Review their payment records below.
            </span>
          </div>
        )}
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors by name, contact, notes, phone, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-subtle/50 border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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

        <div className="flex items-center justify-between text-xs text-neutral-muted pt-2 border-t border-neutral-border/40">
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
              className="text-secondary hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Vendor Cards List */}
      {filteredVendors.length === 0 ? (
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-12 text-center shadow-card">
          <Briefcase className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-lg font-semibold text-neutral-text mb-1">
            {vendors.length === 0 ? 'No Vendors Recorded Yet' : 'No Vendors Match Your Filter'}
          </h3>
          <p className="text-xs text-neutral-muted max-w-md mx-auto mb-5 leading-relaxed">
            {vendors.length === 0
              ? 'Begin tracking quotes, contract terms, deposit receipts, and contact personnel for your celebration.'
              : 'Try clearing your search query or selecting a different category/status filter.'}
          </p>
          {vendors.length === 0 && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingVendor(null);
                setIsVendorDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Record First Vendor</span>
            </Button>
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

            return (
              <div
                key={vendor.id}
                className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between hover:border-neutral-border-strong transition-all"
              >
                <div>
                  {/* Card Top: Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(vendor.status)}
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-subtle border border-neutral-border text-neutral-muted">
                        {categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingVendor(vendor);
                          setIsVendorDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingVendor(vendor)}
                        className="text-status-danger hover:bg-status-danger-subtle"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Vendor Name */}
                  <h3 className="font-display text-lg font-semibold text-neutral-text mb-2">
                    {vendor.name}
                  </h3>

                  {/* Contact Info Row */}
                  {(vendor.contactPerson || vendor.phone || vendor.email || vendor.website) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-muted mb-4 font-sans">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-1 text-neutral-text">
                          <User className="w-3.5 h-3.5 text-secondary" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-secondary" />
                          <a href={`tel:${vendor.phone}`} className="hover:underline">
                            {vendor.phone}
                          </a>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-secondary" />
                          <a href={`mailto:${vendor.email}`} className="hover:underline">
                            {vendor.email}
                          </a>
                        </div>
                      )}
                      {vendor.website && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5 text-secondary" />
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

                  {/* Financial Breakdown Table */}
                  <div className="bg-neutral-subtle/60 border border-neutral-border rounded p-3 text-xs space-y-2 mb-3">
                    <div className="flex justify-between items-center text-neutral-muted">
                      <span>Initial Quote:</span>
                      <span className="font-mono font-semibold text-neutral-text">
                        {formatCurrency(vendor.quotedCost, event.currency)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-neutral-muted">
                      <span>Agreed Contract:</span>
                      <span className="font-mono font-semibold text-neutral-text">
                        {vendor.agreedCost != null
                          ? formatCurrency(vendor.agreedCost, event.currency)
                          : 'Not established'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-neutral-muted">
                      <span>Total Paid to Date:</span>
                      <span className="font-mono font-semibold text-status-success">
                        {formatCurrency(vendor.amountPaid, event.currency)}
                        {vendor.depositPaid > 0 && (
                          <span className="text-neutral-muted font-normal text-xs ml-1">
                            (incl. {formatCurrency(vendor.depositPaid, event.currency)} deposit)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="border-t border-neutral-border/60 pt-2 flex justify-between items-center font-semibold">
                      <span>Remaining Balance:</span>
                      {balance.isEstablished ? (
                        balance.isOverpaid ? (
                          <span className="font-mono text-status-danger">
                            Overpaid by {formatCurrency(balance.overpaidAmount, event.currency)}
                          </span>
                        ) : (
                          <span className="font-mono text-secondary">
                            {formatCurrency(balance.remaining, event.currency)}
                          </span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-muted italic font-normal">
                          Awaiting agreed rate
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {vendor.agreedCost != null && vendor.agreedCost > 0 && (
                      <div className="pt-1">
                        <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              percentPaid >= 100 ? 'bg-status-success' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, percentPaid)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-neutral-muted mt-1 font-mono">
                          <span>{percentPaid}% cleared</span>
                          <span>
                            {percentPaid >= 100 ? 'Contract Settled' : 'Payment in Progress'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Private Notes if provided */}
                  {vendor.notes && (
                    <p className="text-xs text-neutral-muted italic mb-3 bg-neutral-bg p-2 rounded border border-neutral-border/50">
                      &ldquo;{vendor.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Footer: Category Linkage */}
                <div className="pt-2 border-t border-neutral-border/50 flex items-center justify-between text-xs">
                  {linkedCatName ? (
                    <div className="flex items-center gap-1.5 text-neutral-muted">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <span>Linked Category: </span>
                      <span className="font-medium text-neutral-text">{linkedCatName}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-muted italic">Unlinked to budget category</span>
                  )}
                  <span className="font-mono text-neutral-muted text-xs">
                    Updated {vendor.updatedAt ? vendor.updatedAt.slice(0, 10) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
}
