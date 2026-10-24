import { z } from 'zod';

export const VENDOR_CATEGORIES = [
  'venue',
  'catering',
  'photography',
  'decoration',
  'entertainment',
  'music_dj',
  'clothing_makeup',
  'transport',
  'accommodation',
  'invitations_printing',
  'equipment_rentals',
  'other',
] as const;

export const CURRENCY_CODES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export const QuotationExtractionInputSchema = z.object({
  sourceText: z
    .string()
    .min(10, 'Quotation text must be at least 10 characters')
    .max(10000, 'Quotation text cannot exceed 10,000 characters'),
  category: z.enum(VENDOR_CATEGORIES).optional(),
  currency: z.enum(CURRENCY_CODES).default('INR'),
  eventId: z.string().optional(),
});

export const QuotationServiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  itemizedCost: z.number().nonnegative().optional(),
});

export const QuotationAddOnItemSchema = z.object({
  title: z.string().min(1),
  additionalCost: z.number().nonnegative(),
  description: z.string().optional(),
});

export const QuotationChargeItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().nonnegative(),
  isIncludedInTotal: z.boolean().default(true),
});

export const QuotationPaymentMilestoneSchema = z.object({
  stage: z.string().min(1),
  amount: z.number().nonnegative(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const ExtractedQuotationOutputSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  serviceCategory: z.enum(VENDOR_CATEGORIES),
  title: z.string().min(1, 'Quotation title is required'),
  quotedTotal: z.number().nonnegative(),
  currency: z.enum(CURRENCY_CODES).default('INR'),
  quoteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Quote date must be YYYY-MM-DD'),
  validUntilDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until date must be YYYY-MM-DD')
    .optional(),
  includedServices: z.array(QuotationServiceItemSchema).default([]),
  exclusions: z.array(z.string()).default([]),
  optionalAddOns: z.array(QuotationAddOnItemSchema).default([]),
  taxesAndFees: z.array(QuotationChargeItemSchema).default([]),
  depositRequired: z.number().nonnegative().optional(),
  paymentMilestones: z.array(QuotationPaymentMilestoneSchema).default([]),
  cancellationPolicy: z.string().optional(),
  guestCountAssumption: z.number().int().positive().optional(),
  capacityConstraint: z.string().optional(),
  notes: z.string().optional(),
});

export const QuotationComparisonInsightSchema = z.object({
  findings: z.array(
    z.object({
      dimension: z.enum([
        'price',
        'scope',
        'exclusions',
        'payment_terms',
        'cancellation',
        'validity',
        'capacity',
      ]),
      summary: z.string().min(1),
      detail: z.string().min(1),
      severity: z.enum(['info', 'warning', 'alert']).default('info'),
      sourceEvidence: z.string().optional(),
    })
  ),
});

export const QuotationsApiRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('extract'),
    payload: QuotationExtractionInputSchema,
  }),
  z.object({
    action: z.literal('compare_insights'),
    payload: z.object({
      quotations: z.array(z.any()).min(2, 'At least 2 quotations required for comparison'),
      eventContext: z.object({
        title: z.string(),
        eventType: z.string(),
        guestTarget: z.number(),
        date: z.string(),
      }),
    }),
  }),
]);

export type QuotationsApiRequest = z.infer<typeof QuotationsApiRequestSchema>;
export type ExtractedQuotationOutput = z.infer<typeof ExtractedQuotationOutputSchema>;
export type QuotationComparisonInsight = z.infer<typeof QuotationComparisonInsightSchema>;
