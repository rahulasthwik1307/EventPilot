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
  Armchair,
  Sliders,
  Check,
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronRight,
  ShieldCheck,
  Utensils,
  ExternalLink,
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
import { isTaskOverdue, calculateMilestoneDate } from '../../features/events/timeline-engine';
import { calculateVendorFinancials } from '../../features/vendors/vendor-engine';
import { calculateAttendanceSummary } from '../../features/guests/guest-engine';
import { calculateSeatingSummary } from '../../features/seating/seating-engine';
import { CouponBadge } from '../ui/Badge';
import { WorkspaceTab } from './WorkspaceNavigation';

export interface OverviewTabProps {
  event: Event;
  onEdit: () => void;
  onReplan?: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  lastSavedAt?: string;
}

// Helpers to keep horizon checkpoints and checklist task titles short, crisp, and unclipped
function getCrispMilestoneTitle(title: string): string {
  if (title === '2 Weeks Prior — Coordination & Rehearsals') {
    return '2 Weeks Prior — Final Rehearsals';
  }
  return title;
}

function getCrispTaskTitle(title: string): string {
  if (
    title === 'Catering menu tasting & tiffin spread selection' ||
    title === 'Catering menu tasting & tiffins' ||
    title === 'Catering tasting & tiffins'
  ) {
    return 'Catering tasting & tiffins';
  }
  if (
    title === 'Reconfirm Nadaswaram, live instrumentalists and DJ' ||
    title === 'Reconfirm Nadaswaram & live artists' ||
    title === 'Reconfirm Nadaswaram & music'
  ) {
    return 'Reconfirm Nadaswaram & music';
  }
  if (
    title === 'Finalize photography & cinematography team' ||
    title === 'Finalize photography & cinema team' ||
    title === 'Finalize photo & cinema team' ||
    title === 'Finalize photo & cinema'
  ) {
    return 'Finalize photo & cinema';
  }
  if (
    title === 'Design and print physical Lagna Patrika invitations' ||
    title === 'Design & print Lagna Patrika invites' ||
    title === 'Design & print Lagna Patrika'
  ) {
    return 'Design & print Lagna Patrika';
  }
  if (
    title === 'Curate wedding silk sarees and dhoti sets' ||
    title === 'Curate wedding silk sarees & dhotis' ||
    title === 'Curate silk sarees & dhotis'
  ) {
    return 'Curate silk sarees & dhotis';
  }
  return title;
}

