import { describe, expect, it } from 'vitest';
import { generateTradeOffOptions } from '../tradeoff-generator';
import { calculateScenarioFinancials } from '../scenario-engine';
import { Event } from '../../events/types';
import { createDefaultPreferenceRecord } from '../../preferences/preferences';

describe('tradeoff-generator (Preference-Aware Trade-Off Optimizer)', () => {
  const eventWithPreferences: Event = {
    id: 'test-event-tradeoffs',
    type: 'wedding',
    title: 'Aditi & Siddharth Vivaha',
    date: '2026-11-20',
    guestTarget: 200,
    budgetCap: 800000,
    currency: 'INR',
    categories: [
      { id: 'cat-venue', name: 'Venue & Heritage Ambiance', allocatedAmount: 350000 },
      { id: 'cat-catering', name: 'Catering & Dining', allocatedAmount: 250000 },
      { id: 'cat-photo', name: 'Photography', allocatedAmount: 120000 },
      { id: 'cat-decor', name: 'Decor & Florals', allocatedAmount: 80000 },
    ],
    expenses: [
      {
        id: 'exp-venue',
        categoryId: 'cat-venue',
        title: 'Heritage Courtyard',
        estimatedAmount: 350000,
        paymentStatus: 'settled',
        costModel: 'fixed',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-catering',
        categoryId: 'cat-catering',
        title: 'Traditional Sadya Feast',
        estimatedAmount: 240000,
        costModel: 'per_guest',
        unitCost: 1200,
        paymentStatus: 'projected',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-photo',
        categoryId: 'cat-photo',
        title: 'Cinematography Package',
        estimatedAmount: 140000,
        paymentStatus: 'projected',
        costModel: 'fixed',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'exp-decor',
        categoryId: 'cat-decor',
        title: 'Floral Toranams & Return Gifts',
        estimatedAmount: 90000,
        paymentStatus: 'projected',
        costModel: 'fixed',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    vendors: [
      {
        id: 'vnd-venue',
        name: 'Courtyard Palace',
        category: 'venue',
        status: 'booked',
        quotedCost: 350000,
        agreedCost: 350000,
        depositPaid: 150000,
        amountPaid: 350000,
        linkedCategoryId: 'cat-venue',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    preferences: {
      budget: createDefaultPreferenceRecord(
        {
          spendingPriorities: ['Catering & Dining', 'Venue & Heritage Ambiance'],
          economizeAreas: ['Decor & Florals', 'Return Gifts'],
          nonNegotiables: ['Traditional Sadya Feast'],
          flexibility: 'strict_hard_limit',
        },
        'confirmed',
        'user_edit'
      ),
    },
    milestones: [],
    tasks: [],
    households: [],
    guests: [],
    tables: [],
    assignments: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('protects confirmed non-negotiables from recommended cuts', () => {
    // Total projected: 350k + 240k + 140k + 90k = 820,000 (Shortfall of 20,000 against 800k cap)
    const financials = calculateScenarioFinancials(eventWithPreferences, {});
    expect(financials.scenarioShortfall).toBe(20000);

    const options = generateTradeOffOptions(eventWithPreferences, financials);

    // Options must prioritize economize areas (Decor & Florals)
    const decorOption = options.find((o) => o.targetCategoryName?.includes('Decor'));
    expect(decorOption).toBeDefined();
    expect(decorOption?.isEconomizeArea).toBe(true);
    expect(decorOption?.affectsNonNegotiable).toBe(false);

    // Non-negotiable feast must NOT be targeted for cost reduction
    const feastCut = options.find(
      (o) => o.targetExpenseId === 'exp-catering' && !o.affectsNonNegotiable
    );
    expect(feastCut).toBeUndefined();
  });

  it('generates practical reductions in explicitly identified economize areas first', () => {
    const financials = calculateScenarioFinancials(eventWithPreferences, {});
    const options = generateTradeOffOptions(eventWithPreferences, financials);

    expect(options.length).toBeGreaterThan(0);
    const topOption = options[0];
    // First recommended trade-off should be an economize area
    expect(topOption.isEconomizeArea).toBe(true);
    expect(topOption.estimatedSavings).toBeGreaterThan(0);
    expect(topOption.isConflictWithPreference).toBe(false);
  });

  it('generates guest buffer adjustment when guest increase triggers dining shortfall', () => {
    // Increase guests from 200 to 250 (+50 guests * 1200 = +60,000)
    const financials = calculateScenarioFinancials(eventWithPreferences, { guestTarget: 250 });
    expect(financials.scenarioShortfall).toBe(80000);

    const options = generateTradeOffOptions(eventWithPreferences, financials);
    const guestOption = options.find((o) => o.impactType === 'guest_scaling');

    expect(guestOption).toBeDefined();
    expect(guestOption?.description).toContain('attendees');
    expect(guestOption?.estimatedSavings).toBeGreaterThan(0);
  });

  it('handles events without preferences gracefully without throwing or assuming artificial limits', () => {
    const eventWithoutPrefs: Event = {
      ...eventWithPreferences,
      preferences: undefined,
    };

    const financials = calculateScenarioFinancials(eventWithoutPrefs, {});
    const options = generateTradeOffOptions(eventWithoutPrefs, financials);

    expect(options).toBeDefined();
    expect(Array.isArray(options)).toBe(true);
    // When no preferences exist, options do not claim to conflict or align with economize areas
    for (const opt of options) {
      expect(opt.isEconomizeArea).toBe(false);
      expect(opt.isConflictWithPreference).toBe(false);
    }
  });

  it('strictly protects contracted expenses even when paymentStatus is projected (W3-02)', () => {
    // Photography has an expense of 140,000 with paymentStatus 'projected'.
    // Add an agreed vendor contract for Photography of 140,000.
    const eventWithContractedProjectedExpense: Event = {
      ...eventWithPreferences,
      vendors: [
        ...eventWithPreferences.vendors,
        {
          id: 'vnd-photo',
          name: 'Vivaha Studios',
          category: 'photography',
          status: 'booked',
          quotedCost: 150000,
          agreedCost: 140000, // Fully locks the 140k expense
          depositPaid: 0, // No deposit yet!
          amountPaid: 0,
          linkedCategoryId: 'cat-photo',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    };

    const financials = calculateScenarioFinancials(eventWithContractedProjectedExpense, {});
    const options = generateTradeOffOptions(eventWithContractedProjectedExpense, financials);

    // The contracted photography expense must NOT be proposed for reduction
    const photoCut = options.find((o) => o.targetExpenseId === 'exp-photo');
    expect(photoCut).toBeUndefined();
  });

  it('respects historical actual spend as an absolute non-reducible floor (W3-03)', () => {
    // Change decor expense: estimated 100,000, actualAmount: 90,000, paymentStatus: 'deposit_paid'
    // Eligible reducible base is only 10,000 (100k - 90k).
    // A 25% economize cut on 10,000 is 2,500, which is below the 5,000 minimum threshold.
    // Therefore it must NOT be cut.
    const eventWithActuals: Event = {
      ...eventWithPreferences,
      expenses: eventWithPreferences.expenses.map((e) =>
        e.id === 'exp-decor'
          ? {
              ...e,
              estimatedAmount: 100000,
              actualAmount: 90000,
              paymentStatus: 'deposit_paid',
            }
          : e
      ),
    };

    const financials = calculateScenarioFinancials(eventWithActuals, {});
    const options = generateTradeOffOptions(eventWithActuals, financials);

    const decorCut = options.find((o) => o.targetExpenseId === 'exp-decor');
    expect(decorCut).toBeUndefined(); // Cannot be cut below actuals!

    // Now test where eligibleBase is large enough: estimated 160,000, actual 90,000 (eligible base: 70,000)
    const eventWithLargerHeadroom: Event = {
      ...eventWithPreferences,
      expenses: eventWithPreferences.expenses.map((e) =>
        e.id === 'exp-decor'
          ? {
              ...e,
              estimatedAmount: 160000,
              actualAmount: 90000,
              paymentStatus: 'deposit_paid',
            }
          : e
      ),
    };

    const fin2 = calculateScenarioFinancials(eventWithLargerHeadroom, {});
    const options2 = generateTradeOffOptions(eventWithLargerHeadroom, fin2);

    const decorCut2 = options2.find((o) => o.targetExpenseId === 'exp-decor');
    expect(decorCut2).toBeDefined();
    // Proposed amount must be >= actualAmount (90,000)
    expect(decorCut2!.proposedAmount).toBeGreaterThanOrEqual(90000);
    // Estimated savings must be on eligible base (70k * 0.25 = 17,500 or shortfall)
    expect(decorCut2!.estimatedSavings).toBeLessThanOrEqual(70000);
  });
});
