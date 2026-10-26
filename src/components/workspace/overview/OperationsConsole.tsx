'use client';

import React from 'react';
import {
  Users,
  Armchair,
  Briefcase,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Utensils,
} from 'lucide-react';
import { Event } from '../../../features/events/types';
import { GuestAttendanceSummary } from '../../../features/guests/types';
import { SeatingSummary } from '../../../features/seating/types';
import { VendorFinancialSummary } from '../../../features/vendors/types';
import { formatCurrency } from '../../../features/events/validation';
import { WorkspaceTab } from '../WorkspaceNavigation';

export interface OperationsConsoleProps {
  event: Event;
  attendanceSummary: GuestAttendanceSummary;
  seatingSummary: SeatingSummary;
  vendorFinancials: VendorFinancialSummary;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

const DIET_SHORT_NAMES: Record<string, string> = {
  vegetarian: 'Veg',
  vegan: 'Vegan',
  jain: 'Jain',
  halal: 'Halal',
  gluten_free: 'GF',
  other: 'Other',
};

function formatCrispDietaryLabel(key: string): string {
  const normalized = key.toLowerCase().trim();
  if (DIET_SHORT_NAMES[normalized]) {
    return DIET_SHORT_NAMES[normalized];
  }
  return key
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function OperationsConsole({
  event,
  attendanceSummary,
  seatingSummary,
  vendorFinancials,
  onNavigateTab,
}: OperationsConsoleProps) {
  return (
    <section className="bg-neutral-surface border border-neutral-border rounded-xl shadow-card overflow-hidden">
      {/* Console Header Deck */}
      <div className="px-5 py-3 border-b border-neutral-border/70 flex flex-wrap items-center justify-between gap-3 bg-neutral-subtle/30">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold">
            Operations Console
          </span>
          <span className="text-neutral-border-strong">·</span>
          <span className="text-xs font-medium text-neutral-text">
            Synchronized Hospitality, Banquet Floor &amp; Commercial Vendor Ledgers
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
            <span>Real-Time In-Memory Engine</span>
          </span>
        </div>
      </div>

      {/* 3 Synchronized Operational Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-border items-stretch">
        {/* COLUMN 1: GUEST REGISTER & HOSPITALITY */}
        <div className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header with inline icon */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold block mb-0.5">
                  Attendance
                </span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="font-display text-sm sm:text-base font-bold text-neutral-text truncate">
                    Guest &amp; Hospitality
                  </h3>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('guests')}
                  className="text-xs font-semibold text-secondary hover:text-secondary-hover underline inline-flex items-center gap-0.5 shrink-0 pt-2"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Hero Metric */}
            <div className="flex items-baseline justify-between gap-2 pt-0.5">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-mono text-2xl font-bold text-neutral-text tabular-nums">
                  {attendanceSummary.expectedAttendance}
                </span>
                <span className="text-xs text-neutral-muted">expected</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-muted shrink-0">
                Target: <strong className="text-neutral-text">{event.guestTarget}</strong>
              </span>
            </div>

            {/* Clean Multi-Segment Response Track */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-neutral-subtle rounded-full overflow-hidden flex border border-neutral-border/60">
                <div
                  className="bg-status-success transition-all duration-300"
                  style={{
                    width: `${
                      attendanceSummary.totalNamedGuests > 0
                        ? (attendanceSummary.confirmedCount / attendanceSummary.totalNamedGuests) * 100
                        : 0
                    }%`,
                  }}
                  title={`Confirmed: ${attendanceSummary.confirmedCount}`}
                />
                <div
                  className="bg-status-warning transition-all duration-300"
                  style={{
                    width: `${
                      attendanceSummary.totalNamedGuests > 0
                        ? (attendanceSummary.pendingCount / attendanceSummary.totalNamedGuests) * 100
                        : 0
                    }%`,
                  }}
                  title={`Pending: ${attendanceSummary.pendingCount}`}
                />
                <div
                  className="bg-neutral-border transition-all duration-300"
                  style={{
                    width: `${
                      attendanceSummary.totalNamedGuests > 0
                        ? (attendanceSummary.declinedCount / attendanceSummary.totalNamedGuests) * 100
                        : 0
                    }%`,
                  }}
                  title={`Declined: ${attendanceSummary.declinedCount}`}
                />
              </div>
            </div>

            {/* Structured Key-Value Metric Rows */}
            <div className="space-y-2 pt-1 border-t border-neutral-border/50 text-xs">
              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
                  <span>Confirmed RSVPs</span>
                </span>
                <span className="font-mono font-bold text-status-success tabular-nums">
                  {attendanceSummary.confirmedCount}{' '}
                  <span className="font-sans font-normal text-neutral-muted text-[11px]">
                    ({attendanceSummary.expectedPlusOnes} +1s)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-warning shrink-0" />
                  <span>Pending Responses</span>
                </span>
                <span className="font-mono font-bold text-status-warning tabular-nums">
                  {attendanceSummary.pendingCount}{' '}
                  <span className="font-sans font-normal text-neutral-muted text-[11px]">
                    awaiting
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-border-strong shrink-0" />
                  <span>Declined Invitations</span>
                </span>
                <span className="font-mono font-medium text-neutral-text tabular-nums">
                  {attendanceSummary.declinedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Subline / Dietary Status */}
          <div className="pt-2 border-t border-neutral-border/40 text-[11px] text-neutral-muted flex items-start gap-1.5 min-h-[28px]">
            {Object.keys(attendanceSummary.dietaryBreakdown).length > 0 ? (
              <>
                <Utensils className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
                <span className="leading-snug break-words">
                  Diets:{' '}
                  {Object.entries(attendanceSummary.dietaryBreakdown)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([diet, count]) => `${formatCrispDietaryLabel(diet)} (${count})`)
                    .join(', ')}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-status-success shrink-0 mt-0.5" />
                <span className="leading-snug">RSVP responses reconciled dynamically</span>
              </>
            )}
          </div>
        </div>

        {/* COLUMN 2: BANQUET SEATING ARRANGEMENT */}
        <div className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header with inline icon */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold block mb-0.5">
                  Floor Arrangement
                </span>
                <div className="flex items-center gap-1.5">
                  <Armchair className="w-4 h-4 text-secondary shrink-0" />
                  <h3 className="font-display text-sm sm:text-base font-bold text-neutral-text truncate">
                    Banquet Seating
                  </h3>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('seating')}
                  className="text-xs font-semibold text-secondary hover:text-secondary-hover underline inline-flex items-center gap-0.5 shrink-0 pt-2"
                >
                  <span>Floor Plan</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Hero Metric */}
            <div className="flex items-baseline justify-between gap-2 pt-0.5">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-mono text-2xl font-bold text-neutral-text tabular-nums">
                  {seatingSummary.seatingProgressPct}%
                </span>
                <span className="text-xs text-neutral-muted">seated</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-muted shrink-0">
                Capacity: <strong className="text-neutral-text">{seatingSummary.totalSeats}</strong>
              </span>
            </div>

            {/* Clean Progress Track */}
            <div className="space-y-1">
              <div className="w-full bg-neutral-subtle rounded-full h-2 overflow-hidden border border-neutral-border/60">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, seatingSummary.seatingProgressPct)}%` }}
                />
              </div>
            </div>

            {/* Structured Key-Value Metric Rows */}
            <div className="space-y-2 pt-1 border-t border-neutral-border/50 text-xs">
              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Tables Configured</span>
                </span>
                <span className="font-mono font-bold text-neutral-text tabular-nums">
                  {seatingSummary.totalTables}{' '}
                  <span className="font-sans font-normal text-neutral-muted text-[11px]">
                    ({seatingSummary.totalSeats} seats)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
                  <span>Allocated to Tables</span>
                </span>
                <span className="font-mono font-bold text-status-success tabular-nums">
                  {seatingSummary.expectedAssigned}{' '}
                  <span className="font-sans font-normal text-neutral-muted text-[11px]">
                    guests
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      seatingSummary.unassignedExpected > 0 ? 'bg-secondary' : 'bg-neutral-border-strong'
                    }`}
                  />
                  <span>Awaiting Placement</span>
                </span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    seatingSummary.unassignedExpected > 0 ? 'text-secondary' : 'text-neutral-text'
                  }`}
                >
                  {seatingSummary.unassignedExpected}{' '}
                  <span className="font-sans font-normal text-neutral-muted text-[11px]">
                    unassigned
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Subline / Capacity Status */}
          <div className="pt-2 border-t border-neutral-border/40 text-[11px] text-status-success flex items-start gap-1.5 min-h-[28px]">
            <Check className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="leading-snug">All tables within designated capacity</span>
          </div>
        </div>

        {/* COLUMN 3: COMMERCIAL COMMITMENTS (VENDORS) */}
        <div className="p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Header with inline icon */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold block mb-0.5">
                  Commercial Contracts
                </span>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="font-display text-sm sm:text-base font-bold text-neutral-text truncate">
                    Vendor Commitments
                  </h3>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('vendors')}
                  className="text-xs font-semibold text-secondary hover:text-secondary-hover underline inline-flex items-center gap-0.5 shrink-0 pt-2"
                >
                  <span>Vendors</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Hero Metric */}
            <div className="flex items-baseline justify-between gap-2 pt-0.5">
              <div>
                <span className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tabular-nums tracking-tight">
                  {formatCurrency(vendorFinancials.totalAgreed, event.currency)}
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-muted shrink-0">
                Booked: <strong className="text-neutral-text">{vendorFinancials.bookedCount}</strong>/{vendorFinancials.vendorCount}
              </span>
            </div>

            {/* Clean Progress Track */}
            <div className="space-y-1">
              {(() => {
                const agreed = vendorFinancials.totalAgreed;
                const paid = vendorFinancials.totalPaid;
                const pct = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 0;
                return (
                  <div className="w-full bg-neutral-subtle rounded-full h-2 overflow-hidden border border-neutral-border/60">
                    <div
                      className="h-full bg-status-success transition-all duration-500 rounded-full"
                      style={{ width: `${pct}%` }}
                      title={`${pct}% settled`}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Structured Key-Value Metric Rows */}
            <div className="space-y-2 pt-1 border-t border-neutral-border/50 text-xs">
              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
                  <span>Advances Paid</span>
                </span>
                <span className="font-mono font-bold text-status-success tabular-nums">
                  {formatCurrency(vendorFinancials.totalPaid, event.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                  <span>Outstanding Balance</span>
                </span>
                <span className="font-mono font-bold text-secondary tabular-nums">
                  {formatCurrency(vendorFinancials.totalRemaining, event.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Tracked Suppliers</span>
                </span>
                <span className="font-mono font-medium text-neutral-text tabular-nums">
                  {vendorFinancials.vendorCount}{' '}
                  <span className="font-sans font-normal text-neutral-muted text-[11px]">
                    vendors active
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Subline / Isolation Note */}
          <div className="pt-2 border-t border-neutral-border/40 text-[11px] text-neutral-muted flex items-start gap-1.5 min-h-[28px]">
            <Clock className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
            <span className="leading-snug">Contractual payments isolated from actuals</span>
          </div>
        </div>
      </div>
    </section>
  );
}
