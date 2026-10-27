import { ValidationResult } from '../events/types';
import {
  AccessibilityRequirement,
  BudgetFlexibility,
  BudgetPreferences,
  CelebrationAtmosphere,
  CelebrationPriorities,
  DietaryStyle,
  EventPreferences,
  EventTimeOfDay,
  GuestCountFlexibility,
  LogisticsPreferences,
  MusicStyle,
  PreferenceCategoryKey,
  PreferenceProvenance,
  PreferenceRecord,
  PreferenceSource,
  PriorityFocusArea,
  TraditionPreferences,
  VenueTypePreference,
} from './types';

const VALID_PROVENANCE: PreferenceProvenance[] = [
  'explicit',
  'confirmed',
  'inferred',
  'unknown',
];

const VALID_SOURCES: PreferenceSource[] = [
  'user_onboarding',
  'user_edit',
  'ai_inference',
];

const VALID_ATMOSPHERES: CelebrationAtmosphere[] = [
  'intimate_traditional',
  'grand_festive',
  'relaxed_contemporary',
  'minimalist_sacred',
  'vibrant_celebratory',
  'custom',
];

const VALID_BUDGET_FLEXIBILITY: BudgetFlexibility[] = [
  'strict_hard_limit',
  'moderate_flexibility',
  'flexible_target',
];

const VALID_GUEST_FLEXIBILITY: GuestCountFlexibility[] = [
  'strict_cap',
  'small_buffer',
  'open_estimate',
];

const VALID_VENUE_TYPES: VenueTypePreference[] = [
  'indoor_banquet',
  'outdoor_lawn',
  'temple_mandapam',
  'resort_destination',
  'home_society',
  'any',
];

const VALID_TIMES_OF_DAY: EventTimeOfDay[] = [
  'morning_auspicious',
  'evening_reception',
  'full_day',
  'multi_day',
];

const VALID_DIETARY_STYLES: DietaryStyle[] = [
  'pure_vegetarian',
  'sattvic_jain',
  'vegetarian_and_non_veg',
  'multi_cuisine',
  'custom',
];

/**
 * Creates an empty EventPreferences record container.
 *
 * @returns An empty EventPreferences object.
 */
export function createEmptyPreferences(): EventPreferences {
  return {};
}

/**
 * Wraps a domain preference value in a versioned provenance record envelope.
 *
 * @param value - The preference data payload.
 * @param provenance - The verification state of the preference (e.g. explicit, inferred).
 * @param source - The channel or agent that originated the preference entry.
 * @returns A structured PreferenceRecord envelope stamped with the current timestamp.
 */
export function createDefaultPreferenceRecord<T>(
  value: T,
  provenance: PreferenceProvenance = 'explicit',
  source: PreferenceSource = 'user_onboarding'
): PreferenceRecord<T> {
  return {
    value,
    provenance,
    source,
    updatedAt: new Date().toISOString(),
  };
}

function validateRecordEnvelope<T>(
  raw: unknown,
  fieldLabel: string,
  validateValue: (val: unknown, errors: Record<string, string>) => T | null
): { record?: PreferenceRecord<T>; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') {
    return { errors };
  }

  const obj = raw as Record<string, unknown>;
  const rawProv = obj.provenance as PreferenceProvenance;
  const provenance = VALID_PROVENANCE.includes(rawProv) ? rawProv : 'unknown';

  if (obj.provenance && !VALID_PROVENANCE.includes(rawProv)) {
    errors[`${fieldLabel}.provenance`] = `Invalid provenance for ${fieldLabel}.`;
  }

  const rawSource = obj.source as PreferenceSource;
  const source = VALID_SOURCES.includes(rawSource) ? rawSource : undefined;

  const confidence =
    typeof obj.confidence === 'number' && Number.isFinite(obj.confidence)
      ? Math.max(0, Math.min(1, obj.confidence))
      : undefined;

  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined;

  const value = validateValue(obj.value, errors);

  if (Object.keys(errors).length > 0 || value === null) {
    return { errors };
  }

  return {
    record: {
      value,
      provenance,
      source,
      confidence,
      updatedAt,
    },
    errors,
  };
}

