'use client';

import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { SeatingTable } from '../../features/seating/types';
import { AlertTriangle } from 'lucide-react';

export interface TableDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  table: SeatingTable | null;
  seatedCount: number;
}

export function TableDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  table,
  seatedCount,
}: TableDeleteDialogProps) {
  if (!table) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Seating Table"
      description="Remove this table from the banquet floor plan."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-status-danger-subtle border border-status-danger/30 p-3.5 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-text leading-relaxed">
            <p className="font-semibold text-status-danger mb-1">
              Delete &ldquo;{table.name}&rdquo;?
            </p>
            <p className="text-neutral-muted">
              {seatedCount > 0
                ? `${seatedCount} seated attendee(s) will be unseated and returned to the Unassigned Expected Attendees pool. No guest records will be deleted.`
                : 'This table currently has no seated attendees.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose} className="w-full sm:w-auto">
            Keep Table
          </Button>
          <Button
            variant="danger"
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete Table
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
