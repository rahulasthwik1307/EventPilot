import { describe, it, expect } from 'vitest';
import {
  validateVendorQuotation,
  calculateQuotationItemizedTotal,
  filterQuotations,
} from '../quotation-engine';
import { VendorQuotation } from '../../types';

describe('quotation-engine', () => {
  const validBaseQuote: Partial<VendorQuotation> = {
    vendorName: 'Studio Memoir',
    serviceCategory: 'photography',
    title: 'Signature Wedding Package',
    quotedTotal: 180000,
    currency: 'INR',
    quoteDate: '2026-10-15',
    validUntilDate: '2026-11-15',
    includedServices: [
      { description: '2 Lead Photographers (10 hrs)', itemizedCost: 120000 },
      { description: '1 Cinematic Videographer', itemizedCost: 60000 },
    ],
    taxesAndFees: [
      { name: 'GST 18%', amount: 32400, isIncludedInTotal: true },
    ],
    exclusions: ['Destination travel & accommodation'],
    depositRequired: 50000,
    paymentMilestones: [
      { stage: 'Booking Deposit', amount: 50000, dueDate: '2026-10-20' },
      { stage: 'Pre-Event Handover', amount: 90000, dueDate: '2026-11-20' },
      { stage: 'Album Delivery', amount: 40000, dueDate: '2026-12-15' },
    ],
  };

  describe('validateVendorQuotation', () => {
    it('validates a complete and correct quotation input', () => {
      const result = validateVendorQuotation(validBaseQuote);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.quotation).toBeDefined();
      expect(result.quotation?.title).toBe('Signature Wedding Package');
      expect(result.quotation?.quotedTotal).toBe(180000);
      expect(result.quotation?.currency).toBe('INR');
      expect(result.quotation?.status).toBe('active');
      expect(result.quotation?.id).toMatch(/^quote-/);
    });

    it('rejects missing or empty vendorName', () => {
      const result = validateVendorQuotation({ ...validBaseQuote, vendorName: '  ' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vendor name is required.');
    });

    it('rejects negative quoted total', () => {
      const result = validateVendorQuotation({ ...validBaseQuote, quotedTotal: -500 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quoted total must be a non-negative number.');
    });

    it('rejects invalid currency', () => {
      const result = validateVendorQuotation({ ...validBaseQuote, currency: 'JPY' as any });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Currency must be one of'))).toBe(true);
    });

    it('rejects malformed date formats', () => {
      const result = validateVendorQuotation({ ...validBaseQuote, quoteDate: '15-10-2026' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quote date must be formatted as YYYY-MM-DD.');
    });

    it('sanitizes and trims string fields and excludes invalid items', () => {
      const result = validateVendorQuotation({
        ...validBaseQuote,
        title: '  Trimmed Title   ',
        exclusions: ['  Exclusion 1  ', ''],
        taxesAndFees: [
          { name: ' GST 18% ', amount: 18000, isIncludedInTotal: true },
        ],
      });
      expect(result.isValid).toBe(true);
      expect(result.quotation?.title).toBe('Trimmed Title');
      expect(result.quotation?.exclusions).toEqual(['Exclusion 1']);
      expect(result.quotation?.taxesAndFees[0].name).toBe('GST 18%');
    });
  });

  describe('calculateQuotationItemizedTotal', () => {
    it('calculates matching sum when items sum up to quoted total', () => {
      const calc = calculateQuotationItemizedTotal({
        quotedTotal: 180000,
        includedServices: [
          { description: 'Item 1', itemizedCost: 100000 },
          { description: 'Item 2', itemizedCost: 80000 },
        ],
        taxesAndFees: [
          { name: 'GST', amount: 32400, isIncludedInTotal: true },
        ],
      });
      expect(calc.itemizedServicesSum).toBe(180000);
      expect(calc.extraTaxesSum).toBe(0);
      expect(calc.calculatedTotal).toBe(180000);
      expect(calc.hasDiscrepancy).toBe(false);
      expect(calc.discrepancy).toBe(0);
    });

    it('detects discrepancy when itemized sum does not match quoted total', () => {
      const calc = calculateQuotationItemizedTotal({
        quotedTotal: 200000,
        includedServices: [
          { description: 'Item 1', itemizedCost: 100000 },
          { description: 'Item 2', itemizedCost: 80000 },
        ],
        taxesAndFees: [],
      });
      expect(calc.itemizedServicesSum).toBe(180000);
      expect(calc.calculatedTotal).toBe(180000);
      expect(calc.discrepancy).toBe(20000);
      expect(calc.hasDiscrepancy).toBe(true);
    });

    it('adds unincluded taxes to calculated total', () => {
      const calc = calculateQuotationItemizedTotal({
        quotedTotal: 100000,
        includedServices: [
          { description: 'Item 1', itemizedCost: 100000 },
        ],
        taxesAndFees: [
          { name: 'GST 18%', amount: 18000, isIncludedInTotal: false },
        ],
      });
      expect(calc.extraTaxesSum).toBe(18000);
      expect(calc.calculatedTotal).toBe(118000);
      expect(calc.discrepancy).toBe(-18000);
      expect(calc.hasDiscrepancy).toBe(true);
    });

    it('returns zero discrepancy when services are not itemized', () => {
      const calc = calculateQuotationItemizedTotal({
        quotedTotal: 150000,
        includedServices: [
          { description: 'Full day coverage with album' },
        ],
        taxesAndFees: [],
      });
      expect(calc.itemizedServicesSum).toBe(0);
      expect(calc.calculatedTotal).toBe(150000);
      expect(calc.hasDiscrepancy).toBe(false);
    });
  });

  describe('filterQuotations', () => {
    const quotes: VendorQuotation[] = [
      {
        ...validBaseQuote,
        id: 'q1',
        vendorId: 'v1',
        serviceCategory: 'photography',
        status: 'active',
      } as VendorQuotation,
      {
        ...validBaseQuote,
        id: 'q2',
        vendorId: 'v2',
        serviceCategory: 'catering',
        status: 'active',
      } as VendorQuotation,
      {
        ...validBaseQuote,
        id: 'q3',
        vendorId: 'v1',
        serviceCategory: 'photography',
        status: 'archived',
      } as VendorQuotation,
    ];

    it('filters by vendorId', () => {
      const filtered = filterQuotations(quotes, { vendorId: 'v1' });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((q) => q.id)).toEqual(['q1', 'q3']);
    });

    it('filters by category', () => {
      const filtered = filterQuotations(quotes, { category: 'catering' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('q2');
    });

    it('excludes archived quotations when specified', () => {
      const filtered = filterQuotations(quotes, { excludeArchived: true });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((q) => q.id)).toEqual(['q1', 'q2']);
    });
  });
});