/**
 * Validates and normalizes raw celebration preferences against category-specific domain schemas.
 *
 * @param raw - The raw, untrusted preference payload object to validate.
 * @returns A ValidationResult containing normalized preferences or validation error messages.
 */
export function validateEventPreferences(raw: unknown): ValidationResult<EventPreferences> {
  if (!raw || typeof raw !== 'object') {
    return {
      isValid: true,
      data: createEmptyPreferences(),
      errors: {},
    };
  }

  const obj = raw as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: EventPreferences = {};

  // 1. Priorities
  if (obj.priorities !== undefined) {
    const { record, errors: prioErrors } = validateRecordEnvelope<CelebrationPriorities>(
      obj.priorities,
      'priorities',
      (val, errs) => {
        if (!val || typeof val !== 'object') {
          errs['priorities.value'] = 'Priorities value must be an object.';
          return null;
        }
        const v = val as Record<string, unknown>;
        const primaryFocus: PriorityFocusArea[] = Array.isArray(v.primaryFocus)
          ? (v.primaryFocus.filter((f) => typeof f === 'string') as PriorityFocusArea[])
          : [];

        const rawAtmos = v.atmosphere as CelebrationAtmosphere;
        const atmosphere: CelebrationAtmosphere = VALID_ATMOSPHERES.includes(rawAtmos)
          ? rawAtmos
          : 'relaxed_contemporary';

        const experienceNotes = typeof v.experienceNotes === 'string' ? v.experienceNotes.trim() : undefined;

        return {
          primaryFocus,
          atmosphere,
          experienceNotes,
        };
      }
    );

    if (record) result.priorities = record;
    Object.assign(errors, prioErrors);
  }

  // 2. Budget
  if (obj.budget !== undefined) {
    const { record, errors: budgetErrors } = validateRecordEnvelope<BudgetPreferences>(
      obj.budget,
      'budget',
      (val, errs) => {
        if (!val || typeof val !== 'object') {
          errs['budget.value'] = 'Budget preferences value must be an object.';
          return null;
        }
        const v = val as Record<string, unknown>;
        const spendingPriorities = Array.isArray(v.spendingPriorities)
          ? v.spendingPriorities.filter((s) => typeof s === 'string').map((s) => String(s).trim())
          : [];
        const economizeAreas = Array.isArray(v.economizeAreas)
          ? v.economizeAreas.filter((s) => typeof s === 'string').map((s) => String(s).trim())
          : [];
        const nonNegotiables = Array.isArray(v.nonNegotiables)
          ? v.nonNegotiables.filter((s) => typeof s === 'string').map((s) => String(s).trim())
          : [];

        const rawFlex = v.flexibility as BudgetFlexibility;
        if (!VALID_BUDGET_FLEXIBILITY.includes(rawFlex)) {
          errs['budget.flexibility'] = `Flexibility must be one of: ${VALID_BUDGET_FLEXIBILITY.join(', ')}`;
          return null;
        }

        return {
          spendingPriorities,
          economizeAreas,
          nonNegotiables,
          flexibility: rawFlex,
        };
      }
    );

    if (record) result.budget = record;
    Object.assign(errors, budgetErrors);
  }

  // 3. Logistics
  if (obj.logistics !== undefined) {
    const { record, errors: logErrors } = validateRecordEnvelope<LogisticsPreferences>(
      obj.logistics,
      'logistics',
      (val, errs) => {
        if (!val || typeof val !== 'object') {
          errs['logistics.value'] = 'Logistics preferences value must be an object.';
          return null;
        }
        const v = val as Record<string, unknown>;
        const rawFlex = v.guestCountFlexibility as GuestCountFlexibility;
        const guestCountFlexibility: GuestCountFlexibility = VALID_GUEST_FLEXIBILITY.includes(rawFlex)
          ? rawFlex
          : 'small_buffer';

        const accessibilityRequirements: AccessibilityRequirement[] = Array.isArray(v.accessibilityRequirements)
          ? (v.accessibilityRequirements.filter((a) => typeof a === 'string') as AccessibilityRequirement[])
          : [];

        const rawVenue = v.venueTypePreference as VenueTypePreference;
        const venueTypePreference: VenueTypePreference | undefined = VALID_VENUE_TYPES.includes(rawVenue)
          ? rawVenue
          : undefined;

        const rawTime = v.timeOfDay as EventTimeOfDay;
        const timeOfDay: EventTimeOfDay | undefined = VALID_TIMES_OF_DAY.includes(rawTime)
          ? rawTime
          : undefined;

        return {
          guestCountFlexibility,
          accessibilityRequirements,
          venueTypePreference,
          timeOfDay,
        };
      }
    );

    if (record) result.logistics = record;
    Object.assign(errors, logErrors);
  }

  // 4. Tradition
  if (obj.tradition !== undefined) {
    const { record, errors: tradErrors } = validateRecordEnvelope<TraditionPreferences>(
      obj.tradition,
      'tradition',
      (val, errs) => {
        if (!val || typeof val !== 'object') {
          errs['tradition.value'] = 'Tradition preferences value must be an object.';
          return null;
        }
        const v = val as Record<string, unknown>;
        const customRequirements = Array.isArray(v.customRequirements)
          ? v.customRequirements.filter((r) => typeof r === 'string').map((r) => String(r).trim())
          : undefined;

        const rawDiet = v.dietaryStyle as DietaryStyle;
        const dietaryStyle: DietaryStyle | undefined = VALID_DIETARY_STYLES.includes(rawDiet)
          ? rawDiet
          : undefined;

        const musicStyle: MusicStyle[] | undefined = Array.isArray(v.musicStyle)
          ? (v.musicStyle.filter((m) => typeof m === 'string') as MusicStyle[])
          : undefined;

        const notes = typeof v.notes === 'string' ? v.notes.trim() : undefined;

        return {
          customRequirements,
          dietaryStyle,
          musicStyle,
          notes,
        };
      }
    );

    if (record) result.tradition = record;
    Object.assign(errors, tradErrors);
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      data: null,
      errors,
    };
  }

  return {
    isValid: true,
    data: result,
    errors: {},
  };
}

