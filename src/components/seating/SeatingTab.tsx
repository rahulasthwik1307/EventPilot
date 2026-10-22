'use client';

import React, { useMemo, useState } from 'react';
import {
  SeatingAssignment,
  SeatingTable,
  TableInput,
  UnassignedAttendee,
} from '../../features/seating/types';
import { Event } from '../../features/events/types';
import {
  assignAttendee,
  calculateSeatingSummary,
  calculateTableOccupancy,
  deleteTableSafely,
  getUnassignedAttendees,
  TABLE_TYPES,
  unassignAttendee,
} from '../../features/seating/seating-engine';
import { calculateAttendanceSummary } from '../../features/guests/guest-engine';
import { CouponBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TableDialog } from './TableDialog';
import { TableDeleteDialog } from './TableDeleteDialog';
import {
  AlertCircle,
  AlertTriangle,
  Armchair,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  Plus,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';

export interface SeatingTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

export function SeatingTab({ event, onUpdateEvent }: SeatingTabProps) {
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<SeatingTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<SeatingTable | null>(null);

  const tables = useMemo(() => event.tables || [], [event.tables]);
  const assignments = useMemo(() => event.assignments || [], [event.assignments]);
  const guests = useMemo(() => event.guests || [], [event.guests]);
  const households = useMemo(() => event.households || [], [event.households]);

  // Pure deterministic calculations
  const summary = useMemo(
    () => calculateSeatingSummary(tables, assignments, guests),
    [tables, assignments, guests]
  );

  const attendanceSummary = useMemo(
    () => calculateAttendanceSummary(guests),
    [guests]
  );

  const unassignedAttendees = useMemo(
    () => getUnassignedAttendees(guests, households, assignments),
    [guests, households, assignments]
  );

  // Guest lookup map for name & household display
  const guestMap = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);
  const householdMap = useMemo(() => new Map(households.map((h) => [h.id, h.name])), [households]);

  const handleSaveTable = (tableData: TableInput) => {
    let updatedTables: SeatingTable[];
    if (editingTable) {
      updatedTables = tables.map((t) =>
        t.id === editingTable.id ? { ...editingTable, ...tableData } : t
      );
    } else {
      const newTable: SeatingTable = {
        id: `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...tableData,
      };
      updatedTables = [...tables, newTable];
    }

    onUpdateEvent({
      ...event,
      tables: updatedTables,
      updatedAt: new Date().toISOString(),
    });

    setEditingTable(null);
  };

  const handleConfirmDeleteTable = () => {
    if (!deletingTable) return;

    const res = deleteTableSafely(tables, assignments, deletingTable.id);

    onUpdateEvent({
      ...event,
      tables: res.tables,
      assignments: res.assignments,
      updatedAt: new Date().toISOString(),
    });

    setDeletingTable(null);
  };

  const handleAssignAttendee = (tableId: string, guestId: string, isPlusOne: boolean) => {
    const updatedAssignments = assignAttendee(assignments, tableId, guestId, isPlusOne);

    onUpdateEvent({
      ...event,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUnseatAttendee = (assignmentId: string) => {
    const updatedAssignments = unassignAttendee(assignments, assignmentId);

    onUpdateEvent({
      ...event,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString(),
    });
  };

  // Find tables with capacity violations
  const overCapacityTables = useMemo(() => {
    return tables.filter((t) => {
      const occ = calculateTableOccupancy(t, assignments, guests);
      return occ.isOverCapacity;
    });
  }, [tables, assignments, guests]);

  return (
    <div className="space-y-8">
      {/* 1. Header & Seating Summary Metrics */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-secondary font-semibold">
                Banquet Allocation &amp; Floor Plan
              </span>
              <CouponBadge variant="marigold">Seating Engine</CouponBadge>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Banquet Seating Planner
            </h2>
            <p className="text-xs text-neutral-muted mt-1">
              Deterministic seat allocations, positive table capacities, dynamic over-capacity alerts, and unassigned attendee queues.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingTable(null);
              setIsTableDialogOpen(true);
            }}
            className="self-start sm:self-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Table</span>
          </Button>
        </div>

        {/* 5 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Total Tables
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
              {summary.totalTables}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Banquet layout
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Total Seat Capacity
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
              {summary.totalSeats}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Configured seats
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Expected Seated
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-status-success">
              {summary.expectedAssigned}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Confirmed attendees
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Unassigned Attendees
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-secondary">
              {summary.unassignedExpected}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Awaiting seat allocation
            </span>
          </div>

          <div className="bg-primary-subtle/50 border border-primary/30 p-3.5 rounded-md col-span-2 lg:col-span-1">
            <span className="text-xs uppercase font-semibold text-primary block mb-1">
              Seating Completion
            </span>
            <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
              {summary.seatingProgressPct}%
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Of expected attendance
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4 pt-4 border-t border-neutral-border/60">
          <div className="flex items-center justify-between text-xs text-neutral-muted mb-1 font-mono">
            <span>Overall Seating Progress</span>
            <span>
              {summary.expectedAssigned} / {summary.expectedAssigned + summary.unassignedExpected} expected attendees allocated
            </span>
          </div>
          <div className="w-full bg-neutral-border/60 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, summary.seatingProgressPct)}%` }}
            />
          </div>
        </div>

        {/* Over-Capacity Alert Banner if any table exceeds capacity */}
        {overCapacityTables.length > 0 && (
          <div
            role="alert"
            className="mt-5 bg-status-danger-subtle text-status-danger border border-status-danger/40 p-4 rounded-md text-xs flex items-start gap-3 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-status-danger mb-1">
                Over-Capacity Warning: {overCapacityTables.length} Table(s) Exceed Configured Seats
              </p>
              <p className="text-neutral-text/90 leading-relaxed">
                The following tables have more attendees assigned than their physical seat limit:{' '}
                <strong>{overCapacityTables.map((t) => t.name).join(', ')}</strong>. Please unseat or move excess attendees to available tables.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Seating Canvas (Tables Grid + Unassigned Queue) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tables Grid (2 cols on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-neutral-text flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-secondary" />
              <span>Table Roster &amp; Occupancy</span>
            </h3>
            <span className="text-xs text-neutral-muted font-mono">
              {tables.length} tables registered
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="bg-neutral-surface border border-neutral-border rounded-lg p-10 text-center shadow-card">
              <Armchair className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-60" />
              <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
                No Tables Created
              </h4>
              <p className="text-xs text-neutral-muted max-w-sm mx-auto mb-4 leading-relaxed">
                Add banquet tables with designated seat capacities to start allocating your confirmed celebration attendees.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingTable(null);
                  setIsTableDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add First Table</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tables.map((table) => {
                const occ = calculateTableOccupancy(table, assignments, guests);
                const tableTypeLabel =
                  TABLE_TYPES.find((t) => t.id === table.tableType)?.label || 'Banquet';

                return (
                  <div
                    key={table.id}
                    className={`bg-neutral-surface border rounded-lg p-5 shadow-card flex flex-col justify-between transition-all ${
                      occ.isOverCapacity
                        ? 'border-status-danger ring-1 ring-status-danger/40'
                        : occ.isFull
                        ? 'border-status-success/60'
                        : 'border-neutral-border hover:border-neutral-border-strong'
                    }`}
                  >
                    <div>
                      {/* Table Header: Name, Type, Capacity Status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-subtle border border-neutral-border text-neutral-muted">
                              {tableTypeLabel}
                            </span>
                            {occ.isOverCapacity ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-status-danger-subtle text-status-danger border border-status-danger/30">
                                Over by {occ.currentOccupancy - table.capacity}
                              </span>
                            ) : occ.isFull ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-status-success-subtle text-status-success border border-status-success/30">
                                Table Full
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-neutral-muted">
                                {occ.availableSeats} seat(s) open
                              </span>
                            )}
                          </div>
                          <h4 className="font-display text-base font-semibold text-neutral-text">
                            {table.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTable(table);
                              setIsTableDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTable(table)}
                            className="text-status-danger hover:bg-status-danger-subtle"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Capacity Meter Bar */}
                      <div className="my-3 space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-neutral-muted">Seat Occupancy:</span>
                          <span
                            className={`font-semibold ${
                              occ.isOverCapacity
                                ? 'text-status-danger'
                                : occ.isFull
                                ? 'text-status-success'
                                : 'text-neutral-text'
                            }`}
                          >
                            {occ.currentOccupancy} / {table.capacity} seats
                          </span>
                        </div>
                        <div className="w-full bg-neutral-border/60 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              occ.isOverCapacity
                                ? 'bg-status-danger'
                                : occ.isFull
                                ? 'bg-status-success'
                                : 'bg-primary'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((occ.currentOccupancy / table.capacity) * 100)
                              )}%`,
                            }}
                          />
                        </div>

                        {/* Seat occupancy dots (up to capacity, max 20) */}
                        <div className="flex flex-wrap items-center gap-1 pt-1" title={`${occ.currentOccupancy} of ${table.capacity} seats occupied`}>
                          {Array.from({ length: Math.min(table.capacity, 20) }).map((_, seatIdx) => {
                            const isOccupied = seatIdx < occ.currentOccupancy;
                            const isOver = occ.isOverCapacity && seatIdx >= table.capacity - (occ.currentOccupancy - table.capacity);
                            return (
                              <span
                                key={seatIdx}
                                className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                                  isOver
                                    ? 'bg-status-danger border-status-danger'
                                    : isOccupied
                                    ? occ.isOverCapacity
                                      ? 'bg-status-danger/70 border-status-danger'
                                      : occ.isFull
                                      ? 'bg-status-success border-status-success'
                                      : 'bg-primary border-primary'
                                    : 'bg-neutral-subtle border-neutral-border'
                                }`}
                                aria-hidden="true"
                              />
                            );
                          })}
                          {table.capacity > 20 && (
                            <span className="text-[10px] font-mono text-neutral-muted">+{table.capacity - 20}</span>
                          )}
                        </div>
                      </div>

                      {/* Location notes if any */}
                      {table.notes && (
                        <p className="text-xs text-neutral-muted italic mb-3 bg-neutral-bg p-2 rounded border border-neutral-border/50">
                          &ldquo;{table.notes}&rdquo;
                        </p>
                      )}

                      {/* Seated Occupants List */}
                      <div className="mt-4 pt-3 border-t border-neutral-border/50 space-y-2">
                        <span className="text-xs uppercase font-bold text-neutral-muted tracking-wider block mb-1">
                          Seated Occupants ({occ.assignments.length})
                        </span>

                        {occ.assignments.length === 0 ? (
                          <p className="text-xs text-neutral-muted italic py-2">
                            No attendees currently seated here.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {occ.assignments.map((asg) => {
                              const guest = guestMap.get(asg.guestId);
                              const householdName =
                                guest?.householdId ? householdMap.get(guest.householdId) : null;

                              const displayName = asg.isPlusOne
                                ? guest?.plusOneName
                                  ? `${guest.plusOneName} (+1 of ${guest.firstName})`
                                  : `+1 Partner of ${guest?.firstName || 'Guest'}`
                                : `${guest?.firstName || 'Unknown'} ${guest?.lastName || ''}`.trim();

                              const isConfirmed = guest?.rsvpStatus === 'confirmed';
                              const isDeclined = guest?.rsvpStatus === 'declined';

                              return (
                                <div
                                  key={asg.id}
                                  className="flex items-center justify-between p-2 rounded bg-neutral-subtle/70 border border-neutral-border/60 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          isDeclined
                                            ? 'bg-status-danger'
                                            : isConfirmed
                                            ? 'bg-status-success'
                                            : 'bg-status-warning'
                                        }`}
                                        title={
                                          isDeclined
                                            ? 'Declined RSVP (occupying seat)'
                                            : isConfirmed
                                            ? 'Confirmed RSVP'
                                            : 'Pending RSVP'
                                        }
                                      />
                                      <span
                                        className={`font-medium ${
                                          isDeclined ? 'line-through text-neutral-muted' : 'text-neutral-text'
                                        }`}
                                      >
                                        {displayName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-muted font-sans text-xs pl-3.5">
                                      {householdName && <span>{householdName}</span>}
                                      {!isConfirmed && !isDeclined && (
                                        <span className="text-status-warning font-semibold">
                                          (Pending RSVP)
                                        </span>
                                      )}
                                      {isDeclined && (
                                        <span className="text-status-danger font-semibold">
                                          (Declined)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleUnseatAttendee(asg.id)}
                                    className="text-neutral-muted hover:text-status-danger p-1 rounded hover:bg-neutral-surface"
                                    title="Unseat attendee"
                                    aria-label={`Unseat ${displayName}`}
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Inline Seat from Unassigned Pool */}
                    {unassignedAttendees.length > 0 && !occ.isFull && !occ.isOverCapacity && (
                      <div className="mt-4 pt-3 border-t border-neutral-border/50">
                        <label
                          htmlFor={`seat-select-${table.id}`}
                          className="block text-xs font-semibold uppercase text-neutral-muted mb-1"
                        >
                          Seat Attendee Here:
                        </label>
                        <select
                          id={`seat-select-${table.id}`}
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const [guestId, plusOneStr] = e.target.value.split(':');
                            handleAssignAttendee(table.id, guestId, plusOneStr === 'true');
                            e.target.value = '';
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-neutral-surface border border-neutral-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Choose attendee to seat...</option>
                          {unassignedAttendees.map((u) => (
                            <option
                              key={`${u.guestId}:${u.isPlusOne}`}
                              value={`${u.guestId}:${u.isPlusOne}`}
                            >
                              {u.displayName}{' '}
                              {u.householdName ? `(${u.householdName})` : ''}{' '}
                              {u.rsvpStatus === 'pending' ? '· [Pending]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Unassigned Expected Attendees Queue */}
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-border pb-3">
            <div>
              <h3 className="font-display text-base font-semibold text-neutral-text flex items-center gap-1.5">
                <Armchair className="w-4 h-4 text-primary" />
                <span>Unassigned Queue</span>
              </h3>
              <p className="text-xs text-neutral-muted">
                Attendees needing table assignments
              </p>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-subtle text-secondary border border-secondary/30">
              {unassignedAttendees.length}
            </span>
          </div>

          {unassignedAttendees.length === 0 ? (
            guests.length === 0 ? (
              <div className="text-center py-8 text-neutral-muted">
                <Users className="w-8 h-8 text-neutral-muted/60 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-text mb-0.5">
                  No Guests Registered
                </p>
                <p className="text-xs text-neutral-muted max-w-xs mx-auto">
                  Add guests and record their RSVPs in the Guests tab to begin seating arrangements.
                </p>
              </div>
            ) : attendanceSummary.expectedAttendance === 0 ? (
              <div className="text-center py-8 text-neutral-muted">
                <Clock className="w-8 h-8 text-status-warning mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-neutral-text mb-0.5">
                  Awaiting Confirmed RSVPs
                </p>
                <p className="text-xs text-neutral-muted max-w-xs mx-auto">
                  There are no confirmed attendees to assign. Update guest RSVPs to confirmed to seat them.
                </p>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-neutral-muted">
                <Armchair className="w-8 h-8 text-secondary mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-neutral-text mb-0.5">
                  Tables Needed
                </p>
                <p className="text-xs text-neutral-muted max-w-xs mx-auto">
                  Create banquet tables to begin assigning seats to your confirmed guests.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-muted">
                <CheckCircle2 className="w-8 h-8 text-status-success mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-neutral-text mb-0.5">
                  All Confirmed Attendees Seated!
                </p>
                <p className="text-xs text-neutral-muted max-w-xs mx-auto">
                  Every confirmed attendee and attending partner currently holds a reserved table seat.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {unassignedAttendees.map((u) => (
                <div
                  key={`${u.guestId}:${u.isPlusOne}`}
                  className="p-3 rounded-md bg-neutral-subtle/60 border border-neutral-border/70 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-semibold text-neutral-text text-sm">{u.displayName}</p>
                      {u.householdName && (
                        <p className="text-neutral-muted">{u.householdName}</p>
                      )}
                    </div>
                    {u.rsvpStatus === 'pending' ? (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-status-warning-subtle text-status-warning border border-status-warning/30">
                        Pending
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-status-success-subtle text-status-success border border-status-success/30">
                        Confirmed
                      </span>
                    )}
                  </div>

                  {tables.length > 0 ? (
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-border/40">
                      <select
                        aria-label={`Seat ${u.displayName} at table`}
                        defaultValue=""
                        onChange={(e) => {
                          if (!e.target.value) return;
                          handleAssignAttendee(e.target.value, u.guestId, u.isPlusOne);
                          e.target.value = '';
                        }}
                        className="w-full px-2 py-1 text-xs bg-neutral-surface border border-neutral-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Seat at table...</option>
                        {tables.map((tbl) => {
                          const occ = calculateTableOccupancy(tbl, assignments, guests);
                          return (
                            <option key={tbl.id} value={tbl.id}>
                              {tbl.name} ({occ.currentOccupancy}/{tbl.capacity} seated)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <p className="text-neutral-muted italic text-xs pt-1">
                      Create a table to seat this guest.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TableDialog
        isOpen={isTableDialogOpen}
        onClose={() => {
          setIsTableDialogOpen(false);
          setEditingTable(null);
        }}
        onSave={handleSaveTable}
        table={editingTable}
      />

      <TableDeleteDialog
        isOpen={Boolean(deletingTable)}
        onClose={() => setDeletingTable(null)}
        onConfirm={handleConfirmDeleteTable}
        table={deletingTable}
        seatedCount={
          deletingTable
            ? assignments.filter((a) => a.tableId === deletingTable.id).length
            : 0
        }
      />
    </div>
  );
}
