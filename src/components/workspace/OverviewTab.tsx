'use client';

import React, { useMemo } from 'react';
import { Event } from '../../features/events/types';
import { calculateDaysRemaining, formatCurrency } from '../../features/events/validation';
import {
  calculateBudgetSummary,
  calculateCategorySummaries,
} from '../../features/events/budget-engine';
import { isTaskOverdue, calculateMilestoneDate } from '../../features/events/timeline-engine';
import { calculateVendorFinancials } from '../../features/vendors/vendor-engine';
import { calculateAttendanceSummary } from '../../features/guests/guest-engine';
import { calculateSeatingSummary } from '../../features/seating/seating-engine';
import { calculateReadinessScore } from '../../features/events/readiness-engine';
import { WorkspaceTab } from './WorkspaceNavigation';

import { ExecutiveReadinessDeck } from './overview/ExecutiveReadinessDeck';
import { ActionRadar, ActionRadarItem } from './overview/ActionRadar';
import { FinancialRunwayAndMilestones } from './overview/FinancialRunwayAndMilestones';
import { OperationsConsole } from './overview/OperationsConsole';
import { AiAdvisorDock } from './overview/AiAdvisorDock';

export interface OverviewTabProps {
  event: Event;
  onEdit: () => void;
  onReplan?: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  lastSavedAt?: string;
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

  // Deterministic Celebration Readiness Composite Score (10-100%)
  const readiness = useMemo(() => {
    return calculateReadinessScore({
      type: event.type,
      budgetCap: event.budgetCap,
      totalAllocated: summary.totalAllocated,
      guestTarget: event.guestTarget,
      expectedAttendance: attendanceSummary.expectedAttendance,
      taskMetrics,
    });
  }, [
    event.type,
    event.budgetCap,
    summary.totalAllocated,
    event.guestTarget,
    attendanceSummary.expectedAttendance,
    taskMetrics,
  ]);

  // Action Radar Items (Urgent bottlenecks needing immediate human attention)
  const actionRadarItems = useMemo(() => {
    const items: ActionRadarItem[] = [];

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

  return (
    <div className="space-y-6">
      <ExecutiveReadinessDeck
        event={event}
        categoriesCount={categories.length}
        totalAllocated={summary.totalAllocated}
        taskMetrics={taskMetrics}
        seatingSummary={seatingSummary}
        vendorFinancials={vendorFinancials}
        attendanceSummary={attendanceSummary}
        readiness={readiness}
        lastSavedAt={lastSavedAt}
        onEdit={onEdit}
        onReplan={onReplan}
      />

      <ActionRadar
        items={actionRadarItems}
        onNavigateTab={onNavigateTab}
      />

      <FinancialRunwayAndMilestones
        event={event}
        categories={categories}
        expenses={expenses}
        summary={summary}
        categorySummaries={categorySummaries}
        upcomingMilestones={upcomingMilestones}
        upcomingTasks={upcomingTasks}
        taskMetrics={taskMetrics}
        todayStr={todayStr}
        onNavigateTab={onNavigateTab}
      />

      <OperationsConsole
        event={event}
        attendanceSummary={attendanceSummary}
        seatingSummary={seatingSummary}
        vendorFinancials={vendorFinancials}
        onNavigateTab={onNavigateTab}
      />

      <AiAdvisorDock onNavigateTab={onNavigateTab} />
    </div>
  );
}
