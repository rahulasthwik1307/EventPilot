import { describe, it, expect } from 'vitest';
import {
  calculateVendorRemainingBalance,
  calculateVendorFinancials,
  validateVendorInput,
  reconcileBudgetCategoryDeletion,
  filterVendors,
} from '../vendor-engine';
import { Vendor } from '../types';

describe('Vendor Engine - Financial & Accounting Calculations', () => {
  const mockVendor = (overrides: Partial<Vendor> = {}): Vendor => ({
    id: 'vnd_1',
    name: 'The Royal Palace',
    category: 'venue',
    status: 'booked',
    quotedCost: 600000,
    agreedCost: 550000,
    depositPaid: 100000,
    amountPaid: 200000,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  });

  it('calculates remaining balance accurately when agreed cost is established', () => {
    const v = mockVendor({ agreedCost: 500000, amountPaid: 150000 });
    const balance = calculateVendorRemainingBalance(v);
    expect(balance.isEstablished).toBe(true);
    expect(balance.remaining).toBe(350000);
    expect(balance.isOverpaid).toBe(false);
  });

  it('reports remaining balance as not established when agreed cost is missing', () => {
    const v = mockVendor({ agreedCost: undefined, amountPaid: 50000 });
    const balance = calculateVendorRemainingBalance(v);
    expect(balance.isEstablished).toBe(false);
    expect(balance.remaining).toBe(0);
  });

  it('detects overpayment without returning negative remaining balance', () => {
    const v = mockVendor({ agreedCost: 100000, amountPaid: 120000 });
    const balance = calculateVendorRemainingBalance(v);
    expect(balance.isEstablished).toBe(true);
    expect(balance.remaining).toBe(0);
    expect(balance.isOverpaid).toBe(true);
    expect(balance.overpaidAmount).toBe(20000);
  });

  it('aggregates financials correctly across multiple active and cancelled vendors', () => {
    const vendors: Vendor[] = [
      mockVendor({
        id: 'vnd_1',
        status: 'booked',
        quotedCost: 500000,
        agreedCost: 450000,
        depositPaid: 100000,
        amountPaid: 200000,
      }),
      mockVendor({
        id: 'vnd_2',
        status: 'negotiating',
        quotedCost: 200000,
        agreedCost: 180000,
        depositPaid: 0,
        amountPaid: 0,
      }),
      mockVendor({
        id: 'vnd_3',
        status: 'quote_received',
        quotedCost: 150000,
        agreedCost: undefined,
        depositPaid: 0,
        amountPaid: 0,
      }),
      mockVendor({
        id: 'vnd_4',
        status: 'cancelled',
        quotedCost: 300000,
        agreedCost: 250000,
        depositPaid: 25000,
        amountPaid: 25000, // Non-refundable deposit preserved
      }),
    ];

    const summary = calculateVendorFinancials(vendors);

    // Total quoted should include all (500k + 200k + 150k + 300k = 1,150,000)
    expect(summary.totalQuoted).toBe(1150000);
    // Total agreed commitments should exclude cancelled (450k + 180k = 630,000)
    expect(summary.totalAgreed).toBe(630000);
    // Total paid should include all actual payments (200k + 0 + 0 + 25k = 225,000)
    expect(summary.totalPaid).toBe(225000);
    // Total remaining should exclude cancelled: (450k-200k) + (180k-0) = 250k + 180k = 430,000
    expect(summary.totalRemaining).toBe(430000);

    expect(summary.vendorCount).toBe(4);
    expect(summary.bookedCount).toBe(1);
    expect(summary.negotiatingCount).toBe(1);
    expect(summary.cancelledCount).toBe(1);
  });

  it('validates vendor input requiring name, valid category, and non-negative numbers', () => {
    const invalid = validateVendorInput({
      name: '',
      quotedCost: -100,
      amountPaid: 50,
      depositPaid: 100, // amountPaid < depositPaid is invalid!
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.quotedCost).toBeDefined();
    expect(invalid.errors.amountPaid).toBeDefined();

    const valid = validateVendorInput({
      name: 'Lotus Events',
      category: 'decoration',
      status: 'researching',
      quotedCost: 75000,
      agreedCost: 70000,
      depositPaid: 10000,
      amountPaid: 10000,
    });
    expect(valid.isValid).toBe(true);
  });

  it('reconciles deleted budget category by safely unlinking without deleting vendor or costs', () => {
    const vendors: Vendor[] = [
      mockVendor({ id: 'v1', linkedCategoryId: 'cat_venue' }),
      mockVendor({ id: 'v2', linkedCategoryId: 'cat_catering' }),
    ];

    const reconciled = reconcileBudgetCategoryDeletion(vendors, 'cat_venue');
    expect(reconciled[0].linkedCategoryId).toBeUndefined();
    expect(reconciled[0].agreedCost).toBe(550000); // Cost preserved
    expect(reconciled[1].linkedCategoryId).toBe('cat_catering'); // Untouched
  });

  it('filters vendors by text, category, and status', () => {
    const vendors: Vendor[] = [
      mockVendor({ id: 'v1', name: 'Royal Mandap', category: 'venue', status: 'booked' }),
      mockVendor({ id: 'v2', name: 'Spicy Treats', category: 'catering', status: 'negotiating' }),
    ];

    expect(filterVendors(vendors, 'royal')).toHaveLength(1);
    expect(filterVendors(vendors, '', 'catering')).toHaveLength(1);
    expect(filterVendors(vendors, '', 'all', 'booked')).toHaveLength(1);
    expect(filterVendors(vendors, 'nonexistent')).toHaveLength(0);
  });
});
