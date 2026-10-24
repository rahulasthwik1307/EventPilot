import { describe, it, expect } from 'vitest';
import { generateVendorMessageDraft } from '../message-drafts';
import { Event } from '@/features/events/types';
import { VendorQuotation } from '../../types';

describe('message-drafts', () => {
  const sampleEvent: Event = {
    id: 'test-event-1',
    type: 'wedding',
    title: 'Aarav & Meera Wedding Celebration',
    date: '2026-11-20',
    location: 'Udaipur, Rajasthan',
    guestTarget: 250,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [],
    expenses: [],
    milestones: [],
    tasks: [],
    vendors: [],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  const sampleQuote: VendorQuotation = {
    id: 'quote-1',
    vendorId: 'vendor-1',
    vendorName: 'Lumiere Studios',
    serviceCategory: 'photography',
    title: 'Signature Wedding Package',
    quotedTotal: 180000,
    currency: 'INR',
    quoteDate: '2026-10-15',
    validUntilDate: '2026-11-01',
    includedServices: [],
    exclusions: [],
    optionalAddOns: [],
    taxesAndFees: [],
    paymentMilestones: [],
    provenance: 'user_manual',
    status: 'active',
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  it('generates initial inquiry draft with unfilled placeholders highlighted', () => {
    const draft = generateVendorMessageDraft('initial_inquiry', sampleEvent);

    expect(draft.scenario).toBe('initial_inquiry');
    expect(draft.subject).toContain('Inquiry: Services for Aarav & Meera Wedding Celebration on 2026-11-20');
    expect(draft.body).toContain('250 guests');
    expect(draft.body).toContain('Udaipur, Rajasthan');
    expect(draft.unfilledPlaceholders).toContain('[Vendor Name / Team]');
    expect(draft.unfilledPlaceholders).toContain('[Target Date for Response]');
  });

  it('generates scope clarification draft for an existing quotation', () => {
    const draft = generateVendorMessageDraft('scope_clarification', sampleEvent, sampleQuote);

    expect(draft.scenario).toBe('scope_clarification');
    expect(draft.subject).toContain('Scope Clarification: "Signature Wedding Package"');
    expect(draft.body).toContain('Lumiere Studios');
    expect(draft.body).toContain('INR 1,80,000');
    expect(draft.unfilledPlaceholders.length).toBeGreaterThan(0);
  });

  it('generates revised quote request aligning with budget constraints', () => {
    const draft = generateVendorMessageDraft('revised_quote', sampleEvent, sampleQuote);

    expect(draft.scenario).toBe('revised_quote');
    expect(draft.body).toContain('Lumiere Studios');
    expect(draft.body).toContain('INR 1,80,000');
    expect(draft.body).toContain('allocated budget ceiling');
    expect(draft.unfilledPlaceholders).toContain('[Target Budget, e.g. INR XX,XXX]');
  });

  it('generates payment terms schedule adjustment draft', () => {
    const draft = generateVendorMessageDraft('payment_terms', sampleEvent, sampleQuote);

    expect(draft.scenario).toBe('payment_terms');
    expect(draft.body).toContain('Advance Booking Retainer');
    expect(draft.body).toContain('Mid-Term Milestone');
    expect(draft.body).toContain('Final Balance');
  });

  it('generates scope confirmation pre-contract draft', () => {
    const draft = generateVendorMessageDraft('scope_confirmation', sampleEvent, sampleQuote);

    expect(draft.scenario).toBe('scope_confirmation');
    expect(draft.body).toContain('proceed with "Signature Wedding Package"');
    expect(draft.body).toContain('formal service agreement / contract draft');
  });

  it('generates quotation expiry extension request', () => {
    const draft = generateVendorMessageDraft('expiry_extension', sampleEvent, sampleQuote);

    expect(draft.scenario).toBe('expiry_extension');
    expect(draft.body).toContain('expires on 2026-11-01');
    expect(draft.unfilledPlaceholders).toContain('[New Target Date, e.g. next Friday]');
  });
});
