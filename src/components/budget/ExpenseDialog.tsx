'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, Users, Calculator } from 'lucide-react';
import { BudgetCategory, CurrencyCode, Expense, PaymentStatus, CostModelType } from '../../features/events/types';
import { formatCurrency } from '../../features/events/validation';
import { Dialog } from '../ui/Dialog';

export interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null; // null if creating
  categories: BudgetCategory[];
  defaultCategoryId?: string;
  currency: CurrencyCode;
  guestTarget?: number;
  onSave: (expense: {
    id: string;
    categoryId: string;
    title: string;
    estimatedAmount: number;
    actualAmount?: number;
    paymentStatus: PaymentStatus;
    notes?: string;
    costModel?: CostModelType;
    unitCost?: number;
  }) => void;
}

export function ExpenseDialog({
  isOpen,
  onClose,
  expense,
  categories,
  defaultCategoryId,
  currency,
  guestTarget,
  onSave,
}: ExpenseDialogProps) {
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [costModel, setCostModel] = useState<CostModelType>('fixed');
  const [unitCost, setUnitCost] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('projected');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setCategoryId(expense.categoryId);
        setTitle(expense.title);
        setCostModel(expense.costModel || 'fixed');
        setUnitCost(typeof expense.unitCost === 'number' ? String(expense.unitCost) : '');
        setEstimatedAmount(String(expense.estimatedAmount));
        setActualAmount(
          typeof expense.actualAmount === 'number' ? String(expense.actualAmount) : ''
        );
        setPaymentStatus(expense.paymentStatus);
        setNotes(expense.notes || '');
      } else {
        setCategoryId(
          defaultCategoryId || (categories.length > 0 ? categories[0].id : '')
        );
        setTitle('');
        setCostModel('fixed');
        setUnitCost('');
        setEstimatedAmount('');
        setActualAmount('');
        setPaymentStatus('projected');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, expense, categories, defaultCategoryId]);

  const handleUnitCostChange = (val: string) => {
    setUnitCost(val);
    const num = Number(val);
    if (Number.isFinite(num) && num >= 0 && typeof guestTarget === 'number' && guestTarget > 0) {
      setEstimatedAmount(String(Math.round(num * guestTarget)));
    }
  };

  const handleCostModelToggle = (model: CostModelType) => {
    setCostModel(model);
    if (model === 'per_guest') {
      const est = Number(estimatedAmount);
      if (Number.isFinite(est) && est > 0 && typeof guestTarget === 'number' && guestTarget > 0) {
        setUnitCost(String(Math.round(est / guestTarget)));
      }
    }
  };

  const handleCopyEstimateToActual = () => {
    const est = Number(estimatedAmount);
    if (Number.isFinite(est) && est >= 0) {
      setActualAmount(String(Math.round(est)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!categoryId) {
      newErrors.categoryId = 'Please select a budget category.';
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Expense title is required.';
    } else if (trimmedTitle.length < 2) {
      newErrors.title = 'Title must be at least 2 characters.';
    } else if (trimmedTitle.length > 120) {
      newErrors.title = 'Title cannot exceed 120 characters.';
    }

    let parsedUnitCost: number | undefined = undefined;
    if (costModel === 'per_guest') {
      const uNum = Number(unitCost);
      if (!Number.isFinite(uNum) || uNum < 0) {
        newErrors.unitCost = 'Rate per guest must be a positive number or zero.';
      } else {
        parsedUnitCost = Math.round(uNum);
      }
    }

    const estNum = Number(estimatedAmount);
    if (!Number.isFinite(estNum) || estNum < 0) {
      newErrors.estimatedAmount = 'Estimated amount must be a positive number or zero.';
    }

    let parsedActual: number | undefined = undefined;
    if (actualAmount.trim() !== '') {
      const actNum = Number(actualAmount);
      if (!Number.isFinite(actNum) || actNum < 0) {
        newErrors.actualAmount = 'Actual amount must be a positive number or zero.';
      } else {
        parsedActual = Math.round(actNum);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: expense ? expense.id : `exp-${Date.now()}`,
      categoryId,
      title: trimmedTitle,
      estimatedAmount: Math.round(estNum),
      actualAmount: parsedActual,
      paymentStatus,
      costModel,
      unitCost: parsedUnitCost,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Expense Item' : 'Add Expense Item'}
      description="Record an estimated or actual expense line item in your celebration ledger."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Category selector */}
        <div>
          <label
            htmlFor="expense-category-select"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Budget Category <span className="text-secondary">*</span>
          </label>
          <select
            id="expense-category-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? 'expense-category-error' : undefined}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.length === 0 && (
              <option value="">No categories defined yet</option>
            )}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({formatCurrency(c.allocatedAmount, currency)} allocated)
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p id="expense-category-error" className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.categoryId}</span>
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="expense-title-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Expense Title <span className="text-secondary">*</span>
          </label>
          <input
            id="expense-title-input"
            type="text"
            placeholder="e.g. Kalyana Mandapam Advance Payment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'expense-title-error' : undefined}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.title && (
            <p id="expense-title-error" className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        {/* Cost Model Selection */}
        <div>
          <label id="cost-model-label" className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5">
            Cost Model
          </label>
          <div role="radiogroup" aria-labelledby="cost-model-label" className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              role="radio"
              aria-checked={costModel === 'fixed'}
              tabIndex={costModel === 'fixed' ? 0 : -1}
              onClick={() => handleCostModelToggle('fixed')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  handleCostModelToggle('per_guest');
                }
              }}
              className={`p-2.5 rounded-md border text-left font-medium transition-all ${
                costModel === 'fixed'
                  ? 'border-primary bg-primary-subtle text-neutral-text font-semibold shadow-xs'
                  : 'border-neutral-border bg-neutral-surface text-neutral-muted hover:bg-neutral-subtle'
              }`}
            >
              <div className="font-semibold text-neutral-text">Fixed Lump Sum</div>
              <div className="text-[11px] text-neutral-muted mt-0.5">Fixed commitment (e.g. Venue, Photography)</div>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={costModel === 'per_guest'}
              tabIndex={costModel === 'per_guest' ? 0 : -1}
              onClick={() => handleCostModelToggle('per_guest')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  handleCostModelToggle('fixed');
                }
              }}
              className={`p-2.5 rounded-md border text-left font-medium transition-all ${
                costModel === 'per_guest'
                  ? 'border-primary bg-primary-subtle text-neutral-text font-semibold shadow-xs'
                  : 'border-neutral-border bg-neutral-surface text-neutral-muted hover:bg-neutral-subtle'
              }`}
            >
              <div className="font-semibold text-neutral-text flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Per-Guest Rate</span>
              </div>
              <div className="text-[11px] text-neutral-muted mt-0.5">Scales with headcount (e.g. Catering)</div>
            </button>
          </div>
        </div>

        {/* Per-Guest Unit Cost input if costModel === 'per_guest' */}
        {costModel === 'per_guest' && (
          <div className="bg-neutral-subtle/60 p-3 rounded-md border border-neutral-border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="expense-unit-cost" className="font-semibold text-neutral-text">
                Rate per Guest ({currency}) <span className="text-secondary">*</span>
              </label>
              {typeof guestTarget === 'number' && guestTarget > 0 && (
                <span className="text-neutral-muted font-mono text-[11px]">
                  Target: {guestTarget} guests
                </span>
              )}
            </div>
            <input
              id="expense-unit-cost"
              type="number"
              min="0"
              step="50"
              placeholder="e.g. 2400"
              value={unitCost}
              onChange={(e) => handleUnitCostChange(e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.unitCost)}
              aria-describedby={errors.unitCost ? 'expense-unit-cost-error' : undefined}
              className="w-full bg-neutral-surface border border-neutral-border px-3 py-1.5 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.unitCost && (
              <p id="expense-unit-cost-error" className="text-xs text-status-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.unitCost}</span>
              </p>
            )}
            {typeof guestTarget === 'number' && guestTarget > 0 && unitCost && (
              <p className="text-[11px] text-neutral-muted flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-primary" />
                <span>
                  Projected total: {guestTarget} guests × {formatCurrency(Number(unitCost) || 0, currency)} ={' '}
                  <strong className="text-neutral-text font-mono">
                    {formatCurrency(Math.round((Number(unitCost) || 0) * guestTarget), currency)}
                  </strong>
                </span>
              </p>
            )}
          </div>
        )}

        {/* Amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="expense-est-input"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Estimated Amount ({currency}) <span className="text-secondary">*</span>
            </label>
            <input
              id="expense-est-input"
              type="number"
              min="0"
              step="500"
              placeholder="0"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(errors.estimatedAmount)}
              aria-describedby={errors.estimatedAmount ? 'expense-est-error' : undefined}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.estimatedAmount && (
              <p id="expense-est-error" className="text-xs text-status-danger mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.estimatedAmount}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="expense-actual-input"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-text"
              >
                Actual Spent ({currency})
              </label>
              {estimatedAmount && Number(estimatedAmount) > 0 && (
                <button
                  type="button"
                  onClick={handleCopyEstimateToActual}
                  className="text-xs text-secondary hover:text-secondary-hover font-medium underline flex items-center gap-0.5"
                >
                  <span>Set = Est</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <input
              id="expense-actual-input"
              type="number"
              min="0"
              step="500"
              placeholder="Leave blank if unpaid"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.actualAmount && (
              <p className="text-xs text-status-danger mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.actualAmount}</span>
              </p>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5">
            Payment Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus('projected')}
              className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                paymentStatus === 'projected'
                  ? 'bg-neutral-subtle border-neutral-text text-neutral-text font-semibold shadow-xs'
                  : 'bg-neutral-surface border-neutral-border text-neutral-muted hover:bg-neutral-subtle'
              }`}
            >
              Projected
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('deposit_paid')}
              className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                paymentStatus === 'deposit_paid'
                  ? 'bg-primary-subtle border-primary text-neutral-text font-semibold shadow-xs'
                  : 'bg-neutral-surface border-neutral-border text-neutral-muted hover:bg-neutral-subtle'
              }`}
            >
              Deposit Paid
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('settled')}
              className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-all ${
                paymentStatus === 'settled'
                  ? 'bg-status-success-subtle border-status-success text-status-success font-semibold shadow-xs'
                  : 'bg-neutral-surface border-neutral-border text-neutral-muted hover:bg-neutral-subtle'
              }`}
            >
              Settled
            </button>
          </div>
          <p className="text-xs text-neutral-muted mt-1.5">
            {paymentStatus === 'projected' && 'Estimated expense line; no payments released.'}
            {paymentStatus === 'deposit_paid' && 'Advance or partial booking amount released.'}
            {paymentStatus === 'settled' && 'Final invoice paid in full. Remember to enter the actual amount spent above.'}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="expense-notes-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1"
          >
            Notes &amp; Vendor Contract Terms
          </label>
          <textarea
            id="expense-notes-input"
            rows={2}
            placeholder="e.g. Includes stage lighting generator and cleanup crew"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border-t border-neutral-border pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-all active:scale-[0.98] text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm active:scale-[0.98] text-center"
          >
            {expense ? 'Save Expense' : 'Add to Ledger'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
