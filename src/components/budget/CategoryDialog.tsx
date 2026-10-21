'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { BudgetCategory, CurrencyCode } from '../../features/events/types';
import { Dialog } from '../ui/Dialog';

export interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: BudgetCategory | null; // null if creating
  currency: CurrencyCode;
  onSave: (category: { id: string; name: string; allocatedAmount: number }) => void;
}

export function CategoryDialog({
  isOpen,
  onClose,
  category,
  currency,
  onSave,
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setAllocatedAmount(String(category.allocatedAmount));
      } else {
        setName('');
        setAllocatedAmount('0');
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Category name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters.';
    } else if (trimmedName.length > 80) {
      newErrors.name = 'Category name cannot exceed 80 characters.';
    }

    const amountNum = Number(allocatedAmount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      newErrors.allocatedAmount = 'Allocated amount must be a positive number or zero.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: category ? category.id : `cat-custom-${Date.now()}`,
      name: trimmedName,
      allocatedAmount: Math.round(amountNum),
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Budget Category' : 'Add Budget Category'}
      description="Allocate a portion of your celebration budget to this dedicated ledger category."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="cat-name-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Category Name <span className="text-secondary">*</span>
          </label>
          <input
            id="cat-name-input"
            type="text"
            placeholder="e.g. Mandap Floral Architecture"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.name && (
            <p className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cat-amount-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Allocated Planned Amount ({currency}) <span className="text-secondary">*</span>
          </label>
          <input
            id="cat-amount-input"
            type="number"
            min="0"
            step="1000"
            value={allocatedAmount}
            onChange={(e) => setAllocatedAmount(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.allocatedAmount && (
            <p className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.allocatedAmount}</span>
            </p>
          )}
        </div>

        <div className="border-t border-neutral-border pt-4 flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm"
          >
            {category ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
