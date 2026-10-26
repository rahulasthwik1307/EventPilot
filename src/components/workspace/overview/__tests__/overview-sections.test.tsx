import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveReadinessDeck } from '../ExecutiveReadinessDeck';
import { ActionRadar, ActionRadarItem } from '../ActionRadar';
import { FinancialRunwayAndMilestones } from '../FinancialRunwayAndMilestones';
import { OperationsConsole } from '../OperationsConsole';
import { AiAdvisorDock } from '../AiAdvisorDock';
import { createFreshSampleEvent } from '../../../../features/events/sample-event';
import { calculateReadinessScore } from '../../../../features/events/readiness-engine';
import { calculateBudgetSummary, calculateCategorySummaries } from '../../../../features/events/budget-engine';
import { calculateAttendanceSummary } from '../../../../features/guests/guest-engine';
import { calculateSeatingSummary } from '../../../../features/seating/seating-engine';
import { calculateVendorFinancials } from '../../../../features/vendors/vendor-engine';

describe('Overview Domain Sub-components', () => {
  const sample = createFreshSampleEvent();
  const summary = calculateBudgetSummary(
    sample.budgetCap,
    sample.categories,
    sample.expenses,
    sample.guestTarget,
    sample.currency
  );
  const taskMetrics = { total: 10, completed: 4, overdue: 1, pct: 40 };
  const attendanceSummary = calculateAttendanceSummary(sample.guests);
  const seatingSummary = calculateSeatingSummary(sample.tables, sample.assignments, sample.guests);
  const vendorFinancials = calculateVendorFinancials(sample.vendors);
  const readiness = calculateReadinessScore({
    type: sample.type,
    budgetCap: sample.budgetCap,
    totalAllocated: summary.totalAllocated,
    guestTarget: sample.guestTarget,
    expectedAttendance: attendanceSummary.expectedAttendance,
    taskMetrics,
  });

  describe('ExecutiveReadinessDeck', () => {
    it('renders master readiness score, dial, and 3 pillars', () => {
      const onEdit = vi.fn();
      const onReplan = vi.fn();

      render(
        <ExecutiveReadinessDeck
          event={sample}
          categoriesCount={sample.categories.length}
          totalAllocated={summary.totalAllocated}
          taskMetrics={taskMetrics}
          seatingSummary={seatingSummary}
          vendorFinancials={vendorFinancials}
          attendanceSummary={attendanceSummary}
          readiness={readiness}
          onEdit={onEdit}
          onReplan={onReplan}
        />
      );

      expect(screen.getByText('Celebration Master Health & Readiness')).toBeInTheDocument();
      expect(screen.getByText('Master Readiness')).toBeInTheDocument();
      expect(screen.getByText('Budget Allocation')).toBeInTheDocument();
      expect(screen.getByText('Milestone Tasks')).toBeInTheDocument();
      expect(screen.getByText('Guest Attendance')).toBeInTheDocument();

      const editBtn = screen.getByRole('button', { name: /Edit Baseline/i });
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledTimes(1);

      const replanBtn = screen.getByRole('button', { name: /Dynamic Replan/i });
      fireEvent.click(replanBtn);
      expect(onReplan).toHaveBeenCalledTimes(1);
    });
  });

  describe('ActionRadar', () => {
    it('renders radar clear banner when no bottlenecks exist', () => {
      render(<ActionRadar items={[]} />);
      expect(screen.getByText(/Celebration Radar Clear:/i)).toBeInTheDocument();
      expect(screen.getByText('No active bottlenecks')).toBeInTheDocument();
    });

    it('renders urgent bottleneck items with navigation button', () => {
      const onNavigate = vi.fn();
      const items: ActionRadarItem[] = [
        {
          id: 'test_item_1',
          title: '1 Overdue Ritual Task',
          detail: 'Review scheduled milestones',
          severity: 'urgent',
          tab: 'timeline',
          actionLabel: 'Resolve Tasks',
        },
      ];

      render(<ActionRadar items={items} onNavigateTab={onNavigate} />);

      expect(screen.getByText('1 Overdue Ritual Task')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /Resolve Tasks/i });
      fireEvent.click(actionBtn);
      expect(onNavigate).toHaveBeenCalledWith('timeline');
    });
  });

  describe('FinancialRunwayAndMilestones', () => {
    it('renders capital runway figures and milestone horizon cards', () => {
      const onNavigate = vi.fn();
      const catSummaries = calculateCategorySummaries(sample.categories, sample.expenses);

      render(
        <FinancialRunwayAndMilestones
          event={sample}
          categories={sample.categories}
          expenses={sample.expenses}
          summary={summary}
          categorySummaries={catSummaries}
          upcomingMilestones={[
            {
              id: 'm1',
              title: 'Mandap Setup',
              offsetDays: -1,
              effectiveDate: '2026-11-20',
            },
          ]}
          upcomingTasks={sample.tasks.slice(0, 3)}
          taskMetrics={taskMetrics}
          todayStr="2026-11-01"
          onNavigateTab={onNavigate}
        />
      );

      expect(screen.getByText('Financial Capital Runway')).toBeInTheDocument();
      expect(screen.getByText('Total Budget Cap')).toBeInTheDocument();
      expect(screen.getByText('Milestone & Task Horizon')).toBeInTheDocument();
      expect(screen.getByText('Mandap Setup')).toBeInTheDocument();

      const manageBtn = screen.getByRole('button', { name: /Manage Ledger/i });
      fireEvent.click(manageBtn);
      expect(onNavigate).toHaveBeenCalledWith('budget');
    });
  });

  describe('OperationsConsole', () => {
    it('renders attendance, seating, and vendor metrics with navigation links', () => {
      const onNavigate = vi.fn();

      render(
        <OperationsConsole
          event={sample}
          attendanceSummary={attendanceSummary}
          seatingSummary={seatingSummary}
          vendorFinancials={vendorFinancials}
          onNavigateTab={onNavigate}
        />
      );

      expect(screen.getByText('Operations Console')).toBeInTheDocument();
      expect(screen.getByText('Guest & Hospitality')).toBeInTheDocument();
      expect(screen.getByText('Banquet Seating')).toBeInTheDocument();
      expect(screen.getByText('Vendor Commitments')).toBeInTheDocument();

      const regBtn = screen.getByRole('button', { name: /Register/i });
      fireEvent.click(regBtn);
      expect(onNavigate).toHaveBeenCalledWith('guests');
    });
  });

  describe('AiAdvisorDock', () => {
    it('renders AI consultation banner with button', () => {
      const onNavigate = vi.fn();

      render(<AiAdvisorDock onNavigateTab={onNavigate} />);

      expect(screen.getByText('AI Celebration Advisor')).toBeInTheDocument();
      expect(screen.getByText('Smart Staged Diff')).toBeInTheDocument();

      const consultBtn = screen.getByRole('button', { name: /Consult AI Assistant/i });
      fireEvent.click(consultBtn);
      expect(onNavigate).toHaveBeenCalledWith('ai');
    });
  });
});
