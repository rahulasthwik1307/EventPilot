'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { SeatingTable, TableInput, TableType } from '../../features/seating/types';
import { TABLE_TYPES, validateTableInput } from '../../features/seating/seating-engine';

export interface TableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableData: TableInput) => void;
  table?: SeatingTable | null;
}

export function TableDialog({
  isOpen,
  onClose,
  onSave,
  table,
}: TableDialogProps) {
  const isEditing = Boolean(table);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [tableType, setTableType] = useState<TableType>('round');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (table) {
      setName(table.name);
      setCapacity(String(table.capacity));
      setTableType(table.tableType || 'round');
      setNotes(table.notes || '');
    } else {
      setName('');
      setCapacity('8');
      setTableType('round');
      setNotes('');
    }
    setErrors({});
  }, [table, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedCapacity = parseInt(capacity, 10);
    const inputData: TableInput = {
      name: name.trim(),
      capacity: Number.isInteger(parsedCapacity) ? parsedCapacity : 0,
      tableType,
      notes: notes.trim() || undefined,
    };

    const validation = validateTableInput(inputData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(inputData);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Seating Table' : 'Add Seating Table'}
      description="Configure table seating capacity, shape, and physical location notes."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="table-name" className="block text-xs font-semibold uppercase text-neutral-muted">
            Table Name / Identifier <span className="text-status-danger">*</span>
          </label>
          <input
            id="table-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="e.g. Table 1 - Mandap Royal, Elders Dining Table"
            className={`w-full px-3 py-2 text-sm bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
              errors.name
                ? 'border-status-danger focus:ring-status-danger'
                : 'border-neutral-border focus:ring-primary'
            }`}
          />
          {errors.name && <p className="text-xs text-status-danger mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="table-capacity" className="block text-xs font-semibold uppercase text-neutral-muted">
              Seat Capacity <span className="text-status-danger">*</span>
            </label>
            <input
              id="table-capacity"
              type="number"
              min="1"
              max="50"
              step="1"
              value={capacity}
              onChange={(e) => {
                setCapacity(e.target.value);
                if (errors.capacity) setErrors((prev) => ({ ...prev, capacity: '' }));
              }}
              className={`w-full px-3 py-2 text-sm font-mono bg-neutral-surface border rounded-md focus:outline-none focus:ring-1 ${
                errors.capacity
                  ? 'border-status-danger focus:ring-status-danger'
                  : 'border-neutral-border focus:ring-primary'
              }`}
            />
            {errors.capacity && (
              <p className="text-xs text-status-danger mt-1">{errors.capacity}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="table-type" className="block text-xs font-semibold uppercase text-neutral-muted">
              Table Style / Layout
            </label>
            <select
              id="table-type"
              value={tableType}
              onChange={(e) => setTableType(e.target.value as TableType)}
              className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {TABLE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="table-notes" className="block text-xs font-semibold uppercase text-neutral-muted">
            Location &amp; Special Arrangements Notes
          </label>
          <textarea
            id="table-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Near mandap ramp, reserved for grandmothers, requires wheelchair clearance..."
            className="w-full px-3 py-2 text-sm bg-neutral-surface border border-neutral-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-neutral-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditing ? 'Save Table' : 'Add Table'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
