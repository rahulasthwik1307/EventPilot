import {
  VendorQuotation,
  VendorQuotationInput,
  VendorCategory,
  QuotationServiceItem,
  QuotationAddOnItem,
  QuotationChargeItem,
  QuotationPaymentMilestone,
} from '../types';

export interface QuotationValidationResult {
  isValid: boolean;
  errors: string[];
  quotation?: VendorQuotation;
}

export interface QuotationItemizedCalculation {
  itemizedServicesSum: number;
  extraTaxesSum: number;
  calculatedTotal: number;
  discrepancy: number;
  hasDiscrepancy: boolean;
}

const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;
type ValidCurrency = (typeof VALID_CURRENCIES)[number];
const isValidCurrency = (val: unknown): val is ValidCurrency =>
  typeof val === 'string' && (VALID_CURRENCIES as readonly string[]).includes(val);

const VALID_QUOTATION_STATUSES = ['active', 'archived', 'accepted', 'declined'] as const;
type QuotationStatus = (typeof VALID_QUOTATION_STATUSES)[number];
const isValidStatus = (val: unknown): val is QuotationStatus =>
  typeof val === 'string' && (VALID_QUOTATION_STATUSES as readonly string[]).includes(val);
const VALID_CATEGORIES: VendorCategory[] = [
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
];

/**
 * Validates and sanitizes a vendor quotation input.
 * Ensures numerical validity, positive non-NaN amounts, safe dates, and array structures.
 */
