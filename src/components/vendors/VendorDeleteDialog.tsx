'use client';

import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Vendor } from '../../features/vendors/types';
import { AlertTriangle } from 'lucide-react';

export interface VendorDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vendor: Vendor | null;
}

export function VendorDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  vendor,
}: VendorDeleteDialogProps) {
  if (!vendor) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Vendor Record"
      description="Remove this vendor from your active celebration contacts."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-status-danger-subtle border border-status-danger/30 p-3.5 rounded-md flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-text leading-relaxed">
            <p className="font-semibold text-status-danger mb-1">
              Are you sure you want to delete &ldquo;{vendor.name}&rdquo;?
            </p>
            <p className="text-neutral-muted">
              All recorded quotes, agreed commitments, and payment notes for this vendor will be removed. Your Budget Ledger expense entries will remain completely intact.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Keep Vendor
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete Vendor
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
