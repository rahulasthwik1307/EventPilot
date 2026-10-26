import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReplanningImpactSummary } from '../ReplanningImpactSummary';
import { ReplanningProposalList } from '../ReplanningProposalList';
import { DynamicReplanningModal } from '../DynamicReplanningModal';
import { ReplanningFullImpact, ReplanningProposal } from '../../../features/replanning/types';
import { Event } from '../../../features/events/types';
import { eventStorage } from '../../../features/events/storage';

describe('Replanning UI Components', () => {
  const mockImpact: ReplanningFullImpact = {
    financials: {
      baselineBudgetCap: 1000000,
      baselineGuestTarget: 200,
      baselineTotalProjected: 900000,
      baselineTotalAllocated: 950000,
      baselineCostPerGuest: 4500,
      baselineHeadroom: 100000,

      scenarioBudgetCap: 1200000,
      scenarioGuestTarget: 250,
      scenarioTotalProjected: 1050000,
      scenarioTotalAllocated: 1100000,
      scenarioCostPerGuest: 4200,
      scenarioHeadroom: 150000,
      scenarioShortfall: 0,
      isOverAllocated: false,
      allocationGap: 0,

      budgetCapDelta: 200000,
      guestTargetDelta: 50,
      projectedCostDelta: 150000,
      headroomDelta: 50000,

      fixedProjectedCost: 600000,
      variableProjectedCost: 450000,

      totalCommittedContract: 400000,
      totalPaidToDate: 200000,
      remainingContractBalance: 200000,
      uncommittedProjectedCost: 650000,
      historicalActualSpend: 200000,
      unlinkedContractCommitment: 0,
      contractDiscrepancyCategories: [],

      categoryImpacts: [],
      currency: 'INR',
      warnings: [],
    },
    scheduling: {
      calendarDateShiftDays: 30,
      milestonesShiftedCount: 4,
      tasksShiftedCount: 8,
      overdueTasksCount: 1,
      urgentTasksCount: 2,
      preservedManualOverridesCount: 1,
      preservedCompletedTasksCount: 2,
      flaggedTasks: [
        {
          taskId: 'task-1',
          title: 'Review Catering Menu',
          previousDueDate: '2026-10-15',
          newDueDate: '2026-11-15',
          isOverdue: false,
          isUrgent: true,
        },
      ],
    },
    attendance: {
      baselineGuestTarget: 200,
      candidateGuestTarget: 250,
      guestDelta: 50,
      totalTableCapacity: 200,
      capacityShortfall: 50,
      isCapacityExceeded: true,
    },
    triggers: ['date_change', 'guest_target_change'],
    warnings: [],
  };

  const mockProposals: ReplanningProposal[] = [
    {
      id: 'prop-date-shift',
      entity: 'event',
      field: 'date',
      title: 'Reschedule Celebration Date (+30 days)',
      explanation: 'Shift celebration from 2026-11-20 to 2026-12-20.',
      previousValue: '2026-11-20',
      proposedValue: '2026-12-20',
      impactDescription: 'Re-anchors 4 milestones and 8 tasks.',
      status: 'staged',
      originalEventUpdatedAt: '2026-01-01T12:00:00.000Z',
    },
    {
      id: 'prop-task-1',
      entity: 'task',
      entityId: 'task-1',
      field: 'dueDate',
      title: 'Reschedule Task: Review Catering Menu',
      explanation: 'Anchored to 1 Month Prior milestone.',
      previousValue: '2026-10-15',
      proposedValue: '2026-11-15',
      impactDescription: 'Due date shifts by 30 days.',
      dependsOnProposalIds: ['prop-date-shift'],
      status: 'staged',
      originalEventUpdatedAt: '2026-01-01T12:00:00.000Z',
    },
  ];

  const mockEvent: Event = {
    id: 'test-event-modal',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1000000,
    currency: 'INR',
    categories: [
      { id: 'cat-catering', name: 'Catering', allocatedAmount: 500000 },
    ],
    expenses: [
      {
        id: 'exp-sadya',
        categoryId: 'cat-catering',
        title: 'Sadya Feast',
        costModel: 'per_guest',
        unitCost: 1500,
        estimatedAmount: 300000,
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    milestones: [],
    tasks: [],
    vendors: [],
    tables: [],
    households: [],
    guests: [],
    assignments: [],
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
  };

  describe('ReplanningImpactSummary', () => {
    it('renders financial headroom, scheduling card, and seating capacity alert', () => {
      render(
        <ReplanningImpactSummary
          impact={mockImpact}
          currency="INR"
        />
      );

      expect(screen.getByTestId('replanning-impact-summary')).toBeInTheDocument();
      expect(screen.getByText(/₹1,50,000 Headroom/i)).toBeInTheDocument();
      expect(screen.getByTestId('scheduling-impact-card')).toBeInTheDocument();
      expect(screen.getByTestId('seating-capacity-alert')).toBeInTheDocument();
      expect(screen.getByText(/Table Seating Capacity Exceeded/i)).toBeInTheDocument();
    });

    it('displays contract discrepancy and overage alert when detected', () => {
      const discrepancyImpact: ReplanningFullImpact = {
        ...mockImpact,
        financials: {
          ...mockImpact.financials,
          isOverAllocated: true,
          allocationGap: 100000,
          scenarioTotalAllocated: 1300000,
          contractDiscrepancyCategories: [
            { categoryName: 'Catering', agreed: 600000, projected: 450000, discrepancy: 150000 },
          ],
        },
      };

      render(
        <ReplanningImpactSummary
          impact={discrepancyImpact}
          currency="INR"
        />
      );

      expect(screen.getByTestId('contract-discrepancy-banner')).toBeInTheDocument();
      expect(screen.getByText(/Contract Commitment Discrepancies/i)).toBeInTheDocument();
      expect(screen.getByTestId('allocation-overage-alert')).toBeInTheDocument();
    });
  });

  describe('ReplanningProposalList', () => {
    it('renders empty message when proposals array is empty', () => {
      render(
        <ReplanningProposalList
          proposals={[]}
          selectedIds={[]}
          onToggleProposal={() => {}}
          onSelectAll={() => {}}
          onDeselectAll={() => {}}
          currency="INR"
        />
      );

      expect(screen.getByTestId('empty-proposals-message')).toBeInTheDocument();
    });

    it('renders proposals with entity badges and allows toggling selection', () => {
      const handleToggle = vi.fn();
      render(
        <ReplanningProposalList
          proposals={mockProposals}
          selectedIds={['prop-date-shift']}
          onToggleProposal={handleToggle}
          onSelectAll={() => {}}
          onDeselectAll={() => {}}
          currency="INR"
        />
      );

      expect(screen.getByTestId('proposal-card-prop-date-shift')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-card-prop-task-1')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('proposal-card-prop-task-1'));
      expect(handleToggle).toHaveBeenCalledWith('prop-task-1');
    });

    it('renders missing prerequisite warning when a dependent proposal is selected alone', () => {
      render(
        <ReplanningProposalList
          proposals={mockProposals}
          selectedIds={['prop-task-1']} // parent 'prop-date-shift' is unselected!
          onToggleProposal={() => {}}
          onSelectAll={() => {}}
          onDeselectAll={() => {}}
          currency="INR"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent(/Requires parent proposal selected/i);
    });
  });

  describe('DynamicReplanningModal', () => {
    const handleClose = vi.fn();
    const handleApplyPlan = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders modal controls and allows switching views', () => {
      render(
        <DynamicReplanningModal
          isOpen={true}
          onClose={handleClose}
          event={mockEvent}
          onApplyPlan={handleApplyPlan}
        />
      );

      expect(screen.getByRole('heading', { name: 'Dynamic Celebration Replanner' })).toBeInTheDocument();
      expect(screen.getByTestId('replanning-impact-summary')).toBeInTheDocument();

      // Change guest count to generate proposals
      fireEvent.change(screen.getByLabelText(/Target Attendance/i), { target: { value: '250' } });

      // Switch to Review Proposals view
      fireEvent.click(screen.getByRole('tab', { name: /Review Proposals/i }));
      expect(screen.getByTestId('replanning-proposal-list')).toBeInTheDocument();
    });

    it('discards cleanly when Discard Replan is clicked', () => {
      const saveSpy = vi.spyOn(eventStorage, 'savePersonalEvent');

      render(
        <DynamicReplanningModal
          isOpen={true}
          onClose={handleClose}
          event={mockEvent}
          onApplyPlan={handleApplyPlan}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Discard Replan/i }));
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(handleApplyPlan).not.toHaveBeenCalled();
    });

    it('blocks applying changes and shows conflict notice on CONCURRENCY_CONFLICT', () => {
      vi.spyOn(eventStorage, 'savePersonalEvent').mockReturnValue({
        success: false,
        error: {
          code: 'CONCURRENCY_CONFLICT',
          message: 'Celebration updated elsewhere.',
        },
      });

      render(
        <DynamicReplanningModal
          isOpen={true}
          onClose={handleClose}
          event={mockEvent}
          onApplyPlan={handleApplyPlan}
        />
      );

      // Change guest count to generate proposals
      fireEvent.change(screen.getByLabelText(/Target Attendance/i), { target: { value: '250' } });

      // Click Apply Selected Proposals
      const applyBtn = screen.getByRole('button', { name: /Apply Selected Proposals/i });
      fireEvent.click(applyBtn);

      expect(screen.getByRole('alert')).toHaveTextContent(/updated in another session or window/i);
      expect(handleApplyPlan).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();
      // Unsaved user inputs remain available for conflict resolution
      expect(screen.getByLabelText(/Target Attendance/i)).toHaveValue('250');
      expect(screen.getAllByText(/250 guests/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
