import { describe, expect, it } from 'vitest';
import {
  ExtractedQuotationOutputSchema,
  QuotationComparisonInsightSchema,
  ComparisonQuotationItemSchema,
  VENDOR_CATEGORIES,
  CURRENCY_CODES,
} from '../quotation-schemas';

describe('quotation-schemas (Quotation Output & Comparison Validation)', () => {
  describe('ExtractedQuotationOutputSchema', () => {
    const validMinimal = {
      vendorName: 'Studio Drishti',
      serviceCategory: 'photography' as const,
      title: 'Wedding Cinema Package',
      quotedTotal: 180000,
      quoteDate: '2026-11-20',
    };

    const validComplete = {
      ...validMinimal,
      currency: 'INR' as const,
      validUntilDate: '2026-12-20',
      includedServices: [
        {
          description: '2 Candid Photographers + 1 Cinematographer',
          quantity: 3,
          unit: 'artists',
          itemizedCost: 120000,
        },
      ],
      exclusions: ['Outstation travel & lodging'],
      optionalAddOns: [
        {
          title: 'Drone Aerial Highlights',
          additionalCost: 35000,
          description: '4K aerial shoot of outdoor ceremonies',
        },
      ],
      taxesAndFees: [
        {
          name: 'GST 18%',
          amount: 32400,
          isIncludedInTotal: true,
        },
      ],
      depositRequired: 50000,
      paymentMilestones: [
        {
          stage: 'Advance Booking Token',
          amount: 50000,
          dueDate: '2026-11-25',
        },
      ],
      cancellationPolicy: 'Refundable up to 30 days prior to event',
      guestCountAssumption: 250,
      capacityConstraint: 'Up to 400 attendees',
      notes: 'Includes traditional album with 40 sheets',
    };

    it('validates a complete extracted quotation object', () => {
      const result = ExtractedQuotationOutputSchema.safeParse(validComplete);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendorName).toBe('Studio Drishti');
        expect(result.data.quotedTotal).toBe(180000);
        expect(result.data.includedServices).toHaveLength(1);
        expect(result.data.optionalAddOns).toHaveLength(1);
        expect(result.data.taxesAndFees).toHaveLength(1);
        expect(result.data.paymentMilestones).toHaveLength(1);
      }
    });

    it('validates a minimal quotation object and populates defaults', () => {
      const result = ExtractedQuotationOutputSchema.safeParse(validMinimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('INR');
        expect(result.data.includedServices).toEqual([]);
        expect(result.data.exclusions).toEqual([]);
        expect(result.data.optionalAddOns).toEqual([]);
        expect(result.data.taxesAndFees).toEqual([]);
        expect(result.data.paymentMilestones).toEqual([]);
      }
    });

    it('accepts every canonical vendor category in VENDOR_CATEGORIES', () => {
      for (const cat of VENDOR_CATEGORIES) {
        const candidate = {
          ...validMinimal,
          serviceCategory: cat,
        };
        expect(ExtractedQuotationOutputSchema.safeParse(candidate).success).toBe(true);
      }
    });

    it('accepts every canonical currency in CURRENCY_CODES', () => {
      for (const curr of CURRENCY_CODES) {
        const candidate = {
          ...validMinimal,
          currency: curr,
        };
        expect(ExtractedQuotationOutputSchema.safeParse(candidate).success).toBe(true);
      }
    });

    it('rejects objects missing required fields', () => {
      const missingVendor = { ...validMinimal, vendorName: undefined };
      const missingCategory = { ...validMinimal, serviceCategory: undefined };
      const missingTitle = { ...validMinimal, title: undefined };
      const missingTotal = { ...validMinimal, quotedTotal: undefined };
      const missingDate = { ...validMinimal, quoteDate: undefined };

      expect(ExtractedQuotationOutputSchema.safeParse(missingVendor).success).toBe(false);
      expect(ExtractedQuotationOutputSchema.safeParse(missingCategory).success).toBe(false);
      expect(ExtractedQuotationOutputSchema.safeParse(missingTitle).success).toBe(false);
      expect(ExtractedQuotationOutputSchema.safeParse(missingTotal).success).toBe(false);
      expect(ExtractedQuotationOutputSchema.safeParse(missingDate).success).toBe(false);
    });

    it('rejects empty strings for vendorName or title', () => {
      expect(
        ExtractedQuotationOutputSchema.safeParse({ ...validMinimal, vendorName: '' }).success
      ).toBe(false);
      expect(
        ExtractedQuotationOutputSchema.safeParse({ ...validMinimal, title: '' }).success
      ).toBe(false);
    });

    it('rejects invalid vendor categories', () => {
      const invalidCat = {
        ...validMinimal,
        serviceCategory: 'invalid_category_xyz',
      };
      expect(ExtractedQuotationOutputSchema.safeParse(invalidCat).success).toBe(false);
    });

    it('rejects empty objects', () => {
      expect(ExtractedQuotationOutputSchema.safeParse({}).success).toBe(false);
    });

    it('rejects wrong types for numeric and string fields', () => {
      expect(
        ExtractedQuotationOutputSchema.safeParse({
          ...validMinimal,
          quotedTotal: 'one-lakh',
        }).success
      ).toBe(false);

      expect(
        ExtractedQuotationOutputSchema.safeParse({
          ...validMinimal,
          quotedTotal: -500,
        }).success
      ).toBe(false);

      expect(
        ExtractedQuotationOutputSchema.safeParse({
          ...validMinimal,
          depositRequired: -1000,
        }).success
      ).toBe(false);

      expect(
        ExtractedQuotationOutputSchema.safeParse({
          ...validMinimal,
          quoteDate: '20-11-2026', // wrong format, must be YYYY-MM-DD
        }).success
      ).toBe(false);

      expect(
        ExtractedQuotationOutputSchema.safeParse({
          ...validMinimal,
          validUntilDate: 'not-a-date',
        }).success
      ).toBe(false);
    });
  });

  describe('QuotationComparisonInsightSchema', () => {
    it('validates a correct comparison insight payload with valid dimensions', () => {
      const valid = {
        findings: [
          {
            dimension: 'scope' as const,
            summary: 'Aerial Footage Coverage: Vendor A vs Vendor B',
            detail: 'Vendor A bundles aerial drone coverage while Vendor B charges extra.',
            severity: 'info' as const,
            sourceEvidence: 'Included services line item 2',
          },
          {
            dimension: 'cancellation' as const,
            summary: 'Contractual Exposure',
            detail: 'Vendor B lacks explicit refund terms.',
            severity: 'warning' as const,
          },
          {
            dimension: 'price' as const,
            summary: 'Overall Price Variance',
            detail: 'Vendor A quoted 25% higher base cost.',
            severity: 'alert' as const,
          },
        ],
      };

      const result = QuotationComparisonInsightSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.findings).toHaveLength(3);
        expect(result.data.findings[0].severity).toBe('info');
      }
    });

    it('validates empty findings array', () => {
      const result = QuotationComparisonInsightSchema.safeParse({ findings: [] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.findings).toEqual([]);
      }
    });

    it('rejects invalid dimensions in findings', () => {
      const invalid = {
        findings: [
          {
            dimension: 'unsupported_dimension',
            summary: 'Invalid dimension test',
            detail: 'Details here',
            severity: 'info',
          },
        ],
      };
      expect(QuotationComparisonInsightSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects invalid severity in findings', () => {
      const invalid = {
        findings: [
          {
            dimension: 'price',
            summary: 'Price difference',
            detail: 'Details here',
            severity: 'catastrophic', // Not info, warning, or alert
          },
        ],
      };
      expect(QuotationComparisonInsightSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects findings missing required summary or detail', () => {
      const missingSummary = {
        findings: [
          {
            dimension: 'scope',
            detail: 'Some details',
          },
        ],
      };
      const missingDetail = {
        findings: [
          {
            dimension: 'scope',
            summary: 'Some summary',
          },
        ],
      };

      expect(QuotationComparisonInsightSchema.safeParse(missingSummary).success).toBe(false);
      expect(QuotationComparisonInsightSchema.safeParse(missingDetail).success).toBe(false);
    });

    it('rejects empty objects and non-array findings', () => {
      expect(QuotationComparisonInsightSchema.safeParse({}).success).toBe(false);
      expect(QuotationComparisonInsightSchema.safeParse({ findings: 'not-an-array' }).success).toBe(false);
      expect(QuotationComparisonInsightSchema.safeParse({ findings: null }).success).toBe(false);
    });
  });

  describe('ComparisonQuotationItemSchema', () => {
    const validMinimalItem = {
      vendorName: 'Sri Krishna Caterers',
      serviceCategory: 'catering' as const,
      title: 'South Indian Wedding Feast',
      quotedTotal: 425000,
    };

    const validCompleteItem = {
      ...validMinimalItem,
      id: 'quote-skc-01',
      vendorId: 'vendor-101',
      currency: 'INR' as const,
      quoteDate: '2026-11-20',
      validUntilDate: '2026-12-20',
      includedServices: [{ description: 'Full traditional banana leaf service' }],
      exclusions: ['Welcome drinks table'],
      optionalAddOns: [{ title: 'Live Jalebi Station', additionalCost: 15000 }],
      taxesAndFees: [{ name: 'Service Tax', amount: 20000, isIncludedInTotal: true }],
      depositRequired: 50000,
      paymentMilestones: [{ stage: 'Advance', amount: 50000 }],
      cancellationPolicy: '50% forfeit on cancellation within 15 days',
      guestCountAssumption: 350,
      capacityConstraint: 'Minimum 300 plates guaranteed',
      notes: 'Pure vegetarian catering only',
      sourceText: 'Raw quotation email copy',
      provenance: 'user_manual' as const,
      status: 'active' as const,
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-20T10:00:00.000Z',
    };

    it('validates a complete comparison quotation item', () => {
      const result = ComparisonQuotationItemSchema.safeParse(validCompleteItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vendorName).toBe('Sri Krishna Caterers');
        expect(result.data.status).toBe('active');
        expect(result.data.provenance).toBe('user_manual');
      }
    });

    it('validates minimal comparison quotation item and applies defaults', () => {
      const result = ComparisonQuotationItemSchema.safeParse(validMinimalItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('INR');
        expect(result.data.includedServices).toEqual([]);
        expect(result.data.exclusions).toEqual([]);
      }
    });

    it('rejects items missing required fields', () => {
      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          vendorName: undefined,
        }).success
      ).toBe(false);

      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          serviceCategory: undefined,
        }).success
      ).toBe(false);

      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          title: undefined,
        }).success
      ).toBe(false);

      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          quotedTotal: undefined,
        }).success
      ).toBe(false);
    });

    it('rejects items with invalid categories or negative amounts', () => {
      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          serviceCategory: 'invalid_category',
        }).success
      ).toBe(false);

      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          quotedTotal: -100,
        }).success
      ).toBe(false);
    });

    it('rejects empty objects', () => {
      expect(ComparisonQuotationItemSchema.safeParse({}).success).toBe(false);
    });

    it('rejects invalid provenance or status values', () => {
      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          provenance: 'unknown_source',
        }).success
      ).toBe(false);

      expect(
        ComparisonQuotationItemSchema.safeParse({
          ...validMinimalItem,
          status: 'deleted',
        }).success
      ).toBe(false);
    });
  });
});
