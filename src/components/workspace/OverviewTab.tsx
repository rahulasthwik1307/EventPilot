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
              <p className="text-xs text-neutral-muted font-mono mt-0.5">
                ~{formatCurrency(summary.costPerGuest, event.currency)} per guest
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="text-xs font-semibold bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border px-3.5 py-2 rounded-md transition-colors shadow-xs"
              >
                Edit Details
              </button>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('budget')}
                  className="text-xs font-semibold bg-primary hover:bg-primary-hover hover:text-white text-neutral-text px-3.5 py-2 rounded-md transition-all shadow-sm flex items-center gap-1"
                >
                  <span>Open Budget Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Persistence Status Stamp */}
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

      {/* 2. Deterministic Financial Snapshot */}
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
      </div>

      {/* 3. Category Breakdown Table */}
      {categorySummaries.length > 0 && (
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-border">
            <div>
              <h4 className="font-display text-lg font-semibold text-neutral-text">
                Category Allocations &amp; Actuals
              </h4>
              <p className="text-xs text-neutral-muted">
                Authoritative breakdown of planned allocations vs confirmed payments.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('budget')}
                className="text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
              >
                <span>Open Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="divide-y divide-neutral-border/60 font-mono text-xs">
            {categorySummaries.map(({ category, allocatedAmount, totalActual, variance, expenseCount }) => {
              return (
                <div
                  key={category.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="font-sans font-medium text-neutral-text text-sm flex items-center gap-2">
                    <span>{category.name}</span>
                    <span className="text-xs font-mono text-neutral-muted font-normal">
                      ({expenseCount} {expenseCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <div className="flex items-center gap-6 tabular-nums">
                    <div>
                      <span className="text-neutral-muted text-xs uppercase block sm:hidden">
                        Allocated:
                      </span>
                      <span className="text-neutral-text">
                        {formatCurrency(allocatedAmount, event.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-muted text-xs uppercase block sm:hidden">
                        Actual:
                      </span>
                      <span className="text-neutral-muted">
                        {formatCurrency(totalActual, event.currency)}
                      </span>
                    </div>
                    <div className="min-w-24 text-right">
                      <span
                        className={`font-medium ${
                          variance >= 0 ? 'text-status-success' : 'text-status-danger'
                        }`}
                      >
                        {variance >= 0 ? '+' : ''}
                        {formatCurrency(variance, event.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Timeline & Checklist Progress Snapshot */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-border">
          <div>
            <h4 className="font-display text-lg font-semibold text-neutral-text">
              Timeline &amp; Tasks Snapshot
            </h4>
            <p className="text-xs text-neutral-muted">
              Milestone anchors and action checklist status for this celebration.
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-neutral-subtle/50 border border-neutral-border rounded p-3 text-xs">
            <span className="text-neutral-muted font-medium">Task Completion:</span>
            <p className="font-mono text-base font-bold text-neutral-text mt-0.5">
              {taskMetrics.completed} of {taskMetrics.total} ({taskMetrics.pct}%)
            </p>
          </div>
          <div className="bg-neutral-subtle/50 border border-neutral-border rounded p-3 text-xs">
            <span className="text-neutral-muted font-medium">Milestone Anchors:</span>
            <p className="font-mono text-base font-bold text-neutral-text mt-0.5">
              {milestones.length} defined
            </p>
          </div>
          <div className="bg-neutral-subtle/50 border border-neutral-border rounded p-3 text-xs">
            <span className="text-neutral-muted font-medium">Overdue Alerts:</span>
            <p
              className={`font-mono text-base font-bold mt-0.5 ${
                taskMetrics.overdue > 0 ? 'text-status-danger' : 'text-status-success'
              }`}
            >
              {taskMetrics.overdue === 0 ? 'None — All on schedule' : `${taskMetrics.overdue} task(s) overdue`}
            </p>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="divide-y divide-neutral-border/60 text-xs">
            {tasks.slice(0, 4).map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2
                    className={`w-4 h-4 flex-shrink-0 ${
                      t.status === 'completed'
                        ? 'text-status-success'
                        : 'text-neutral-muted'
                    }`}
                  />
                  <span
                    className={`truncate ${
                      t.status === 'completed'
                        ? 'line-through text-neutral-muted'
                        : 'text-neutral-text font-medium'
                    }`}
                  >
                    {t.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 font-mono text-neutral-muted">
                  <span>Due: {t.dueDate}</span>
                  {t.priority === 'urgent' && (
                    <CouponBadge variant="terracotta">Urgent</CouponBadge>
                  )}
                </div>
              </div>
            ))}
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                <Wallet className="w-4 h-4" />
              </div>
              <CouponBadge variant="marigold">LIVE · M2</CouponBadge>
            </div>
            <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
              Budget &amp; Expense Ledger
            </h4>
            <p className="text-xs text-neutral-muted leading-relaxed">
              Granular expense lines, recorded deposit statuses (`projected`, `deposit_paid`, `settled`), and variance calculations.
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('budget')}
                className="mt-3 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
              >
                <span>Open Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                <Clock className="w-4 h-4" />
              </div>
              <CouponBadge variant="marigold">LIVE · M2</CouponBadge>
            </div>
            <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
              Timeline &amp; Tasks Matrix
            </h4>
            <p className="text-xs text-neutral-muted leading-relaxed">
              Relative day offsets (`offset_days`), actionable task checklists, priority filters, and ceremonial sequence anchors.
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('timeline')}
                className="mt-3 text-xs font-semibold text-secondary hover:text-secondary-hover underline flex items-center gap-1"
              >
                <span>Open Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-md bg-secondary-subtle flex items-center justify-center text-secondary">
                <Briefcase className="w-4 h-4" />
              </div>
              <CouponBadge variant="stone">Milestone 3</CouponBadge>
            </div>
            <h4 className="font-display text-base font-semibold text-neutral-text mb-1">
              Vendors &amp; Seating Coordination
            </h4>
            <p className="text-xs text-neutral-muted leading-relaxed">
              Private vendor tracking, quotes and deposit records, guest RSVP matrices, dietary notes, and table capacities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