/**
 * Detects conflicts when an incoming proposal contradicts existing confirmed preferences.
 * Confirmed user choices take strict priority and require explicit resolution.
 */
export function detectPreferenceConflict(
  current: EventPreferences | undefined,
  category: PreferenceCategoryKey,
  proposedValue: unknown
): { hasConflict: boolean; reason?: string } {
  if (!current || !proposedValue || typeof proposedValue !== 'object') {
    return { hasConflict: false };
  }

  const existingRecord = current[category];
  if (!existingRecord || existingRecord.provenance === 'unknown' || existingRecord.provenance === 'inferred') {
    return { hasConflict: false };
  }

  const existing = (existingRecord.value || {}) as Record<string, unknown>;
  const proposed = (typeof proposedValue === 'object' && proposedValue !== null ? proposedValue : {}) as Record<string, unknown>;

  if (category === 'budget') {
    // Check flexibility conflict
    if (
      typeof existing.flexibility === 'string' &&
      typeof proposed.flexibility === 'string' &&
      existing.flexibility !== proposed.flexibility
    ) {
      const formatFlex = (f: string) => f.replace(/_/g, ' ');
      return {
        hasConflict: true,
        reason: `Budget Flexibility conflict: currently confirmed as "${formatFlex(
          existing.flexibility
        )}", but proposed as "${formatFlex(proposed.flexibility)}".`,
      };
    }

    // Check if an area explicitly marked non-negotiable is proposed to be economized
    if (Array.isArray(existing.nonNegotiables) && Array.isArray(proposed.economizeAreas)) {
      const nonNegotiables = existing.nonNegotiables as unknown[];
      const economizeAreas = proposed.economizeAreas as unknown[];
      const contested = nonNegotiables.find(
        (nn): nn is string =>
          typeof nn === 'string' &&
          economizeAreas.some((ea) => typeof ea === 'string' && ea.toLowerCase() === nn.toLowerCase())
      );
      if (contested) {
        return {
          hasConflict: true,
          reason: `Priority conflict: "${contested}" is marked as a non-negotiable priority, but proposed to be economized.`,
        };
      }
    }
  }

  if (category === 'logistics') {
    if (
      typeof existing.guestCountFlexibility === 'string' &&
      typeof proposed.guestCountFlexibility === 'string' &&
      existing.guestCountFlexibility !== proposed.guestCountFlexibility
    ) {
      return {
        hasConflict: true,
        reason: `Guest count flexibility conflict: currently confirmed as "${existing.guestCountFlexibility}", but proposed as "${proposed.guestCountFlexibility}".`,
      };
    }
  }

  if (category === 'tradition') {
    if (
      typeof existing.dietaryStyle === 'string' &&
      typeof proposed.dietaryStyle === 'string' &&
      existing.dietaryStyle !== proposed.dietaryStyle
    ) {
      return {
        hasConflict: true,
        reason: `Dietary style conflict: currently confirmed as "${existing.dietaryStyle}", but proposed as "${proposed.dietaryStyle}".`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Merges partial preference updates into an existing preferences object deterministically.
 */
export function mergePreferences(
  base: EventPreferences | undefined,
  incoming: Partial<EventPreferences>
): EventPreferences {
  const merged: EventPreferences = {
    ...(base || {}),
    updatedAt: new Date().toISOString(),
  };

  if (incoming.priorities) merged.priorities = incoming.priorities;
  if (incoming.budget) merged.budget = incoming.budget;
  if (incoming.logistics) merged.logistics = incoming.logistics;
  if (incoming.tradition) merged.tradition = incoming.tradition;

  return merged;
}

/**
 * Merges a single preference field or category payload into an existing preferences object.
 * Preserves sibling fields within the target category and all other categories.
 * Validates the resulting category data and stamps provenance and source.
 */
export function mergeSinglePreferenceField(
  current: EventPreferences | undefined,
  category: PreferenceCategoryKey,
  field: string,
  proposedValue: unknown,
  provenance: PreferenceProvenance = 'confirmed',
  source: PreferenceSource = 'ai_inference'
): { success: boolean; preferences?: EventPreferences; error?: string } {
  const currentCategoryRecord = current?.[category];
  const currentCategoryValue = (currentCategoryRecord?.value || {}) as Record<string, unknown>;

  let incomingFieldValues: Record<string, unknown> = {};

  if (proposedValue !== null && typeof proposedValue === 'object' && !Array.isArray(proposedValue)) {
    // If the proposedValue is an object that already has the field key or multiple keys
    incomingFieldValues = { ...(proposedValue as Record<string, unknown>) };
  } else {
    // Single primitive or array proposed for the specified field
    incomingFieldValues = { [field]: proposedValue };
  }

  // Merge with existing category fields
  const mergedCategoryValue = {
    ...currentCategoryValue,
    ...incomingFieldValues,
  };

  // Validate the merged category value using validateEventPreferences envelope
  const candidateEnvelope = {
    [category]: {
      value: mergedCategoryValue,
      provenance,
      source,
      updatedAt: new Date().toISOString(),
    },
  };

  const validation = validateEventPreferences(candidateEnvelope);
  if (!validation.isValid || !validation.data || !validation.data[category]) {
    const errorDetails = Object.values(validation.errors).join(', ');
    return {
      success: false,
      error: `Invalid preference update for ${category}.${field}: ${errorDetails || 'validation failed'}`,
    };
  }

  const updatedRecord = validation.data[category]!;
  const updatedPrefs: EventPreferences = {
    ...(current || {}),
    [category]: updatedRecord,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    preferences: updatedPrefs,
  };
}
