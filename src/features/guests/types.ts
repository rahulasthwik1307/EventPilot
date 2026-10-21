/**
 * Guest & RSVP Management Domain Types
 * Households, individually tracked guests, RSVP responses, plus-ones, and dietary preferences.
 */

export type RsvpStatus = 'pending' | 'confirmed' | 'declined';

export type InvitationStatus = 'not_sent' | 'sent' | 'delivered';

export type DietaryPreference =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'jain'
  | 'halal'
  | 'gluten_free'
  | 'other';

export interface GuestHousehold {
  id: string;
  name: string; // e.g. "The Sharma Family"
  relationshipType?: string; // e.g. "Bride's Extended Family", "College Friends"
  notes?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName?: string;
  householdId?: string; // Optional reference to GuestHousehold.id
  relationship?: string; // e.g. "Cousin", "Colleague", "Neighbor"
  phone?: string;
  email?: string;
  rsvpStatus: RsvpStatus;
  invitationStatus: InvitationStatus;
  plusOneAllowed: boolean;
  plusOneExpected: boolean; // Only true if the plus-one is attending
  plusOneName?: string; // Optional known name of the plus-one
  dietaryPreference?: DietaryPreference;
  dietaryNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GuestInput = Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>;

export interface GuestAttendanceSummary {
  totalNamedGuests: number;
  pendingCount: number;
  confirmedCount: number;
  declinedCount: number;
  expectedPlusOnes: number; // Only from confirmed guests with plusOneExpected = true
  expectedAttendance: number; // confirmedCount + expectedPlusOnes
  ungroupedCount: number;
  dietaryBreakdown: Record<string, number>;
}
