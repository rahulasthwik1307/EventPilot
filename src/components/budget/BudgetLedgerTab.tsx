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
  Sliders,
  Sparkles,
  MapPin,
  Utensils,
  TrendingUp,
  Receipt,
  Check,
  ShieldCheck,
  ArrowRight,
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
import { ScenarioSimulationModal } from '../tradeoffs/ScenarioSimulationModal';
import { DynamicReplanningModal } from '../replanning/DynamicReplanningModal';

export interface BudgetLedgerTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('venue') || lower.includes('hall') || lower.includes('estate') || lower.includes('mandap')) {
    return <MapPin className="w-4 h-4 text-primary" />;
  }
  if (lower.includes('cater') || lower.includes('food') || lower.includes('dining') || lower.includes('feast') || lower.includes('sadya')) {
    return <Utensils className="w-4 h-4 text-secondary" />;
  }
  if (lower.includes('decor') || lower.includes('flower') || lower.includes('floral') || lower.includes('ambience')) {
    return <Sparkles className="w-4 h-4 text-primary" />;
  }
  if (lower.includes('photo') || lower.includes('video') || lower.includes('cinema')) {
    return <Layers className="w-4 h-4 text-secondary" />;
  }
  if (lower.includes('music') || lower.includes('sound') || lower.includes('sangeet') || lower.includes('nadaswaram')) {
    return <Sparkles className="w-4 h-4 text-primary" />;
  }
  return <Wallet className="w-4 h-4 text-secondary" />;
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
  const [isScenarioSimulationOpen, setIsScenarioSimulationOpen] = useState(false);
  const [isDynamicReplanningOpen, setIsDynamicReplanningOpen] = useState(false);

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
    <div className="space-y-7">
      {/* =========================================================================
          1. HEADER & ACTION CONTROLS
      ========================================================================= */}
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

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setIsDynamicReplanningOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-primary-subtle text-primary hover:bg-primary hover:text-neutral-text border border-primary/30 rounded-md transition-all active:scale-[0.98] shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Dynamic Replan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsScenarioSimulationOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-all active:scale-[0.98] shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-secondary" />
            <span>What-If Simulation</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border rounded-md transition-all active:scale-[0.98] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Add Category</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedExpense(null);
              setDefaultExpenseCatId(undefined);
              setIsExpenseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-md transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SAFETY WARNING BANNERS
      ========================================================================= */}
      {summary.isOverAllocated && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-status-warning-subtle border border-status-warning/40 rounded-xl text-sm text-neutral-text shadow-xs"
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
          className="flex items-start gap-3 p-4 bg-status-danger-subtle border border-status-danger/40 rounded-xl text-sm text-status-danger shadow-xs"
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

      {/* =========================================================================
          3. EXECUTIVE CAPITAL HEALTH DECK (Spacious, No Number Overflow)
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-6 shadow-card relative overflow-hidden space-y-5">
        {/* Panchang Ceremonial Accent Header Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-border/60 pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-bold block">
              Almanac Capital Governance
            </span>
            <h3 className="font-display text-lg sm:text-xl font-bold text-neutral-text">
              Financial Capital Runway &amp; Unit Economics
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-muted">
            Currency: <strong className="text-neutral-text font-bold">{event.currency}</strong> · Guest Target: <strong className="text-neutral-text font-bold">{event.guestTarget}</strong>
          </span>
        </div>

        {/* 4 Core Runway Pillars (2x2 on sm, 4 cols on lg with plenty of room) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Budget Cap */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Budget Cap
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-surface border border-neutral-border text-neutral-muted">
                  Ceiling
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-neutral-text tracking-tight">
                {formatCurrency(summary.budgetCap, event.currency)}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              Locked authoritative cap
            </p>
          </div>

          {/* Card 2: Allocated Planned */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Total Allocated
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary-subtle border border-primary/30 text-primary whitespace-nowrap shrink-0 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <strong className="font-bold">{categories.length}</strong>{' '}
                    {categories.length === 1 ? 'Category' : 'Categories'}
                  </span>
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-tight">
                {formatCurrency(summary.totalAllocated, event.currency)}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              {summary.budgetCap > 0
                ? `${Math.round((summary.totalAllocated / summary.budgetCap) * 100)}% of ceiling`
                : 'Plan defined'}
            </p>
          </div>

          {/* Card 3: Actual Spent */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Actual Spent
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-status-success-subtle border border-status-success/30 text-status-success">
                  Cleared
                </span>
              </div>
              <p className="font-mono text-xl sm:text-2xl font-bold text-status-success tracking-tight">
                {formatCurrency(summary.totalActual, event.currency)}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              Confirmed cleared invoices
            </p>
          </div>

          {/* Card 4: Safety Reserve Buffer */}
          <div className="bg-neutral-subtle/60 border border-neutral-border rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
                  Unallocated Pool
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                    summary.unallocatedBudget < 0
                      ? 'bg-status-danger-subtle border-status-danger/30 text-status-danger'
                      : 'bg-neutral-surface border-neutral-border text-neutral-text'
                  }`}
                >
                  {summary.unallocatedBudget < 0 ? 'Deficit' : 'Reserve'}
                </span>
              </div>
              <p
                className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
                  summary.unallocatedBudget < 0 ? 'text-status-danger' : 'text-neutral-text'
                }`}
              >
                {formatCurrency(summary.unallocatedBudget, event.currency)}
              </p>
            </div>
            <p className="text-[11px] text-neutral-muted mt-2 font-mono">
              {summary.unallocatedBudget >= 0 ? 'Safety buffer runway' : 'Over allocated'}
            </p>
          </div>
        </div>

        {/* 2 Efficiency Secondary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-3 rounded-lg bg-neutral-subtle/40 border border-neutral-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted block mb-0.5">
                Estimated Cost
              </span>
              <p className="font-mono text-base sm:text-lg font-bold text-neutral-text tracking-tight">
                {formatCurrency(summary.totalEstimated, event.currency)}
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-muted px-2.5 py-1 rounded bg-neutral-surface border border-neutral-border">
              {expenses.length} {expenses.length === 1 ? 'item' : 'items'} tracked
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-subtle/40 border border-neutral-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-muted block mb-0.5">
                Cost Per Guest
              </span>
              <p className="font-mono text-base sm:text-lg font-bold text-neutral-text tracking-tight">
                {formatCurrency(summary.costPerGuest, event.currency)}
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-muted px-2.5 py-1 rounded bg-neutral-surface border border-neutral-border">
              For {event.guestTarget} guests
            </span>
          </div>
        </div>

        {/* Segmented Capital Utilization Spectrum Bar */}
        {summary.budgetCap > 0 && (
          <div className="pt-3 border-t border-neutral-border/60 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-display font-semibold text-xs sm:text-sm text-neutral-text">
                Budget Allocation &amp; Spending Utilization
              </span>
              <span className="font-mono font-semibold text-neutral-muted text-xs">
                Cap Ceiling: {formatCurrency(summary.budgetCap, event.currency)}
              </span>
            </div>

            {(() => {
              const spentPct = Math.min(100, Math.round((summary.totalActual / summary.budgetCap) * 100));
              const committedUnspent = Math.max(0, summary.totalAllocated - summary.totalActual);
              const committedPct = Math.min(100 - spentPct, Math.round((committedUnspent / summary.budgetCap) * 100));
              const reservePct = Math.max(0, 100 - spentPct - committedPct);

              return (
                <div className="space-y-2">
                  <div
                    className="w-full h-3 bg-neutral-subtle rounded-full overflow-hidden flex border border-neutral-border/70"
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
                      className="bg-secondary/70 transition-all duration-300"
                      style={{ width: `${committedPct}%` }}
                      title={`Allocated Unspent: ${committedPct}% (${formatCurrency(committedUnspent, event.currency)})`}
                    />
                    <div
                      className="bg-neutral-border/60 transition-all duration-300"
                      style={{ width: `${reservePct}%` }}
                      title={`Unallocated Reserve: ${reservePct}% (${formatCurrency(summary.unallocatedBudget, event.currency)})`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-muted pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                      <span>Actual Spent: <strong className="text-neutral-text">{formatCurrency(summary.totalActual, event.currency)}</strong> ({spentPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary/70 inline-block" />
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
      </section>

      {/* =========================================================================
          4. CATEGORY ALLOCATION BREAKDOWN (Pillar Allocation Cards)
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <div>
            <h3 className="font-display text-lg font-bold text-neutral-text">
              Category Allocation Breakdown
            </h3>
            <p className="text-xs text-neutral-muted">
              Allocated budgets, recorded actuals, and variance for each celebration pillar.
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-neutral-subtle border border-neutral-border text-neutral-text font-semibold">
            {categories.length} Categories
          </span>
        </div>

        {categorySummaries.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-neutral-border rounded-xl">
            <Layers className="w-9 h-9 text-neutral-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-neutral-text">No categories defined</p>
            <p className="text-xs text-neutral-muted mt-1 mb-4">
              Create your first budget category to begin organizing your celebration finances.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-md transition-all shadow-sm active:scale-[0.98]"
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
              const totalCap = summary.budgetCap > 0 ? summary.budgetCap : 1;
              const shareOfCapPct = Math.round((allocatedAmount / totalCap) * 100);

              return (
                <div
                  key={category.id}
                  className="bg-neutral-subtle/50 border border-neutral-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div>
                    {/* Header: Icon, Category Name, Share Chip, Actions */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-neutral-surface border border-neutral-border flex items-center justify-center shrink-0">
                          {getCategoryIcon(category.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-display font-bold text-sm text-neutral-text leading-tight">
                            {category.name}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-muted block mt-0.5">
                            {shareOfCapPct}% of total cap
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsCategoryModalOpen(true);
                          }}
                          aria-label={`Edit ${category.name}`}
                          className="p-1.5 text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors"
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
                          className="p-1.5 text-neutral-muted hover:text-status-danger rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stat Key-Values in Monospace */}
                    <div className="space-y-1.5 font-mono text-xs bg-neutral-surface p-2.5 rounded-lg border border-neutral-border/60 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-muted font-sans text-xs">Allocated:</span>
                        <span className="font-bold text-neutral-text">
                          {formatCurrency(allocatedAmount, event.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-muted font-sans text-xs">Actual Spent:</span>
                        <span className="font-semibold text-status-success">
                          {formatCurrency(totalActual, event.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-neutral-border/50 pt-1">
                        <span className="text-neutral-muted font-sans text-xs">Remaining:</span>
                        <span
                          className={`font-bold ${
                            variance >= 0 ? 'text-status-success' : 'text-status-danger'
                          }`}
                        >
                          {variance >= 0 ? '+' : ''}
                          {formatCurrency(variance, event.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Spent Percentage Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-neutral-border/40 rounded-full overflow-hidden border border-neutral-border/60">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            spentPct >= 100
                              ? 'bg-status-danger'
                              : spentPct > 80
                              ? 'bg-secondary'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${spentPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-neutral-muted">
                        <span>{spentPct}% utilized</span>
                        <span>{expenseCount} {expenseCount === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add Expense Quick Action */}
                  <div className="mt-4 pt-3 border-t border-neutral-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-muted">
                      {variance >= 0 ? 'On budget' : 'Overrun'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedExpense(null);
                        setDefaultExpenseCatId(category.id);
                        setIsExpenseModalOpen(true);
                      }}
                      className="text-xs font-bold text-secondary hover:text-secondary-hover underline flex items-center gap-1 active:scale-[0.98] transition-all"
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
      </section>

      {/* =========================================================================
          5. GRANULAR EXPENSE ITEMS LEDGER TABLE
      ========================================================================= */}
      <section className="bg-neutral-surface border border-neutral-border rounded-xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-border">
          <div>
            <h3 className="font-display text-lg font-bold text-neutral-text">
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
                className="bg-neutral-subtle border border-neutral-border rounded-md px-2.5 py-1.5 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
              >
                <option value="all">All Categories ({categories.length})</option>
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
              className="bg-neutral-subtle border border-neutral-border rounded-md px-2.5 py-1.5 text-xs text-neutral-text focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="projected">Projected Only</option>
              <option value="deposit_paid">Deposit Paid Only</option>
              <option value="settled">Settled Only</option>
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-neutral-border rounded-xl">
            <FileSpreadsheet className="w-9 h-9 text-neutral-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-neutral-text">No expense items match your criteria</p>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-text bg-primary hover:bg-primary-hover rounded-md transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-subtle/80 text-neutral-muted uppercase tracking-wider font-semibold border-b border-neutral-border">
                <tr>
                  <th scope="col" className="py-3 px-3.5">
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
                  <th scope="col" className="py-3 px-3.5 text-right">
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
                      className="hover:bg-primary-subtle/20 transition-colors group"
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-text text-sm leading-tight">
                          {exp.title}
                        </div>
                        {exp.notes && (
                          <div className="text-[11px] text-neutral-muted mt-0.5 max-w-md line-clamp-1">
                            {exp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-subtle border border-neutral-border text-neutral-text text-xs font-medium">
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
                      <td className="py-3 px-3 text-right font-mono text-neutral-text whitespace-nowrap tabular-nums">
                        {formatCurrency(exp.estimatedAmount, event.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap tabular-nums">
                        {typeof exp.actualAmount === 'number' ? (
                          <span className="font-bold text-status-success">
                            {formatCurrency(exp.actualAmount, event.currency)}
                          </span>
                        ) : (
                          <span className="text-neutral-muted text-[11px] font-mono italic">Unbilled</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExpense(exp);
                              setIsExpenseModalOpen(true);
                            }}
                            aria-label={`Edit ${exp.title}`}
                            className="p-1.5 text-neutral-muted hover:text-neutral-text rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            aria-label={`Delete ${exp.title}`}
                            className="p-1.5 text-neutral-muted hover:text-status-danger rounded-md hover:bg-neutral-surface border border-transparent hover:border-neutral-border transition-colors"
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
      </section>

      {/* =========================================================================
          MODALS & DIALOGS
      ========================================================================= */}
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
        guestTarget={event.guestTarget}
        onSave={handleSaveExpense}
      />

      <ScenarioSimulationModal
        isOpen={isScenarioSimulationOpen}
        onClose={() => setIsScenarioSimulationOpen(false)}
        event={event}
        onApplyScenario={(updated) => onUpdateEvent(updated)}
      />

      <DynamicReplanningModal
        isOpen={isDynamicReplanningOpen}
        onClose={() => setIsDynamicReplanningOpen(false)}
        event={event}
        onApplyPlan={(updated) => onUpdateEvent(updated)}
      />
    </div>
  );
}
