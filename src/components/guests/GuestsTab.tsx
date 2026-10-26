'use client';

import React, { useMemo, useState } from 'react';
import {
  Guest,
  GuestHousehold,
  GuestInput,
  RsvpStatus,
} from '../../features/guests/types';
import { Event } from '../../features/events/types';
import {
  calculateAttendanceSummary,
  filterGuests,
  safeDeleteHousehold,
  DIETARY_PREFERENCES,
  RSVP_STATUSES,
} from '../../features/guests/guest-engine';
import { CouponBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UndoToast } from '../ui/UndoToast';
import { SeatingAssignment } from '../../features/seating/types';
import { GuestDialog } from './GuestDialog';
import { HouseholdDialog } from './HouseholdDialog';
import { HouseholdDeleteDialog } from './HouseholdDeleteDialog';
import {
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  FolderPlus,
  HelpCircle,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Utensils,
  XCircle,
} from 'lucide-react';

export interface GuestsTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

export function GuestsTab({ event, onUpdateEvent }: GuestsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [householdFilter, setHouseholdFilter] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all');

  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const [isHouseholdDialogOpen, setIsHouseholdDialogOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<GuestHousehold | null>(null);
  const [deletingHousehold, setDeletingHousehold] = useState<GuestHousehold | null>(null);
  const [pendingUndoGuest, setPendingUndoGuest] = useState<{
    guest: Guest;
    assignments: SeatingAssignment[];
  } | null>(null);

  const guests = useMemo(() => event.guests || [], [event.guests]);
  const households = useMemo(() => event.households || [], [event.households]);

  // Pure deterministic attendance metrics
  const summary = useMemo(
    () => calculateAttendanceSummary(guests),
    [guests]
  );

  const filteredGuests = useMemo(
    () => filterGuests(guests, searchQuery, rsvpFilter, householdFilter, dietaryFilter),
    [guests, searchQuery, rsvpFilter, householdFilter, dietaryFilter]
  );

  // Group filtered guests by household
  const groupedGuests = useMemo(() => {
    const map = new Map<string, Guest[]>();

    for (const g of filteredGuests) {
      const key = g.householdId || 'ungrouped';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(g);
    }

    return map;
  }, [filteredGuests]);

  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  const handleToggleSelectGuest = (id: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedGuestIds.length === filteredGuests.length) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(filteredGuests.map((g) => g.id));
    }
  };

  const handleBulkUpdateRsvp = (newStatus: RsvpStatus) => {
    if (selectedGuestIds.length === 0) return;
    const now = new Date().toISOString();
    const selectedSet = new Set(selectedGuestIds);
    const updatedGuests = guests.map((g) =>
      selectedSet.has(g.id)
        ? {
            ...g,
            rsvpStatus: newStatus,
            updatedAt: now,
          }
        : g
    );

    onUpdateEvent({
      ...event,
      guests: updatedGuests,
      updatedAt: now,
    });

    setSelectedGuestIds([]);
  };

  const handleSaveGuest = (guestData: GuestInput) => {
    const now = new Date().toISOString();

    let updatedGuests: Guest[];
    if (editingGuest) {
      updatedGuests = guests.map((g) =>
        g.id === editingGuest.id
          ? {
              ...editingGuest,
              ...guestData,
              updatedAt: now,
            }
          : g
      );
    } else {
      const newGuest: Guest = {
        id: `gst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...guestData,
        createdAt: now,
        updatedAt: now,
      };
      updatedGuests = [...guests, newGuest];
    }

    onUpdateEvent({
      ...event,
      guests: updatedGuests,
      updatedAt: now,
    });

    setEditingGuest(null);
  };

  const handleDeleteGuest = (guestId: string) => {
    const deletedGuest = guests.find((g) => g.id === guestId);
    if (!deletedGuest) return;

    const now = new Date().toISOString();
    const updatedGuests = guests.filter((g) => g.id !== guestId);
    const removedAssignments = (event.assignments || []).filter((a) => a.guestId === guestId);
    const remainingAssignments = (event.assignments || []).filter((a) => a.guestId !== guestId);

    setPendingUndoGuest({
      guest: deletedGuest,
      assignments: removedAssignments,
    });

    onUpdateEvent({
      ...event,
      guests: updatedGuests,
      assignments: remainingAssignments,
      updatedAt: now,
    });
  };

  const handleUndoDeleteGuest = () => {
    if (!pendingUndoGuest) return;
    const { guest: restoredGuest, assignments: restoredAssignments } = pendingUndoGuest;
    setPendingUndoGuest(null);

    const now = new Date().toISOString();
    const updatedGuests = [...guests, restoredGuest];

    // Restore seating assignments, keeping only those where table still exists
    const validTableIds = new Set((event.tables || []).map((t) => t.id));
    const safeRestoredAssignments = restoredAssignments.filter((a) =>
      validTableIds.has(a.tableId)
    );
    const updatedAssignments = [...(event.assignments || []), ...safeRestoredAssignments];

    onUpdateEvent({
      ...event,
      guests: updatedGuests,
      assignments: updatedAssignments,
      updatedAt: now,
    });
  };

  const handleQuickToggleRsvp = (guest: Guest, newStatus: RsvpStatus) => {
    const now = new Date().toISOString();
    const updatedGuests = guests.map((g) =>
      g.id === guest.id
        ? {
            ...g,
            rsvpStatus: newStatus,
            updatedAt: now,
          }
        : g
    );

    onUpdateEvent({
      ...event,
      guests: updatedGuests,
      updatedAt: now,
    });
  };

  const handleSaveHousehold = (householdData: {
    name: string;
    relationshipType?: string;
    notes?: string;
  }) => {
    let updatedHouseholds: GuestHousehold[];
    if (editingHousehold) {
      updatedHouseholds = households.map((h) =>
        h.id === editingHousehold.id ? { ...editingHousehold, ...householdData } : h
      );
    } else {
      const newHousehold: GuestHousehold = {
        id: `hh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...householdData,
      };
      updatedHouseholds = [...households, newHousehold];
    }

    onUpdateEvent({
      ...event,
      households: updatedHouseholds,
      updatedAt: new Date().toISOString(),
    });

    setEditingHousehold(null);
  };

  const handleConfirmDeleteHousehold = () => {
    if (!deletingHousehold) return;

    const res = safeDeleteHousehold(households, guests, deletingHousehold.id);

    onUpdateEvent({
      ...event,
      households: res.households,
      guests: res.guests,
      updatedAt: new Date().toISOString(),
    });

    setDeletingHousehold(null);
  };

  const getInitials = (firstName: string, lastName?: string) => {
    if (lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return firstName.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const palettes = [
      'bg-primary-subtle text-primary border-primary/30',
      'bg-secondary-subtle text-secondary border-secondary/30',
      'bg-status-success-subtle text-status-success border-status-success/30',
      'bg-status-info-subtle text-status-info border-status-info/30',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palettes[Math.abs(hash) % palettes.length];
  };

  const getRsvpBadge = (status: RsvpStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-status-success-subtle text-status-success border border-status-success/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Attending</span>
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-neutral-subtle text-neutral-muted border border-neutral-border line-through">
            <XCircle className="w-3 h-3" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-status-warning-subtle text-status-warning border border-status-warning/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-7">
      {/* =========================================================================
          1. HEADER & ACTION CONTROLS
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Guest &amp; RSVP Management
            </h2>
            <CouponBadge variant="marigold">RSVP Tracker</CouponBadge>
          </div>
          <p className="text-xs text-neutral-muted">
            Household groupings, individual guest attendance, partner plus-ones, and dietary restrictions.
          </p>
        </div>

        {/* Action Button Cluster - unclipped, perfectly responsive */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              setEditingHousehold(null);
              setIsHouseholdDialogOpen(true);
            }}
            className="text-xs font-mono font-bold hover:border-secondary/50 hover:bg-neutral-subtle active:scale-[0.98] transition-all"
          >
            <FolderPlus className="w-4 h-4 mr-1.5 text-secondary" />
            <span>New Group</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingGuest(null);
              setIsGuestDialogOpen(true);
            }}
            className="text-xs font-mono font-bold active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>Add Guest</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          2. HOSPITALITY & CAPACITY RADAR (Panchang Ceremonial Deck)
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-6 shadow-card relative overflow-hidden space-y-4">
        {/* Panchang Ceremonial Accent Header Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-border/60 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold block">
              Hospitality Radar
            </span>
            <h3 className="font-display text-lg sm:text-xl font-bold text-neutral-text">
              Attendance Spectrum &amp; Capacity Economics
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-muted">
            <span className="bg-neutral-subtle px-2.5 py-1 rounded-md border border-neutral-border">
              Target Capacity: <strong className="text-neutral-text font-bold">{event.guestTarget}</strong>
            </span>
            <span className="bg-neutral-subtle px-2.5 py-1 rounded-md border border-neutral-border">
              Committed: <strong className="text-primary font-bold">{summary.expectedAttendance}</strong>
            </span>
          </div>
        </div>

        {/* 6 Attendance Metric Stations */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Station 1: Named Guests */}
          <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-muted block mb-1">
                Named Guests
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {summary.totalNamedGuests}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Registered records
            </span>
          </div>

          {/* Station 2: Confirmed Guests */}
          <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-muted block mb-1">
                Confirmed Guests
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-status-success tracking-tight">
                {summary.confirmedCount}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Named attendees
            </span>
          </div>

          {/* Station 3: Expected +1s */}
          <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-muted block mb-1">
                Expected +1s
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-tight">
                {summary.expectedPlusOnes}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Attending partners
            </span>
          </div>

          {/* Station 4: Expected Attendance (Highlighted) */}
          <div className="bg-primary-subtle/40 border border-primary/40 ring-1 ring-primary/20 p-3.5 rounded-lg flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-primary block mb-1">
                Expected Attendance
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {summary.expectedAttendance}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block font-medium">
              Total seats needed
            </span>
          </div>

          {/* Station 5: Pending RSVPs */}
          <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-muted block mb-1">
                Pending RSVPs
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-status-warning tracking-tight">
                {summary.pendingCount}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Awaiting reply
            </span>
          </div>

          {/* Station 6: Declined */}
          <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 rounded-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-muted block mb-1">
                Declined
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-muted tracking-tight">
                {summary.declinedCount}
              </p>
            </div>
            <span className="text-[11px] text-neutral-muted font-mono mt-2 block">
              Not attending
            </span>
          </div>
        </div>

        {/* Multi-segment RSVP Progress Spectrum */}
        {summary.totalNamedGuests > 0 ? (
          <div className="pt-3 border-t border-neutral-border/60 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
              <span className="font-semibold text-neutral-text">
                RSVP Response Distribution
              </span>
              <span className="font-mono text-neutral-muted">
                {summary.expectedAttendance} attending ({summary.confirmedCount} confirmed + {summary.expectedPlusOnes} +1s) of {summary.totalNamedGuests} invited
              </span>
            </div>

            {(() => {
              const total = summary.totalNamedGuests;
              const confPct = Math.round((summary.confirmedCount / total) * 100);
              const pendPct = Math.round((summary.pendingCount / total) * 100);
              const declPct = Math.max(0, 100 - confPct - pendPct);

              return (
                <div className="space-y-1.5">
                  <div
                    className="w-full h-2.5 bg-neutral-subtle rounded-full overflow-hidden flex border border-neutral-border/60"
                    role="progressbar"
                    aria-label="RSVP Response Distribution"
                    aria-valuenow={confPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="bg-status-success transition-all duration-300"
                      style={{ width: `${confPct}%` }}
                      title={`Confirmed: ${summary.confirmedCount} (${confPct}%)`}
                    />
                    <div
                      className="bg-status-warning transition-all duration-300"
                      style={{ width: `${pendPct}%` }}
                      title={`Pending: ${summary.pendingCount} (${pendPct}%)`}
                    />
                    <div
                      className="bg-neutral-muted/40 transition-all duration-300"
                      style={{ width: `${declPct}%` }}
                      title={`Declined: ${summary.declinedCount} (${declPct}%)`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-muted">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                      <span>Confirmed: <strong className="text-neutral-text">{summary.confirmedCount}</strong> ({confPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-status-warning inline-block" />
                      <span>Pending: <strong className="text-neutral-text">{summary.pendingCount}</strong> ({pendPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-neutral-muted/40 inline-block" />
                      <span>Declined: <strong className="text-neutral-text">{summary.declinedCount}</strong> ({declPct}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="pt-3 border-t border-neutral-border/60 text-xs text-neutral-muted italic">
            No guests registered yet. Click &ldquo;Add Guest&rdquo; or &ldquo;New Group&rdquo; above to begin tracking RSVPs.
          </div>
        )}

        {/* Dietary Catering Requirements Bar */}
        {Object.keys(summary.dietaryBreakdown).length > 0 && (
          <div className="pt-3 border-t border-neutral-border/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-neutral-muted flex items-center gap-1.5 mr-2">
              <Utensils className="w-3.5 h-3.5 text-secondary" />
              <span>Confirmed Catering Needs:</span>
            </span>
            {Object.entries(summary.dietaryBreakdown).map(([diet, count]) => {
              const label = DIETARY_PREFERENCES.find((d) => d.id === diet)?.label || diet;
              return (
                <span
                  key={diet}
                  className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-md bg-neutral-subtle border border-neutral-border text-neutral-text shadow-xs"
                >
                  {label}: <strong className="text-secondary font-bold">{count}</strong>
                </span>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          3. REFINED SEARCH & FILTER TOOLBAR (Zero Placeholder Clipping)
      ========================================================================= */}
      <div className="bg-neutral-surface border border-neutral-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Top Row: Full Width Search Input + Quick Count / Select All */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests by name, phone, email, notes, or plus-one..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-subtle border border-neutral-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-neutral-text placeholder:text-neutral-muted/70"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-muted shrink-0">
            <span className="font-mono">
              Showing <strong className="text-neutral-text">{filteredGuests.length}</strong> of {guests.length} guests
            </span>
            {filteredGuests.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-secondary hover:text-primary font-semibold font-mono text-xs transition-colors"
              >
                {selectedGuestIds.length === filteredGuests.length
                  ? 'Deselect All'
                  : `Select All (${filteredGuests.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: 3 Responsive Filters with Clear Labels */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-neutral-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-neutral-text uppercase tracking-wider flex items-center gap-1 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-secondary" />
              <span>Filters:</span>
            </span>

            <select
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="bg-neutral-subtle border border-neutral-border rounded-md px-2.5 py-1 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
              aria-label="Filter by RSVP status"
            >
              <option value="all">All RSVP Responses</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="pending">Pending Only</option>
              <option value="declined">Declined Only</option>
            </select>

            <select
              value={householdFilter}
              onChange={(e) => setHouseholdFilter(e.target.value)}
              className="bg-neutral-subtle border border-neutral-border rounded-md px-2.5 py-1 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
              aria-label="Filter by household group"
            >
              <option value="all">All Households</option>
              <option value="ungrouped">Ungrouped Guests Only</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="bg-neutral-subtle border border-neutral-border rounded-md px-2.5 py-1 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
              aria-label="Filter by dietary requirement"
            >
              <option value="all">All Diets</option>
              <option value="has_restriction">Has Dietary Restriction</option>
              {DIETARY_PREFERENCES.filter((d) => d.id !== 'none').map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || rsvpFilter !== 'all' || householdFilter !== 'all' || dietaryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRsvpFilter('all');
                setHouseholdFilter('all');
                setDietaryFilter('all');
              }}
              className="text-secondary hover:text-primary font-semibold text-xs transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          4. BULK ACTION BAR (When Guests Are Selected)
      ========================================================================= */}
      {selectedGuestIds.length > 0 && (
        <div className="bg-primary-subtle/80 border border-primary/50 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in-0 duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-neutral-text">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>
              {selectedGuestIds.length} {selectedGuestIds.length === 1 ? 'guest' : 'guests'} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-text mr-1">Bulk RSVP:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkUpdateRsvp('confirmed')}
              className="bg-neutral-surface text-status-success border-status-success/30 hover:bg-status-success-subtle text-xs py-1 px-2.5 h-auto"
            >
              Mark Confirmed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkUpdateRsvp('pending')}
              className="bg-neutral-surface text-status-warning border-status-warning/30 hover:bg-status-warning-subtle text-xs py-1 px-2.5 h-auto"
            >
              Mark Pending
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkUpdateRsvp('declined')}
              className="bg-neutral-surface text-status-danger border-status-danger/30 hover:bg-status-danger-subtle text-xs py-1 px-2.5 h-auto"
            >
              Mark Declined
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGuestIds([])}
              className="text-xs text-neutral-muted hover:text-neutral-text py-1 px-2 h-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. HOUSEHOLD DIRECTORIES & GUEST DOSSIER CARDS
      ========================================================================= */}
      {filteredGuests.length === 0 ? (
        <div className="bg-neutral-surface border border-neutral-border rounded-xl p-12 text-center shadow-card">
          <Users className="w-12 h-12 text-neutral-muted mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-lg font-semibold text-neutral-text mb-1">
            {guests.length === 0 ? 'No Guests Registered Yet' : 'No Guests Match Your Filter'}
          </h3>
          <p className="text-xs text-neutral-muted max-w-md mx-auto mb-5 leading-relaxed">
            {guests.length === 0
              ? 'Add individual attendees, organize family households, track meal preferences, and maintain expected seating counts.'
              : 'Try clearing your search query or relaxing your RSVP/dietary filters.'}
          </p>
          {guests.length === 0 && (
            <Button
              variant="primary"
              onClick={() => {
                setEditingGuest(null);
                setIsGuestDialogOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Add First Guest</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Render Households that have matching guests */}
          {households.map((household) => {
            const memberGuests = groupedGuests.get(household.id) || [];
            if (memberGuests.length === 0 && householdFilter !== household.id && !searchQuery) {
              return null;
            }
            if (memberGuests.length === 0) return null;

            return (
              <div
                key={household.id}
                className="bg-neutral-surface border border-neutral-border rounded-xl shadow-card overflow-hidden"
              >
                {/* Household Header */}
                <div className="bg-neutral-subtle/70 border-b border-neutral-border px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-secondary-subtle border border-secondary/30 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-neutral-text">
                          {household.name}
                        </h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-surface border border-neutral-border text-neutral-muted">
                          {memberGuests.length} members
                        </span>
                      </div>
                      {household.relationshipType && (
                        <span className="text-xs text-neutral-muted block">
                          {household.relationshipType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHousehold(household);
                        setIsHouseholdDialogOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Group</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingHousehold(household)}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-muted hover:text-status-danger rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Household Members */}
                <div className="p-3 sm:p-4 divide-y divide-neutral-border/60">
                  {memberGuests.map((guest) => renderGuestCard(guest))}
                </div>
              </div>
            );
          })}

          {/* Render Ungrouped Guests if any */}
          {groupedGuests.has('ungrouped') && groupedGuests.get('ungrouped')!.length > 0 && (
            <div className="bg-neutral-surface border border-neutral-border rounded-xl shadow-card overflow-hidden">
              <div className="bg-neutral-subtle/70 border-b border-neutral-border px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-surface border border-neutral-border flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-neutral-muted" />
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-neutral-text">
                    Ungrouped Attendees
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-surface border border-neutral-border text-neutral-muted">
                    {groupedGuests.get('ungrouped')!.length} guests
                  </span>
                </div>
              </div>

              <div className="p-3 sm:p-4 divide-y divide-neutral-border/60">
                {groupedGuests.get('ungrouped')!.map((guest) => renderGuestCard(guest))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <GuestDialog
        isOpen={isGuestDialogOpen}
        onClose={() => {
          setIsGuestDialogOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleSaveGuest}
        guest={editingGuest}
        households={households}
      />

      <HouseholdDialog
        isOpen={isHouseholdDialogOpen}
        onClose={() => {
          setIsHouseholdDialogOpen(false);
          setEditingHousehold(null);
        }}
        onSave={handleSaveHousehold}
        household={editingHousehold}
      />

      <HouseholdDeleteDialog
        isOpen={Boolean(deletingHousehold)}
        onClose={() => setDeletingHousehold(null)}
        onConfirm={handleConfirmDeleteHousehold}
        household={deletingHousehold}
        memberCount={
          deletingHousehold
            ? guests.filter((g) => g.householdId === deletingHousehold.id).length
            : 0
        }
      />

      <UndoToast
        isOpen={Boolean(pendingUndoGuest)}
        message={`Guest "${pendingUndoGuest ? `${pendingUndoGuest.guest.firstName} ${pendingUndoGuest.guest.lastName || ''}`.trim() : ''}" removed.`}
        onUndo={handleUndoDeleteGuest}
        onDismiss={() => setPendingUndoGuest(null)}
        durationMs={5000}
      />
    </div>
  );

  function renderGuestCard(guest: Guest) {
    const fullName = `${guest.firstName} ${guest.lastName || ''}`.trim();
    const isSelected = selectedGuestIds.includes(guest.id);
    const dietLabel =
      guest.dietaryPreference && guest.dietaryPreference !== 'none'
        ? DIETARY_PREFERENCES.find((d) => d.id === guest.dietaryPreference)?.label
        : null;

    const initials = getInitials(guest.firstName, guest.lastName);
    const avatarTone = getAvatarColor(fullName);

    return (
      <div
        key={guest.id}
        className={`py-3.5 px-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-all ${
          isSelected ? 'bg-primary-subtle/30 ring-1 ring-primary/40' : 'hover:bg-neutral-subtle/30'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleSelectGuest(guest.id)}
            aria-label={`Select ${fullName}`}
            className="w-4 h-4 rounded border-neutral-border text-primary focus:ring-primary cursor-pointer mt-1 flex-shrink-0"
          />

          {/* Monogram Avatar */}
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${avatarTone}`}
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-neutral-text leading-tight">{fullName}</span>
              {guest.relationship && (
                <span className="text-neutral-muted italic font-sans text-xs">
                  ({guest.relationship})
                </span>
              )}
              {getRsvpBadge(guest.rsvpStatus)}
              {guest.plusOneExpected && (
                <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/30">
                  <UserPlus className="w-3 h-3" />
                  <span>+1 Expected: {guest.plusOneName || 'Partner'}</span>
                </span>
              )}
              {!guest.plusOneExpected && guest.plusOneAllowed && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-subtle text-neutral-muted border border-neutral-border">
                  +1 Allowed
                </span>
              )}
              {dietLabel && (
                <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-secondary-subtle text-secondary border border-secondary/30">
                  <Utensils className="w-3 h-3" />
                  <span>{dietLabel}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-neutral-muted text-xs">
              {guest.phone && (
                <div className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-secondary shrink-0" />
                  <span>{guest.phone}</span>
                </div>
              )}
              {guest.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-secondary shrink-0" />
                  <span>{guest.email}</span>
                </div>
              )}
            </div>

            {guest.dietaryNotes && (
              <p className="text-status-warning italic text-xs leading-relaxed">
                Dietary Note: {guest.dietaryNotes}
              </p>
            )}

            {guest.notes && (
              <p className="text-neutral-muted italic text-xs leading-relaxed">
                &ldquo;{guest.notes}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Quick RSVP toggle buttons & Actions */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-1 md:pt-0">
          <div className="flex items-center border border-neutral-border rounded-lg overflow-hidden shadow-xs bg-neutral-surface">
            <button
              type="button"
              onClick={() => handleQuickToggleRsvp(guest, 'confirmed')}
              className={`px-2.5 py-1 text-xs font-semibold transition-all ${
                guest.rsvpStatus === 'confirmed'
                  ? 'bg-status-success text-white shadow-xs'
                  : 'text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle'
              }`}
              title="Mark Attending"
            >
              Attending
            </button>
            <button
              type="button"
              onClick={() => handleQuickToggleRsvp(guest, 'pending')}
              className={`px-2.5 py-1 text-xs font-semibold transition-all border-l border-neutral-border ${
                guest.rsvpStatus === 'pending'
                  ? 'bg-status-warning text-white shadow-xs'
                  : 'text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle'
              }`}
              title="Mark Pending"
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handleQuickToggleRsvp(guest, 'declined')}
              className={`px-2.5 py-1 text-xs font-semibold transition-all border-l border-neutral-border ${
                guest.rsvpStatus === 'declined'
                  ? 'bg-neutral-muted text-white shadow-xs'
                  : 'text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle'
              }`}
              title="Mark Declined"
            >
              Declined
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingGuest(guest);
              setIsGuestDialogOpen(true);
            }}
            aria-label={`Edit ${fullName}`}
            className="p-1.5 text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-subtle border border-transparent hover:border-neutral-border transition-colors text-xs font-medium inline-flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => handleDeleteGuest(guest.id)}
            aria-label={`Delete ${fullName}`}
            className="p-1.5 text-neutral-muted hover:text-status-danger rounded-md hover:bg-neutral-subtle border border-transparent hover:border-neutral-border transition-colors text-xs font-medium inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  }
}
