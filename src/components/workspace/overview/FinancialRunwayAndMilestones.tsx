'use client';

import React from 'react';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  Event,
  BudgetCategory,
  Expense,
  TimelineMilestone,
  ChecklistTask,
  BudgetSummary,
  CategorySummary,
} from '../../../features/events/types';
import { formatCurrency, formatDateDisplay } from '../../../features/events/validation';
import { isTaskOverdue } from '../../../features/events/timeline-engine';
import { WorkspaceTab } from '../WorkspaceNavigation';

export interface MilestoneWithDate extends TimelineMilestone {
  effectiveDate: string;
}

export interface FinancialRunwayAndMilestonesProps {
  event: Event;
  categories: BudgetCategory[];
  expenses: Expense[];
  summary: BudgetSummary;
  categorySummaries: CategorySummary[];
  upcomingMilestones: MilestoneWithDate[];
  upcomingTasks: ChecklistTask[];
  taskMetrics: { total: number; completed: number; overdue: number; pct: number };
  todayStr: string;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

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

export function FinancialRunwayAndMilestones({
  event,
  categories,
  expenses,
  summary,
  categorySummaries,
  upcomingMilestones,
  upcomingTasks,
  taskMetrics,
  todayStr,
  onNavigateTab,
}: FinancialRunwayAndMilestonesProps) {
  return (
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

          {/* Top Category Allocations WITH Names and Values */}
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
  );
}
