import { describe, it, expect } from 'vitest';
import { generateVendorRequirementBrief } from '../brief-engine';
import { Event } from '@/features/events/types';

describe('brief-engine', () => {
  const sampleEvent: Event = {
    id: 'test-event-1',
    type: 'wedding',
    title: 'Aarav & Meera Wedding Celebration',
    date: '2026-11-20',
    location: 'Udaipur, Rajasthan',
    guestTarget: 250,
    budgetCap: 1500000,
    currency: 'INR',
    categories: [
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 200000 },
      { id: 'cat-cat', name: 'Catering', allocatedAmount: 500000 },
    ],
    expenses: [
      {
        id: 'exp-photo-1',
        categoryId: 'cat-photo',
        title: 'Wedding Photography Lead',
        estimatedAmount: 180000,
        paymentStatus: 'projected',
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    milestones: [],
    tasks: [
      {
        id: 'task-1',
        title: 'Finalize Photographer Contract',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-10-31',
        category: 'photography',
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    vendors: [],
    households: [],
    guests: [
      {
        id: 'g1',
        firstName: 'Private',
        lastName: 'Relative',
        rsvpStatus: 'confirmed',
        invitationStatus: 'sent',
        plusOneAllowed: false,
        plusOneExpected: false,
        email: 'secret.relative@example.com',
        phone: '+919876543210',
        dietaryNotes: 'Severe peanut allergy',
        createdAt: '2026-10-15T00:00:00.000Z',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ],
    tables: [],
    assignments: [],
    preferences: {
      budget: {
        value: {
          spendingPriorities: ['Photography & Cinematography', 'Catering'],
          economizeAreas: [],
          nonNegotiables: [
            'Drone coverage for lake palace arrival',
            'Traditional Shehnai music during phere',
          ],
          flexibility: 'moderate_flexibility',
        },
        provenance: 'explicit',
      },
      tradition: {
        value: {
          dietaryStyle: 'pure_vegetarian',
          notes: 'Please contact planner at coordinator@wedding.com or +91-999-888-7777 for private notes.',
        },
        provenance: 'explicit',
      },
    },
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  it('generates a privacy-safe brief without guest personal info', () => {
    const brief = generateVendorRequirementBrief(sampleEvent, 'photography');

    expect(brief.category).toBe('photography');
    expect(brief.categoryLabel).toContain('Photography');
    expect(brief.eventTitle).toBe('Aarav & Meera Wedding Celebration');
    expect(brief.guestTarget).toBe(250);
    expect(brief.location).toBe('Udaipur, Rajasthan');

    const formattedText = brief.formattedBriefText;

    // Must NEVER leak individual guest details
    expect(formattedText).not.toContain('secret.relative@example.com');
    expect(formattedText).not.toContain('+919876543210');
    expect(formattedText).not.toContain('Private Relative');
    expect(formattedText).not.toContain('Severe peanut allergy');

    // Must include confirmed preferences and non-negotiables
    expect(formattedText).toContain('Drone coverage for lake palace arrival');
    expect(formattedText).toContain('Key Milestones & Timing');
    expect(formattedText).toContain('Finalize Photographer Contract');
  });

  it('sanitizes personal phone and email if present in organizer notes', () => {
    const brief = generateVendorRequirementBrief(sampleEvent, 'catering');
    const formatted = brief.formattedBriefText;

    expect(formatted).not.toContain('coordinator@wedding.com');
    expect(formatted).not.toContain('+91-999-888-7777');
    expect(formatted).toContain('[email redacted]');
    expect(formatted).toContain('[phone redacted]');
  });

  it('extracts allocated category budget envelope from budget categories or expenses', () => {
    const brief = generateVendorRequirementBrief(sampleEvent, 'photography');
    expect(brief.allocatedCategoryBudgetFormatted).toContain('INR 2,00,000');

    // Test fallback when category has 0 allocated amount
    const eventWithoutCatAlloc: Event = {
      ...sampleEvent,
      categories: [{ id: 'cat-photo', name: 'Photography', allocatedAmount: 0 }],
    };
    const briefFallback = generateVendorRequirementBrief(eventWithoutCatAlloc, 'photography');
    expect(briefFallback.allocatedCategoryBudgetFormatted).toContain('INR 1,80,000');
  });
});
