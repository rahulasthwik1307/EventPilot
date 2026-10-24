'use client';

import React from 'react';
import {
  Sparkles,
  Heart,
  Wallet,
  Compass,
  Accessibility,
  UtensilsCrossed,
  Music,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  CelebrationAtmosphere,
  CelebrationPriorities,
  BudgetFlexibility,
  BudgetPreferences,
  DietaryStyle,
  EventPreferences,
  EventTimeOfDay,
  GuestCountFlexibility,
  LogisticsPreferences,
  MusicStyle,
  PriorityFocusArea,
  TraditionPreferences,
  VenueTypePreference,
  AccessibilityRequirement,
  PreferenceSource,
} from '../../features/preferences/types';
import { EventType } from '../../features/events/types';

export interface PreferencesFormProps {
  eventType: EventType;
  values: EventPreferences;
  onChange: (updated: EventPreferences) => void;
  disabled?: boolean;
  source?: PreferenceSource;
}

const FOCUS_OPTIONS: { id: PriorityFocusArea; label: string; desc: string }[] = [
  { id: 'guest_hospitality', label: 'Guest Hospitality', desc: 'Welcoming comfort, lodging, and transport' },
  { id: 'food_and_beverage', label: 'Food & Dining', desc: 'Authentic menus, live counters, and feast quality' },
  { id: 'ceremonial_rituals', label: 'Sacred Rituals', desc: 'Traditional rites, muhurtham timing, and priest coordination' },
  { id: 'decor_and_ambience', label: 'Decor & Mandap', desc: 'Floral aesthetics, stage styling, and lighting' },
  { id: 'photography_and_memories', label: 'Photography', desc: 'Candid memories, portraits, and cinema albums' },
  { id: 'music_and_entertainment', label: 'Music & Sangeet', desc: 'Nadaswaram, live acoustic, DJ, and dance' },
  { id: 'budget_discipline', label: 'Budget Discipline', desc: 'Strict allocation caps and cost consciousness' },
  { id: 'convenience_and_ease', label: 'Stress-Free Ease', desc: 'Simplicity and minimal coordination burden' },
];

const ATMOSPHERE_OPTIONS: { id: CelebrationAtmosphere; label: string }[] = [
  { id: 'intimate_traditional', label: 'Intimate & Traditional' },
  { id: 'grand_festive', label: 'Grand & Festive' },
  { id: 'relaxed_contemporary', label: 'Relaxed Contemporary' },
  { id: 'minimalist_sacred', label: 'Minimalist Sacred' },
  { id: 'vibrant_celebratory', label: 'Vibrant Celebratory' },
];

const BUDGET_FLEX_OPTIONS: { id: BudgetFlexibility; label: string; desc: string }[] = [
  { id: 'strict_hard_limit', label: 'Strict Hard Limit', desc: 'No budget overflow permitted' },
  { id: 'moderate_flexibility', label: 'Moderate Flexibility', desc: 'Buffer for high-value upgrades' },
  { id: 'flexible_target', label: 'Flexible Target', desc: 'Estimates guide planning, quality comes first' },
];

const ACCESSIBILITY_OPTIONS: { id: AccessibilityRequirement; label: string }[] = [
  { id: 'wheelchair_access', label: 'Wheelchair Ramp Access' },
  { id: 'elderly_friendly_seating', label: 'Elderly-Friendly Seating' },
  { id: 'ground_floor_preferred', label: 'Ground Floor / No Steps' },
  { id: 'quiet_zone', label: 'Quiet Rest Zone' },
  { id: 'child_care_area', label: 'Child Activity Area' },
];

const DIETARY_OPTIONS: { id: DietaryStyle; label: string }[] = [
  { id: 'pure_vegetarian', label: 'Pure Vegetarian (Shakahari)' },
  { id: 'sattvic_jain', label: 'Sattvic / Jain Friendly' },
  { id: 'vegetarian_and_non_veg', label: 'Vegetarian & Non-Veg' },
  { id: 'multi_cuisine', label: 'Global / Multi-Cuisine' },
];

