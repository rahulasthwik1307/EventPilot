import { describe, expect, it } from 'vitest';
import { calculateScenarioFinancials } from '../scenario-engine';
import { Event } from '../../events/types';

describe('scenario-engine (Deterministic Financial & Variable Cost Engine)', () => {
  const baseEvent: Event = {
    id: 'test-event-financials',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 1000000,
    currency: 'INR',
    categories: [
      { id: 'cat-venue', name: 'Venue & Heritage Ambiance', allocatedAmount: 400000 },
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 300000 },
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 200000 },
      { id: 'cat-decor', name: 'Decor & Florals', allocatedAmount: 100000 },
    ],
    expenses: [
      {
        id: 'exp-venue-rent',
        categoryId: 'cat-venue',
        title: 'Heritage Courtyard Rental',
        estimatedAmount: 350000,
        actualAmount: 350000,
        paymentStatus: 'settled',
        costModel: 'fixed',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-catering-meal',
        categoryId: 'cat-catering',
        title: 'Traditional Banana Leaf Sadya Feast',
        estimatedAmount: 240000, // 200 guests * 1200
        costModel: 'per_guest',
        unitCost: 1200,
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-photo-legacy',
        categoryId: 'cat-photo',
        title: 'Candid Photography (Legacy Expense without costModel)',
        estimatedAmount: 150000,
        paymentStatus: 'projected',
        // Note: costModel is omitted to test legacy compatibility rule
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-decor-mandap',
        categoryId: 'cat-decor',
        title: 'Mandap Floral Setup',
        estimatedAmount: 80000,
        actualAmount: 40000,
        paymentStatus: 'deposit_paid',
        costModel: 'fixed',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    vendors: [
      {
        id: 'vnd-venue',
        name: 'Heritage Palace',
        category: 'venue',
        status: 'booked',
        quotedCost: 400000,
        agreedCost: 350000,
        depositPaid: 150000,
        amountPaid: 350000, // Fully settled
        linkedCategoryId: 'cat-venue',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'vnd-decor',
        name: 'Flower Masters',
        category: 'decoration',
        status: 'negotiating',
        quotedCost: 100000,
        agreedCost: 80000,
        depositPaid: 40000,
        amountPaid: 40000,
        linkedCategoryId: 'cat-decor',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    milestones: [],
    tasks: [],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('calculates baseline financials with clean accounting and no double-counting of deposits', () => {
    const fin = calculateScenarioFinancials(baseEvent, {});

    expect(fin.baselineBudgetCap).toBe(1000000);
    expect(fin.baselineGuestTarget).toBe(200);
    // Baseline total projected = 350k (venue) + 240k (catering) + 150k (photo) + 80k (decor) = 820,000
    expect(fin.baselineTotalProjected).toBe(820000);
    expect(fin.baselineHeadroom).toBe(180000);
    expect(fin.baselineCostPerGuest).toBe(4100); // 820,000 / 200

    // Contract commitments: Venue (350k) + Decor (80k) = 430,000
    expect(fin.totalCommittedContract).toBe(430000);
    // Paid to date: Venue (350k) + Decor (40k) = 390,000
    expect(fin.totalPaidToDate).toBe(390000);
    // Remaining balance: 430k - 390k = 40,000
    expect(fin.remainingContractBalance).toBe(40000);

    // CRITICAL: Deposits must NOT be added on top of the agreed contract liability!
    expect(fin.totalCommittedContract).not.toBe(430000 + 40000);
  });

  it('keeps fixed costs fixed and scales per_guest costs deterministically when guest target changes', () => {
    // Increase guests from 200 to 250 (+50 guests)
    const fin = calculateScenarioFinancials(baseEvent, { guestTarget: 250 });

    expect(fin.scenarioGuestTarget).toBe(250);
    expect(fin.guestTargetDelta).toBe(50);

    // Fixed costs remain completely unchanged: 350k (venue) + 150k (photo) + 80k (decor) = 580,000
    expect(fin.fixedProjectedCost).toBe(580000);

    // Per-guest catering scales: 250 * 1200 = 300,000 (was 240,000)
    expect(fin.variableProjectedCost).toBe(300000);

    // Scenario total projected: 580k + 300k = 880,000 (+60,000)
    expect(fin.scenarioTotalProjected).toBe(880000);
    expect(fin.projectedCostDelta).toBe(60000);
    expect(fin.scenarioHeadroom).toBe(120000); // 1,000,000 - 880,000
    expect(fin.scenarioCostPerGuest).toBe(Math.round(880000 / 250)); // 3,520
  });

  it('handles legacy expenses without costModel as fixed costs by default', () => {
    // Photo expense exp-photo-legacy has no costModel field
    const fin200 = calculateScenarioFinancials(baseEvent, { guestTarget: 200 });
    const fin400 = calculateScenarioFinancials(baseEvent, { guestTarget: 400 });

    const photo200 = fin200.categoryImpacts.find((c) => c.categoryId === 'cat-photo');
    const photo400 = fin400.categoryImpacts.find((c) => c.categoryId === 'cat-photo');

    expect(photo200?.scenarioProjected).toBe(150000);
    expect(photo400?.scenarioProjected).toBe(150000); // Must remain fixed!
    expect(photo400?.fixedCost).toBe(150000);
    expect(photo400?.variableCost).toBe(0);
  });

  it('computes budget cap reduction, shortfall, and negative headroom accurately', () => {
    // Reduce budget from 1,000,000 to 750,000 (-250,000) with 200 guests (projected 820,000)
    const fin = calculateScenarioFinancials(baseEvent, { budgetCap: 750000 });

    expect(fin.scenarioBudgetCap).toBe(750000);
    expect(fin.budgetCapDelta).toBe(-250000);
    expect(fin.scenarioTotalProjected).toBe(820000);
    // Headroom is negative: 750,000 - 820,000 = -70,000
    expect(fin.scenarioHeadroom).toBe(-70000);
    // Shortfall is positive 70,000
    expect(fin.scenarioShortfall).toBe(70000);
  });

  it('does NOT mutate the input event snapshot', () => {
    const originalBudgetCap = baseEvent.budgetCap;
    const originalGuestTarget = baseEvent.guestTarget;
    const originalExpenses = JSON.stringify(baseEvent.expenses);

    calculateScenarioFinancials(baseEvent, { budgetCap: 600000, guestTarget: 500 });

    expect(baseEvent.budgetCap).toBe(originalBudgetCap);
    expect(baseEvent.guestTarget).toBe(originalGuestTarget);
    expect(JSON.stringify(baseEvent.expenses)).toBe(originalExpenses);
  });

  it('handles zero guest target without divide-by-zero errors', () => {
    const fin = calculateScenarioFinancials(baseEvent, { guestTarget: 0 });

    expect(fin.scenarioGuestTarget).toBe(0);
    expect(fin.variableProjectedCost).toBe(0);
    expect(fin.scenarioCostPerGuest).toBe(0);
    expect(fin.warnings.some((w) => w.toLowerCase().includes('zero'))).toBe(true);
  });

  it('excludes cancelled vendors from commitments and balance calculations (W3-04)', () => {
    const eventWithCancelledVendor: Event = {
      ...baseEvent,
      vendors: [
        ...baseEvent.vendors,
        {
          id: 'vnd-cancelled',
          name: 'Old Caterer',
          category: 'catering',
          status: 'cancelled',
          quotedCost: 300000,
          agreedCost: 250000,
          depositPaid: 50000,
          amountPaid: 50000,
          linkedCategoryId: 'cat-catering',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    const fin = calculateScenarioFinancials(eventWithCancelledVendor, {});
    // Commitments and payments must match baseEvent because cancelled vendor is strictly excluded
    expect(fin.totalCommittedContract).toBe(430000);
    expect(fin.totalPaidToDate).toBe(390000);
    expect(fin.remainingContractBalance).toBe(40000);
  });

  it('calculates remaining contract balances per-vendor without cross-vendor netting (W3-05)', () => {
    // Vendor A: Agreed 100k, Paid 120k (overpaid by 20k)
    // Vendor B: Agreed 100k, Paid 40k (remaining 60k)
    // Global netting would say (200k - 160k = 40k).
    // Correct per-vendor calculation: max(0, 100k-120k) + max(0, 100k-40k) = 0 + 60k = 60,000!
    const eventWithOverpayment: Event = {
      ...baseEvent,
      vendors: [
        {
          id: 'vnd-a',
          name: 'Vendor A',
          category: 'venue',
          status: 'booked',
          quotedCost: 100000,
          agreedCost: 100000,
          depositPaid: 50000,
          amountPaid: 120000, // Overpaid
          linkedCategoryId: 'cat-venue',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'vnd-b',
          name: 'Vendor B',
          category: 'decoration',
          status: 'booked',
          quotedCost: 100000,
          agreedCost: 100000,
          depositPaid: 40000,
          amountPaid: 40000, // Remaining 60k
          linkedCategoryId: 'cat-decor',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    const fin = calculateScenarioFinancials(eventWithOverpayment, {});
    expect(fin.totalCommittedContract).toBe(200000);
    expect(fin.totalPaidToDate).toBe(160000);
    expect(fin.remainingContractBalance).toBe(60000); // NOT 40,000!
  });

  it('detects contract/ledger discrepancies and unlinked active vendors (W3-06)', () => {
    const eventWithDiscrepancy: Event = {
      ...baseEvent,
      vendors: [
        ...baseEvent.vendors,
        {
          id: 'vnd-over-agreed',
          name: 'Luxury Stage Decorator',
          category: 'decoration',
          status: 'booked',
          quotedCost: 200000,
          agreedCost: 150000, // Decor projected in baseEvent is only 80,000
          depositPaid: 50000,
          amountPaid: 50000,
          linkedCategoryId: 'cat-decor',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'vnd-unlinked',
          name: 'Specialist Priest / Purohit',
          category: 'other',
          status: 'booked',
          quotedCost: 25000,
          agreedCost: 25000,
          depositPaid: 10000,
          amountPaid: 10000,
          linkedCategoryId: undefined, // Unlinked
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    const fin = calculateScenarioFinancials(eventWithDiscrepancy, {});
    // Decor agreed = 80k (Flower Masters) + 150k (Luxury Stage Decorator) = 230,000 vs decor projected = 80,000
    expect(fin.contractDiscrepancyCategories.length).toBeGreaterThan(0);
    const decorDisc = fin.contractDiscrepancyCategories.find((c) => c.categoryName.includes('Decor'));
    expect(decorDisc).toBeDefined();
    expect(decorDisc?.discrepancy).toBe(150000); // 230,000 - 80,000

    expect(fin.unlinkedContractCommitment).toBe(25000);
    expect(fin.warnings.some((w) => w.includes('Unlinked vendor contracts'))).toBe(true);
    expect(fin.warnings.some((w) => w.includes('exceed scenario projected spend'))).toBe(true);
  });

  it('tracks category allocation overage independently from projected spend (W3-07)', () => {
    // In baseEvent, categories allocated: 400k + 300k + 200k + 100k = 1,000,000
    // Simulate budget cap reduced to 800,000
    // Projected spend: 820,000. Allocations: 1,000,000.
    const fin = calculateScenarioFinancials(baseEvent, { budgetCap: 800000 });

    expect(fin.scenarioBudgetCap).toBe(800000);
    expect(fin.scenarioTotalAllocated).toBe(1000000);
    expect(fin.isOverAllocated).toBe(true);
    expect(fin.allocationGap).toBe(200000);
    expect(fin.warnings.some((w) => w.includes('Category allocations') && w.includes('exceed the scenario budget cap'))).toBe(true);
  });

  it('correctly resolves amountPaid fallback to depositPaid when amountPaid is missing (W3-08)', () => {
    const eventWithLegacyVendor: Event = {
      ...baseEvent,
      vendors: [
        {
          id: 'vnd-legacy',
          name: 'Legacy Vendor',
          category: 'venue',
          status: 'booked',
          quotedCost: 100000,
          agreedCost: 90000,
          depositPaid: 30000,
          amountPaid: undefined as unknown as number, // Missing amountPaid
          linkedCategoryId: 'cat-venue',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    const fin = calculateScenarioFinancials(eventWithLegacyVendor, {});
    expect(fin.totalPaidToDate).toBe(30000);
    expect(fin.remainingContractBalance).toBe(60000); // 90,000 - 30,000
  });
});
