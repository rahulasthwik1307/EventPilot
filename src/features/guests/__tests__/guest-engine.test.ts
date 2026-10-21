import { describe, it, expect } from 'vitest';
import {
  calculateAttendanceSummary,
  validateGuestInput,
  validateHouseholdInput,
  safeDeleteHousehold,
  convertPlusOneToNamedGuest,
  filterGuests,
} from '../guest-engine';
import { Guest, GuestHousehold } from '../types';

describe('Guest Engine - Attendance, Households & RSVP Math', () => {
  const mockGuest = (overrides: Partial<Guest> = {}): Guest => ({
    id: 'gst_1',
    firstName: 'Priya',
    lastName: 'Sharma',
    rsvpStatus: 'confirmed',
    invitationStatus: 'sent',
    plusOneAllowed: false,
    plusOneExpected: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  });

  it('calculates expected attendance correctly including confirmed plus-ones', () => {
    const guests: Guest[] = [
      mockGuest({ id: 'g1', rsvpStatus: 'confirmed', plusOneAllowed: true, plusOneExpected: true }), // 1 + 1 = 2
      mockGuest({ id: 'g2', rsvpStatus: 'confirmed', plusOneAllowed: false, plusOneExpected: false }), // 1
      mockGuest({ id: 'g3', rsvpStatus: 'pending', plusOneAllowed: true, plusOneExpected: true }), // Pending -> not expected!
      mockGuest({ id: 'g4', rsvpStatus: 'declined', plusOneAllowed: true, plusOneExpected: true }), // Declined -> not expected!
    ];

    const summary = calculateAttendanceSummary(guests);
    expect(summary.totalNamedGuests).toBe(4);
    expect(summary.confirmedCount).toBe(2);
    expect(summary.pendingCount).toBe(1);
    expect(summary.declinedCount).toBe(1);
    expect(summary.expectedPlusOnes).toBe(1);
    // Expected attendance: 2 confirmed + 1 confirmed plus-one = 3
    expect(summary.expectedAttendance).toBe(3);
  });

  it('aggregates dietary requirements only for confirmed attendees', () => {
    const guests: Guest[] = [
      mockGuest({ id: 'g1', rsvpStatus: 'confirmed', dietaryPreference: 'jain' }),
      mockGuest({ id: 'g2', rsvpStatus: 'confirmed', dietaryPreference: 'vegetarian' }),
      mockGuest({ id: 'g3', rsvpStatus: 'declined', dietaryPreference: 'vegan' }), // Declined not counted in catering
    ];

    const summary = calculateAttendanceSummary(guests);
    expect(summary.dietaryBreakdown['jain']).toBe(1);
    expect(summary.dietaryBreakdown['vegetarian']).toBe(1);
    expect(summary.dietaryBreakdown['vegan']).toBeUndefined();
  });

  it('safely deletes household by moving members to ungrouped state without deleting them', () => {
    const households: GuestHousehold[] = [
      { id: 'hh_1', name: 'Sharma Family' },
      { id: 'hh_2', name: 'Verma Family' },
    ];
    const guests: Guest[] = [
      mockGuest({ id: 'g1', householdId: 'hh_1' }),
      mockGuest({ id: 'g2', householdId: 'hh_1' }),
      mockGuest({ id: 'g3', householdId: 'hh_2' }),
    ];

    const result = safeDeleteHousehold(households, guests, 'hh_1');
    expect(result.households).toHaveLength(1);
    expect(result.households[0].id).toBe('hh_2');
    expect(result.guests).toHaveLength(3);
    expect(result.guests[0].householdId).toBeUndefined();
    expect(result.guests[1].householdId).toBeUndefined();
    expect(result.guests[2].householdId).toBe('hh_2');
  });

  it('converts plus-one into named guest and disables plusOneExpected to prevent double-counting', () => {
    const primary = mockGuest({
      id: 'g1',
      firstName: 'Rahul',
      householdId: 'hh_1',
      plusOneAllowed: true,
      plusOneExpected: true,
      plusOneName: 'Ananya',
    });

    const { updatedPrimary, newGuest } = convertPlusOneToNamedGuest(primary, {
      id: 'g2',
      firstName: 'Ananya',
      lastName: 'Patel',
      dietaryPreference: 'vegetarian',
    });

    expect(updatedPrimary.plusOneExpected).toBe(false);
    expect(updatedPrimary.plusOneName).toBeUndefined();

    expect(newGuest.id).toBe('g2');
    expect(newGuest.firstName).toBe('Ananya');
    expect(newGuest.lastName).toBe('Patel');
    expect(newGuest.householdId).toBe('hh_1');
    expect(newGuest.rsvpStatus).toBe('confirmed');

    // Attendance calculation with both guests must equal 2, never 3!
    const summary = calculateAttendanceSummary([updatedPrimary, newGuest]);
    expect(summary.expectedAttendance).toBe(2);
    expect(summary.expectedPlusOnes).toBe(0);
  });

  it('validates guest and household inputs correctly', () => {
    const invalidGuest = validateGuestInput({ firstName: '', rsvpStatus: 'invalid' as any });
    expect(invalidGuest.isValid).toBe(false);
    expect(invalidGuest.errors.firstName).toBeDefined();
    expect(invalidGuest.errors.rsvpStatus).toBeDefined();

    const validGuest = validateGuestInput({ firstName: 'Amit', rsvpStatus: 'confirmed' });
    expect(validGuest.isValid).toBe(true);

    const invalidHousehold = validateHouseholdInput({ name: '' });
    expect(invalidHousehold.isValid).toBe(false);
  });

  it('filters guests by search term, household, and dietary preference', () => {
    const guests: Guest[] = [
      mockGuest({ id: 'g1', firstName: 'Rohan', householdId: 'hh_1', dietaryPreference: 'jain' }),
      mockGuest({ id: 'g2', firstName: 'Meera', householdId: 'hh_2', dietaryPreference: 'none' }),
    ];

    expect(filterGuests(guests, 'rohan')).toHaveLength(1);
    expect(filterGuests(guests, '', 'all', 'hh_2')).toHaveLength(1);
    expect(filterGuests(guests, '', 'all', 'all', 'jain')).toHaveLength(1);
  });
});
