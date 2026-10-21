'use client';

import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { GuestHousehold } from '../../features/guests/types';
import { AlertTriangle, Users } from 'lucide-react';

export interface HouseholdDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  household: GuestHousehold | null;
  memberCount: number;
}

export function HouseholdDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  household,
  memberCount,
}: HouseholdDeleteDialogProps) {
  if (!household) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Household Group"
      description="Remove this group while keeping its individual guest records safe."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-status-danger-subtle border border-status-danger/30 p-3.5 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-text leading-relaxed">
            <p className="font-semibold text-status-danger mb-1">
              Delete &ldquo;{household.name}&rdquo;?
            </p>
            <p className="text-neutral-muted">
              {memberCount > 0
                ? `${memberCount} guest member(s) will be moved to the Ungrouped list. No guest records, RSVP statuses, or plus-one allocations will be deleted.`
                : 'This household currently has no guest members.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Keep Group
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Dissolve Group
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
