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

export const ComparisonQuotationItemSchema = z.object({
  id: z.string().min(1).optional(),
  vendorId: z.string().min(1).optional(),
  vendorName: z.string().min(1, 'Vendor name is required'),
  serviceCategory: z.enum(VENDOR_CATEGORIES),
  title: z.string().min(1, 'Quotation title is required'),
  quotedTotal: z.number().nonnegative('Quoted total must be non-negative'),
  currency: z.enum(CURRENCY_CODES).default('INR'),
  quoteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Quote date must be YYYY-MM-DD').optional(),
  validUntilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until date must be YYYY-MM-DD').optional(),
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
  sourceText: z.string().optional(),
  provenance: z.enum(['user_manual', 'ai_extracted']).optional(),
  status: z.enum(['active', 'archived', 'accepted', 'declined']).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const VendorQuotationSchema = ComparisonQuotationItemSchema;

export const QuotationsApiRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('extract'),
    payload: QuotationExtractionInputSchema,
  }),
  z.object({
    action: z.literal('compare_insights'),
    payload: z.object({
      quotations: z
        .array(ComparisonQuotationItemSchema)
        .min(2, 'At least 2 quotations required for comparison')
        .max(10, 'A maximum of 10 quotations can be compared at once'),
      eventContext: z.object({
        title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
        eventType: z.string().min(1, 'Event type is required').max(100, 'Event type cannot exceed 100 characters'),
        guestTarget: z.number().nonnegative('Guest target must be non-negative').max(100000, 'Guest target cannot exceed 100,000'),
        date: z.string().min(1, 'Date is required').max(50, 'Date cannot exceed 50 characters'),
      }),
    }),
  }),
]);

export type ComparisonQuotationItem = z.infer<typeof ComparisonQuotationItemSchema>;
export type QuotationsApiRequest = z.infer<typeof QuotationsApiRequestSchema>;
export type ExtractedQuotationOutput = z.infer<typeof ExtractedQuotationOutputSchema>;
export type QuotationComparisonInsight = z.infer<typeof QuotationComparisonInsightSchema>;
