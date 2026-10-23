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
import { GuestDialog } from './GuestDialog';
import { HouseholdDialog } from './HouseholdDialog';
import { HouseholdDeleteDialog } from './HouseholdDeleteDialog';
import {
  CheckCircle2,
  Clock,
  Filter,
  FolderPlus,
  HelpCircle,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
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
    const now = new Date().toISOString();
    const updatedGuests = guests.filter((g) => g.id !== guestId);
    // Also remove any seating assignments for this guest
    const updatedAssignments = (event.assignments || []).filter((a) => a.guestId !== guestId);

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
    <div className="space-y-8">
      {/* 1. Header & Attendance Metrics */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-secondary font-semibold">
                Guest Register &amp; Attendance
              </span>
              <CouponBadge variant="marigold">RSVP Tracker</CouponBadge>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Guest &amp; RSVP Management
            </h2>
            <p className="text-xs text-neutral-muted mt-1">
              Household groupings, individual guest attendance, partner plus-ones, and dietary restrictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              onClick={() => {
                setEditingHousehold(null);
                setIsHouseholdDialogOpen(true);
              }}
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
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Add Guest</span>
            </Button>
          </div>
        </div>

        {/* 6 Attendance Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-stretch">
          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-neutral-muted mb-1.5 h-8 flex items-start leading-4">
                Named Guests
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
                {summary.totalNamedGuests}
              </p>
            </div>
            <span className="text-xs text-neutral-muted font-mono mt-1.5 block">
              Registered records
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-neutral-muted mb-1.5 h-8 flex items-start leading-4">
                Confirmed Guests
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-status-success">
                {summary.confirmedCount}
              </p>
            </div>
            <span className="text-xs text-neutral-muted font-mono mt-1.5 block">
              Named attendees
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-neutral-muted mb-1.5 h-8 flex items-start leading-4">
                Expected +1s
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-primary">
                {summary.expectedPlusOnes}
              </p>
            </div>
            <span className="text-xs text-neutral-muted font-mono mt-1.5 block">
              Attending partners
            </span>
          </div>

          <div className="bg-primary-subtle/50 border border-primary/30 p-3.5 rounded-md transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-primary mb-1.5 h-8 flex items-start leading-4">
                Expected Attendance
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text">
                {summary.expectedAttendance}
              </p>
            </div>
            <span className="text-xs text-neutral-muted font-mono mt-1.5 block">
              Total seats needed
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-neutral-muted mb-1.5 h-8 flex items-start leading-4">
                Pending RSVPs
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-status-warning">
                {summary.pendingCount}
              </p>
            </div>
            <span className="text-xs text-neutral-muted font-mono mt-1.5 block">
              Awaiting reply
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-semibold text-neutral-muted mb-1.5 h-8 flex items-start leading-4">
                Declined
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-muted">
                {summary.declinedCount}
              </p>
            </div>
            <span className="text-xs text-neutral-muted font-mono mt-1.5 block">
              Not attending
            </span>
          </div>
        </div>

        {/* RSVP Distribution Visualization Bar */}
        {summary.totalNamedGuests > 0 ? (
          <div className="mt-4 pt-4 border-t border-neutral-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
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
          <div className="mt-4 pt-4 border-t border-neutral-border/60 text-xs text-neutral-muted italic">
            No guests registered yet. Click &ldquo;Add Guest&rdquo; or &ldquo;New Group&rdquo; above to begin tracking RSVPs.
          </div>
        )}

        {/* Dietary Catering Requirements Bar */}
        {Object.keys(summary.dietaryBreakdown).length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-border/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-neutral-muted flex items-center gap-1.5 mr-2">
              <Utensils className="w-3.5 h-3.5 text-secondary" />
              <span>Confirmed Catering Needs:</span>
            </span>
            {Object.entries(summary.dietaryBreakdown).map(([diet, count]) => {
              const label = DIETARY_PREFERENCES.find((d) => d.id === diet)?.label || diet;
              return (
                <span
                  key={diet}
                  className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-neutral-surface border border-neutral-border text-neutral-text"
                >
                  {label}: <strong className="text-secondary">{count}</strong>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Search & Filters */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests by name, phone, email, notes, or plus-one..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-neutral-subtle/50 border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="px-3 py-2 text-xs sm:text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-muted pt-2 border-t border-neutral-border/40">
          <span>
            Showing {filteredGuests.length} of {guests.length} guests
          </span>
          {(searchQuery || rsvpFilter !== 'all' || householdFilter !== 'all' || dietaryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRsvpFilter('all');
                setHouseholdFilter('all');
                setDietaryFilter('all');
              }}
              className="text-secondary hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Grouped Guest List */}
      {filteredGuests.length === 0 ? (
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-12 text-center shadow-card">
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
              // If filtering and no guests match, skip
              return null;
            }
            if (memberGuests.length === 0) return null;

            return (
              <div
                key={household.id}
                className="bg-neutral-surface border border-neutral-border rounded-lg shadow-card overflow-hidden"
              >
                {/* Household Header */}
                <div className="bg-neutral-subtle/80 border-b border-neutral-border px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-secondary" />
                    <div>
                      <h3 className="font-display text-base font-semibold text-neutral-text">
                        {household.name}
                      </h3>
                      {household.relationshipType && (
                        <span className="text-xs text-neutral-muted">
                          {household.relationshipType}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-surface border border-neutral-border text-neutral-muted">
                      {memberGuests.length} members
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingHousehold(household);
                        setIsHouseholdDialogOpen(true);
                      }}
                    >
                      Edit Group
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingHousehold(household)}
                      className="text-status-danger hover:bg-status-danger-subtle"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Household Members */}
                <div className="p-4 divide-y divide-neutral-border/50">
                  {memberGuests.map((guest) => renderGuestCard(guest))}
                </div>
              </div>
            );
          })}

          {/* Render Ungrouped Guests if any */}
          {groupedGuests.has('ungrouped') && groupedGuests.get('ungrouped')!.length > 0 && (
            <div className="bg-neutral-surface border border-neutral-border rounded-lg shadow-card overflow-hidden">
              <div className="bg-neutral-subtle/60 border-b border-neutral-border px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-muted" />
                  <h3 className="font-display text-base font-semibold text-neutral-text">
                    Ungrouped Attendees
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-surface border border-neutral-border text-neutral-muted">
                    {groupedGuests.get('ungrouped')!.length} guests
                  </span>
                </div>
              </div>

              <div className="p-4 divide-y divide-neutral-border/50">
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
    </div>
  );

  function renderGuestCard(guest: Guest) {
    const fullName = `${guest.firstName} ${guest.lastName || ''}`.trim();
    const dietLabel =
      guest.dietaryPreference && guest.dietaryPreference !== 'none'
        ? DIETARY_PREFERENCES.find((d) => d.id === guest.dietaryPreference)?.label
        : null;

    return (
      <div
        key={guest.id}
        className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-neutral-text">{fullName}</span>
            {guest.relationship && (
              <span className="text-neutral-muted italic font-sans">
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

          <div className="flex flex-wrap items-center gap-3 text-neutral-muted">
            {guest.phone && (
              <div className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-secondary" />
                <span>{guest.phone}</span>
              </div>
            )}
            {guest.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-secondary" />
                <span>{guest.email}</span>
              </div>
            )}
            {guest.dietaryNotes && (
              <span className="text-status-warning italic">
                Dietary Note: {guest.dietaryNotes}
              </span>
            )}
            {guest.notes && <span className="italic">&ldquo;{guest.notes}&rdquo;</span>}
          </div>
        </div>

        {/* Quick RSVP toggle buttons & Actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="flex items-center border border-neutral-border rounded overflow-hidden">
            <button
              type="button"
              onClick={() => handleQuickToggleRsvp(guest, 'confirmed')}
              className={`px-2 py-1 text-xs font-semibold transition-colors ${
                guest.rsvpStatus === 'confirmed'
                  ? 'bg-status-success text-white'
                  : 'bg-neutral-surface text-neutral-muted hover:bg-neutral-subtle'
              }`}
              title="Mark Attending"
            >
              Attending
            </button>
            <button
              type="button"
              onClick={() => handleQuickToggleRsvp(guest, 'pending')}
              className={`px-2 py-1 text-xs font-semibold transition-colors border-l border-neutral-border ${
                guest.rsvpStatus === 'pending'
                  ? 'bg-status-warning text-white'
                  : 'bg-neutral-surface text-neutral-muted hover:bg-neutral-subtle'
              }`}
              title="Mark Pending"
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handleQuickToggleRsvp(guest, 'declined')}
              className={`px-2 py-1 text-xs font-semibold transition-colors border-l border-neutral-border ${
                guest.rsvpStatus === 'declined'
                  ? 'bg-neutral-muted text-white'
                  : 'bg-neutral-surface text-neutral-muted hover:bg-neutral-subtle'
              }`}
              title="Mark Declined"
            >
              Declined
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingGuest(guest);
              setIsGuestDialogOpen(true);
            }}
          >
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteGuest(guest.id)}
            className="text-status-danger hover:bg-status-danger-subtle"
          >
            Delete
          </Button>
        </div>
      </div>
    );
  }
}
