import { describe, it, expect, vi } from 'vitest';
import { downloadVendorBriefPdf } from '../brief-pdf';
import { VendorRequirementBrief } from '../../types';

let lastDocInstance: any = null;
const saveSpy = vi.fn();

vi.mock('jspdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jspdf')>();
  return {
    ...actual,
    jsPDF: class extends actual.jsPDF {
      constructor(...args: any[]) {
        super(...args);
        lastDocInstance = this;
        this.save = saveSpy as any;
      }
    },
  };
});

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

  it('generates a PDF and invokes doc.save with expected filename without error', () => {
    saveSpy.mockClear();
    expect(() => downloadVendorBriefPdf(mockBrief)).not.toThrow();
    expect(saveSpy).toHaveBeenCalledWith(
      'Requirement-Brief-photography-Aarav___Meera_Wedding_Celebration.pdf'
    );
    expect(lastDocInstance).not.toBeNull();
    expect(lastDocInstance.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles empty milestone/timing constraints and empty non-negotiables without error', () => {
    saveSpy.mockClear();
    const minimalBrief: VendorRequirementBrief = {
      ...mockBrief,
      category: 'catering',
      categoryLabel: 'Traditional Catering',
      confirmedPreferences: [],
      confirmedNonNegotiables: [],
      timingConstraints: [],
      openQuestions: [],
    };

    expect(() => downloadVendorBriefPdf(minimalBrief)).not.toThrow();
    expect(saveSpy).toHaveBeenCalledWith(
      'Requirement-Brief-catering-Aarav___Meera_Wedding_Celebration.pdf'
    );
    expect(lastDocInstance.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles non-ASCII characters in event title and generates a valid blob', () => {
    saveSpy.mockClear();
    const nonAsciiBrief: VendorRequirementBrief = {
      ...mockBrief,
      eventTitle: "Priyā & Ānand's Vivāha Celebration — आनंद",
      category: 'music_dj',
      categoryLabel: 'पारंपरिक संगीत & Shehnai',
      location: 'वाराणसी Mandap, Kashi',
      confirmedPreferences: [
        { label: 'राग / Melody', value: 'शास्त्रीय संगीत एवं शहनाई' },
      ],
      confirmedNonNegotiables: ['Auspicious Ragas during Muhurtham'],
    };

    expect(() => downloadVendorBriefPdf(nonAsciiBrief)).not.toThrow();

    // Filename replaces non-ASCII and special characters with underscores safely
    expect(saveSpy).toHaveBeenCalled();
    const savedFilename: string = saveSpy.mock.calls[0][0];
    expect(savedFilename.startsWith('Requirement-Brief-music_dj-')).toBe(true);
    expect(savedFilename.endsWith('.pdf')).toBe(true);
    expect(/^[a-zA-Z0-9_.-]+$/.test(savedFilename)).toBe(true);

    // Observable PDF invariant: valid Blob output with content
    const blob = lastDocInstance.output('blob');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
  });
});
