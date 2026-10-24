import { describe, it, expect } from 'vitest';
import {
  createQuoteDerivedProposal,
  applyQuoteDerivedProposal,
} from '../proposal-adapter';
import { Event } from '@/features/events/types';
import { VendorQuotation } from '../../types';

describe('proposal-adapter', () => {
  const baseEvent: Event = {
    id: 'test-event-1',
    type: 'wedding',
    title: 'Aarav & Meera Wedding Celebration',
    date: '2026-11-20',
    guestTarget: 250,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 200000 },
    ],
    expenses: [
      {
        id: 'exp-photo',
        categoryId: 'cat-photo',
        title: 'Photography & Video',
        estimatedAmount: 180000,
        actualAmount: 50000, // 50,000 already paid out!
        paymentStatus: 'deposit_paid',
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    milestones: [],
    tasks: [],
    vendors: [
      {
        id: 'vendor-1',
        name: 'Lumiere Studios',
        category: 'photography',
        status: 'booked',
        quotedCost: 180000,
        agreedCost: 180000,
        depositPaid: 50000,
        amountPaid: 50000, // 50,000 paid out!
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    quotations: [],
    version: 3,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z',
  };

  const quote: VendorQuotation = {
    id: 'quote-new',
    vendorId: 'vendor-1',
    vendorName: 'Lumiere Studios',
    serviceCategory: 'photography',
    title: 'Add-on Drone Upgrade',
    quotedTotal: 195000,
    currency: 'INR',
    quoteDate: '2026-10-20',
    includedServices: [],
    exclusions: [],
    optionalAddOns: [],
    taxesAndFees: [],
    paymentMilestones: [],
    provenance: 'user_manual',
    status: 'active',
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
  };

  describe('createQuoteDerivedProposal', () => {
    it('creates a staged proposal for an existing vendor and expense', () => {
      const proposal = createQuoteDerivedProposal(baseEvent, quote, {
        promoteToAgreedContract: true,
        targetExpenseId: 'exp-photo',
      });

      expect(proposal.canApply).toBe(true);
      expect(proposal.quotationUpdate.status).toBe('accepted');
      expect(proposal.vendorProposal?.after.agreedCost).toBe(195000);
      expect(proposal.expenseProposal?.after.estimatedAmount).toBe(195000);
      expect(proposal.impactSummary).toContain('Accepting quotation "Add-on Drone Upgrade"');
    });

    it('rejects proposal if proposed contract is lower than already paid amount', () => {
      const lowballQuote: VendorQuotation = {
        ...quote,
        quotedTotal: 30000, // Lower than amountPaid (50,000)!
      };

      const proposal = createQuoteDerivedProposal(baseEvent, lowballQuote, {
        promoteToAgreedContract: true,
      });

      expect(proposal.canApply).toBe(false);
      expect(proposal.validationError).toContain('this vendor has already been paid INR 50,000');
      expect(proposal.validationError).toContain('immutable floor');
    });

    it('rejects proposal if target expense estimate would be lower than actual spent amount', () => {
      const lowballQuote: VendorQuotation = {
        ...quote,
        quotedTotal: 40000, // Lower than expense actualAmount (50,000)!
      };

      const proposal = createQuoteDerivedProposal(baseEvent, lowballQuote, {
        targetExpenseId: 'exp-photo',
      });

      expect(proposal.canApply).toBe(false);
      expect(proposal.validationError).toContain('actual paid amount is INR 50,000');
    });
  });

  describe('applyQuoteDerivedProposal', () => {
    it('applies proposal and increments version counter monotonically', () => {
      const proposal = createQuoteDerivedProposal(baseEvent, quote, {
        promoteToAgreedContract: true,
        targetExpenseId: 'exp-photo',
      });

      const applyRes = applyQuoteDerivedProposal(baseEvent, proposal, {
        expectedVersion: 3,
      });

      expect('updatedEvent' in applyRes).toBe(true);
      if ('updatedEvent' in applyRes) {
        expect(applyRes.updatedEvent.version).toBe(4);
        expect(applyRes.updatedEvent.expenses[0].estimatedAmount).toBe(195000);
        expect(applyRes.updatedEvent.vendors[0].agreedCost).toBe(195000);
      }
    });

    it('rejects application on optimistic concurrency version mismatch', () => {
      const proposal = createQuoteDerivedProposal(baseEvent, quote);

      const applyRes = applyQuoteDerivedProposal(baseEvent, proposal, {
        expectedVersion: 2, // Mismatched (event is version 3)
      });

      expect('error' in applyRes).toBe(true);
      if ('error' in applyRes) {
        expect(applyRes.error).toContain('Conflict detected');
        expect(applyRes.error).toContain('expected version 2, found 3');
      }
    });
  });
});
