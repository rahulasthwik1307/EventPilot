'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { GuestHousehold } from '../../features/guests/types';
import { validateHouseholdInput } from '../../features/guests/guest-engine';

export interface HouseholdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (householdData: { name: string; relationshipType?: string; notes?: string }) => void;
  household?: GuestHousehold | null;
}

export function HouseholdDialog({
  isOpen,
  onClose,
  onSave,
  household,
}: HouseholdDialogProps) {
  const isEditing = Boolean(household);

  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (household) {
      setName(household.name);
      setRelationshipType(household.relationshipType || '');
      setNotes(household.notes || '');
    } else {
      setName('');
      setRelationshipType('');
      setNotes('');
    }
    setErrors({});
  }, [household, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateHouseholdInput({ name });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave({
      name: name.trim(),
      relationshipType: relationshipType.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Household / Group' : 'Create Household / Group'}
      description="Organize families, batchmates, and invitation circles into manageable groups."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="household-name" className="block text-xs font-semibold uppercase text-neutral-muted">
            Household or Group Name <span className="text-status-danger">*</span>
          </label>
          <input
            id="household-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({});
            }}
            placeholder="e.g. The Sharma Family, College Friends, Indiranagar Neighbors"
            className={`w-full px-3 py-2 text-sm bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
              errors.name
                ? 'border-status-danger focus:ring-status-danger'
                : 'border-neutral-border focus:ring-primary'
            }`}
          />
          {errors.name && <p className="text-xs text-status-danger mt-1">{errors.name}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="household-rel" className="block text-xs font-semibold uppercase text-neutral-muted">
            Relationship Category <span className="text-xs font-normal lowercase text-neutral-muted">(optional)</span>
          </label>
          <input
            id="household-rel"
            type="text"
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
            placeholder="e.g. Bride Extended Family, Groom Friends, Neighborhood"
            className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="household-notes" className="block text-xs font-semibold uppercase text-neutral-muted">
            Group Notes
          </label>
          <textarea
            id="household-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Travel arrangements, lodging requests, arrival batch..."
            className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save Changes' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
