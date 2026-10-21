'use client';

import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { BudgetCategory, Expense } from '../../features/events/types';
import { canDeleteCategory } from '../../features/events/budget-engine';
import { Dialog } from '../ui/Dialog';

export interface CategoryDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: BudgetCategory | null;
  expenses: Expense[];
  onConfirmDelete: (categoryId: string) => void;
}

export function CategoryDeleteDialog({
  isOpen,
  onClose,
  category,
  expenses,
  onConfirmDelete,
}: CategoryDeleteDialogProps) {
  if (!category) return null;

  const safety = canDeleteCategory(category.id, expenses);

  const handleDelete = () => {
    if (safety.canDelete) {
      onConfirmDelete(category.id);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Budget Category"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {!safety.canDelete ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-status-danger-subtle border border-status-danger/30 rounded-lg text-sm text-status-danger">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cannot Delete Category</p>
                <p className="text-xs text-status-danger/90 mt-1">
                  <strong>{category.name}</strong> currently has{' '}
                  <strong>{safety.associatedCount}</strong> recorded expense item
                  {safety.associatedCount === 1 ? '' : 's'}. Deleting an active category would orphan these financial records.
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-muted">
              Please reassign or delete the associated expense items before deleting this category.
            </p>
            <div className="border-t border-neutral-border pt-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm font-semibold text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-status-warning-subtle border border-status-warning/40 rounded-lg text-sm text-neutral-text">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-secondary mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-text">Confirm Deletion</p>
                <p className="text-xs text-neutral-muted mt-1">
                  Are you sure you want to remove <strong>{category.name}</strong>? Its allocated planned budget will return to your unallocated pool.
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-border pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-status-danger hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
