import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScenarioImpactPreview } from '../ScenarioImpactPreview';
import { ScenarioFinancials, TradeOffOption } from '../../../features/tradeoffs/types';

describe('ScenarioImpactPreview Component', () => {
  const baseFinancials: ScenarioFinancials = {
    baselineBudgetCap: 1000000,
    baselineGuestTarget: 200,
    baselineTotalProjected: 900000,
    baselineTotalAllocated: 950000,
    baselineCostPerGuest: 4500,
    baselineHeadroom: 100000,

    scenarioBudgetCap: 850000,
    scenarioGuestTarget: 200,
    scenarioTotalProjected: 900000,
    scenarioTotalAllocated: 950000,
    scenarioCostPerGuest: 4500,
    scenarioHeadroom: -50000,
    scenarioShortfall: 50000,
    isOverAllocated: false,
    allocationGap: 0,

    budgetCapDelta: -150000,
    guestTargetDelta: 0,
    projectedCostDelta: 0,
    headroomDelta: -150000,

    fixedProjectedCost: 500000,
    variableProjectedCost: 400000,

    totalCommittedContract: 300000,
    totalPaidToDate: 100000,
    remainingContractBalance: 200000,
    uncommittedProjectedCost: 600000,
    historicalActualSpend: 100000,
    unlinkedContractCommitment: 0,
    contractDiscrepancyCategories: [],

    categoryImpacts: [],
    currency: 'INR',
    warnings: ['Scenario projected costs exceed the budget cap.'],
  };

  const tradeOffOptions: TradeOffOption[] = [
    {
      id: 'tradeoff-decor',
      title: 'Optimize Floral & Decor: Stage Florals',
      description: 'Adjust Stage Florals by trimming 25% of uncommitted spend.',
      impactType: 'budget_reduction',
      currentAmount: 100000,
      proposedAmount: 75000,
      estimatedSavings: 25000,
      isSavingsProjected: true,
      assumptions: 'Trims 25% based on confirmed flexibility.',
      isConflictWithPreference: false,
      affectsNonNegotiable: false,
      isEconomizeArea: true,
      isSpendingPriority: false,
      applied: false,
    },
  ];

  it('renders deficit pill, warnings, and trade-off options', () => {
    const handleToggle = vi.fn();

    render(
      <ScenarioImpactPreview
        financials={baseFinancials}
        tradeOffOptions={tradeOffOptions}
        selectedTradeOffIds={[]}
        onToggleTradeOff={handleToggle}
      />
    );

    expect(screen.getByText(/Deficit: ₹50,000 over cap/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligent Trade-Off Proposals \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Economize Priority/i)).toBeInTheDocument();

    // Toggle trade-off
    fireEvent.click(screen.getByText(/Optimize Floral & Decor: Stage Florals/i));
    expect(handleToggle).toHaveBeenCalledWith('tradeoff-decor');
  });

  it('shows stale state warning when background changes occurred', () => {
    const handleRefresh = vi.fn();

    render(
      <ScenarioImpactPreview
        financials={baseFinancials}
        tradeOffOptions={[]}
        selectedTradeOffIds={[]}
        onToggleTradeOff={() => {}}
        isStale={true}
        onRefreshStale={handleRefresh}
      />
    );

    expect(screen.getByText(/Celebration State Changed Elsewhere/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Recalculate/i }));
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders allocation overage alert when category allocations exceed budget cap (W3-07)', () => {
    const overAllocatedFinancials: ScenarioFinancials = {
      ...baseFinancials,
      scenarioTotalAllocated: 1200000,
      scenarioBudgetCap: 1000000,
      isOverAllocated: true,
      allocationGap: 200000,
    };

    render(
      <ScenarioImpactPreview
        financials={overAllocatedFinancials}
        tradeOffOptions={[]}
        selectedTradeOffIds={[]}
        onToggleTradeOff={() => {}}
      />
    );

    expect(screen.getByTestId('allocation-overage-alert')).toBeInTheDocument();
    expect(screen.getByText(/Category Allocations Exceed Budget Cap/i)).toBeInTheDocument();
    expect(screen.getByText(/Allocations:.*over cap/i)).toBeInTheDocument();
  });

  it('renders contract commitment discrepancy banner when agreed vendor contracts exceed projections (W3-06)', () => {
    const discrepancyFinancials: ScenarioFinancials = {
      ...baseFinancials,
      contractDiscrepancyCategories: [
        {
          categoryName: 'Catering',
          agreed: 500000,
          projected: 400000,
          discrepancy: 100000,
        },
      ],
      unlinkedContractCommitment: 75000,
    };

    render(
      <ScenarioImpactPreview
        financials={discrepancyFinancials}
        tradeOffOptions={[]}
        selectedTradeOffIds={[]}
        onToggleTradeOff={() => {}}
      />
    );

    const banner = screen.getByTestId('contract-discrepancy-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Agreed vendor contracts in “Catering”/i);
    expect(banner).toHaveTextContent(/exceed scenario projected spend/i);
    expect(banner).toHaveTextContent(/Active vendor contracts totaling/i);
    expect(banner).toHaveTextContent(/are not linked to any valid budget category/i);
  });
});
