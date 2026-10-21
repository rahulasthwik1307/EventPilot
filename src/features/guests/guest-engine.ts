/**
 * Guest & RSVP Calculation Engine
 * Pure deterministic calculations for households, attendance counts, plus-ones, and dietary restrictions.
 */

import {
  DietaryPreference,
  Guest,
  GuestAttendanceSummary,
  GuestHousehold,
  GuestInput,
  InvitationStatus,
  RsvpStatus,
} from './types';

export const DIETARY_PREFERENCES: { id: DietaryPreference; label: string }[] = [
  { id: 'none', label: 'Standard / No Restriction' },
  { id: 'vegetarian', label: 'Vegetarian (Shakahari)' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'jain', label: 'Jain (No Root Veg / Onion / Garlic)' },
  { id: 'halal', label: 'Halal' },
  { id: 'gluten_free', label: 'Gluten-Free' },
  { id: 'other', label: 'Other Dietary Need' },
];

export const RSVP_STATUSES: { id: RsvpStatus; label: string }[] = [
  { id: 'pending', label: 'Pending RSVP' },
  { id: 'confirmed', label: 'Attending (Confirmed)' },
  { id: 'declined', label: 'Declined' },
];

export const INVITATION_STATUSES: { id: InvitationStatus; label: string }[] = [
  { id: 'not_sent', label: 'Not Sent' },
  { id: 'sent', label: 'Sent' },
  { id: 'delivered', label: 'Delivered' },
];

/**
 * Pure calculation of authoritative attendance metrics.
 * Critical Rule: Expected attendance counts confirmed named guests + confirmed plus-ones.
 * Pending and declined guests are never counted as expected attendees.
 */
export function calculateAttendanceSummary(guests: Guest[]): GuestAttendanceSummary {
  let pendingCount = 0;
  let confirmedCount = 0;
  let declinedCount = 0;
  let expectedPlusOnes = 0;
  let ungroupedCount = 0;
  const dietaryBreakdown: Record<string, number> = {};

  for (const g of guests) {
    if (!g.householdId) {
      ungroupedCount++;
    }

    if (g.rsvpStatus === 'confirmed') {
      confirmedCount++;
      if (g.plusOneExpected) {
        expectedPlusOnes++;
      }

      // Track confirmed dietary needs for catering planning
      if (g.dietaryPreference && g.dietaryPreference !== 'none') {
        dietaryBreakdown[g.dietaryPreference] = (dietaryBreakdown[g.dietaryPreference] || 0) + 1;
      }
    } else if (g.rsvpStatus === 'pending') {
      pendingCount++;
    } else if (g.rsvpStatus === 'declined') {
      declinedCount++;
    }
  }

  const expectedAttendance = confirmedCount + expectedPlusOnes;

  return {
    totalNamedGuests: guests.length,
    pendingCount,
    confirmedCount,
    declinedCount,
    expectedPlusOnes,
    expectedAttendance,
    ungroupedCount,
    dietaryBreakdown,
  };
}

/**
 * Validates guest creation and editing input.
 */
export function validateGuestInput(input: Partial<GuestInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : '';
  if (!firstName) {
    errors.firstName = 'First name or display name is required.';
  } else if (firstName.length > 80) {
    errors.firstName = 'First name must be 80 characters or fewer.';
  }

  if (input.lastName && input.lastName.trim().length > 80) {
    errors.lastName = 'Last name must be 80 characters or fewer.';
  }

  const validRsvp: RsvpStatus[] = ['pending', 'confirmed', 'declined'];
  if (!input.rsvpStatus || !validRsvp.includes(input.rsvpStatus)) {
    errors.rsvpStatus = 'Please select a valid RSVP status.';
  }

  if (input.email && typeof input.email === 'string') {
    const trimmed = input.email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors.email = 'Please enter a valid email address.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates household group creation and editing input.
 */
export function validateHouseholdInput(input: Partial<GuestHousehold>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    errors.name = 'Household or group name is required.';
  } else if (name.length > 100) {
    errors.name = 'Household name must be 100 characters or fewer.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Safe household deletion: removes the household but unlinks its member guests,
 * moving them to the ungrouped state instead of silently deleting them.
 */
export function safeDeleteHousehold(
  households: GuestHousehold[],
  guests: Guest[],
  householdId: string
): { households: GuestHousehold[]; guests: Guest[] } {
  const updatedHouseholds = households.filter((h) => h.id !== householdId);
  const now = new Date().toISOString();

  const updatedGuests = guests.map((g) => {
    if (g.householdId === householdId) {
      return {
        ...g,
        householdId: undefined,
        updatedAt: now,
      };
    }
    return g;
  });

  return {
    households: updatedHouseholds,
    guests: updatedGuests,
  };
}

/**
 * Promotes a plus-one to a named individual guest.
 * Critical Rule: Disables plusOneExpected on primary guest to prevent double-counting.
 */
export function convertPlusOneToNamedGuest(
  primaryGuest: Guest,
  newGuestDetails: {
    id: string;
    firstName: string;
    lastName?: string;
    relationship?: string;
    dietaryPreference?: DietaryPreference;
    dietaryNotes?: string;
  }
): { updatedPrimary: Guest; newGuest: Guest } {
  const now = new Date().toISOString();

  const updatedPrimary: Guest = {
    ...primaryGuest,
    plusOneExpected: false,
    plusOneName: undefined,
    updatedAt: now,
  };

  const newGuest: Guest = {
    id: newGuestDetails.id,
    firstName: newGuestDetails.firstName,
    lastName: newGuestDetails.lastName,
    householdId: primaryGuest.householdId,
    relationship: newGuestDetails.relationship || 'Plus-One',
    rsvpStatus: primaryGuest.rsvpStatus, // Matches primary guest's status
    invitationStatus: primaryGuest.invitationStatus,
    plusOneAllowed: false,
    plusOneExpected: false,
    dietaryPreference: newGuestDetails.dietaryPreference || 'none',
    dietaryNotes: newGuestDetails.dietaryNotes,
    createdAt: now,
    updatedAt: now,
  };

  return {
    updatedPrimary,
    newGuest,
  };
}

/**
 * Filter guests by search query, RSVP status, household, and dietary requirement.
 */
export function filterGuests(
  guests: Guest[],
  query: string,
  rsvpFilter?: string,
  householdFilter?: string,
  dietaryFilter?: string
): Guest[] {
  const q = query.trim().toLowerCase();

  return guests.filter((g) => {
    if (rsvpFilter && rsvpFilter !== 'all' && g.rsvpStatus !== rsvpFilter) {
      return false;
    }

    if (householdFilter && householdFilter !== 'all') {
      if (householdFilter === 'ungrouped') {
        if (g.householdId) return false;
      } else if (g.householdId !== householdFilter) {
        return false;
      }
    }

    if (dietaryFilter && dietaryFilter !== 'all') {
      if (dietaryFilter === 'has_restriction') {
        if (!g.dietaryPreference || g.dietaryPreference === 'none') return false;
      } else if (g.dietaryPreference !== dietaryFilter) {
        return false;
      }
    }

    if (!q) return true;

    const fullName = `${g.firstName} ${g.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (g.relationship && g.relationship.toLowerCase().includes(q)) ||
      (g.notes && g.notes.toLowerCase().includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.phone && g.phone.includes(q)) ||
      (g.plusOneName && g.plusOneName.toLowerCase().includes(q))
    );
  });
}
