import { describe, expect, it } from 'vitest';
import {
  createDefaultPreferenceRecord,
  createEmptyPreferences,
  detectPreferenceConflict,
  mergePreferences,
  mergeSinglePreferenceField,
  validateEventPreferences,
} from '../preferences';
import { EventPreferences } from '../types';

describe('Event Preferences Domain Model & Validation', () => {
  it('creates empty preferences with safe defaults and unknown provenance', () => {
    const prefs = createEmptyPreferences();
    expect(prefs).toBeDefined();
    expect(prefs.priorities).toBeUndefined();
    expect(prefs.budget).toBeUndefined();
    expect(prefs.logistics).toBeUndefined();
    expect(prefs.tradition).toBeUndefined();
  });

  it('validates a complete, valid preferences structure with explicit provenance', () => {
    const raw: EventPreferences = {
      priorities: createDefaultPreferenceRecord({
        primaryFocus: ['guest_hospitality', 'food_and_beverage'],
        atmosphere: 'intimate_traditional',
        experienceNotes: 'Focus on elder comfort and traditional dining rituals.',
      }, 'explicit', 'user_onboarding'),
      budget: createDefaultPreferenceRecord({
        spendingPriorities: ['Catering', 'Photography'],
        economizeAreas: ['Invitations', 'Decor'],
        nonNegotiables: ['Food quality', 'Pooja items'],
        flexibility: 'strict_hard_limit',
      }, 'explicit', 'user_onboarding'),
      logistics: createDefaultPreferenceRecord({
        guestCountFlexibility: 'strict_cap',
        accessibilityRequirements: ['wheelchair_access', 'elderly_friendly_seating'],
        venueTypePreference: 'indoor_banquet',
        timeOfDay: 'morning_auspicious',
      }, 'explicit', 'user_onboarding'),
      tradition: createDefaultPreferenceRecord({
        customRequirements: ['Vedic Muhurtham before 9:00 AM'],
        dietaryStyle: 'pure_vegetarian',
        musicStyle: ['traditional_nadaswaram'],
      }, 'explicit', 'user_onboarding'),
    };

    const result = validateEventPreferences(raw);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.priorities?.provenance).toBe('explicit');
      expect(result.data.priorities?.source).toBe('user_onboarding');
      expect(result.data.priorities?.value.atmosphere).toBe('intimate_traditional');
      expect(result.data.budget?.value.flexibility).toBe('strict_hard_limit');
      expect(result.data.logistics?.value.accessibilityRequirements).toContain('wheelchair_access');
      expect(result.data.tradition?.value.dietaryStyle).toBe('pure_vegetarian');
    }
  });

  it('safely handles empty or partial preferences without inventing values', () => {
    const partialRaw = {
      priorities: {
        value: {
          primaryFocus: ['guest_hospitality'],
          atmosphere: 'relaxed_contemporary',
        },
        provenance: 'inferred',
        source: 'ai_inference',
      },
    };

    const result = validateEventPreferences(partialRaw);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.priorities?.provenance).toBe('inferred');
      expect(result.data.priorities?.value.primaryFocus).toEqual(['guest_hospitality']);
      expect(result.data.budget).toBeUndefined();
      expect(result.data.logistics).toBeUndefined();
      expect(result.data.tradition).toBeUndefined();
    }
  });

  it('rejects malformed preference payloads gracefully', () => {
    const invalidPayload = {
      budget: {
        value: {
          flexibility: 'not_a_valid_flexibility_value',
        },
        provenance: 'invalid_provenance',
      },
    };

    const result = validateEventPreferences(invalidPayload);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    }
  });

  it('detects conflicts when proposed preference contradicts confirmed user preference', () => {
    const confirmedPreferences: EventPreferences = {
      budget: createDefaultPreferenceRecord({
        spendingPriorities: ['Catering'],
        economizeAreas: ['Decor'],
        nonNegotiables: ['Food quality'],
        flexibility: 'strict_hard_limit',
      }, 'confirmed', 'user_edit'),
    };

    // A proposed update claiming budget is a flexible target
    const conflict = detectPreferenceConflict(
      confirmedPreferences,
      'budget',
      {
        spendingPriorities: ['Decor'],
        economizeAreas: ['Catering'],
        nonNegotiables: [],
        flexibility: 'flexible_target',
      }
    );

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.reason).toContain('Budget Flexibility');
  });

  it('merges preferences safely while keeping confirmed user preferences over unconfirmed', () => {
    const base: EventPreferences = {
      priorities: createDefaultPreferenceRecord({
        primaryFocus: ['guest_hospitality'],
        atmosphere: 'intimate_traditional',
      }, 'confirmed', 'user_edit'),
    };

    const incoming: EventPreferences = {
      budget: createDefaultPreferenceRecord({
        spendingPriorities: ['Catering'],
        economizeAreas: [],
        nonNegotiables: [],
        flexibility: 'moderate_flexibility',
      }, 'inferred', 'ai_inference'),
    };

    const merged = mergePreferences(base, incoming);
    expect(merged.priorities?.value.atmosphere).toBe('intimate_traditional');
    expect(merged.priorities?.provenance).toBe('confirmed');
    expect(merged.budget?.value.flexibility).toBe('moderate_flexibility');
    expect(merged.budget?.provenance).toBe('inferred');
  });

  describe('mergeSinglePreferenceField (Field-Level Safe Merging)', () => {
    it('updates a single field in budget while preserving other budget fields and other categories', () => {
      const base: EventPreferences = {
        priorities: createDefaultPreferenceRecord({
          primaryFocus: ['guest_hospitality'],
          atmosphere: 'intimate_traditional',
        }, 'confirmed', 'user_onboarding'),
        budget: createDefaultPreferenceRecord({
          spendingPriorities: ['Catering', 'Photography'],
          economizeAreas: ['Invitations'],
          nonNegotiables: ['Mandap'],
          flexibility: 'strict_hard_limit',
        }, 'confirmed', 'user_onboarding'),
      };

      const result = mergeSinglePreferenceField(
        base,
        'budget',
        'flexibility',
        'moderate_flexibility',
        'confirmed',
        'ai_inference'
      );

      expect(result.success).toBe(true);
      const updated = result.preferences!;
      expect(updated.budget?.value.flexibility).toBe('moderate_flexibility');
      expect(updated.budget?.value.spendingPriorities).toEqual(['Catering', 'Photography']);
      expect(updated.budget?.value.economizeAreas).toEqual(['Invitations']);
      expect(updated.budget?.value.nonNegotiables).toEqual(['Mandap']);
      expect(updated.budget?.provenance).toBe('confirmed');
      expect(updated.budget?.source).toBe('ai_inference');

      // Priorities category must remain completely untouched
      expect(updated.priorities?.value.atmosphere).toBe('intimate_traditional');
      expect(updated.priorities?.provenance).toBe('confirmed');
      expect(updated.priorities?.source).toBe('user_onboarding');
    });

    it('rejects invalid field values without corrupting existing preferences', () => {
      const base: EventPreferences = {
        budget: createDefaultPreferenceRecord({
          spendingPriorities: ['Catering'],
          economizeAreas: [],
          nonNegotiables: [],
          flexibility: 'strict_hard_limit',
        }, 'confirmed', 'user_onboarding'),
      };

      const result = mergeSinglePreferenceField(
        base,
        'budget',
        'flexibility',
        'not_a_valid_flexibility_value',
        'confirmed',
        'ai_inference'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid preference update');
      expect(result.preferences).toBeUndefined();
    });

    it('merges single field into an initially empty preferences container', () => {
      const result = mergeSinglePreferenceField(
        undefined,
        'logistics',
        'accessibilityRequirements',
        ['wheelchair_access'],
        'confirmed',
        'ai_inference'
      );

      expect(result.success).toBe(true);
      const updated = result.preferences!;
      expect(updated.logistics?.value.accessibilityRequirements).toEqual(['wheelchair_access']);
      expect(updated.logistics?.provenance).toBe('confirmed');
      expect(updated.logistics?.source).toBe('ai_inference');
    });
  });
});
