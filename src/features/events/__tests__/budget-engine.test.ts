import { describe, expect, it } from 'vitest';
import {
  calculateBudgetSummary,
  calculateCategorySummaries,
  canDeleteCategory,
  generateStarterCategories,
} from '../budget-engine';
import { BudgetCategory, Expense } from '../types';

describe('Budget Engine - Deterministic Calculations', () => {
  describe('generateStarterCategories', () => {
    it('generates categories for wedding archetype matching budget cap exactly', () => {
      const budgetCap = 1500000;
      const categories = generateStarterCategories(budgetCap, 'wedding');

      expect(categories).toHaveLength(6);
      const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
      expect(totalAllocated).toBe(budgetCap);

      // Verify specific proportions
      // Venue & Catering: ~45% = 675,000
      expect(categories[0].name).toContain('Venue & Traditional Catering');
      expect(categories[0].allocatedAmount).toBe(675000);
    });

    it('generates categories for birthday archetype matching budget cap exactly', () => {
      const budgetCap = 50000;
      const categories = generateStarterCategories(budgetCap, 'birthday');

      expect(categories).toHaveLength(5);
      const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
      expect(totalAllocated).toBe(budgetCap);
    });

    it('generates categories for community archetype matching budget cap exactly', () => {
      const budgetCap = 250000;
      const categories = generateStarterCategories(budgetCap, 'community');

      expect(categories).toHaveLength(5);
      const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
      expect(totalAllocated).toBe(budgetCap);
    });

    it('handles rounding without drift on odd budget numbers', () => {
      const budgetCap = 999999;
      const categories = generateStarterCategories(budgetCap, 'wedding');
      const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
      expect(totalAllocated).toBe(budgetCap);
    });

    it('handles zero or negative budget cap gracefully', () => {
      const categoriesZero = generateStarterCategories(0, 'wedding');
      expect(categoriesZero).toHaveLength(6);
      expect(categoriesZero.every((c) => c.allocatedAmount === 0)).toBe(true);

      const categoriesNeg = generateStarterCategories(-500, 'birthday');
      expect(categoriesNeg.every((c) => c.allocatedAmount === 0)).toBe(true);
    });
  });

  describe('calculateBudgetSummary', () => {
    const categories: BudgetCategory[] = [
      { id: 'cat-1', name: 'Venue', allocatedAmount: 500000 },
      { id: 'cat-2', name: 'Decor', allocatedAmount: 200000 },
    ];

    it('calculates summary accurately with actual expenses', () => {
      const expenses: Expense[] = [
        {
          id: 'exp-1',
          categoryId: 'cat-1',
          title: 'Hall Advance',
          estimatedAmount: 250000,
          actualAmount: 250000,
          paymentStatus: 'deposit_paid',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'exp-2',
          categoryId: 'cat-2',
          title: 'Mandap Setup',
          estimatedAmount: 180000,
          actualAmount: 190000,
          paymentStatus: 'settled',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const summary = calculateBudgetSummary(800000, categories, expenses, 400, 'INR');

      expect(summary.budgetCap).toBe(800000);
      expect(summary.totalAllocated).toBe(700000); // 500k + 200k
      expect(summary.totalEstimated).toBe(430000); // 250k + 180k
      expect(summary.totalActual).toBe(440000); // 250k + 190k
      expect(summary.unallocatedBudget).toBe(100000); // 800k - 700k
      expect(summary.budgetCapVariance).toBe(360000); // 800k - 440k
      expect(summary.costPerGuest).toBe(2000); // 800k / 400
      expect(summary.isOverAllocated).toBe(false);
      expect(summary.isOverBudget).toBe(false);
    });

    it('STRICT ACTUAL SPENDING RULE: settled status without actualAmount does NOT invent spending', () => {
      const expenses: Expense[] = [
        {
          id: 'exp-1',
          categoryId: 'cat-1',
          title: 'Unpaid Estimate',
          estimatedAmount: 100000,
          paymentStatus: 'projected',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'exp-2',
          categoryId: 'cat-2',
          title: 'Settled without recorded actual',
          estimatedAmount: 50000,
          paymentStatus: 'settled', // Marked settled but actualAmount is undefined
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const summary = calculateBudgetSummary(500000, categories, expenses, 100, 'INR');

      expect(summary.totalEstimated).toBe(150000);
      // Crucial: totalActual MUST be 0, not 50000!
      expect(summary.totalActual).toBe(0);
    });

    it('detects over-allocation and over-budget states', () => {
      const overAllocatedCats: BudgetCategory[] = [
        { id: 'cat-1', name: 'Venue', allocatedAmount: 600000 },
        { id: 'cat-2', name: 'Decor', allocatedAmount: 500000 },
      ]; // Total 1.1M vs 1.0M cap

      const expenses: Expense[] = [
        {
          id: 'exp-1',
          categoryId: 'cat-1',
          title: 'Grand Palace',
          estimatedAmount: 900000,
          actualAmount: 1050000,
          paymentStatus: 'settled',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const summary = calculateBudgetSummary(1000000, overAllocatedCats, expenses, 200, 'INR');

      expect(summary.isOverAllocated).toBe(true);
      expect(summary.unallocatedBudget).toBe(-100000);
      expect(summary.isOverBudget).toBe(true);
      expect(summary.budgetCapVariance).toBe(-50000);
    });

    it('safely handles 0 guest count without division by zero', () => {
      const summary = calculateBudgetSummary(500000, categories, [], 0, 'INR');
      expect(summary.costPerGuest).toBe(0);
      expect(Number.isFinite(summary.costPerGuest)).toBe(true);
    });
  });

  describe('calculateCategorySummaries', () => {
    it('computes breakdown and variance for each category accurately', () => {
      const categories: BudgetCategory[] = [
        { id: 'cat-a', name: 'Sound', allocatedAmount: 60000 },
        { id: 'cat-b', name: 'Lights', allocatedAmount: 40000 },
      ];

      const expenses: Expense[] = [
        {
          id: 'e1',
          categoryId: 'cat-a',
          title: 'Speakers',
          estimatedAmount: 30000,
          actualAmount: 25000,
          paymentStatus: 'settled',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'e2',
          categoryId: 'cat-a',
          title: 'Microphones',
          estimatedAmount: 15000,
          actualAmount: 18000,
          paymentStatus: 'deposit_paid',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'e3',
          categoryId: 'cat-b',
          title: 'Stage Focus Lights',
          estimatedAmount: 40000,
          // no actualAmount
          paymentStatus: 'projected',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      const summaries = calculateCategorySummaries(categories, expenses);

      expect(summaries).toHaveLength(2);

      // Category A
      expect(summaries[0].category.id).toBe('cat-a');
      expect(summaries[0].allocatedAmount).toBe(60000);
      expect(summaries[0].totalEstimated).toBe(45000);
      expect(summaries[0].totalActual).toBe(43000); // 25k + 18k
      expect(summaries[0].variance).toBe(17000); // 60k - 43k
      expect(summaries[0].expenseCount).toBe(2);

      // Category B
      expect(summaries[1].category.id).toBe('cat-b');
      expect(summaries[1].allocatedAmount).toBe(40000);
      expect(summaries[1].totalEstimated).toBe(40000);
      expect(summaries[1].totalActual).toBe(0);
      expect(summaries[1].variance).toBe(40000); // 40k - 0
      expect(summaries[1].expenseCount).toBe(1);
    });
  });

  describe('canDeleteCategory', () => {
    it('permits deletion when no expenses reference category', () => {
      const expenses: Expense[] = [
        {
          id: 'e1',
          categoryId: 'cat-other',
          title: 'Misc',
          estimatedAmount: 100,
          paymentStatus: 'projected',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];
      const check = canDeleteCategory('cat-target', expenses);
      expect(check.canDelete).toBe(true);
      expect(check.associatedCount).toBe(0);
    });

    it('blocks deletion when expenses reference category', () => {
      const expenses: Expense[] = [
        {
          id: 'e1',
          categoryId: 'cat-target',
          title: 'Tent rental',
          estimatedAmount: 5000,
          paymentStatus: 'projected',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'e2',
          categoryId: 'cat-target',
          title: 'Chairs',
          estimatedAmount: 3000,
          paymentStatus: 'projected',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];
      const check = canDeleteCategory('cat-target', expenses);
      expect(check.canDelete).toBe(false);
      expect(check.associatedCount).toBe(2);
    });
  });
});
