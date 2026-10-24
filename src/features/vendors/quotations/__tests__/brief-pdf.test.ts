import { describe, it, expect, vi } from 'vitest';
import { downloadVendorBriefPdf } from '../brief-pdf';
import { VendorRequirementBrief } from '../../types';

describe('downloadVendorBriefPdf', () => {
  const mockBrief: VendorRequirementBrief = {
    category: 'photography',
    categoryLabel: 'Photography & Cinematography',
    eventTitle: 'Aarav & Meera Wedding Celebration',
    eventType: 'Wedding',
    eventDate: '2026-11-20',
    location: 'Taj Lake Palace, Udaipur, Rajasthan',
    guestTarget: 250,
    budgetCapFormatted: 'INR 25,00,000',
    allocatedCategoryBudgetFormatted: 'INR 2,00,000',
    confirmedPreferences: [
      { label: 'Primary Style', value: 'Candid and Documentary Photography' },
    ],
    confirmedNonNegotiables: ['Drone coverage for arrival'],
    timingConstraints: [
      { milestone: 'Finalize Photographer Contract', dueDate: '2026-10-31' },
    ],
    openQuestions: ['Payment milestone terms'],
    formattedBriefText: 'Sample formatted brief',
  };

  it('generates a PDF and invokes doc.save without error', () => {
    // Should run through jsPDF vector generation cleanly
    expect(() => downloadVendorBriefPdf(mockBrief)).not.toThrow();
  });
});
