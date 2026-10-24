/**
 * Vendor Management Domain Types
 * Private vendor tracking, contract commitments, payment milestones, and category linkage.
 * Guardrail: Vendor commitments and payments NEVER automatically create or mutate Budget Ledger Expense records.
 */

export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'decoration'
  | 'entertainment'
  | 'music_dj'
  | 'clothing_makeup'
  | 'transport'
  | 'accommodation'
  | 'invitations_printing'
  | 'equipment_rentals'
  | 'other';

export type VendorStatus =
  | 'researching'
  | 'contacted'
  | 'quote_received'
  | 'negotiating'
  | 'booked'
  | 'cancelled';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: VendorStatus;
  quotedCost: number;
  agreedCost?: number;
  depositPaid: number;
  amountPaid: number; // Canonical total paid to date (includes depositPaid)
  linkedCategoryId?: string; // Optional reference to BudgetCategory.id
  notes?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type VendorInput = Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>;

export interface VendorFinancialSummary {
  totalQuoted: number;
  totalAgreed: number;
  totalPaid: number;
  totalRemaining: number;
  vendorCount: number;
  bookedCount: number;
  negotiatingCount: number;
  cancelledCount: number;
  overpaidCount: number;
}

export interface VendorRemainingBalance {
  remaining: number;
  isEstablished: boolean; // True if agreedCost is set
  isOverpaid: boolean; // True if amountPaid > agreedCost
  overpaidAmount: number;
}

// --- Milestone 5: Vendor Quotations & Coordination Domain ---

export interface QuotationServiceItem {
  description: string;
  quantity?: number;
  unit?: string;
  itemizedCost?: number;
}

export interface QuotationAddOnItem {
  title: string;
  additionalCost: number;
  description?: string;
}

export interface QuotationChargeItem {
  name: string;
  amount: number;
  isIncludedInTotal: boolean;
}

export interface QuotationPaymentMilestone {
  stage: string;
  amount: number;
  dueDate?: string;
}

export interface VendorQuotation {
  id: string;
  vendorId: string;
  vendorName: string;
  serviceCategory: VendorCategory;
  title: string;
  quotedTotal: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  quoteDate: string; // YYYY-MM-DD
  validUntilDate?: string; // YYYY-MM-DD
  includedServices: QuotationServiceItem[];
  exclusions: string[];
  optionalAddOns: QuotationAddOnItem[];
  taxesAndFees: QuotationChargeItem[];
  depositRequired?: number;
  paymentMilestones: QuotationPaymentMilestone[];
  cancellationPolicy?: string;
  guestCountAssumption?: number;
  capacityConstraint?: string;
  notes?: string;
  sourceText?: string;
  provenance: 'user_manual' | 'ai_extracted';
  status: 'active' | 'archived' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export type VendorQuotationInput = Omit<VendorQuotation, 'id' | 'createdAt' | 'updatedAt'>;

export interface QuotationComparisonFinding {
  dimension: 'price' | 'scope' | 'exclusions' | 'payment_terms' | 'cancellation' | 'validity' | 'capacity';
  summary: string;
  detail: string;
  isAiInterpretation: boolean;
  sourceEvidence?: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface QuotationComparisonResult {
  category: VendorCategory;
  quotations: VendorQuotation[];
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  hasCurrencyMismatch: boolean;
  basePriceComparison: {
    lowestQuotedTotal: number;
    highestQuotedTotal: number;
    variance: number;
  };
  scopeAlignment: {
    commonDeliverables: string[];
    uniqueDeliverables: Record<string, string[]>; // quoteId -> unique deliverables
  };
  exclusionsAnalysis: {
    explicitExclusions: Record<string, string[]>;
    missingInformation: Record<string, string[]>;
  };
  findings: QuotationComparisonFinding[];
  generatedAt: string;
}

export interface VendorRequirementBrief {
  category: VendorCategory;
  categoryLabel: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  location?: string;
  guestTarget: number;
  budgetCapFormatted?: string;
  allocatedCategoryBudgetFormatted?: string;
  confirmedPreferences: Array<{ label: string; value: string }>;
  confirmedNonNegotiables: string[];
  timingConstraints: Array<{ milestone: string; dueDate: string }>;
  openQuestions: string[];
  formattedBriefText: string;
}

export type VendorMessageScenario =
  | 'initial_inquiry'
  | 'scope_clarification'
  | 'revised_quote'
  | 'payment_terms'
  | 'scope_confirmation'
  | 'expiry_extension';

export interface VendorMessageDraft {
  scenario: VendorMessageScenario;
  scenarioTitle: string;
  subject: string;
  body: string;
  unfilledPlaceholders: string[];
}
