import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuotationComparisonView } from '../QuotationComparisonView';
import { QuotationDialog } from '../QuotationDialog';
import { RequirementBriefModal } from '../RequirementBriefModal';
import { MessageDrafterModal } from '../MessageDrafterModal';
import { QuoteProposalReviewModal } from '../QuoteProposalReviewModal';
import { VendorsTab } from '../../VendorsTab';
import { Event } from '@/features/events/types';
import { VendorQuotation } from '@/features/vendors/types';

describe('Quotation UI Components', () => {
  const mockQuotations: VendorQuotation[] = [
    {
      id: 'quote-photo-1',
      vendorId: 'vnd-photo-1',
      vendorName: 'Studio Memoir',
      serviceCategory: 'photography',
      title: 'Signature Vivaha Package',
      quotedTotal: 180000,
      currency: 'INR',
      quoteDate: '2026-10-15',
      validUntilDate: '2026-11-30',
      includedServices: [
        { description: '2 Lead Photographers', itemizedCost: 100000 },
        { description: '1 Cinematic Videographer', itemizedCost: 80000 },
        { description: 'Drone Aerial Coverage' },
      ],
      exclusions: ['Outstation travel'],
      optionalAddOns: [],
      taxesAndFees: [{ name: 'GST 18%', amount: 32400, isIncludedInTotal: true }],
      depositRequired: 50000,
      paymentMilestones: [{ stage: 'Booking Retainer', amount: 50000 }],
      cancellationPolicy: 'Refundable up to 30 days prior',
      provenance: 'user_manual',
      status: 'active',
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z',
    },
    {
      id: 'quote-photo-2',
      vendorId: 'vnd-photo-2',
      vendorName: 'Lumiere Studios',
      serviceCategory: 'photography',
      title: 'Essential Ceremony Coverage',
      quotedTotal: 130000,
      currency: 'INR',
      quoteDate: '2026-10-16',
      validUntilDate: '2026-11-15',
      includedServices: [
        { description: '2 Lead Photographers' },
        { description: '1 Traditional Videographer' },
      ],
      exclusions: ['Drone coverage'],
      optionalAddOns: [],
      taxesAndFees: [{ name: 'GST 18%', amount: 23400, isIncludedInTotal: false }], // Excluded taxes
      depositRequired: 40000,
      paymentMilestones: [{ stage: 'Deposit', amount: 40000 }],
      provenance: 'user_manual',
      status: 'active',
      createdAt: '2026-10-16T00:00:00.000Z',
      updatedAt: '2026-10-16T00:00:00.000Z',
    },
  ];

  const mockEvent: Event = {
    id: 'test-event',
    type: 'wedding',
    title: 'Aarav & Meera Wedding Celebration',
    date: '2026-11-20',
    location: 'Udaipur, Rajasthan',
    guestTarget: 250,
    budgetCap: 2500000,
    currency: 'INR',
    categories: [
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 200000 },
    ],
    expenses: [
      {
        id: 'exp-photo-1',
        categoryId: 'cat-photo',
        title: 'Wedding Photography Lead',
        estimatedAmount: 180000,
        actualAmount: 50000,
        paymentStatus: 'deposit_paid',
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    milestones: [],
    tasks: [],
    vendors: [
      {
        id: 'vnd-photo-1',
        name: 'Studio Memoir',
        category: 'photography',
        status: 'booked',
        quotedCost: 180000,
        agreedCost: 180000,
        depositPaid: 50000,
        amountPaid: 50000,
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    quotations: mockQuotations,
    version: 1,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  describe('QuotationComparisonView', () => {
    it('renders side-by-side comparative quotes and highlights price variance', () => {
      render(
        <QuotationComparisonView
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          onPromoteQuote={vi.fn()}
          onDraftMessage={vi.fn()}
          onEditQuote={vi.fn()}
          onAddNewQuote={vi.fn()}
        />
      );

      expect(screen.getByText('Quotation Comparison & Scope Alignment')).toBeDefined();
      expect(screen.getByText('Signature Vivaha Package')).toBeDefined();
      expect(screen.getByText('Essential Ceremony Coverage')).toBeDefined();
      expect(screen.getByText('Price Variance')).toBeDefined();
      expect(screen.getAllByText(/₹50,000/i).length).toBeGreaterThanOrEqual(1);
    });

    it('triggers promote quote callback when clicking Accept & Stage Proposal', () => {
      const promoteSpy = vi.fn();
      render(
        <QuotationComparisonView
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          onPromoteQuote={promoteSpy}
          onDraftMessage={vi.fn()}
          onEditQuote={vi.fn()}
          onAddNewQuote={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button', { name: /Accept & Stage Proposal/i });
      fireEvent.click(buttons[0]);
      expect(promoteSpy).toHaveBeenCalledWith(mockQuotations[0]);
    });
  });

  describe('QuotationDialog', () => {
    it('renders form inputs and validates submission', () => {
      const saveSpy = vi.fn();
      render(
        <QuotationDialog
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          onSave={saveSpy}
        />
      );

      expect(screen.getByText('Record Vendor Quotation')).toBeDefined();
      const saveBtn = screen.getByRole('button', { name: /Save Quotation/i });
      fireEvent.click(saveBtn);

      // Should show validation error for missing vendorName or title
      expect(screen.getByText(/Please correct the following/i)).toBeDefined();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('calculates itemized total live and shows discrepancy warning', () => {
      render(
        <QuotationDialog
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          editingQuote={{
            ...mockQuotations[0],
            quotedTotal: 250000, // Discrepancy: items sum to 180000
          }}
          onSave={vi.fn()}
        />
      );

      expect(screen.getByText(/Itemized Sum Discrepancy/i)).toBeDefined();
    });
  });

  describe('RequirementBriefModal', () => {
    it('renders requirement brief and excludes private guest info', () => {
      render(
        <RequirementBriefModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          initialCategory="photography"
        />
      );

      expect(screen.getByText('Vendor Requirement Brief Generator')).toBeDefined();
      expect(screen.getByText(/Privacy Shield Active/i)).toBeDefined();
      const briefTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(briefTextarea.value).toContain('Vendor Requirement Brief: Photography');
      expect(briefTextarea.value).toContain('250 guests');
    });
  });

  describe('MessageDrafterModal', () => {
    it('renders message drafter and detects unfilled bracket placeholders', () => {
      render(
        <MessageDrafterModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          initialQuotation={mockQuotations[0]}
          initialScenario="initial_inquiry"
        />
      );

      expect(screen.getByText('Vendor Coordination Message Drafter')).toBeDefined();
      expect(screen.getByText(/Placeholder/i)).toBeDefined();
      const subjectInput = screen.getByDisplayValue(/Inquiry: Services for Aarav & Meera Wedding Celebration/i);
      expect(subjectInput).toBeDefined();
    });
  });

  describe('QuoteProposalReviewModal', () => {
    it('stages quote changes and allows application when invariants pass', () => {
      const updateSpy = vi.fn();
      render(
        <QuoteProposalReviewModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          quote={mockQuotations[0]}
          onUpdateEvent={updateSpy}
        />
      );

      expect(screen.getByText('Review Quote-Derived Proposal')).toBeDefined();
      const applyBtn = screen.getByRole('button', { name: /Apply Changes/i });
      fireEvent.click(applyBtn);

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('VendorsTab Integration', () => {
    it('renders Compare Quotes toolbar button and quote count badge on vendor cards', () => {
      render(
        <VendorsTab
          event={mockEvent}
          onUpdateEvent={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Compare Quotes \(2\)/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Requirement Brief/i })).toBeDefined();
      expect(screen.getByText(/1 quote/i)).toBeDefined();
    });
  });
});
