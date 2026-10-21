import { describe, it, expect } from 'vitest';
import {
  calculateTableOccupancy,
  calculateSeatingSummary,
  getUnassignedAttendees,
  assignAttendee,
  unassignAttendee,
  deleteTableSafely,
  validateTableInput,
} from '../seating-engine';
import { SeatingAssignment, SeatingTable } from '../types';
import { Guest, GuestHousehold } from '../../guests/types';

describe('Seating Engine - Capacity, Occupancy & Assignment Rules', () => {
  const mockTable = (overrides: Partial<SeatingTable> = {}): SeatingTable => ({
    id: 'tbl_1',
    name: 'Mandap Royal',
    capacity: 8,
    tableType: 'round',
    ...overrides,
  });

  const mockGuest = (overrides: Partial<Guest> = {}): Guest => ({
    id: 'g1',
    firstName: 'Aarav',
    lastName: 'Sharma',
    rsvpStatus: 'confirmed',
    invitationStatus: 'delivered',
    plusOneAllowed: false,
    plusOneExpected: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  });

  it('validates table capacity requiring whole numbers between 1 and 50', () => {
    expect(validateTableInput({ name: 'Table A', capacity: 0 }).isValid).toBe(false);
    expect(validateTableInput({ name: 'Table A', capacity: -5 }).isValid).toBe(false);
    expect(validateTableInput({ name: 'Table A', capacity: 8.5 }).isValid).toBe(false);
    expect(validateTableInput({ name: 'Table A', capacity: 60 }).isValid).toBe(false);
    expect(validateTableInput({ name: 'Table A', capacity: 10 }).isValid).toBe(true);
  });

  it('calculates table occupancy accurately including available seats and fullness', () => {
    const table = mockTable({ capacity: 4 });
    const guests = [
      mockGuest({ id: 'g1', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g2', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g3', rsvpStatus: 'pending' }),
    ];
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
      { id: 'a2', tableId: 'tbl_1', guestId: 'g2', isPlusOne: false, assignedAt: '' },
      { id: 'a3', tableId: 'tbl_1', guestId: 'g3', isPlusOne: false, assignedAt: '' },
    ];

    const occ = calculateTableOccupancy(table, assignments, guests);
    expect(occ.currentOccupancy).toBe(3);
    expect(occ.expectedOccupancy).toBe(2);
    expect(occ.provisionalOccupancy).toBe(1);
    expect(occ.availableSeats).toBe(1);
    expect(occ.isFull).toBe(false);
    expect(occ.isOverCapacity).toBe(false);
  });

  it('detects over-capacity when assignments exceed table capacity', () => {
    const table = mockTable({ capacity: 2 });
    const guests = [
      mockGuest({ id: 'g1', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g2', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g3', rsvpStatus: 'confirmed' }),
    ];
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
      { id: 'a2', tableId: 'tbl_1', guestId: 'g2', isPlusOne: false, assignedAt: '' },
      { id: 'a3', tableId: 'tbl_1', guestId: 'g3', isPlusOne: false, assignedAt: '' },
    ];

    const occ = calculateTableOccupancy(table, assignments, guests);
    expect(occ.currentOccupancy).toBe(3);
    expect(occ.isOverCapacity).toBe(true);
    expect(occ.availableSeats).toBe(0);
  });

  it('enforces single assignment constraint by moving guest without duplicating seats', () => {
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
    ];

    // Assigning g1 to tbl_2 moves them from tbl_1
    const updated = assignAttendee(assignments, 'tbl_2', 'g1', false);
    expect(updated).toHaveLength(1);
    expect(updated[0].tableId).toBe('tbl_2');
    expect(updated[0].guestId).toBe('g1');
  });

  it('handles plus-one seat assignment separately from primary guest seat', () => {
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
    ];

    // Assigning the plus-one of g1 to tbl_1 creates a second seat for that table
    const withPlusOne = assignAttendee(assignments, 'tbl_1', 'g1', true);
    expect(withPlusOne).toHaveLength(2);
    expect(withPlusOne.find((a) => a.isPlusOne)).toBeDefined();
  });

  it('identifies unassigned expected attendees correctly', () => {
    const households: GuestHousehold[] = [{ id: 'hh_1', name: 'Sharma Family' }];
    const guests: Guest[] = [
      mockGuest({ id: 'g1', rsvpStatus: 'confirmed', plusOneAllowed: true, plusOneExpected: true }),
      mockGuest({ id: 'g2', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g3', rsvpStatus: 'declined' }), // Declined should not show in unassigned list
    ];
    // g1 is seated, but g1's plus-one is unseated. g2 is unseated.
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
    ];

    const unassigned = getUnassignedAttendees(guests, households, assignments);
    expect(unassigned).toHaveLength(2);
    // Expect g1's plus-one
    expect(unassigned.find((u) => u.guestId === 'g1' && u.isPlusOne)).toBeDefined();
    // Expect g2 primary
    expect(unassigned.find((u) => u.guestId === 'g2' && !u.isPlusOne)).toBeDefined();
  });

  it('safely deletes table and unassigns occupants without affecting other tables', () => {
    const tables: SeatingTable[] = [
      mockTable({ id: 'tbl_1' }),
      mockTable({ id: 'tbl_2' }),
    ];
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
      { id: 'a2', tableId: 'tbl_2', guestId: 'g2', isPlusOne: false, assignedAt: '' },
    ];

    const result = deleteTableSafely(tables, assignments, 'tbl_1');
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].id).toBe('tbl_2');
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].tableId).toBe('tbl_2');
  });

  it('calculates global seating summary progress and unassigned count', () => {
    const tables: SeatingTable[] = [mockTable({ id: 'tbl_1', capacity: 10 })];
    const guests: Guest[] = [
      mockGuest({ id: 'g1', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g2', rsvpStatus: 'confirmed' }),
      mockGuest({ id: 'g3', rsvpStatus: 'confirmed' }),
    ];
    const assignments: SeatingAssignment[] = [
      { id: 'a1', tableId: 'tbl_1', guestId: 'g1', isPlusOne: false, assignedAt: '' },
    ];

    const summary = calculateSeatingSummary(tables, assignments, guests);
    expect(summary.totalTables).toBe(1);
    expect(summary.totalSeats).toBe(10);
    expect(summary.expectedAssigned).toBe(1);
    expect(summary.unassignedExpected).toBe(2);
    expect(summary.seatingProgressPct).toBe(33); // 1 of 3 confirmed seated
  });
});
