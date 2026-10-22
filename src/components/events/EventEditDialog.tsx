'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { CurrencyCode, Event, EventType } from '../../features/events/types';
import { validateEventInput } from '../../features/events/validation';
import { eventStorage } from '../../features/events/storage';
import { reanchorTimelineOnDateChange } from '../../features/events/timeline-engine';
import { Dialog } from '../ui/Dialog';

export interface EventEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onSuccess: (updatedEvent: Event) => void;
}

export function EventEditDialog({
  isOpen,
  onClose,
  event,
  onSuccess,
}: EventEditDialogProps) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [location, setLocation] = useState(event.location || '');
  const [guestTarget, setGuestTarget] = useState(String(event.guestTarget));
  const [budgetCap, setBudgetCap] = useState(String(event.budgetCap));
  const [currency, setCurrency] = useState<CurrencyCode>(event.currency);
  const [traditionOrTheme, setTraditionOrTheme] = useState(
    event.culturalContext?.traditionOrTheme || ''
  );
  const [notes, setNotes] = useState(event.culturalContext?.notes || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(event.title);
      setDate(event.date);
      setLocation(event.location || '');
      setGuestTarget(String(event.guestTarget));
      setBudgetCap(String(event.budgetCap));
      setCurrency(event.currency);
      setTraditionOrTheme(event.culturalContext?.traditionOrTheme || '');
      setNotes(event.culturalContext?.notes || '');
      setErrors({});
      setSaveError(null);
    }
  }, [isOpen, event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const validation = validateEventInput({
      type: event.type,
      title,
      date,
      location,
      guestTarget: Number(guestTarget),
      budgetCap: Number(budgetCap),
      currency,
      culturalContext: traditionOrTheme || notes ? { traditionOrTheme, notes } : undefined,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSaving(true);

    let updatedMilestones = event.milestones || [];
    let updatedTasks = event.tasks || [];

    // Trigger deterministic timeline re-anchoring when celebration date changes
    if (validation.data.date !== event.date && updatedMilestones.length > 0) {
      const reanchored = reanchorTimelineOnDateChange(
        updatedMilestones,
        updatedTasks,
        validation.data.date
      );
      updatedMilestones = reanchored.milestones;
      updatedTasks = reanchored.tasks;
    }

    const updated: Event = {
      ...event,
      ...validation.data,
      milestones: updatedMilestones,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    };

    let saveRes;
    if (event.isSample) {
      saveRes = eventStorage.saveSampleEvent(updated);
    } else {
      saveRes = eventStorage.savePersonalEvent(updated);
    }

    if (!saveRes.success) {
      setSaveError(saveRes.error?.message || 'Failed to persist event updates.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onSuccess(updated);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Celebration Details"
      description="Update core parameters for this celebration workspace."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {saveError && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3 rounded-md text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="edit-title"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Title <span className="text-secondary">*</span>
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.title && (
            <p className="text-xs text-status-danger mt-1">{errors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="edit-date"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Date <span className="text-secondary">*</span>
            </label>
            <input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.date && (
              <p className="text-xs text-status-danger mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-location"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Location / Venue
            </label>
            <input
              id="edit-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="edit-guest-target"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Guest Count <span className="text-secondary">*</span>
            </label>
            <input
              id="edit-guest-target"
              type="number"
              min="1"
              value={guestTarget}
              onChange={(e) => setGuestTarget(e.target.value)}
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.guestTarget && (
              <p className="text-xs text-status-danger mt-1">{errors.guestTarget}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="edit-budget-cap"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
            >
              Budget Cap <span className="text-secondary">*</span>
            </label>
            <div className="flex gap-2 min-w-0">
              <select
                aria-label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="flex-shrink-0 bg-neutral-subtle border border-neutral-border px-2.5 py-2 rounded-md text-sm font-mono text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <input
                id="edit-budget-cap"
                type="number"
                min="1000"
                step="1000"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
                className="flex-1 min-w-0 bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {errors.budgetCap && (
              <p className="text-xs text-status-danger mt-1">{errors.budgetCap}</p>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-border/60 pt-3">
          <label
            htmlFor="edit-theme"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1"
          >
            Ceremonial Tradition / Theme
          </label>
          <input
            id="edit-theme"
            type="text"
            value={traditionOrTheme}
            onChange={(e) => setTraditionOrTheme(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
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
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
