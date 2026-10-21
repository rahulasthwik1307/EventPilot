/**
 * Vendor Management Calculation Engine
 * Pure deterministic calculations for vendor quotes, contracts, payments, and balances.
 * Guardrail: All vendor math is pure TypeScript. Never mutates budget actuals.
 */

import {
  Vendor,
  VendorCategory,
  VendorFinancialSummary,
  VendorInput,
  VendorRemainingBalance,
  VendorStatus,
} from './types';

export const VENDOR_CATEGORIES: { id: VendorCategory; label: string }[] = [
  { id: 'venue', label: 'Venue & Banquet' },
  { id: 'catering', label: 'Catering & Food' },
  { id: 'photography', label: 'Photography & Cinema' },
  { id: 'decoration', label: 'Decoration & Flowers' },
  { id: 'entertainment', label: 'Entertainment & Artists' },
  { id: 'music_dj', label: 'Music, Sound & DJ' },
  { id: 'clothing_makeup', label: 'Attire & Makeup' },
  { id: 'transport', label: 'Logistics & Transport' },
  { id: 'accommodation', label: 'Guest Accommodation' },
  { id: 'invitations_printing', label: 'Invitations & Stationery' },
  { id: 'equipment_rentals', label: 'Equipment & Rentals' },
  { id: 'other', label: 'Other Services' },
];

export const VENDOR_STATUSES: { id: VendorStatus; label: string }[] = [
  { id: 'researching', label: 'Researching' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'quote_received', label: 'Quote Received' },
  { id: 'negotiating', label: 'Negotiating' },
  { id: 'booked', label: 'Booked' },
  { id: 'cancelled', label: 'Cancelled' },
];

/**
 * Calculates remaining balance for a single vendor.
 * Deterministic rule: Balance is derived solely from agreedCost - amountPaid.
 * Never calculates remaining balance from quotedCost when agreedCost is available.
 */
export function calculateVendorRemainingBalance(vendor: Vendor): VendorRemainingBalance {
  if (vendor.agreedCost == null || !Number.isFinite(vendor.agreedCost)) {
    return {
      remaining: 0,
      isEstablished: false,
      isOverpaid: false,
      overpaidAmount: 0,
    };
  }

  const agreed = Math.max(0, vendor.agreedCost);
  const paid = Math.max(0, Number.isFinite(vendor.amountPaid) ? vendor.amountPaid : 0);
  const diff = agreed - paid;

  if (diff < 0) {
    return {
      remaining: 0,
      isEstablished: true,
      isOverpaid: true,
      overpaidAmount: Math.abs(diff),
    };
  }

  return {
    remaining: diff,
    isEstablished: true,
    isOverpaid: false,
    overpaidAmount: 0,
  };
}

/**
 * Pure calculation of aggregated vendor financial metrics.
 * Cancelled vendors are preserved in history and counted, but excluded from active agreed/remaining totals.
 */
export function calculateVendorFinancials(vendors: Vendor[]): VendorFinancialSummary {
  let totalQuoted = 0;
  let totalAgreed = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let bookedCount = 0;
  let negotiatingCount = 0;
  let cancelledCount = 0;
  let overpaidCount = 0;

  for (const v of vendors) {
    const isCancelled = v.status === 'cancelled';
    const quoted = Number.isFinite(v.quotedCost) ? Math.max(0, v.quotedCost) : 0;
    const paid = Number.isFinite(v.amountPaid) ? Math.max(0, v.amountPaid) : 0;

    totalPaid += paid;

    if (isCancelled) {
      cancelledCount++;
      // Still count quotes for cancelled vendors so user knows what quotes they held
      totalQuoted += quoted;
      continue;
    }

    totalQuoted += quoted;

    if (v.status === 'booked') {
      bookedCount++;
    } else if (v.status === 'negotiating') {
      negotiatingCount++;
    }

    if (v.agreedCost != null && Number.isFinite(v.agreedCost)) {
      const agreed = Math.max(0, v.agreedCost);
      totalAgreed += agreed;

      const balance = calculateVendorRemainingBalance(v);
      totalRemaining += balance.remaining;

      if (balance.isOverpaid) {
        overpaidCount++;
      }
    }
  }

  return {
    totalQuoted: Math.round(totalQuoted),
    totalAgreed: Math.round(totalAgreed),
    totalPaid: Math.round(totalPaid),
    totalRemaining: Math.round(totalRemaining),
    vendorCount: vendors.length,
    bookedCount,
    negotiatingCount,
    cancelledCount,
    overpaidCount,
  };
}