export function PreferencesForm({
  eventType,
  values,
  onChange,
  disabled = false,
  source = 'user_onboarding',
}: PreferencesFormProps) {
  // Current values or defaults
  const priorities = values.priorities?.value || {
    primaryFocus: eventType === 'wedding' ? ['ceremonial_rituals', 'food_and_beverage'] : ['food_and_beverage'],
    atmosphere: eventType === 'wedding' ? 'intimate_traditional' : 'relaxed_contemporary',
  };

  const budget = values.budget?.value || {
    spendingPriorities: [],
    economizeAreas: [],
    nonNegotiables: [],
    flexibility: 'strict_hard_limit' as BudgetFlexibility,
  };

  const logistics = values.logistics?.value || {
    guestCountFlexibility: 'small_buffer' as GuestCountFlexibility,
    accessibilityRequirements: [],
  };

  const tradition = values.tradition?.value || {
    dietaryStyle: 'pure_vegetarian' as DietaryStyle,
  };

  const updatePriorities = (updates: Partial<CelebrationPriorities>) => {
    const updated: CelebrationPriorities = { ...priorities, ...updates };
    onChange({
      ...values,
      priorities: {
        value: updated,
        provenance: 'explicit',
        source,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const updateBudget = (updates: Partial<BudgetPreferences>) => {
    const updated: BudgetPreferences = { ...budget, ...updates };
    onChange({
      ...values,
      budget: {
        value: updated,
        provenance: 'explicit',
        source,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const updateLogistics = (updates: Partial<LogisticsPreferences>) => {
    const updated: LogisticsPreferences = { ...logistics, ...updates };
    onChange({
      ...values,
      logistics: {
        value: updated,
        provenance: 'explicit',
        source,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const updateTradition = (updates: Partial<TraditionPreferences>) => {
    const updated: TraditionPreferences = { ...tradition, ...updates };
    onChange({
      ...values,
      tradition: {
        value: updated,
        provenance: 'explicit',
        source,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const toggleFocus = (focus: PriorityFocusArea) => {
    const current = priorities.primaryFocus || [];
    const exists = current.includes(focus);
    const updated = exists ? current.filter((f) => f !== focus) : [...current, focus];
    updatePriorities({ primaryFocus: updated });
  };

  const toggleAccessibility = (acc: AccessibilityRequirement) => {
    const current = logistics.accessibilityRequirements || [];
    const exists = current.includes(acc);
    const updated = exists ? current.filter((a) => a !== acc) : [...current, acc];
    updateLogistics({ accessibilityRequirements: updated });
  };

  return (
    <div className="space-y-6 text-neutral-text">
      {/* 1. Celebration Priorities */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-text">
            Celebration Priorities & Focus
          </h4>
        </div>
        <p className="text-xs text-neutral-muted">
          Select what matters most for this {eventType}. These guide future AI trade-off trade advice and budget suggestions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FOCUS_OPTIONS.map((opt) => {
            const isSelected = priorities.primaryFocus?.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleFocus(opt.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-md border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-subtle/50 text-neutral-text font-medium shadow-xs'
                    : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle/70 text-neutral-text/80'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-xs border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? 'border-primary bg-primary text-white' : 'border-neutral-border bg-neutral-surface'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[11px] text-neutral-muted">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Atmosphere */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-neutral-text mb-1.5">
            Desired Atmosphere
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ATMOSPHERE_OPTIONS.map((atm) => {
              const isSelected = priorities.atmosphere === atm.id;
              return (
                <button
                  key={atm.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => updatePriorities({ atmosphere: atm.id })}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-subtle text-neutral-text font-semibold'
                      : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle text-neutral-muted'
                  }`}
                >
                  {atm.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Budget Flexibility & Constraints */}
      <div className="space-y-3 border-t border-neutral-border/60 pt-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-text">
            Financial Flexibility
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BUDGET_FLEX_OPTIONS.map((opt) => {
            const isSelected = budget.flexibility === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => updateBudget({ flexibility: opt.id })}
                className={`p-2.5 rounded-md border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-subtle/50 text-neutral-text font-medium shadow-xs'
                    : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle/70 text-neutral-text/80'
                }`}
              >
                <div className="text-xs font-semibold mb-0.5">{opt.label}</div>
                <div className="text-[11px] text-neutral-muted">{opt.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-text mb-1">
              Top Spending Priority (Allocate Generously)
            </label>
            <input
              type="text"
              disabled={disabled}
              value={budget.spendingPriorities?.join(', ') || ''}
              onChange={(e) =>
                updateBudget({
                  spendingPriorities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="e.g. Catering, Photography"
              className="w-full bg-neutral-surface border border-neutral-border px-3 py-1.5 rounded-md text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-text mb-1">
              Areas to Economize (Willing to Compromise)
            </label>
            <input
              type="text"
              disabled={disabled}
              value={budget.economizeAreas?.join(', ') || ''}
              onChange={(e) =>
                updateBudget({
                  economizeAreas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="e.g. Print invitations, Return gifts"
              className="w-full bg-neutral-surface border border-neutral-border px-3 py-1.5 rounded-md text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* 3. Logistics & Accessibility */}
      <div className="space-y-3 border-t border-neutral-border/60 pt-4">
        <div className="flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-text">
            Guest Comfort & Accessibility
          </h4>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ACCESSIBILITY_OPTIONS.map((acc) => {
            const isSelected = logistics.accessibilityRequirements?.includes(acc.id);
            return (
              <button
                key={acc.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleAccessibility(acc.id)}
                className={`text-xs px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-primary bg-primary-subtle text-neutral-text font-semibold'
                    : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle text-neutral-muted'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-primary stroke-[3]" />}
                <span>{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Dietary & Hospitality */}
      <div className="space-y-3 border-t border-neutral-border/60 pt-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-text">
            Hospitality & Dietary Preferences
          </h4>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DIETARY_OPTIONS.map((diet) => {
            const isSelected = tradition.dietaryStyle === diet.id;
            return (
              <button
                key={diet.id}
                type="button"
                disabled={disabled}
                onClick={() => updateTradition({ dietaryStyle: diet.id })}
                className={`text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-subtle text-neutral-text font-semibold'
                    : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle text-neutral-muted'
                }`}
              >
                {diet.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
