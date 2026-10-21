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
