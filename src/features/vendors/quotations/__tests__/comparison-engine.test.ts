import { describe, it, expect } from 'vitest';
import {
  compareVendorQuotations,
  mergeAiComparisonInsights,
} from '../comparison-engine';
import { VendorQuotation } from '../../types';

describe('comparison-engine', () => {
  const quoteA: VendorQuotation = {
    id: 'quote-a',
    vendorId: 'vendor-a',
    vendorName: 'Lumiere Studios',
    serviceCategory: 'photography',
    title: 'Signature Wedding Package',
    quotedTotal: 180000,
    currency: 'INR',
    quoteDate: '2026-10-15',
    validUntilDate: '2026-11-20',
    includedServices: [
      { description: '2 Lead Photographers' },
      { description: '1 Cinematic Videographer' },
      { description: 'Drone Aerial Footage' },
      { description: 'Pre-wedding couple shoot' },
    ],
    exclusions: ['Outstation travel and lodging'],
    optionalAddOns: [{ title: 'Parent Mini Albums', additionalCost: 15000 }],
    taxesAndFees: [{ name: 'GST 18%', amount: 32400, isIncludedInTotal: true }],
    depositRequired: 50000,
    paymentMilestones: [
      { stage: 'Booking deposit', amount: 50000 },
      { stage: 'Balance on handover', amount: 130000 },
    ],
    cancellationPolicy: 'Deposit refundable up to 45 days prior to celebration.',
    provenance: 'user_manual',
    status: 'active',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
  };

  const quoteB: VendorQuotation = {
    id: 'quote-b',
    vendorId: 'vendor-b',
    vendorName: 'Artisan Frames',
    serviceCategory: 'photography',
    title: 'Essential Ceremony Coverage',
    quotedTotal: 130000,
    currency: 'INR',
    quoteDate: '2026-10-16',
    validUntilDate: '2026-11-01',
    includedServices: [
      { description: '2 Lead Photographers' },
      { description: '1 Traditional Videographer' },
      { description: 'High-res edited photo gallery' },
    ],
    exclusions: ['Drone coverage', 'Raw footage delivery'],
    optionalAddOns: [{ title: 'Drone add-on', additionalCost: 25000 }],
    taxesAndFees: [{ name: 'GST 18%', amount: 23400, isIncludedInTotal: false }], // GST excluded!
    depositRequired: 80000, // 61% deposit!
    paymentMilestones: [],
    // Missing cancellation policy!
    provenance: 'user_manual',
    status: 'active',
    createdAt: '2026-10-16T12:00:00.000Z',
    updatedAt: '2026-10-16T12:00:00.000Z',
  };

  it('handles empty quotation list gracefully', () => {
    const res = compareVendorQuotations([]);
    expect(res.quotations).toHaveLength(0);
    expect(res.basePriceComparison.variance).toBe(0);
    expect(res.hasCurrencyMismatch).toBe(false);
  });

  it('calculates deterministic price comparison between two quotes in the same currency', () => {
    const res = compareVendorQuotations([quoteA, quoteB]);
    expect(res.hasCurrencyMismatch).toBe(false);
    expect(res.basePriceComparison.lowestQuotedTotal).toBe(130000);
    expect(res.basePriceComparison.highestQuotedTotal).toBe(180000);
    expect(res.basePriceComparison.variance).toBe(50000);

    const priceFinding = res.findings.find((f) => f.dimension === 'price');
    expect(priceFinding).toBeDefined();
    expect(priceFinding?.summary).toContain('Price Variance');
    expect(priceFinding?.isAiInterpretation).toBe(false);
  });

  it('detects unincluded taxes and flags them with a warning', () => {
    const res = compareVendorQuotations([quoteA, quoteB]);
    const taxFinding = res.findings.find(
      (f) => f.dimension === 'price' && f.summary.includes('Unincluded Taxes/Fees in Artisan Frames')
    );
    expect(taxFinding).toBeDefined();
    expect(taxFinding?.severity).toBe('warning');
    expect(taxFinding?.detail).toContain('Effective total is INR 1,53,400');
  });

  it('flags currency mismatch when quotations have different currencies', () => {
    const quoteUsd: VendorQuotation = {
      ...quoteB,
      id: 'quote-usd',
      currency: 'USD',
      quotedTotal: 1600,
    };

    const res = compareVendorQuotations([quoteA, quoteUsd]);
    expect(res.hasCurrencyMismatch).toBe(true);

    const mismatchFinding = res.findings.find((f) => f.summary === 'Currency Mismatch Detected');
    expect(mismatchFinding).toBeDefined();
    expect(mismatchFinding?.severity).toBe('warning');
  });

  it('aligns common deliverables and identifies unique deliverables per quote', () => {
    const res = compareVendorQuotations([quoteA, quoteB]);
    expect(res.scopeAlignment.commonDeliverables).toContain('2 Lead Photographers');
    expect(res.scopeAlignment.uniqueDeliverables['quote-a']).toContain('Drone Aerial Footage');
    expect(res.scopeAlignment.uniqueDeliverables['quote-a']).toContain('Pre-wedding couple shoot');
    expect(res.scopeAlignment.uniqueDeliverables['quote-b']).toContain('High-res edited photo gallery');
  });

  it('detects missing cancellation policy and high advance deposit', () => {
    const res = compareVendorQuotations([quoteA, quoteB]);

    // Check missing info in quote B
    expect(res.exclusionsAnalysis.missingInformation['quote-b']).toContain(
      'Cancellation and refund terms not specified'
    );

    // Check high deposit finding for quote B (80000 out of 130000 = 62%)
    const depositFinding = res.findings.find(
      (f) => f.dimension === 'payment_terms' && f.summary.includes('High Advance Deposit')
    );
    expect(depositFinding).toBeDefined();
    expect(depositFinding?.severity).toBe('warning');
  });

  it('merges AI comparison insights cleanly marking isAiInterpretation: true', () => {
    const baseRes = compareVendorQuotations([quoteA, quoteB]);
    const merged = mergeAiComparisonInsights(baseRes, [
      {
        dimension: 'scope',
        summary: 'Cinematography Craftsmanship Trade-off',
        detail: 'Quote A provides cinematic storytelling videography whereas Quote B covers traditional static camera recording.',
        severity: 'info',
        sourceEvidence: 'Videographer line items in both proposals',
      },
    ]);

    const aiFinding = merged.findings.find((f) => f.summary === 'Cinematography Craftsmanship Trade-off');
    expect(aiFinding).toBeDefined();
    expect(aiFinding?.isAiInterpretation).toBe(true);
  });
});