export function validateVendorQuotation(
  input: Partial<VendorQuotationInput | VendorQuotation>
): QuotationValidationResult {
  const errors: string[] = [];

  if (!input.vendorName || typeof input.vendorName !== 'string' || input.vendorName.trim().length === 0) {
    errors.push('Vendor name is required.');
  }

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.push('Quotation title or package name is required.');
  }

  if (
    !input.serviceCategory ||
    !VALID_CATEGORIES.includes(input.serviceCategory as VendorCategory)
  ) {
    errors.push(`Invalid vendor category: ${input.serviceCategory}`);
  }

  if (
    typeof input.quotedTotal !== 'number' ||
    isNaN(input.quotedTotal) ||
    !isFinite(input.quotedTotal) ||
    input.quotedTotal < 0
  ) {
    errors.push('Quoted total must be a non-negative number.');
  }

  if (!input.currency || !isValidCurrency(input.currency)) {
    errors.push(`Currency must be one of: ${VALID_CURRENCIES.join(', ')}`);
  }

  if (!input.quoteDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.quoteDate)) {
    errors.push('Quote date must be formatted as YYYY-MM-DD.');
  }

  if (input.validUntilDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.validUntilDate)) {
    errors.push('Valid until date must be formatted as YYYY-MM-DD if provided.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const nowIso = new Date().toISOString();
  const id = (input as VendorQuotation).id || `quote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Sanitize included services
  const includedServices: QuotationServiceItem[] = Array.isArray(input.includedServices)
    ? input.includedServices
        .filter((s) => s && typeof s.description === 'string' && s.description.trim().length > 0)
        .map((s) => ({
          description: s.description.trim(),
          quantity: typeof s.quantity === 'number' && !isNaN(s.quantity) && s.quantity > 0 ? s.quantity : undefined,
          unit: typeof s.unit === 'string' && s.unit.trim().length > 0 ? s.unit.trim() : undefined,
          itemizedCost:
            typeof s.itemizedCost === 'number' && !isNaN(s.itemizedCost) && s.itemizedCost >= 0
              ? Math.round(s.itemizedCost * 100) / 100
              : undefined,
        }))
    : [];

  // Sanitize exclusions
  const exclusions: string[] = Array.isArray(input.exclusions)
    ? input.exclusions
        .filter((e) => typeof e === 'string' && e.trim().length > 0)
        .map((e) => e.trim())
    : [];

  // Sanitize optional add-ons
  const optionalAddOns: QuotationAddOnItem[] = Array.isArray(input.optionalAddOns)
    ? input.optionalAddOns
        .filter((a) => a && typeof a.title === 'string' && a.title.trim().length > 0)
        .map((a) => ({
          title: a.title.trim(),
          additionalCost:
            typeof a.additionalCost === 'number' && !isNaN(a.additionalCost) && a.additionalCost >= 0
              ? Math.round(a.additionalCost * 100) / 100
              : 0,
          description: typeof a.description === 'string' && a.description.trim() ? a.description.trim() : undefined,
        }))
    : [];

  // Sanitize taxes and fees
  const taxesAndFees: QuotationChargeItem[] = Array.isArray(input.taxesAndFees)
    ? input.taxesAndFees
        .filter((t) => t && typeof t.name === 'string' && t.name.trim().length > 0)
        .map((t) => ({
          name: t.name.trim(),
          amount:
            typeof t.amount === 'number' && !isNaN(t.amount) && t.amount >= 0
              ? Math.round(t.amount * 100) / 100
              : 0,
          isIncludedInTotal: Boolean(t.isIncludedInTotal),
        }))
    : [];

  // Sanitize payment milestones
  const paymentMilestones: QuotationPaymentMilestone[] = Array.isArray(input.paymentMilestones)
    ? input.paymentMilestones
        .filter((m) => m && typeof m.stage === 'string' && m.stage.trim().length > 0)
        .map((m) => ({
          stage: m.stage.trim(),
          amount:
            typeof m.amount === 'number' && !isNaN(m.amount) && m.amount >= 0
              ? Math.round(m.amount * 100) / 100
              : 0,
          dueDate: m.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(m.dueDate) ? m.dueDate : undefined,
        }))
    : [];

  const quotation: VendorQuotation = {
    id,
    vendorId: input.vendorId || '',
    vendorName: input.vendorName!.trim(),
    serviceCategory: input.serviceCategory as VendorCategory,
    title: input.title!.trim(),
    quotedTotal: Math.round(input.quotedTotal! * 100) / 100,
    currency: input.currency as 'INR' | 'USD' | 'EUR' | 'GBP',
    quoteDate: input.quoteDate!,
    validUntilDate: input.validUntilDate,
    includedServices,
    exclusions,
    optionalAddOns,
    taxesAndFees,
    depositRequired:
      typeof input.depositRequired === 'number' && !isNaN(input.depositRequired) && input.depositRequired >= 0
        ? Math.round(input.depositRequired * 100) / 100
        : undefined,
    paymentMilestones,
    cancellationPolicy:
      typeof input.cancellationPolicy === 'string' && input.cancellationPolicy.trim()
        ? input.cancellationPolicy.trim()
        : undefined,
    guestCountAssumption:
      typeof input.guestCountAssumption === 'number' &&
      !isNaN(input.guestCountAssumption) &&
      input.guestCountAssumption > 0
        ? Math.round(input.guestCountAssumption)
        : undefined,
    capacityConstraint:
      typeof input.capacityConstraint === 'string' && input.capacityConstraint.trim()
        ? input.capacityConstraint.trim()
        : undefined,
    notes: typeof input.notes === 'string' && input.notes.trim() ? input.notes.trim() : undefined,
    sourceText: typeof input.sourceText === 'string' ? input.sourceText : undefined,
    provenance: input.provenance === 'ai_extracted' ? 'ai_extracted' : 'user_manual',
    status: isValidStatus(input.status) ? input.status : 'active',
    createdAt: (input as VendorQuotation).createdAt || nowIso,
    updatedAt: (input as VendorQuotation).updatedAt || nowIso,
  };

  return {
    isValid: true,
    errors: [],
    quotation,
  };
}

/**
 * Calculates itemized breakdown and compares against declared quotedTotal.
 * Discrepancy is quotedTotal - (sum of itemized services + non-included taxes/fees).
 */
export function calculateQuotationItemizedTotal(
  quote: Pick<VendorQuotation, 'quotedTotal' | 'includedServices' | 'taxesAndFees'>
): QuotationItemizedCalculation {
  const itemizedServicesSum = Math.round(
    (quote.includedServices || []).reduce((acc, s) => acc + (s.itemizedCost || 0), 0) * 100
  ) / 100;

  // Extra taxes are those that are NOT already included in the quoted total
  const extraTaxesSum = Math.round(
    (quote.taxesAndFees || [])
      .filter((t) => !t.isIncludedInTotal)
      .reduce((acc, t) => acc + (t.amount || 0), 0) * 100
  ) / 100;

  const hasAnyItemizedServices = (quote.includedServices || []).some((s) => typeof s.itemizedCost === 'number');

  let calculatedTotal: number;
  let discrepancy: number;

  if (hasAnyItemizedServices) {
    calculatedTotal = Math.round((itemizedServicesSum + extraTaxesSum) * 100) / 100;
    discrepancy = Math.round((quote.quotedTotal - calculatedTotal) * 100) / 100;
  } else {
    // Services were not broken down by price; base is quoted total
    calculatedTotal = quote.quotedTotal;
    discrepancy = 0;
  }

  const hasDiscrepancy = Math.abs(discrepancy) >= 0.01;

  return {
    itemizedServicesSum,
    extraTaxesSum,
    calculatedTotal,
    discrepancy,
    hasDiscrepancy,
  };
}

/**
 * Filters quotations by vendorId, category, or status.
 */
export function filterQuotations(
  quotations: VendorQuotation[],
  options?: {
    vendorId?: string;
    category?: VendorCategory;
    status?: 'active' | 'archived' | 'accepted' | 'declined';
    excludeArchived?: boolean;
  }
): VendorQuotation[] {
  if (!Array.isArray(quotations)) return [];

  return quotations.filter((q) => {
    if (options?.vendorId && q.vendorId !== options.vendorId) return false;
    if (options?.category && q.serviceCategory !== options.category) return false;
    if (options?.status && q.status !== options.status) return false;
    if (options?.excludeArchived && q.status === 'archived') return false;
    return true;
  });
}
