/**
 * Event Pilot Personalization & Preference Engine Domain Types
 * Canonical types for celebration priorities, budget flexibility, logistics, and traditions.
 */

export type PreferenceProvenance = 'explicit' | 'confirmed' | 'inferred' | 'unknown';
export type PreferenceSource = 'user_onboarding' | 'user_edit' | 'ai_inference';

export interface PreferenceRecord<T> {
  value: T;
  provenance: PreferenceProvenance;
  source?: PreferenceSource;
  confidence?: number; // 0 to 1 for AI inferences
  updatedAt?: string;
}

// 1. Celebration Priorities
export type PriorityFocusArea =
  | 'guest_hospitality'
  | 'food_and_beverage'
  | 'ceremonial_rituals'
  | 'decor_and_ambience'
  | 'photography_and_memories'
  | 'music_and_entertainment'
  | 'budget_discipline'
  | 'convenience_and_ease';

export type CelebrationAtmosphere =
  | 'intimate_traditional'
  | 'grand_festive'
  | 'relaxed_contemporary'
  | 'minimalist_sacred'
  | 'vibrant_celebratory'
  | 'custom';

export interface CelebrationPriorities {
  primaryFocus: PriorityFocusArea[];
  atmosphere: CelebrationAtmosphere;
  experienceNotes?: string;
}

// 2. Budget and Financial Constraints
export type BudgetFlexibility = 'strict_hard_limit' | 'moderate_flexibility' | 'flexible_target';

export interface BudgetPreferences {
  spendingPriorities: string[];
  economizeAreas: string[];
  nonNegotiables: string[];
  flexibility: BudgetFlexibility;
}

// 3. Attendance and Logistics Constraints
export type GuestCountFlexibility = 'strict_cap' | 'small_buffer' | 'open_estimate';
export type AccessibilityRequirement =
  | 'wheelchair_access'
  | 'elderly_friendly_seating'
  | 'ground_floor_preferred'
  | 'quiet_zone'
  | 'child_care_area'
  | 'braille_signage'
  | 'custom';

export type VenueTypePreference =
  | 'indoor_banquet'
  | 'outdoor_lawn'
  | 'temple_mandapam'
  | 'resort_destination'
  | 'home_society'
  | 'any';

export type EventTimeOfDay =
  | 'morning_auspicious'
  | 'evening_reception'
  | 'full_day'
  | 'multi_day';

export interface LogisticsPreferences {
  guestCountFlexibility: GuestCountFlexibility;
  accessibilityRequirements: AccessibilityRequirement[];
  venueTypePreference?: VenueTypePreference;
  timeOfDay?: EventTimeOfDay;
}

// 4. Tradition, Theme, and Event-Specific Requirements
export type DietaryStyle =
  | 'pure_vegetarian'
  | 'sattvic_jain'
  | 'vegetarian_and_non_veg'
  | 'multi_cuisine'
  | 'custom';

export type MusicStyle =
  | 'traditional_nadaswaram'
  | 'classical_acoustic'
  | 'bollywood_dj'
  | 'contemporary_live_band'
  | 'devotional_bhajan'
  | 'low_noise_ambient'
  | 'custom';

export interface TraditionPreferences {
  customRequirements?: string[];
  dietaryStyle?: DietaryStyle;
  musicStyle?: MusicStyle[];
  notes?: string;
}

// Canonical Event Preferences Container
export interface EventPreferences {
  priorities?: PreferenceRecord<CelebrationPriorities>;
  budget?: PreferenceRecord<BudgetPreferences>;
  logistics?: PreferenceRecord<LogisticsPreferences>;
  tradition?: PreferenceRecord<TraditionPreferences>;
  updatedAt?: string;
}

export type PreferenceCategoryKey = keyof Omit<EventPreferences, 'updatedAt'>;