function formatCrispTaskDate(dateStr: string): string {
  const full = formatDateDisplay(dateStr);
  return full
    .replace('January', 'Jan')
    .replace('February', 'Feb')
    .replace('March', 'Mar')
    .replace('April', 'Apr')
    .replace('June', 'Jun')
    .replace('July', 'Jul')
    .replace('August', 'Aug')
    .replace('September', 'Sep')
    .replace('October', 'Oct')
    .replace('November', 'Nov')
    .replace('December', 'Dec');
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

export function OverviewTab({
  event,
  onEdit,
  onReplan,
  onNavigateTab,
  lastSavedAt,
}: OverviewTabProps) {
  const daysLeft = calculateDaysRemaining(event.date);

  const categories = useMemo(() => event.categories || [], [event.categories]);
  const expenses = useMemo(() => event.expenses || [], [event.expenses]);
  const milestones = useMemo(() => event.milestones || [], [event.milestones]);
  const tasks = useMemo(() => event.tasks || [], [event.tasks]);
  const vendors = useMemo(() => event.vendors || [], [event.vendors]);
  const guests = useMemo(() => event.guests || [], [event.guests]);
  const tables = useMemo(() => event.tables || [], [event.tables]);
  const assignments = useMemo(() => event.assignments || [], [event.assignments]);

  // Pure deterministic calculations
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

  // Deterministic vendor, attendance, and seating metrics
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

  // Sorted Milestones with Effective Dates
  const milestonesWithDates = useMemo(() => {
    if (!milestones || milestones.length === 0) return [];
    return [...milestones]
      .sort((a, b) => a.offsetDays - b.offsetDays)
      .map((m) => ({
        ...m,
        effectiveDate: calculateMilestoneDate(event.date, m.offsetDays),
      }));
  }, [milestones, event.date]);

  // Upcoming Milestones sequence (first 3 upcoming)
  const upcomingMilestones = useMemo(() => {
    const future = milestonesWithDates.filter((m) => m.effectiveDate >= todayStr);
    return (future.length > 0 ? future : milestonesWithDates).slice(0, 3);
  }, [milestonesWithDates, todayStr]);

  // Immediate upcoming/pending tasks for the checklist priority deck
  const upcomingTasks = useMemo(() => {
    const pending = tasks.filter((t) => t.status !== 'completed');
    return pending
      .sort((a, b) => {
        const aOverdue = isTaskOverdue(a, todayStr);
        const bOverdue = isTaskOverdue(b, todayStr);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 3);
  }, [tasks, todayStr]);

  // Deterministic Celebration Readiness Composite Score (0-100%)
  const readiness = useMemo(() => {
    const budgetScore =
      event.budgetCap > 0
        ? Math.min(Math.round((summary.totalAllocated / event.budgetCap) * 100), 100)
        : 0;
    const taskScore = taskMetrics.pct;
    const rsvpScore =
      event.guestTarget > 0
        ? Math.min(Math.round((attendanceSummary.expectedAttendance / event.guestTarget) * 100), 100)
        : 0;
    const composite = Math.round(budgetScore * 0.4 + taskScore * 0.3 + rsvpScore * 0.3);
    return {
      score: Math.max(10, Math.min(composite, 100)),
      budgetScore,
      taskScore,
      rsvpScore,
    };
  }, [
    summary.totalAllocated,
    event.budgetCap,
    taskMetrics.pct,
    attendanceSummary.expectedAttendance,
    event.guestTarget,
  ]);

  // Action Radar Items (Urgent bottlenecks needing immediate human attention)
  const actionRadarItems = useMemo(() => {
    const items: {
      id: string;
      title: string;
      detail: string;
      severity: 'urgent' | 'warning' | 'info';
      tab: WorkspaceTab;
      actionLabel: string;
    }[] = [];

    if (taskMetrics.overdue > 0) {
      items.push({
        id: 'overdue-tasks',
        title: `${taskMetrics.overdue} Overdue Ritual Task${taskMetrics.overdue > 1 ? 's' : ''}`,
        detail: 'Scheduled milestone checklists need review to keep your timeline on track.',
        severity: 'urgent',
        tab: 'timeline',
        actionLabel: 'Resolve Tasks',
      });
    }

    if (summary.isOverAllocated) {
      items.push({
        id: 'budget-deficit',
        title: `Budget Cap Over-Allocated by ${formatCurrency(Math.abs(summary.unallocatedBudget), event.currency)}`,
        detail: 'Category plans exceed total budget ceiling. Re-balance allocations or expand cap.',
        severity: 'urgent',
        tab: 'budget',
        actionLabel: 'Re-balance Budget',
      });
    }

    if (seatingSummary.unassignedExpected > 0 && tables.length > 0) {
      items.push({
        id: 'unseated-guests',
        title: `${seatingSummary.unassignedExpected} Confirmed Guest${seatingSummary.unassignedExpected > 1 ? 's' : ''} Awaiting Seats`,
        detail: 'Tables are configured but seats are not yet assigned to all attending households.',
        severity: 'warning',
        tab: 'seating',
        actionLabel: 'Assign Seats',
      });
    }

    if (vendorFinancials.overpaidCount > 0) {
      items.push({
        id: 'vendor-overpaid',
        title: `${vendorFinancials.overpaidCount} Vendor Payment${vendorFinancials.overpaidCount > 1 ? 's' : ''} Exceed Agreement`,
        detail: 'Advances recorded exceed established contract commitments.',
        severity: 'warning',
        tab: 'vendors',
        actionLabel: 'Audit Contracts',
      });
    }

    return items;
  }, [
    taskMetrics.overdue,
    summary.isOverAllocated,
    summary.unallocatedBudget,
    event.currency,
    seatingSummary.unassignedExpected,
    tables.length,
    vendorFinancials.overpaidCount,
  ]);

  // SVG Gauge calculations for the Master Readiness Dial
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readiness.score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. EXECUTIVE MASTER PLAN & READINESS DECK
          (No duplicate title, date, or location which are already in top header)
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-7 shadow-card relative overflow-hidden">
        {/* Panchang Ceremonial Accent Header Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Health Narrative & Operational Highlights */}
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-secondary font-bold">
                Almanac Executive Deck
              </span>
              <CouponBadge variant="marigold">Live Execution Health</CouponBadge>
            </div>

            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-text tracking-tight">
                Celebration Master Health &amp; Readiness
              </h2>
              <p className="text-xs sm:text-sm text-neutral-muted mt-1 leading-relaxed">
                Deterministic mathematical tracking across budget capital, ritual milestones, guest attendance, and banquet seating.
              </p>
            </div>

            {/* Cultural Tradition / Theme Banner (Full text, never truncated!) */}
            {event.culturalContext?.traditionOrTheme && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-subtle border border-primary/30 text-neutral-text text-xs">
                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="font-semibold text-neutral-text">Tradition &amp; Ritual:</span>
                <span className="font-medium text-neutral-text/90">
                  {event.culturalContext.traditionOrTheme}
                </span>
              </div>
            )}

            {/* High-Level Pulse Badges (Data not shown in top bar) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-0.5">
              <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
                <strong className="text-primary">{categories.length}</strong> Categories Budgeted
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
                <strong className="text-secondary">{taskMetrics.completed}/{taskMetrics.total}</strong> Tasks Completed
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
                <strong className="text-status-success">{seatingSummary.totalTables}</strong> Tables Arranged
              </span>
              <span className="px-2.5 py-1 rounded bg-neutral-subtle border border-neutral-border text-neutral-text">
                <strong className="text-neutral-text">{vendorFinancials.bookedCount}</strong> Vendors Booked
              </span>
            </div>
          </div>

          {/* Right Column: Master Execution Score Card with Radial Gauge */}
          <div className="lg:w-84 flex-shrink-0 bg-neutral-subtle/50 border border-neutral-border rounded-lg p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold block mb-0.5">
                  Execution Score
                </span>
                <h3 className="font-display text-base font-bold text-neutral-text">
                  Master Readiness
                </h3>
              </div>

              {/* Radial Score Gauge */}
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 90 90">
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    className="stroke-neutral-border/60"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r={radius}
                    className="stroke-primary transition-all duration-700 ease-out"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-mono text-sm font-bold text-neutral-text">
                  {readiness.score}%
                </span>
              </div>
            </div>

            {/* 3 Pillar Progress Bars */}
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-neutral-text mb-0.5">
                  <span>Budget Allocation</span>
                  <span className="font-bold">{readiness.budgetScore}%</span>
                </div>
                <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${readiness.budgetScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-neutral-text mb-0.5">
                  <span>Milestone Tasks</span>
                  <span className="font-bold">{readiness.taskScore}%</span>
                </div>
                <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${readiness.taskScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-neutral-text mb-0.5">
                  <span>Guest Attendance RSVPs</span>
                  <span className="font-bold">{readiness.rsvpScore}%</span>
                </div>
                <div className="w-full bg-neutral-border/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-status-success rounded-full transition-all duration-500"
                    style={{ width: `${readiness.rsvpScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="mt-3.5 pt-2.5 border-t border-neutral-border/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onEdit}
                className="font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1 active:scale-[0.98] transition-all"
              >
                <span>Edit Baseline</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              {onReplan && (
                <button
                  type="button"
                  onClick={onReplan}
                  className="font-bold text-primary hover:text-primary-hover underline flex items-center gap-1 active:scale-[0.98] transition-all"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Dynamic Replan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Note Footer */}
        <div className="border-t border-neutral-border/60 mt-4 pt-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-muted gap-2 font-mono">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            <span>
              Local-First Browser Engine (v1)
              {lastSavedAt ? ` · Last synced at ${lastSavedAt}` : ''}
            </span>
          </div>
          <div className="text-neutral-text-muted">
            Deterministic mathematics · Zero delegated arithmetic
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. "NEEDS ATTENTION TODAY" ACTION RADAR
      ========================================================================= */}
      {actionRadarItems.length > 0 ? (
        <section
          role="region"
          aria-label="Action Radar"
          className="bg-secondary-subtle/30 border border-secondary/30 rounded-xl p-4 shadow-xs space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <h3 className="font-display text-sm sm:text-base font-bold text-neutral-text">
                Needs Attention Radar ({actionRadarItems.length} Urgent Items)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-secondary font-bold uppercase tracking-wider">
              Immediate Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {actionRadarItems.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-surface border border-neutral-border rounded-lg p-3 flex items-start justify-between gap-3 shadow-xs hover:border-secondary/40 transition-all"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="font-semibold text-xs text-neutral-text truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-muted leading-relaxed pl-5">
                    {item.detail}
                  </p>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab(item.tab)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-secondary-hover underline shrink-0 pl-1"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-status-success-subtle/40 border border-status-success/30 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-status-success font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <span>
              <strong>Celebration Radar Clear:</strong> All ritual milestones, budget allocations, and guest registrations are in healthy standing.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-neutral-muted text-[11px]">
            No active bottlenecks
          </span>
        </section>
      )}

      {/* =========================================================================
          3. FINANCIAL RUNWAY & RITUAL MILESTONE MATRIX (Balanced 2-Column Grid)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* FINANCIAL CAPITAL RUNWAY (Span 7 cols on lg) */}
        <section className="lg:col-span-7 bg-neutral-surface border border-neutral-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-neutral-border/60 pb-2.5">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold block">
                    Capital Allocation
                  </span>
                  <h3 className="font-display text-lg font-bold text-neutral-text">
                    Financial Capital Runway
                  </h3>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('budget')}
                    className="text-xs font-bold text-secondary hover:text-secondary-hover underline flex items-center gap-1 active:scale-[0.98] transition-all"
                  >
                    <span>Manage Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 4 Financial Figures in a well-spaced 2x2 grid with slightly increased card sizes (no gap increase) */}
              <div className="grid grid-cols-2 gap-3 my-3">
                <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 sm:p-4 rounded-lg flex flex-col justify-between min-h-[92px]">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-neutral-muted block mb-1">
                      Total Budget Cap
                    </span>
                    <p className="font-mono text-base sm:text-lg font-bold text-neutral-text tracking-tight">
                      {formatCurrency(summary.budgetCap, event.currency)}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-muted font-mono mt-1 block">
                    Authoritative cap ceiling
                  </span>
                </div>

                <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 sm:p-4 rounded-lg flex flex-col justify-between min-h-[92px]">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-neutral-muted block mb-1">
                      Allocated Planned
                    </span>
                    <p className="font-mono text-base sm:text-lg font-bold text-primary tracking-tight">
                      {formatCurrency(summary.totalAllocated, event.currency)}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-muted font-mono mt-1 block">
                    {categories.length} categories defined
                  </span>
                </div>

                <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 sm:p-4 rounded-lg flex flex-col justify-between min-h-[92px]">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-neutral-muted block mb-1">
                      Cleared Actuals
                    </span>
                    <p className="font-mono text-base sm:text-lg font-bold text-status-success tracking-tight">
                      {formatCurrency(summary.totalActual, event.currency)}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-muted font-mono mt-1 block">
                    {expenses.length} expense items recorded
                  </span>
                </div>

                <div className="bg-neutral-subtle/60 border border-neutral-border p-3.5 sm:p-4 rounded-lg flex flex-col justify-between min-h-[92px]">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-neutral-muted block mb-1">
                      Safety Reserve Buffer
                    </span>
                    <p
                      className={`font-mono text-base sm:text-lg font-bold tracking-tight ${
                        summary.unallocatedBudget < 0 ? 'text-status-danger' : 'text-neutral-text'
                      }`}
                    >
                      {formatCurrency(summary.unallocatedBudget, event.currency)}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-muted font-mono mt-1 block">
                    {summary.unallocatedBudget >= 0 ? 'Unallocated runway' : 'Over allocated'}
                  </span>
                </div>
              </div>

              {/* Segmented Color Spectrum Progress Bar */}
              <div className="space-y-1.5 my-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-muted">
                  <span>Allocation Runway Spectrum</span>
                  <span>
                    {summary.budgetCap > 0
                      ? Math.round((summary.totalAllocated / summary.budgetCap) * 100)
                      : 0}
                    % of cap allocated
                  </span>
                </div>

                {(() => {
                  const cap = Math.max(1, summary.budgetCap);
                  const actualPct = Math.min(100, Math.round((summary.totalActual / cap) * 100));
                  const remainingAllocatedPct = Math.min(
                    100 - actualPct,
                    Math.max(
                      0,
                      Math.round(((summary.totalAllocated - summary.totalActual) / cap) * 100)
                    )
                  );
                  const bufferPct = Math.max(0, 100 - actualPct - remainingAllocatedPct);

                  return (
                    <div className="w-full h-2.5 bg-neutral-subtle rounded-full overflow-hidden flex border border-neutral-border/70">
                      <div
                        className="bg-status-success transition-all duration-300"
                        style={{ width: `${actualPct}%` }}
                        title={`Cleared Actuals: ${formatCurrency(summary.totalActual, event.currency)} (${actualPct}%)`}
                      />
                      <div
                        className="bg-primary transition-all duration-300"
                        style={{ width: `${remainingAllocatedPct}%` }}
                        title={`Planned Allocations: ${remainingAllocatedPct}%`}
                      />
                      <div
                        className="bg-neutral-border/60 transition-all duration-300"
                        style={{ width: `${bufferPct}%` }}
                        title={`Unallocated Buffer: ${bufferPct}%`}
                      />
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-neutral-muted pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                    <span>Actuals Paid</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    <span>Planned Allocations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-border/80 inline-block" />
                    <span>Safety Buffer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Category Allocations WITH Names and Values - slightly increased card sizes to eliminate internal void */}
            {categorySummaries.length > 0 && (
              <div className="pt-3 border-t border-neutral-border/50">
                <span className="text-[11px] font-mono uppercase text-neutral-muted font-semibold block mb-2">
                  Category Allocation Breakdown:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categorySummaries.slice(0, 6).map((cat) => (
                    <div
                      key={cat.category.id}
                      className="p-3 sm:p-3.5 rounded-lg bg-neutral-subtle/70 border border-neutral-border text-xs flex flex-col justify-between min-h-[74px] sm:min-h-[78px]"
                    >
                      <span className="font-semibold text-neutral-text text-xs leading-snug line-clamp-2">
                        {cat.category.name}
                      </span>
                      <strong className="font-mono text-secondary text-xs sm:text-[13px] mt-1.5 block">
                        {formatCurrency(cat.allocatedAmount, event.currency)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RITUAL SCHEDULE & TASK MATRIX (Span 5 cols on lg) */}
        <section className="lg:col-span-5 bg-neutral-surface border border-neutral-border rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-border/60 pb-2.5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold block">
                  Ritual Timeline
                </span>
                <h3 className="font-display text-lg font-bold text-neutral-text">
                  Milestone &amp; Task Horizon
                </h3>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('timeline')}
                  className="text-xs font-bold text-secondary hover:text-secondary-hover underline flex items-center gap-1 active:scale-[0.98] transition-all"
                >
                  <span>Open Timeline</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-muted">
              Scheduled ritual checkpoints and immediate preparation tasks.
            </p>

            {/* PART 1: UPCOMING CHECKPOINTS (Milestone Sequence) */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-neutral-muted font-semibold block">
                Upcoming Checkpoints:
              </span>
              {upcomingMilestones.length > 0 ? (
                <div className="space-y-2">
                  {upcomingMilestones.map((m, idx) => {
                    const isCurrent = idx === 0;
                    return (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-primary-subtle/30 border-primary/40 ring-1 ring-primary/20'
                            : 'bg-neutral-subtle/50 border-neutral-border'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isCurrent && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                              <h4 className="font-semibold text-xs text-neutral-text truncate">
                                {getCrispMilestoneTitle(m.title)}
                              </h4>
                            </div>
                            <span className="text-[11px] text-neutral-muted font-mono block">
                              {formatDateDisplay(m.effectiveDate)}
                            </span>
                          </div>

                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                              isCurrent
                                ? 'bg-primary text-neutral-text'
                                : 'bg-neutral-subtle text-secondary border border-neutral-border'
                            }`}
                          >
                            {m.offsetDays === 0
                              ? 'Event Day'
                              : m.offsetDays < 0
                              ? `${Math.abs(m.offsetDays)}d prior`
                              : `+${m.offsetDays}d post`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-muted text-xs">
                  <Clock className="w-6 h-6 text-neutral-muted/60 mx-auto mb-1" />
                  No milestone checkpoints defined yet.
                </div>
              )}
            </div>

            {/* PART 2: IMMEDIATE CHECKLIST PRIORITIES (Top 3 Pending Tasks) */}
            <div className="space-y-2 pt-2 border-t border-neutral-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-neutral-muted font-semibold">
                  Priority Checklist Tasks:
                </span>
                <span className="text-[11px] font-mono text-secondary font-bold">
                  {taskMetrics.completed} of {taskMetrics.total} Done
                </span>
              </div>

              {upcomingTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingTasks.map((task) => {
                    const isOverdue = isTaskOverdue(task, todayStr);
                    return (
                      <div
                        key={task.id}
                        className={`p-2 rounded-md border text-xs flex items-center justify-between gap-1.5 ${
                          isOverdue
                            ? 'bg-status-danger-subtle/30 border-status-danger/40'
                            : 'bg-neutral-subtle/50 border-neutral-border'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isOverdue ? 'text-status-danger' : 'text-neutral-muted'
                            }`}
                          />
                          <span className="font-medium text-[11.5px] leading-tight text-neutral-text truncate">
                            {getCrispTaskTitle(task.title)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isOverdue && (
                            <span className="text-[10px] font-mono font-bold text-status-danger bg-status-danger-subtle px-1 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-neutral-muted">
                            {formatCrispTaskDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-md bg-status-success-subtle/30 border border-status-success/30 text-xs text-status-success flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-status-success" />
                  <span>All immediate checklist tasks completed! Timeline is 100% on schedule.</span>
                </div>
              )}
            </div>
          </div>

          {/* PART 3: CHECKLIST EXECUTION PROGRESS DECK */}
          <div className="mt-4 pt-3 border-t border-neutral-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-muted">Checklist Execution:</span>
              <span className="font-bold text-neutral-text">
                {taskMetrics.completed} of {taskMetrics.total} tasks completed ({taskMetrics.pct}%)
              </span>
            </div>

            {/* Visual Task Completion Bar */}
            <div className="w-full bg-neutral-subtle rounded-full h-2 overflow-hidden border border-neutral-border/60">
              <div
                className="h-full bg-secondary transition-all duration-500 rounded-full"
                style={{ width: `${taskMetrics.pct}%` }}
              />
            </div>

            {/* Quick Status Chips */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
              <span className="text-status-success font-semibold">
                ✓ {taskMetrics.completed} Completed
              </span>
              <span className={taskMetrics.overdue > 0 ? 'text-status-danger font-bold' : 'text-neutral-muted'}>
                {taskMetrics.overdue > 0 ? `⚠ ${taskMetrics.overdue} Overdue` : '0 Overdue'}
              </span>
              <span className="text-neutral-muted">
                {taskMetrics.total - taskMetrics.completed} Remaining
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================================
          4. UNIFIED OPERATIONS CONSOLE (Guests, Seating, Vendors)
          A single seamless executive panel with 3 balanced columns divided by elegant hairlines
      ========================================================================= */}
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
              {/* Header with inline icon (no cramped square) */}
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
                  <span className="text-xs text-neutral-muted">
                    expected
                  </span>
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

              {/* Structured Key-Value Metric Rows (No nested grey box!) */}
              <div className="space-y-2 pt-1 border-t border-neutral-border/50 text-xs">
                <div className="flex items-center justify-between text-neutral-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
                    <span>Confirmed RSVPs</span>
                  </span>
                  <span className="font-mono font-bold text-status-success tabular-nums">
                    {attendanceSummary.confirmedCount} <span className="font-sans font-normal text-neutral-muted text-[11px]">({attendanceSummary.expectedPlusOnes} +1s)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning shrink-0" />
                    <span>Pending Responses</span>
                  </span>
                  <span className="font-mono font-bold text-status-warning tabular-nums">
                    {attendanceSummary.pendingCount} <span className="font-sans font-normal text-neutral-muted text-[11px]">awaiting</span>
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
                      .sort(([, a], [, b]) => b - a)
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
                  <span className="text-xs text-neutral-muted">
                    seated
                  </span>
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
                    {seatingSummary.totalTables} <span className="font-sans font-normal text-neutral-muted text-[11px]">({seatingSummary.totalSeats} seats)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
                    <span>Allocated to Tables</span>
                  </span>
                  <span className="font-mono font-bold text-status-success tabular-nums">
                    {seatingSummary.expectedAssigned} <span className="font-sans font-normal text-neutral-muted text-[11px]">guests</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-neutral-muted">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${seatingSummary.unassignedExpected > 0 ? 'bg-secondary' : 'bg-neutral-border-strong'}`} />
                    <span>Awaiting Placement</span>
                  </span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      seatingSummary.unassignedExpected > 0 ? 'text-secondary' : 'text-neutral-text'
                    }`}
                  >
                    {seatingSummary.unassignedExpected} <span className="font-sans font-normal text-neutral-muted text-[11px]">unassigned</span>
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
                    {vendorFinancials.vendorCount} <span className="font-sans font-normal text-neutral-muted text-[11px]">vendors active</span>
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

      {/* =========================================================================
          5. AI CELEBRATION ADVISOR DOCK
          (Sleek, integrated, review-first)
      ========================================================================= */}
      <section className="bg-primary-subtle border border-primary/40 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-primary text-neutral-text shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-neutral-text" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-neutral-text">
                AI Celebration Advisor
              </h3>
              <CouponBadge variant="marigold">Smart Staged Diff</CouponBadge>
            </div>
            <p className="text-xs text-neutral-text/90 max-w-xl leading-relaxed">
              Synthesize ritual traditions, detect budget variance, and receive structured proposals. Every change is presented as a before/after review diff before touching your live event.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('ai')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-neutral-text font-bold text-xs hover:bg-primary-hover shadow-sm transition-all shrink-0 active:scale-[0.98]"
          >
            <span>Consult AI Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>
    </div>
  );
}
