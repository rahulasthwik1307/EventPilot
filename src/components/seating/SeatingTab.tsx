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
  calculateAllTablesOccupancy,
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
  AlertTriangle,
  Armchair,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

export interface SeatingTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

const AVATAR_PALETTES = [
  { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'border-[#FDE68A]' },
  { bg: 'bg-[#FFEDD5]', text: 'text-[#9A3412]', border: 'border-[#FED7AA]' },
  { bg: 'bg-[#F3E8FF]', text: 'text-[#6B21A8]', border: 'border-[#E9D5FF]' },
  { bg: 'bg-[#E0E7FF]', text: 'text-[#3730A3]', border: 'border-[#C7D2FE]' },
  { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', border: 'border-[#BBF7D0]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#9D174D]', border: 'border-[#FBCFE8]' },
  { bg: 'bg-[#CFFAFE]', text: 'text-[#155E75]', border: 'border-[#A5F3FC]' },
];

function getAvatarPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SeatingTab({ event, onUpdateEvent }: SeatingTabProps) {
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<SeatingTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<SeatingTable | null>(null);

  // Filter state for tables
  const [searchQuery, setSearchQuery] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState<string>('all');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('all');

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

  // Pre-indexed table occupancy map for high-throughput single-pass calculations
  const tableOccupancyMap = useMemo(
    () => calculateAllTablesOccupancy(tables, assignments, guests),
    [tables, assignments, guests]
  );

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
      const occ = tableOccupancyMap.get(t.id);
      return occ?.isOverCapacity;
    });
  }, [tables, tableOccupancyMap]);

  // Filtered tables based on search and dropdown selections
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const occ = tableOccupancyMap.get(t.id);
      if (!occ) return false;

      // Search match: table name, notes, or assigned guest names
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesNotes = t.notes ? t.notes.toLowerCase().includes(q) : false;
        const matchesGuest = occ.assignments.some((asg) => {
          const g = guestMap.get(asg.guestId);
          if (!g) return false;
          const fullName = `${g.firstName} ${g.lastName || ''}`.toLowerCase();
          const plusName = g.plusOneName ? g.plusOneName.toLowerCase() : '';
          return fullName.includes(q) || plusName.includes(q);
        });

        if (!matchesName && !matchesNotes && !matchesGuest) return false;
      }

      // Table type filter
      if (tableTypeFilter !== 'all' && t.tableType !== tableTypeFilter) {
        return false;
      }

      // Occupancy status filter
      if (occupancyFilter === 'has-vacancy') {
        if (occ.isFull || occ.isOverCapacity) return false;
      } else if (occupancyFilter === 'full') {
        if (!occ.isFull || occ.isOverCapacity) return false;
      } else if (occupancyFilter === 'over-capacity') {
        if (!occ.isOverCapacity) return false;
      }

      return true;
    });
  }, [tables, tableOccupancyMap, searchQuery, tableTypeFilter, occupancyFilter, guestMap]);

  return (
    <div className="space-y-8">
      {/* 1. Header & Seating Summary Master Deck */}
      <div className="relative overflow-hidden bg-white border border-[#E7DFD5] rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Top hairline decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#C2410C]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C2410C] font-bold">
                Banquet Allocation &amp; Floor Plan
              </span>
              <CouponBadge variant="marigold">SEATING ENGINE</CouponBadge>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Banquet Seating Planner
            </h2>
            <p className="text-xs text-[#78716C] mt-1 max-w-2xl leading-relaxed">
              Deterministic seat allocations, positive table capacities, dynamic over-capacity alerts, and unassigned attendee queues.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingTable(null);
              setIsTableDialogOpen(true);
            }}
            className="self-start sm:self-center text-xs font-mono font-bold active:scale-[0.98] transition-all bg-primary hover:bg-primary-hover text-neutral-text border-0 shadow-sm px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Table</span>
          </Button>
        </div>

        {/* 5 Summary Metric Stations */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Station 1: Total Tables */}
          <div className="bg-[#FAF8F5] border border-[#E7DFD5] p-3.5 rounded-lg transition-all hover:border-[#D6C7B2]">
            <span className="text-[11px] uppercase font-bold text-[#78716C] block mb-1 tracking-wider">
              Total Tables
            </span>
            <p className="font-mono text-2xl font-bold text-[#1C1917]">
              {summary.totalTables}
            </p>
            <span className="text-[11px] text-[#A8A29E] font-mono mt-0.5 block">
              Banquet layout
            </span>
          </div>

          {/* Station 2: Total Seat Capacity */}
          <div className="bg-[#FAF8F5] border border-[#E7DFD5] p-3.5 rounded-lg transition-all hover:border-[#D6C7B2]">
            <span className="text-[11px] uppercase font-bold text-[#78716C] block mb-1 tracking-wider">
              Total Seat Capacity
            </span>
            <p className="font-mono text-2xl font-bold text-[#1C1917]">
              {summary.totalSeats}
            </p>
            <span className="text-[11px] text-[#A8A29E] font-mono mt-0.5 block">
              Configured seats
            </span>
          </div>

          {/* Station 3: Expected Seated */}
          <div className="bg-[#FAF8F5] border border-[#E7DFD5] p-3.5 rounded-lg transition-all hover:border-[#D6C7B2]">
            <span className="text-[11px] uppercase font-bold text-[#047857] block mb-1 tracking-wider">
              Expected Seated
            </span>
            <p className="font-mono text-2xl font-bold text-[#047857]">
              {summary.expectedAssigned}
            </p>
            <span className="text-[11px] text-[#A8A29E] font-mono mt-0.5 block">
              Confirmed attendees
            </span>
          </div>

          {/* Station 4: Unassigned Attendees */}
          <div className="bg-[#FAF8F5] border border-[#E7DFD5] p-3.5 rounded-lg transition-all hover:border-[#D6C7B2]">
            <span className="text-[11px] uppercase font-bold text-[#C2410C] block mb-1 tracking-wider">
              Unassigned Attendees
            </span>
            <p className="font-mono text-2xl font-bold text-[#C2410C]">
              {summary.unassignedExpected}
            </p>
            <span className="text-[11px] text-[#A8A29E] font-mono mt-0.5 block">
              Awaiting seat allocation
            </span>
          </div>

          {/* Station 5: Seating Completion */}
          <div className="bg-[#FEF3C7]/40 border border-[#FDE68A] p-3.5 rounded-lg col-span-2 lg:col-span-1">
            <span className="text-[11px] uppercase font-bold text-[#92400E] block mb-1 tracking-wider">
              Seating Completion
            </span>
            <p className="font-mono text-2xl font-bold text-[#92400E]">
              {summary.seatingProgressPct}%
            </p>
            <span className="text-[11px] text-[#A8A29E] font-mono mt-0.5 block">
              Of expected attendance
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-[#E7DFD5]">
          <div className="flex items-center justify-between text-xs text-[#78716C] mb-1.5 font-mono">
            <span className="font-semibold text-[#1C1917]">Overall Seating Progress</span>
            <span>
              <strong className="text-[#1C1917]">{summary.expectedAssigned}</strong> / {summary.expectedAssigned + summary.unassignedExpected} expected attendees allocated ({summary.seatingProgressPct}%)
            </span>
          </div>
          <div className="w-full bg-[#E7DFD5]/70 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D97706] to-[#047857] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, summary.seatingProgressPct)}%` }}
            />
          </div>
        </div>

        {/* Over-Capacity Alert Banner if any table exceeds capacity */}
        {overCapacityTables.length > 0 && (
          <div
            role="alert"
            className="mt-5 bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5] p-4 rounded-xl text-xs flex items-start gap-3 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#991B1B] mb-0.5">
                Over-Capacity Warning: {overCapacityTables.length} Table(s) Exceed Configured Seats
              </p>
              <p className="text-[#7F1D1D] leading-relaxed">
                The following tables have more attendees assigned than their physical seat limit:{' '}
                <strong>{overCapacityTables.map((t) => t.name).join(', ')}</strong>. Please unseat or move excess attendees to available tables.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Search & Filters Toolbar */}
      <div className="bg-white border border-[#E7DFD5] rounded-xl p-4 shadow-sm space-y-3">
        {/* Row 1: Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables by name, notes, or assigned attendee..."
              className="w-full pl-9 pr-4 py-2 text-xs font-sans bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97706] focus:bg-white text-[#1C1917] placeholder:text-[#A8A29E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A8A29E] hover:text-[#1C1917] px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-[#78716C] shrink-0 self-center">
            Showing <strong className="text-[#1C1917]">{filteredTables.length}</strong> of {tables.length} tables
          </div>
        </div>

        {/* Row 2: Select Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E7DFD5]/60 text-xs">
          <span className="text-[11px] font-mono uppercase font-bold text-[#A8A29E] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={tableTypeFilter}
            onChange={(e) => setTableTypeFilter(e.target.value)}
            aria-label="Filter by table type"
            className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#1C1917]"
          >
            <option value="all">All Table Styles</option>
            {TABLE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
            aria-label="Filter by occupancy"
            className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#1C1917]"
          >
            <option value="all">All Occupancy States</option>
            <option value="has-vacancy">Has Open Seats</option>
            <option value="full">Table Full</option>
            <option value="over-capacity">Over Capacity</option>
          </select>

          {(searchQuery || tableTypeFilter !== 'all' || occupancyFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTableTypeFilter('all');
                setOccupancyFilter('all');
              }}
              className="text-xs text-[#C2410C] hover:underline font-mono ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Seating Canvas (Tables Grid + Unassigned Queue) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tables Grid (2 cols on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#1C1917] flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#D97706]" />
              <span>Table Roster &amp; Occupancy</span>
            </h3>
            <span className="text-xs text-[#78716C] font-mono">
              {tables.length} tables registered
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="bg-white border border-[#E7DFD5] rounded-xl p-10 text-center shadow-sm">
              <Armchair className="w-12 h-12 text-[#A8A29E] mx-auto mb-3 opacity-60" />
              <h4 className="font-serif text-base font-bold text-[#1C1917] mb-1">
                No Tables Created
              </h4>
              <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-4 leading-relaxed">
                Add banquet tables with designated seat capacities to start allocating your confirmed celebration attendees.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingTable(null);
                  setIsTableDialogOpen(true);
                }}
                className="bg-primary hover:bg-primary-hover text-neutral-text border-0 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add First Table</span>
              </Button>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="bg-white border border-[#E7DFD5] rounded-xl p-8 text-center shadow-sm">
              <p className="text-sm font-semibold text-[#1C1917] mb-1">
                No tables match your filter criteria
              </p>
              <p className="text-xs text-[#78716C] mb-3">
                Try loosening your search query or reset filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTableTypeFilter('all');
                  setOccupancyFilter('all');
                }}
                className="text-xs text-[#C2410C] font-mono underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTables.map((table) => {
                const occ =
                  tableOccupancyMap.get(table.id) ||
                  calculateTableOccupancy(table, assignments, guests);
                const tableTypeLabel =
                  TABLE_TYPES.find((t) => t.id === table.tableType)?.label || 'Banquet';

                return (
                  <div
                    key={table.id}
                    className={`bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      occ.isOverCapacity
                        ? 'border-[#EF4444] ring-1 ring-[#EF4444]/40 bg-[#FEF2F2]/20'
                        : occ.isFull
                        ? 'border-[#10B981]/50'
                        : 'border-[#E7DFD5] hover:border-[#D6C7B2]'
                    }`}
                  >
                    <div>
                      {/* Table Header: Clean, Attractive & Balanced */}
                      <div className="mb-3 space-y-2">
                        {/* Row 1: Table Title on left, Sleek actions on right */}
                        <div className="flex items-start justify-between gap-2.5">
                          <h4 className="font-serif text-lg font-bold text-[#1C1917] tracking-tight leading-snug">
                            {table.name}
                          </h4>

                          <div className="flex items-center gap-1 shrink-0 -mt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTable(table);
                                setIsTableDialogOpen(true);
                              }}
                              className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded-lg transition-colors border border-transparent hover:border-[#E7DFD5]"
                              title="Edit table"
                              aria-label={`Edit ${table.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTable(table)}
                              className="p-1.5 text-[#A8A29E] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors border border-transparent hover:border-[#FCA5A5]"
                              title="Delete table"
                              aria-label={`Delete ${table.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Table Metadata & Status Pills in a Single Neat Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7DFD5] text-[#78716C] font-semibold whitespace-nowrap">
                            {tableTypeLabel}
                          </span>
                          {occ.isOverCapacity ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                              Over by {occ.currentOccupancy - table.capacity}
                            </span>
                          ) : occ.isFull ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                              Table Full
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E7DFD5] text-[#047857] whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                              {occ.availableSeats} seat(s) open
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Capacity Meter Bar */}
                      <div className="my-3 space-y-1.5 bg-[#FAF8F5] border border-[#E7DFD5]/80 p-3 rounded-lg">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#78716C] font-semibold">Seat Occupancy:</span>
                          <span
                            className={`font-bold ${
                              occ.isOverCapacity
                                ? 'text-[#DC2626]'
                                : occ.isFull
                                ? 'text-[#059669]'
                                : 'text-[#1C1917]'
                            }`}
                          >
                            {occ.currentOccupancy} / {table.capacity} seats
                          </span>
                        </div>
                        <div className="w-full bg-[#E7DFD5] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              occ.isOverCapacity
                                ? 'bg-[#DC2626]'
                                : occ.isFull
                                ? 'bg-[#059669]'
                                : 'bg-[#D97706]'
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
                        <div
                          className="flex flex-wrap items-center gap-1 pt-1"
                          title={`${occ.currentOccupancy} of ${table.capacity} seats occupied`}
                        >
                          {Array.from({ length: Math.min(table.capacity, 20) }).map((_, seatIdx) => {
                            const isOccupied = seatIdx < occ.currentOccupancy;
                            const isOver = occ.isOverCapacity && seatIdx >= table.capacity - (occ.currentOccupancy - table.capacity);
                            return (
                              <span
                                key={seatIdx}
                                className={`w-2.5 h-2.5 rounded-full border transition-all ${
                                  isOver
                                    ? 'bg-[#DC2626] border-[#DC2626] ring-2 ring-[#DC2626]/20'
                                    : isOccupied
                                    ? occ.isOverCapacity
                                      ? 'bg-[#DC2626]/70 border-[#DC2626]'
                                      : occ.isFull
                                      ? 'bg-[#059669] border-[#059669]'
                                      : 'bg-[#D97706] border-[#D97706]'
                                    : 'bg-white border-[#D6C7B2]'
                                }`}
                                aria-hidden="true"
                              />
                            );
                          })}
                          {table.capacity > 20 && (
                            <span className="text-[11px] font-mono text-[#A8A29E] ml-1">+{table.capacity - 20}</span>
                          )}
                        </div>
                      </div>

                      {/* Location notes if any */}
                      {table.notes && (
                        <p className="text-xs text-[#78716C] italic mb-3 bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E7DFD5]/70">
                          &ldquo;{table.notes}&rdquo;
                        </p>
                      )}

                      {/* Seated Occupants List */}
                      <div className="mt-4 pt-3 border-t border-[#E7DFD5] space-y-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] uppercase font-bold text-[#78716C] tracking-wider">
                            Seated Occupants ({occ.assignments.length})
                          </span>
                          <span className="text-[11px] font-mono text-[#A8A29E]">
                            {occ.availableSeats > 0 ? `${occ.availableSeats} open` : 'Full'}
                          </span>
                        </div>

                        {occ.assignments.length === 0 ? (
                          <p className="text-xs text-[#A8A29E] italic py-3 text-center bg-[#FAF8F5]/60 rounded-lg border border-dashed border-[#E7DFD5]">
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
                              const avatarPalette = getAvatarPalette(displayName);
                              const initials = getInitials(displayName);

                              return (
                                <div
                                  key={asg.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-xs hover:bg-[#F5F2EB] transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {/* Monogram Avatar */}
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${avatarPalette.bg} ${avatarPalette.text} ${avatarPalette.border}`}
                                    >
                                      {initials}
                                    </div>

                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`w-2 h-2 rounded-full shrink-0 ${
                                            isDeclined
                                              ? 'bg-[#DC2626]'
                                              : isConfirmed
                                              ? 'bg-[#059669]'
                                              : 'bg-[#D97706]'
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
                                          className={`font-semibold leading-tight text-xs ${
                                            isDeclined ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'
                                          }`}
                                        >
                                          {displayName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[#78716C] font-sans text-[11px]">
                                        {householdName && <span>{householdName}</span>}
                                        {!isConfirmed && !isDeclined && (
                                          <span className="text-[#D97706] font-semibold shrink-0">
                                            (Pending RSVP)
                                          </span>
                                        )}
                                        {isDeclined && (
                                          <span className="text-[#DC2626] font-semibold shrink-0">
                                            (Declined)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleUnseatAttendee(asg.id)}
                                    className="text-[#A8A29E] hover:text-[#DC2626] p-1 rounded-md hover:bg-white transition-colors shrink-0 ml-2"
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
                      <div className="mt-4 pt-3 border-t border-[#E7DFD5]">
                        <label
                          htmlFor={`seat-select-${table.id}`}
                          className="block text-[11px] font-bold uppercase text-[#78716C] mb-1"
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
                          className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#1C1917]"
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
        <div className="bg-white border border-[#E7DFD5] rounded-xl p-5 shadow-sm space-y-4 lg:sticky lg:top-6 self-start">
          <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#1C1917] flex items-center gap-1.5">
                <Armchair className="w-4 h-4 text-[#C2410C]" />
                <span>Unassigned Queue</span>
              </h3>
              <p className="text-xs text-[#78716C]">
                Attendees needing table assignments
              </p>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]">
              {unassignedAttendees.length}
            </span>
          </div>

          {unassignedAttendees.length === 0 ? (
            guests.length === 0 ? (
              <div className="text-center py-8 text-[#78716C]">
                <Users className="w-8 h-8 text-[#A8A29E] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-[#1C1917] mb-0.5">
                  No Guests Registered
                </p>
                <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                  Add guests and record their RSVPs in the Guests tab to begin seating arrangements.
                </p>
              </div>
            ) : attendanceSummary.expectedAttendance === 0 ? (
              <div className="text-center py-8 text-[#78716C]">
                <Clock className="w-8 h-8 text-[#D97706] mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-[#1C1917] mb-0.5">
                  Awaiting Confirmed RSVPs
                </p>
                <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                  There are no confirmed attendees to assign. Update guest RSVPs to confirmed to seat them.
                </p>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-8 text-[#78716C]">
                <Armchair className="w-8 h-8 text-[#C2410C] mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-[#1C1917] mb-0.5">
                  Tables Needed
                </p>
                <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                  Create banquet tables to begin assigning seats to your confirmed guests.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-[#78716C]">
                <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-[#1C1917] mb-0.5">
                  All Confirmed Attendees Seated!
                </p>
                <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                  Every confirmed attendee and attending partner currently holds a reserved table seat.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {unassignedAttendees.map((u) => {
                const avatarPalette = getAvatarPalette(u.displayName);
                const initials = getInitials(u.displayName);

                return (
                  <div
                    key={`${u.guestId}:${u.isPlusOne}`}
                    className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E7DFD5] text-xs space-y-2 transition-all hover:border-[#D6C7B2]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${avatarPalette.bg} ${avatarPalette.text} ${avatarPalette.border}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1C1917] text-xs truncate">{u.displayName}</p>
                          {u.householdName && (
                            <p className="text-[11px] text-[#78716C] truncate">{u.householdName}</p>
                          )}
                        </div>
                      </div>

                      {u.rsvpStatus === 'pending' ? (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shrink-0">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shrink-0">
                          Confirmed
                        </span>
                      )}
                    </div>

                    {tables.length > 0 ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#E7DFD5]">
                        <select
                          aria-label={`Seat ${u.displayName} at table`}
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            handleAssignAttendee(e.target.value, u.guestId, u.isPlusOne);
                            e.target.value = '';
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E7DFD5] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#1C1917]"
                        >
                          <option value="">Seat at table...</option>
                          {tables.map((tbl) => {
                            const occ =
                              tableOccupancyMap.get(tbl.id) ||
                              calculateTableOccupancy(tbl, assignments, guests);
                            return (
                              <option key={tbl.id} value={tbl.id}>
                                {tbl.name} ({occ.currentOccupancy}/{tbl.capacity} seated)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : (
                      <p className="text-[#A8A29E] italic text-xs pt-1">
                        Create a table to seat this guest.
                      </p>
                    )}
                  </div>
                );
              })}
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
