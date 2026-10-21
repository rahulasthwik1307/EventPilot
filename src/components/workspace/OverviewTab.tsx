'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  Users,
  Wallet,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Briefcase,
  AlertTriangle,
  Layers,
  Armchair,
  Utensils,
  UserCheck,
} from 'lucide-react';
import { Event } from '../../features/events/types';
import {
  calculateDaysRemaining,
  formatCurrency,
  formatDateDisplay,
} from '../../features/events/validation';
import {
  calculateBudgetSummary,
  calculateCategorySummaries,
} from '../../features/events/budget-engine';
import { isTaskOverdue } from '../../features/events/timeline-engine';
import { calculateVendorFinancials } from '../../features/vendors/vendor-engine';
import { calculateAttendanceSummary } from '../../features/guests/guest-engine';
import { calculateSeatingSummary } from '../../features/seating/seating-engine';
import { CouponBadge } from '../ui/Badge';
import { WorkspaceTab } from './WorkspaceNavigation';

export interface OverviewTabProps {
  event: Event;
  onEdit: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  lastSavedAt?: string;
}

export function OverviewTab({
  event,
  onEdit,
  onNavigateTab,
  lastSavedAt,
}: OverviewTabProps) {
  const daysLeft = calculateDaysRemaining(event.date);
  const countdownLabel =
    daysLeft === 0
      ? 'Today'
      : daysLeft > 0
      ? `${daysLeft} days away`
      : `${Math.abs(daysLeft)} days ago`;

  const categories = useMemo(() => event.categories || [], [event.categories]);
  const expenses = useMemo(() => event.expenses || [], [event.expenses]);
  const milestones = useMemo(() => event.milestones || [], [event.milestones]);
  const tasks = useMemo(() => event.tasks || [], [event.tasks]);
  const vendors = useMemo(() => event.vendors || [], [event.vendors]);
  const guests = useMemo(() => event.guests || [], [event.guests]);
  const tables = useMemo(() => event.tables || [], [event.tables]);
  const assignments = useMemo(() => event.assignments || [], [event.assignments]);

  // Deterministic financial math
  const summary = useMemo(() => {
    return calculateBudgetSummary(
      event.budgetCap,
      categories,
      expenses,
      event.guestTarget,
      event.currency
    );
  }, [event.budgetCap, categories, expenses, event.guestTarget, event.currency]);

  const categorySummaries = useMemo(() => {
    return calculateCategorySummaries(categories, expenses);
  }, [categories, expenses]);

  // Deterministic task metrics
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const taskMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const overdue = tasks.filter((t) => isTaskOverdue(t, todayStr)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, overdue, pct };
  }, [tasks, todayStr]);

  // Deterministic M3 metrics
  const vendorFinancials = useMemo(
    () => calculateVendorFinancials(vendors),
    [vendors]
  );

  const attendanceSummary = useMemo(
    () => calculateAttendanceSummary(guests),
    [guests]
  );

  const seatingSummary = useMemo(
    () => calculateSeatingSummary(tables, assignments, guests),
    [tables, assignments, guests]
  );

  return (
    <div className="space-y-8">
      {/* 1. Identity & Quick Snapshot Banner */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <CouponBadge variant={event.isSample ? 'terracotta' : 'marigold'}>
                {event.isSample ? 'SAMPLE CELEBRATION' : 'ACTIVE PERSONAL PLAN'}
              </CouponBadge>
              <span className="text-xs font-mono uppercase text-neutral-muted">
                {event.type} Archetype
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              {event.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-muted font-sans">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-secondary" />
                <span className="font-medium text-neutral-text">
                  {formatDateDisplay(event.date)}
                </span>
                <span className="font-mono text-neutral-muted">
                  ({countdownLabel})
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-mono">
                <Users className="w-4 h-4 text-secondary" />
                <span>{event.guestTarget} Expected Attendees</span>
              </div>
            </div>

            {event.culturalContext?.traditionOrTheme && (
              <div className="text-xs text-neutral-text/80 bg-neutral-subtle/80 border border-neutral-border p-3 rounded-md mt-2">
                <span className="font-semibold text-neutral-text">Tradition / Theme: </span>
                {event.culturalContext.traditionOrTheme}
                {event.culturalContext.notes && (
                  <p className="mt-1 text-neutral-muted">{event.culturalContext.notes}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end justify-between gap-4 self-stretch border-t md:border-t-0 md:border-l border-neutral-border/60 pt-4 md:pt-0 md:pl-6">
            <div className="text-left md:text-right">
              <span className="text-xs uppercase font-semibold text-neutral-muted tracking-wider">
                Total Budget Cap
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-neutral-text">
                {formatCurrency(event.budgetCap, event.currency)}
              </p>
              <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
                {formatCurrency(summary.costPerGuest, event.currency)} per guest target
              </span>
            </div>

            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 self-start md:self-end"
            >
              <span>Edit Celebration Baseline</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Sync & Trust Footer Note */}
        <div className="border-t border-neutral-border/60 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-muted gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            <span className="font-mono">
              Persisted in browser localStorage (v1)
              {lastSavedAt ? ` · Last synced at ${lastSavedAt}` : ''}
            </span>
          </div>

          <div className="text-neutral-muted/80 text-xs font-mono">
            Deterministic Engine Active
          </div>
        </div>
      </div>

      {/* 2. Milestone 3 Operations Snapshot (Vendors, Attendance, Seating) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-neutral-text">
              Celebration Operations Snapshot
            </h3>
            <p className="text-xs text-neutral-muted">
              Live operational metrics for vendor contracts, guest attendance, and banquet seating.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vendor Commitments Card */}
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                  Vendor Contracts
                </span>
                <Briefcase className="w-4 h-4 text-secondary" />
              </div>

              <p className="font-mono text-xl font-bold text-neutral-text">
                {formatCurrency(vendorFinancials.totalAgreed, event.currency)}
              </p>
              <p className="text-xs text-neutral-muted mt-1 font-mono">
                Agreed contract commitments
              </p>

              <div className="mt-3 pt-3 border-t border-neutral-border/50 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-neutral-muted">
                  <span>Paid to date:</span>
                  <span className="text-status-success font-semibold">
                    {formatCurrency(vendorFinancials.totalPaid, event.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-muted">
                  <span>Remaining balance:</span>
                  <span className="text-secondary font-semibold">
                    {formatCurrency(vendorFinancials.totalRemaining, event.currency)}
                  </span>
                </div>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('vendors')}
                className="mt-4 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
              >
                <span>Open Vendor Book</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Guest Attendance Card */}
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                  Guest Register &amp; RSVPs
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>

              <p className="font-mono text-xl font-bold text-neutral-text">
                {attendanceSummary.expectedAttendance}
              </p>
              <p className="text-xs text-neutral-muted mt-1 font-mono">
                Expected attendees ({attendanceSummary.confirmedCount} + {attendanceSummary.expectedPlusOnes} +1s)
              </p>

              <div className="mt-3 pt-3 border-t border-neutral-border/50 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-neutral-muted">
                  <span>Pending replies:</span>
                  <span className="text-status-warning font-semibold">
                    {attendanceSummary.pendingCount}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-muted">
                  <span>Declined:</span>
                  <span className="text-neutral-muted">{attendanceSummary.declinedCount}</span>
                </div>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('guests')}
                className="mt-4 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
              >
                <span>Manage Guests &amp; Groups</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Seating Allocation Card */}
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                  Banquet Seating
                </span>
                <Armchair className="w-4 h-4 text-secondary" />
              </div>

              <p className="font-mono text-xl font-bold text-neutral-text">
                {seatingSummary.seatingProgressPct}%
              </p>
              <p className="text-xs text-neutral-muted mt-1 font-mono">
                {seatingSummary.expectedAssigned} / {attendanceSummary.expectedAttendance} expected seated
              </p>

              <div className="mt-3 pt-3 border-t border-neutral-border/50 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-neutral-muted">
                  <span>Tables configured:</span>
                  <span className="text-neutral-text font-semibold">
                    {seatingSummary.totalTables} ({seatingSummary.totalSeats} seats)
                  </span>
                </div>
                <div className="flex justify-between text-neutral-muted">
                  <span>Unassigned queue:</span>
                  <span className="text-secondary font-semibold">
                    {seatingSummary.unassignedExpected} attendee(s)
                  </span>
                </div>
              </div>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('seating')}
                className="mt-4 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
              >
                <span>Open Seating Planner</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Deterministic Financial Snapshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-neutral-text">
              Financial &amp; Allocation Snapshot
            </h3>
            <p className="text-xs text-neutral-muted">
              All financial arithmetic, variance, and guest metrics are computed deterministically.
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('budget')}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
            >
              <span>Manage Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
              Budget Cap
            </p>
            <p className="font-mono text-xl font-bold text-neutral-text">
              {formatCurrency(summary.budgetCap, event.currency)}
            </p>
            <p className="text-xs text-neutral-muted mt-1 font-mono">
              Authoritative ceiling
            </p>
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
              Allocated Planned
            </p>
            <p className="font-mono text-xl font-bold text-neutral-text">
              {formatCurrency(summary.totalAllocated, event.currency)}
            </p>
            <p className="text-xs text-neutral-muted mt-1 font-mono">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} defined
            </p>
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
              Recorded Actuals
            </p>
            <p className="font-mono text-xl font-bold text-neutral-text">
              {formatCurrency(summary.totalActual, event.currency)}
            </p>
            <p className="text-xs text-neutral-muted mt-1 font-mono">
              {expenses.length} expense items recorded
            </p>
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
              Unallocated Reserve
            </p>
            <p
              className={`font-mono text-xl font-bold ${
                summary.unallocatedBudget < 0 ? 'text-status-danger' : 'text-neutral-text'
              }`}
            >
              {formatCurrency(summary.unallocatedBudget, event.currency)}
            </p>
            <p className="text-xs text-neutral-muted mt-1 font-mono">
              {summary.unallocatedBudget >= 0 ? 'Safety buffer' : 'Over allocated'}
            </p>
          </div>
        </div>

        {summary.isOverAllocated && (
          <div
            role="alert"
            className="mt-4 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-4 rounded-md text-xs flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Budget Cap Alert:</strong> Total category allocations exceed your planned budget cap by{' '}
              {formatCurrency(Math.abs(summary.unallocatedBudget), event.currency)}. Re-balance category budgets to avoid overallocation.
            </span>
          </div>
        )}
      </div>

      {/* 4. Timeline Countdown & Next Task */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-secondary font-semibold">
                Ceremonial Sequence Matrix
              </span>
              <CouponBadge variant="marigold">Timeline Active</CouponBadge>
            </div>
            <h3 className="font-display text-xl font-semibold text-neutral-text">
              Timeline Milestones &amp; Critical Next Steps
            </h3>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 self-start sm:self-center"
            >
              <span>Open Timeline Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Milestone Anchors
            </span>
            <p className="font-mono text-xl font-bold text-neutral-text">
              {milestones.length}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Relative day offsets
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Checklist Tasks
            </span>
            <p className="font-mono text-xl font-bold text-neutral-text">
              {taskMetrics.total}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              {taskMetrics.completed} completed ({taskMetrics.pct}%)
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Overdue Tasks
            </span>
            <p
              className={`font-mono text-xl font-bold ${
                taskMetrics.overdue > 0 ? 'text-status-danger' : 'text-status-success'
              }`}
            >
              {taskMetrics.overdue}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              {taskMetrics.overdue > 0 ? 'Needs urgent attention' : 'All tasks on track'}
            </span>
          </div>

          <div className="bg-neutral-subtle/70 border border-neutral-border p-3.5 rounded-md">
            <span className="text-xs uppercase font-semibold text-neutral-muted block mb-1">
              Countdown
            </span>
            <p className="font-mono text-xl font-bold text-secondary">
              {daysLeft > 0 ? `${daysLeft}d` : 'Today'}
            </p>
            <span className="text-xs text-neutral-muted font-mono mt-0.5 block">
              Until celebration
            </span>
          </div>
        </div>
      </div>

      {/* Gemini AI Assistant Spotlight Banner */}
      <div className="bg-gradient-to-r from-primary-subtle/50 via-neutral-surface to-secondary-subtle/30 border border-primary/40 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-primary text-neutral-text shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-neutral-text" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-lg font-semibold text-neutral-text">
                Gemini Celebration Advisor
              </h3>
              <CouponBadge variant="marigold">LIVE · M4</CouponBadge>
            </div>
            <p className="text-xs text-neutral-muted max-w-2xl leading-relaxed">
              Ask Gemini for cultural tradition advice, budget reallocation suggestions, or missing milestone tasks. All AI suggestions are staged for your review with before/after diffs before any changes touch your event.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('ai')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-neutral-text font-semibold text-xs sm:text-sm hover:bg-primary-hover shadow-sm transition-all self-start md:self-center shrink-0"
          >
            <span>Consult Gemini Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 5. Modules Architecture Roadmap */}
      <div>
        <div className="mb-4">
          <h3 className="font-display text-xl font-semibold text-neutral-text">
            Planning Modules Architecture
          </h3>
          <p className="text-xs text-neutral-muted">
            Event Pilot is structured across focused planning modules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                  <Wallet className="w-4 h-4" />
                </div>
                <CouponBadge variant="marigold">LIVE · M2</CouponBadge>
              </div>
              <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
                Budget &amp; Ledger
              </h4>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Expense lines, deposit payment milestones, and category variance.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('budget')}
                className="mt-3 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 self-start"
              >
                <span>Open Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                  <Clock className="w-4 h-4" />
                </div>
                <CouponBadge variant="marigold">LIVE · M2</CouponBadge>
              </div>
              <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
                Timeline Matrix
              </h4>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Relative day offsets, checklist tasks, and date-reanchoring.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('timeline')}
                className="mt-3 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 self-start"
              >
                <span>Open Timeline</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                  <Briefcase className="w-4 h-4" />
                </div>
                <CouponBadge variant="marigold">LIVE · M3</CouponBadge>
              </div>
              <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
                Vendors &amp; Contacts
              </h4>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Quotes, agreed rates, deposits, balances, and contact personnel.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('vendors')}
                className="mt-3 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 self-start"
              >
                <span>Open Vendors</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                  <Users className="w-4 h-4" />
                </div>
                <CouponBadge variant="marigold">LIVE · M3</CouponBadge>
              </div>
              <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
                Guests &amp; Seating
              </h4>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Households, RSVP statuses, partner plus-ones, and table planner.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('guests')}
                className="mt-3 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 self-start"
              >
                <span>Open Guests</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-neutral-surface border border-primary/40 rounded-lg p-5 shadow-card flex flex-col justify-between ring-1 ring-primary/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-primary-subtle flex items-center justify-center text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <CouponBadge variant="marigold">LIVE · M4</CouponBadge>
              </div>
              <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
                AI Planning Assistant
              </h4>
              <p className="text-xs text-neutral-muted leading-relaxed">
                Gemini 3.8 Flash recommendations with review-first staged diffs.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('ai')}
                className="mt-3 text-xs font-semibold text-primary-hover hover:underline flex items-center gap-1 self-start"
              >
                <span>Open Assistant</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