/**
 * Validates vendor inputs safely without mutating or casting.
 */
export function validateVendorInput(input: Partial<VendorInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    errors.name = 'Vendor name is required.';
  } else if (name.length > 100) {
    errors.name = 'Vendor name must be 100 characters or fewer.';
  }

  const validCategories: VendorCategory[] = VENDOR_CATEGORIES.map((c) => c.id);
  if (!input.category || !validCategories.includes(input.category as VendorCategory)) {
    errors.category = 'Please select a valid vendor category.';
  }

  const validStatuses: VendorStatus[] = VENDOR_STATUSES.map((s) => s.id);
  if (!input.status || !validStatuses.includes(input.status as VendorStatus)) {
    errors.status = 'Please select a valid booking status.';
  }

  if (input.quotedCost != null) {
    if (!Number.isFinite(input.quotedCost) || input.quotedCost < 0) {
      errors.quotedCost = 'Quoted cost must be a non-negative number.';
    }
  } else {
    errors.quotedCost = 'Quoted cost is required.';
  }

  if (input.agreedCost != null && (!Number.isFinite(input.agreedCost) || input.agreedCost < 0)) {
    errors.agreedCost = 'Agreed cost must be a non-negative number.';
  }

  if (input.depositPaid != null && (!Number.isFinite(input.depositPaid) || input.depositPaid < 0)) {
    errors.depositPaid = 'Deposit must be a non-negative number.';
  }

  if (input.amountPaid != null && (!Number.isFinite(input.amountPaid) || input.amountPaid < 0)) {
    errors.amountPaid = 'Total amount paid must be a non-negative number.';
  }

  // Canonical paid consistency: amountPaid cannot be less than depositPaid
  const deposit = input.depositPaid ?? 0;
  const paid = input.amountPaid ?? 0;
  if (paid < deposit) {
    errors.amountPaid = 'Total amount paid cannot be less than the recorded deposit.';
  }

  if (input.email && typeof input.email === 'string') {
    const trimmed = input.email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors.email = 'Please enter a valid email address.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Safely unlinks a deleted budget category from any vendors referencing it.
 * Preserves all vendor details, costs, and payment histories.
 */
export function reconcileBudgetCategoryDeletion(
  vendors: Vendor[],
  deletedCategoryId: string
): Vendor[] {
  return vendors.map((v) => {
    if (v.linkedCategoryId === deletedCategoryId) {
      return {
        ...v,
        linkedCategoryId: undefined,
        updatedAt: new Date().toISOString(),
      };
    }
    return v;
  });
}

/**
 * Filters vendors by text search query, category, and status.
 */
export function filterVendors(
  vendors: Vendor[],
  query: string,
  categoryFilter?: string,
  statusFilter?: string
): Vendor[] {
  const q = query.trim().toLowerCase();

  return vendors.filter((v) => {
    if (categoryFilter && categoryFilter !== 'all' && v.category !== categoryFilter) {
      return false;
    }
    if (statusFilter && statusFilter !== 'all' && v.status !== statusFilter) {
      return false;
    }
    if (!q) return true;

    return (
      v.name.toLowerCase().includes(q) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
      (v.notes && v.notes.toLowerCase().includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q))
    );
  });
}
