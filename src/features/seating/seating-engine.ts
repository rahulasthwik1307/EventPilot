/**
 * Seating & Table Planner Calculation Engine
 * Pure deterministic calculations for table capacity, occupancy states, attendee assignments, and capacity alerts.
 */

import { Guest, GuestHousehold } from '../guests/types';
import { calculateAttendanceSummary } from '../guests/guest-engine';
import {
  SeatingAssignment,
  SeatingSummary,
  SeatingTable,
  TableInput,
  TableOccupancyStatus,
  TableType,
  UnassignedAttendee,
} from './types';

export const TABLE_TYPES: { id: TableType; label: string }[] = [
  { id: 'round', label: 'Round Banquet Table' },
  { id: 'rectangular', label: 'Rectangular Long Table' },
  { id: 'head_table', label: 'Head Table / Dais' },
  { id: 'high_top', label: 'Cocktail / High Top' },
];

/**
 * Validates table input.
 * Strict rule: Capacity must be a positive integer between 1 and 50.
 */
export function validateTableInput(input: Partial<TableInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    errors.name = 'Table name or number is required.';
  } else if (name.length > 80) {
    errors.name = 'Table name must be 80 characters or fewer.';
  }

  if (input.capacity == null || !Number.isInteger(input.capacity) || input.capacity < 1) {
    errors.capacity = 'Capacity must be a positive whole number of seats (at least 1).';
  } else if (input.capacity > 50) {
    errors.capacity = 'Capacity cannot exceed 50 seats per table.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates authoritative occupancy metrics for an individual table.
 * Supports optional pre-indexed guestMap and pre-filtered tableAssignments for high-throughput batching.
 */
export function calculateTableOccupancy(
  table: SeatingTable,
  assignments: SeatingAssignment[],
  guests: Guest[] | Map<string, Guest>,
  prefilteredAssignments?: SeatingAssignment[]
): TableOccupancyStatus {
  const guestMap =
    guests instanceof Map ? guests : new Map<string, Guest>(guests.map((g) => [g.id, g]));
  const tableAssignments =
    prefilteredAssignments ?? assignments.filter((a) => a.tableId === table.id);

  let expectedOccupancy = 0;
  let provisionalOccupancy = 0;
  let declinedOccupancy = 0;

  for (const asg of tableAssignments) {
    const guest = guestMap.get(asg.guestId);
    if (!guest) {
      // Orphaned reference or guest deleted
      continue;
    }

    if (guest.rsvpStatus === 'confirmed') {
      if (asg.isPlusOne) {
        if (guest.plusOneExpected) {
          expectedOccupancy++;
        } else {
          // Plus one not expected but assigned
          provisionalOccupancy++;
        }
      } else {
        expectedOccupancy++;
      }
    } else if (guest.rsvpStatus === 'pending') {
      provisionalOccupancy++;
    } else if (guest.rsvpStatus === 'declined') {
      declinedOccupancy++;
    }
  }

  const currentOccupancy = tableAssignments.length;
  const availableSeats = Math.max(0, table.capacity - currentOccupancy);
  const isOverCapacity = currentOccupancy > table.capacity;
  const isFull = currentOccupancy === table.capacity;

  return {
    table,
    assignments: tableAssignments,
    currentOccupancy,
    expectedOccupancy,
    provisionalOccupancy,
    declinedOccupancy,
    availableSeats,
    isOverCapacity,
    isFull,
  };
}

/**
 * Efficiently calculates occupancy status for all tables in a single pass.
 * Indexes guests (O(G)) and groups assignments by tableId (O(A)) once,
 * achieving O(G + A + T) asymptotic complexity instead of O(T * (G + A)).
 */
export function calculateAllTablesOccupancy(
  tables: SeatingTable[],
  assignments: SeatingAssignment[],
  guests: Guest[] | Map<string, Guest>
): Map<string, TableOccupancyStatus> {
  const guestMap =
    guests instanceof Map ? guests : new Map<string, Guest>(guests.map((g) => [g.id, g]));

  const assignmentsByTable = new Map<string, SeatingAssignment[]>();
  for (const asg of assignments) {
    let list = assignmentsByTable.get(asg.tableId);
    if (!list) {
      list = [];
      assignmentsByTable.set(asg.tableId, list);
    }
    list.push(asg);
  }

  const result = new Map<string, TableOccupancyStatus>();
  for (const table of tables) {
    const tableAssignments = assignmentsByTable.get(table.id) || [];
    result.set(
      table.id,
      calculateTableOccupancy(table, assignments, guestMap, tableAssignments)
    );
  }

  return result;
}

/**
 * Calculates global seating metrics across all tables and expected attendees.
 */
export function calculateSeatingSummary(
  tables: SeatingTable[],
  assignments: SeatingAssignment[],
  guests: Guest[]
): SeatingSummary {
  const totalTables = tables.length;
  let totalSeats = 0;
  let overCapacityCount = 0;

  const guestMap = new Map<string, Guest>(guests.map((g) => [g.id, g]));
  const occupancyMap = calculateAllTablesOccupancy(tables, assignments, guestMap);

  for (const tbl of tables) {
    totalSeats += tbl.capacity;
    const occ = occupancyMap.get(tbl.id);
    if (occ?.isOverCapacity) {
      overCapacityCount++;
    }
  }

  const attendance = calculateAttendanceSummary(guests);
  const expectedAttendance = attendance.expectedAttendance;

  // Count confirmed attendees assigned to any table
  let expectedAssigned = 0;

  for (const asg of assignments) {
    const guest = guestMap.get(asg.guestId);
    if (guest && guest.rsvpStatus === 'confirmed') {
      if (!asg.isPlusOne || guest.plusOneExpected) {
        expectedAssigned++;
      }
    }
  }

  const unassignedExpected = Math.max(0, expectedAttendance - expectedAssigned);
  const seatingProgressPct =
    expectedAttendance > 0 ? Math.round((expectedAssigned / expectedAttendance) * 100) : 0;

  return {
    totalTables,
    totalSeats,
    expectedAssigned,
    unassignedExpected,
    overCapacityCount,
    seatingProgressPct,
  };
}

/**
 * Returns all expected attendees (confirmed and pending) who do not currently have a seat assigned.
 */
export function getUnassignedAttendees(
  guests: Guest[],
  households: GuestHousehold[],
  assignments: SeatingAssignment[]
): UnassignedAttendee[] {
  const householdMap = new Map<string, string>(households.map((h) => [h.id, h.name]));

  // Build a set of assigned keys: `${guestId}:${isPlusOne}`
  const assignedKeys = new Set<string>(
    assignments.map((a) => `${a.guestId}:${a.isPlusOne}`)
  );

  const unassigned: UnassignedAttendee[] = [];

  for (const g of guests) {
    // Only consider confirmed or pending guests (declined do not seek seating)
    if (g.rsvpStatus === 'declined') continue;

    const householdName = g.householdId ? householdMap.get(g.householdId) : undefined;
    const displayName = `${g.firstName} ${g.lastName || ''}`.trim();

    // Check primary guest
    if (!assignedKeys.has(`${g.id}:false`)) {
      unassigned.push({
        guestId: g.id,
        isPlusOne: false,
        displayName,
        householdName,
        rsvpStatus: g.rsvpStatus,
      });
    }

    // Check plus-one seat if attending
    if (g.rsvpStatus === 'confirmed' && g.plusOneExpected) {
      if (!assignedKeys.has(`${g.id}:true`)) {
        const plusOneLabel = g.plusOneName
          ? `${g.plusOneName} (Plus-One of ${g.firstName})`
          : `Plus-One of ${displayName}`;

        unassigned.push({
          guestId: g.id,
          isPlusOne: true,
          displayName: plusOneLabel,
          householdName,
          rsvpStatus: 'confirmed',
        });
      }
    }
  }

  return unassigned;
}

/**
 * Assigns an attendee to a table.
 * Critical Rule: An attendee (guestId + isPlusOne) can have at most one active table assignment.
 * Automatically removes any prior assignment for this attendee before adding to the new table.
 */
export function assignAttendee(
  assignments: SeatingAssignment[],
  tableId: string,
  guestId: string,
  isPlusOne: boolean
): SeatingAssignment[] {
  // Filter out any prior assignment for this specific occupant
  const cleaned = assignments.filter(
    (a) => !(a.guestId === guestId && a.isPlusOne === isPlusOne)
  );

  const newAssignment: SeatingAssignment = {
    id: `asg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tableId,
    guestId,
    isPlusOne,
    assignedAt: new Date().toISOString(),
  };

  return [...cleaned, newAssignment];
}

/**
 * Unassigns an attendee seat from a table.
 */
export function unassignAttendee(
  assignments: SeatingAssignment[],
  assignmentId: string
): SeatingAssignment[] {
  return assignments.filter((a) => a.id !== assignmentId);
}

/**
 * Safely deletes a table and unassigns all guests seated at that table.
 */
export function deleteTableSafely(
  tables: SeatingTable[],
  assignments: SeatingAssignment[],
  tableId: string
): { tables: SeatingTable[]; assignments: SeatingAssignment[] } {
  return {
    tables: tables.filter((t) => t.id !== tableId),
    assignments: assignments.filter((a) => a.tableId !== tableId),
  };
}
