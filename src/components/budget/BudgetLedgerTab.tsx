'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BudgetCategory,
  Event,
  Expense,
  PaymentStatus,
} from '../../features/events/types';
import {
  calculateBudgetSummary,
  calculateCategorySummaries,
} from '../../features/events/budget-engine';
import { formatCurrency } from '../../features/events/validation';
import { CouponBadge } from '../ui/Badge';
import { CategoryDialog } from './CategoryDialog';
import { CategoryDeleteDialog } from './CategoryDeleteDialog';
import { ExpenseDialog } from './ExpenseDialog';

export interface BudgetLedgerTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

export function BudgetLedgerTab({ event, onUpdateEvent }: BudgetLedgerTabProps) {
  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);

  const [isCategoryDeleteOpen, setIsCategoryDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BudgetCategory | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [defaultExpenseCatId, setDefaultExpenseCatId] = useState<string | undefined>(undefined);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const categories = useMemo(() => event.categories || [], [event.categories]);
  const expenses = useMemo(() => event.expenses || [], [event.expenses]);

  // Deterministic summary calculations
  const summary = useMemo(() => {
    return calculateBudgetSummary(
      event.budgetCap,
      categories,
      expenses,
      event.guestTarget,
      event.currency
    );
  }, [event.budgetCap, categories, expenses, event.guestTarget, event.currency]);

  // Per-category deterministic breakdown
  const categorySummaries = useMemo(() => {
    return calculateCategorySummaries(categories, expenses);
  }, [categories, expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat =
        selectedCategoryFilter === 'all' || e.categoryId === selectedCategoryFilter;
      const matchStatus =
        selectedStatusFilter === 'all' || e.paymentStatus === selectedStatusFilter;
      return matchCat && matchStatus;
    });
  }, [expenses, selectedCategoryFilter, selectedStatusFilter]);

  // Helper map for category names
  const categoryMap = useMemo(() => {
    const map = new Map<string, BudgetCategory>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Handlers for Categories
  const handleSaveCategory = (categoryData: {
    id: string;
    name: string;
    allocatedAmount: number;
  }) => {
    const existingIndex = categories.findIndex((c) => c.id === categoryData.id);
    let updatedCategories: BudgetCategory[];

    if (existingIndex >= 0) {
      updatedCategories = [...categories];
      updatedCategories[existingIndex] = {
        ...updatedCategories[existingIndex],
        ...categoryData,
      };
    } else {
      updatedCategories = [...categories, categoryData];
    }

    onUpdateEvent({
      ...event,
      categories: updatedCategories,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleConfirmDeleteCategory = (categoryId: string) => {
    const updatedCategories = categories.filter((c) => c.id !== categoryId);
    // Unlink any vendor that was linked to this deleted budget category
    const updatedVendors = (event.vendors || []).map((v) =>
      v.linkedCategoryId === categoryId ? { ...v, linkedCategoryId: undefined } : v
    );

    onUpdateEvent({
      ...event,
      categories: updatedCategories,
      vendors: updatedVendors,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handlers for Expenses
  const handleSaveExpense = (expenseData: {
    id: string;
    categoryId: string;
    title: string;
    estimatedAmount: number;
    actualAmount?: number;
    paymentStatus: PaymentStatus;
    notes?: string;
  }) => {
    const existingIndex = expenses.findIndex((e) => e.id === expenseData.id);
    const now = new Date().toISOString();
    let updatedExpenses: Expense[];

    if (existingIndex >= 0) {
      updatedExpenses = [...expenses];
      updatedExpenses[existingIndex] = {
        ...updatedExpenses[existingIndex],
        ...expenseData,
        updatedAt: now,
      };
    } else {
      updatedExpenses = [
        ...expenses,
        {
          ...expenseData,
          createdAt: now,
          updatedAt: now,
        },
      ];
    }

    onUpdateEvent({
      ...event,
      expenses: updatedExpenses,
      updatedAt: now,
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
    onUpdateEvent({
      ...event,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
              Budget &amp; Expense Ledger
            </h2>
            <CouponBadge variant="marigold">Live Ledger</CouponBadge>
          </div>
          <p className="text-xs text-neutral-muted">
            Category allocations, payment statuses, recorded actuals, and per-guest costs computed in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedExpense(null);
              setDefaultExpenseCatId(undefined);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white rounded-md transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Safety Warning Banners */}
      {summary.isOverAllocated && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-status-warning-subtle border border-status-warning/40 rounded-lg text-sm text-neutral-text shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-secondary mt-0.5" />
          <div>
            <p className="font-semibold text-neutral-text">
              Over-Allocation Warning
            </p>
            <p className="text-xs text-neutral-muted mt-0.5">
              Total planned category allocations ({formatCurrency(summary.totalAllocated, event.currency)}) exceed your established budget cap ({formatCurrency(summary.budgetCap, event.currency)}) by{' '}
              <strong className="text-secondary font-mono">
                {formatCurrency(summary.totalAllocated - summary.budgetCap, event.currency)}
              </strong>
              . Rebalance your category budgets to maintain financial safety.
            </p>
          </div>
        </div>
      )}

      {summary.isOverBudget && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-status-danger-subtle border border-status-danger/40 rounded-lg text-sm text-status-danger shadow-xs"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Budget Exceeded Alert</p>
            <p className="text-xs text-status-danger/90 mt-0.5">
              Total actual recorded payments ({formatCurrency(summary.totalActual, event.currency)}) have exceeded your budget cap by{' '}
              <strong className="font-mono">
                {formatCurrency(summary.totalActual - summary.budgetCap, event.currency)}
              </strong>
              .
            </p>
          </div>
        </div>
      )}

      {/* 3. Authoritative Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Budget Cap
          </p>
          <p className="font-mono text-lg sm:text-xl font-bold text-neutral-text">
            {formatCurrency(summary.budgetCap, event.currency)}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            Locked ceiling
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Total Allocated
          </p>
          <p className="font-mono text-lg sm:text-xl font-bold text-neutral-text">
            {formatCurrency(summary.totalAllocated, event.currency)}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Estimated Cost
          </p>
          <p className="font-mono text-lg sm:text-xl font-bold text-neutral-text">
            {formatCurrency(summary.totalEstimated, event.currency)}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            {expenses.length} {expenses.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Actual Spent
          </p>
          <p className="font-mono text-lg sm:text-xl font-bold text-neutral-text">
            {formatCurrency(summary.totalActual, event.currency)}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            Confirmed payments
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Unallocated Pool
          </p>
          <p
            className={`font-mono text-lg sm:text-xl font-bold ${
              summary.unallocatedBudget < 0 ? 'text-status-danger' : 'text-neutral-text'
            }`}
          >
            {formatCurrency(summary.unallocatedBudget, event.currency)}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            {summary.unallocatedBudget >= 0 ? 'Safety reserve' : 'Over allocated'}
          </p>
        </div>

        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1">
            Cost Per Guest
          </p>
          <p className="font-mono text-lg sm:text-xl font-bold text-neutral-text">
            {formatCurrency(summary.costPerGuest, event.currency)}
          </p>
          <p className="text-xs text-neutral-muted mt-1 font-mono">
            For {event.guestTarget} guests
          </p>
        </div>
      </div>

      {/* 3b. Budget Allocation & Utilization Visualization Bar */}
      {summary.budgetCap > 0 && (
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div>
              <span className="font-display font-semibold text-sm text-neutral-text">
                Budget Allocation &amp; Spending Utilization
              </span>
              <p className="text-neutral-muted">
                Track how much of your total budget ceiling is spent, committed, or held in reserve.
              </p>
            </div>
            <div className="font-mono font-semibold text-neutral-text">
              Cap: {formatCurrency(summary.budgetCap, event.currency)}
            </div>
          </div>

          {/* Segmented Progress Bar */}
          {(() => {
            const spentPct = Math.min(100, Math.round((summary.totalActual / summary.budgetCap) * 100));
            const committedUnspent = Math.max(0, summary.totalAllocated - summary.totalActual);
            const committedPct = Math.min(100 - spentPct, Math.round((committedUnspent / summary.budgetCap) * 100));
            const reservePct = Math.max(0, 100 - spentPct - committedPct);

            return (
              <div className="space-y-2">
                <div
                  className="w-full h-3 bg-neutral-subtle rounded-full overflow-hidden flex border border-neutral-border/60"
                  role="progressbar"
                  aria-label="Budget cap utilization"
                  aria-valuenow={spentPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="bg-primary transition-all duration-300"
                    style={{ width: `${spentPct}%` }}
                    title={`Actual Spent: ${spentPct}% (${formatCurrency(summary.totalActual, event.currency)})`}
                  />
                  <div
                    className="bg-secondary/60 transition-all duration-300"
                    style={{ width: `${committedPct}%` }}
                    title={`Allocated Unspent: ${committedPct}% (${formatCurrency(committedUnspent, event.currency)})`}
                  />
                  <div
                    className="bg-neutral-border/40 transition-all duration-300"
                    style={{ width: `${reservePct}%` }}
                    title={`Unallocated Reserve: ${reservePct}% (${formatCurrency(summary.unallocatedBudget, event.currency)})`}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-muted pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                    <span>Actual Spent: <strong className="text-neutral-text">{formatCurrency(summary.totalActual, event.currency)}</strong> ({spentPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary/60 inline-block" />
                    <span>Allocated Unspent: <strong className="text-neutral-text">{formatCurrency(committedUnspent, event.currency)}</strong> ({committedPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-border inline-block" />
                    <span>Unallocated Reserve: <strong className={summary.unallocatedBudget < 0 ? 'text-status-danger' : 'text-neutral-text'}>{formatCurrency(summary.unallocatedBudget, event.currency)}</strong></span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. Category Allocations Section */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-border">
          <div>
            <h3 className="font-display text-lg font-semibold text-neutral-text">
              Category Allocation Breakdown
            </h3>
            <p className="text-xs text-neutral-muted">
              Allocated budgets, recorded actuals, and variance for each celebration pillar.
            </p>
          </div>
          <span className="font-mono text-xs text-neutral-muted">
            {categories.length} Categories
          </span>
        </div>

        {categorySummaries.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-border rounded-lg">
            <Layers className="w-8 h-8 text-neutral-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-neutral-text">No categories defined</p>
            <p className="text-xs text-neutral-muted mt-1 mb-4">
              Create your first budget category to begin organizing your celebration finances.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white rounded-md transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorySummaries.map(({ category, allocatedAmount, totalEstimated, totalActual, variance, expenseCount }) => {
              const spentPct =
                allocatedAmount > 0
                  ? Math.min(100, Math.round((totalActual / allocatedAmount) * 100))
                  : 0;

              return (
                <div
                  key={category.id}
                  className="bg-neutral-subtle/50 border border-neutral-border rounded-lg p-4 flex flex-col justify-between hover:border-neutral-border/80 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-sans font-semibold text-sm text-neutral-text">
                        {category.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsCategoryModalOpen(true);
                          }}
                          aria-label={`Edit ${category.name}`}
                          className="p-1 text-neutral-muted hover:text-neutral-text rounded hover:bg-neutral-surface transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setIsCategoryDeleteOpen(true);
                          }}
                          aria-label={`Delete ${category.name}`}
                          className="p-1 text-neutral-muted hover:text-status-danger rounded hover:bg-neutral-surface transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-muted font-sans">Allocated:</span>
                        <span className="font-semibold text-neutral-text">
                          {formatCurrency(allocatedAmount, event.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-muted font-sans">Actual Spent:</span>
                        <span className="text-neutral-text">
                          {formatCurrency(totalActual, event.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-border/40 pt-1">
                        <span className="text-neutral-muted font-sans">Remaining:</span>
                        <span
                          className={`font-semibold ${
                            variance >= 0 ? 'text-status-success' : 'text-status-danger'
                          }`}
                        >
                          {variance >= 0 ? '+' : ''}
                          {formatCurrency(variance, event.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Spent percentage bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-neutral-border/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            spentPct >= 100
                              ? 'bg-status-danger'
                              : spentPct > 80
                              ? 'bg-secondary'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${spentPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-neutral-muted">
                        <span>{spentPct}% utilized</span>
                        <span>{expenseCount} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-border/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExpense(null);
                        setDefaultExpenseCatId(category.id);
                        setIsExpenseModalOpen(true);
                      }}
                      className="text-xs font-medium text-secondary hover:text-secondary-hover underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Expense</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Granular Expense Items Ledger */}
      <div className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-neutral-border">
          <div>
            <h3 className="font-display text-lg font-semibold text-neutral-text">
              Expense Items Ledger
            </h3>
            <p className="text-xs text-neutral-muted">
              Individual invoices, bookings, and commitments across payment lifecycles.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-muted" />
              <select
                aria-label="Filter by category"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-neutral-subtle border border-neutral-border rounded px-2.5 py-1.5 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              aria-label="Filter by payment status"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-neutral-subtle border border-neutral-border rounded px-2.5 py-1.5 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="projected">Projected Only</option>
              <option value="deposit_paid">Deposit Paid Only</option>
              <option value="settled">Settled Only</option>
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-neutral-border rounded-lg">
            <FileSpreadsheet className="w-8 h-8 text-neutral-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-neutral-text">No expense items match your criteria</p>
            <p className="text-xs text-neutral-muted mt-1 mb-4">
              {expenses.length === 0
                ? 'Your ledger is currently empty. Record your first vendor quotation or invoice.'
                : 'Try clearing your filters to view all recorded expenses.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedExpense(null);
                setDefaultExpenseCatId(
                  selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined
                );
                setIsExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white rounded-md transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-subtle/70 text-neutral-muted uppercase tracking-wider font-semibold border-b border-neutral-border">
                <tr>
                  <th scope="col" className="py-3 px-3">
                    Expense Title
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Category
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Estimated
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Actual Spent
                  </th>
                  <th scope="col" className="py-3 px-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/60">
                {filteredExpenses.map((exp) => {
                  const cat = categoryMap.get(exp.categoryId);
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-neutral-subtle/40 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-medium text-neutral-text text-sm">
                          {exp.title}
                        </div>
                        {exp.notes && (
                          <div className="text-xs text-neutral-muted mt-0.5 max-w-md line-clamp-1">
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-neutral-text text-xs">
                          {cat ? cat.name : 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {exp.paymentStatus === 'settled' && (
                          <CouponBadge variant="stone">Settled</CouponBadge>
                        )}
                        {exp.paymentStatus === 'deposit_paid' && (
                          <CouponBadge variant="marigold">Deposit Paid</CouponBadge>
                        )}
                        {exp.paymentStatus === 'projected' && (
                          <CouponBadge variant="terracotta">Projected</CouponBadge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-text whitespace-nowrap">
                        {formatCurrency(exp.estimatedAmount, event.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        {typeof exp.actualAmount === 'number' ? (
                          <span className="font-semibold text-neutral-text">
                            {formatCurrency(exp.actualAmount, event.currency)}
                          </span>
                        ) : (
                          <span className="text-neutral-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExpense(exp);
                              setIsExpenseModalOpen(true);
                            }}
                            aria-label={`Edit ${exp.title}`}
                            className="p-1 text-neutral-muted hover:text-neutral-text rounded hover:bg-neutral-subtle transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            aria-label={`Delete ${exp.title}`}
                            className="p-1 text-neutral-muted hover:text-status-danger rounded hover:bg-neutral-subtle transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
        currency={event.currency}
        onSave={handleSaveCategory}
      />

      <CategoryDeleteDialog
        isOpen={isCategoryDeleteOpen}
        onClose={() => setIsCategoryDeleteOpen(false)}
        category={categoryToDelete}
        expenses={expenses}
        onConfirmDelete={handleConfirmDeleteCategory}
      />

      <ExpenseDialog
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expense={selectedExpense}
        categories={categories}
        defaultCategoryId={defaultExpenseCatId}
        currency={event.currency}
        onSave={handleSaveExpense}
      />
    </div>
  );
}
