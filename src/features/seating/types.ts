/**
 * Seating & Table Planner Domain Types
 * Configurable tables, individual guest assignments, plus-one occupants, and capacity states.
 */

export type TableType = 'round' | 'rectangular' | 'high_top' | 'head_table';

export interface SeatingTable {
  id: string;
  name: string; // e.g. "Table 1 - Mandap Royal"
  capacity: number; // Positive integer >= 1
  tableType?: TableType;
  notes?: string;
}

export type TableInput = Omit<SeatingTable, 'id'>;

export interface SeatingAssignment {
  id: string;
  tableId: string;
  guestId: string;
  isPlusOne: boolean; // True if this seat is occupied by the guest's plus-one
  assignedAt: string; // ISO timestamp
}

export interface TableOccupancyStatus {
  table: SeatingTable;
  assignments: SeatingAssignment[];
  currentOccupancy: number; // Total seats currently assigned
  expectedOccupancy: number; // Confirmed guests + confirmed plus-ones assigned
  provisionalOccupancy: number; // Pending guests assigned
  declinedOccupancy: number; // Declined guests assigned (flagged)
  availableSeats: number;
  isOverCapacity: boolean; // currentOccupancy > capacity
  isFull: boolean; // currentOccupancy === capacity
}

export interface SeatingSummary {
  totalTables: number;
  totalSeats: number;
  expectedAssigned: number;
  unassignedExpected: number;
  overCapacityCount: number;
  seatingProgressPct: number;
}

export interface UnassignedAttendee {
  guestId: string;
  isPlusOne: boolean;
  displayName: string;
  householdName?: string;
  rsvpStatus: 'pending' | 'confirmed';
}
