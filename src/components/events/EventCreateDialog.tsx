'use client';

import React, { useState } from 'react';
import { Heart, Cake, Users, AlertCircle } from 'lucide-react';
import { CurrencyCode, Event, EventType } from '../../features/events/types';
import { validateEventInput } from '../../features/events/validation';
import { eventStorage } from '../../features/events/storage';
import { generateStarterCategories } from '../../features/events/budget-engine';
import { generateStarterMilestones, generateStarterTasks } from '../../features/events/timeline-engine';
import { Dialog } from '../ui/Dialog';

export interface EventCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: Event) => void;
  initialType?: EventType;
}

export function EventCreateDialog({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'wedding',
}: EventCreateDialogProps) {
  const [type, setType] = useState<EventType>(initialType);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestTarget, setGuestTarget] = useState<string>('150');
  const [budgetCap, setBudgetCap] = useState<string>('1000000');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [traditionOrTheme, setTraditionOrTheme] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial type when dialog opens with specific type
  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateEventInput({
      type,
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

    setIsSubmitting(true);

    try {
      const newId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const now = new Date().toISOString();
      const categories = generateStarterCategories(
        validation.data.budgetCap,
        validation.data.type
      );
      const milestones = generateStarterMilestones(validation.data.type);
      const tasks = generateStarterTasks(
        milestones,
        validation.data.date,
        validation.data.type
      );

      const newEvent: Event = {
        id: newId,
        ...validation.data,
        categories,
        expenses: [],
        milestones,
        tasks,
        vendors: [],
        households: [],
        guests: [],
        tables: [],
        assignments: [],
        isSample: false,
        createdAt: now,
        updatedAt: now,
      };

      const saveRes = eventStorage.savePersonalEvent(newEvent);
      if (!saveRes.success) {
        setSubmitError(saveRes.error?.message || 'Failed to save event to browser storage.');
        setIsSubmitting(false);
        return;
      }

      eventStorage.setActiveEventId(newEvent.id);
      setIsSubmitting(false);
      onSuccess(newEvent);
      onClose();
    } catch (err) {
      setSubmitError('An unexpected error occurred while saving the event.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Celebration Plan"
      description="Enter the core details to establish your deterministic planning workspace."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-status-danger-subtle text-status-danger border border-status-danger/30 p-3 rounded-md text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. Archetype Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-2">
            Celebration Archetype <span className="text-secondary">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'wedding' as EventType, label: 'Wedding / Vivaha', icon: Heart },
              { id: 'birthday' as EventType, label: 'Milestone Birthday', icon: Cake },
              { id: 'community' as EventType, label: 'Community Festival', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setType(item.id);
                    if (errors.type) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.type;
                        return next;
                      });
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-subtle/50 text-neutral-text font-semibold shadow-sm'
                      : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle text-neutral-text/80'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-1.5 ${
                      isSelected ? 'text-primary-hover' : 'text-neutral-muted'
                    }`}
                  />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p className="text-xs text-status-danger mt-1.5">{errors.type}</p>
          )}
        </div>

        {/* 2. Event Title */}
        <div>
          <label
            htmlFor="event-title"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5"
          >
            Celebration Title <span className="text-secondary">*</span>
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.title;
                  return next;
                });
              }
            }}
            placeholder="e.g. Priya &amp; Rohan's Vivaha Celebration"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            className={`w-full bg-neutral-surface border px-3.5 py-2.5 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.title ? 'border-status-danger' : 'border-neutral-border'
            }`}
          />
          {errors.title && (
            <p id="title-error" className="text-xs text-status-danger mt-1">
              {errors.title}
            </p>
          )}
        </div>

        {/* 3. Event Date & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="event-date"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5"
            >
              Celebration Date <span className="text-secondary">*</span>
            </label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.date;
                    return next;
                  });
                }
              }}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'date-error' : undefined}
              className={`w-full bg-neutral-surface border px-3.5 py-2.5 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.date ? 'border-status-danger' : 'border-neutral-border'
              }`}
            />
            {errors.date && (
              <p id="date-error" className="text-xs text-status-danger mt-1">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="event-location"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5"
            >
              Location / Venue (Optional)
            </label>
            <input
              id="event-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Taj West End, Bengaluru"
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2.5 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* 4. Guest Target & Budget Cap */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="event-guest-target"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5"
            >
              Expected Guests <span className="text-secondary">*</span>
            </label>
            <input
              id="event-guest-target"
              type="number"
              min="1"
              max="100000"
              value={guestTarget}
              onChange={(e) => {
                setGuestTarget(e.target.value);
                if (errors.guestTarget) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.guestTarget;
                    return next;
                  });
                }
              }}
              aria-invalid={Boolean(errors.guestTarget)}
              aria-describedby={errors.guestTarget ? 'guest-error' : undefined}
              className={`w-full bg-neutral-surface border px-3.5 py-2.5 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.guestTarget ? 'border-status-danger' : 'border-neutral-border'
              }`}
            />
            {errors.guestTarget && (
              <p id="guest-error" className="text-xs text-status-danger mt-1">
                {errors.guestTarget}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="event-budget-cap"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5"
            >
              Total Budget Cap <span className="text-secondary">*</span>
            </label>
            <div className="flex gap-2">
              <select
                aria-label="Event Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-neutral-subtle border border-neutral-border px-3 py-2.5 rounded-md text-sm font-mono text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <input
                id="event-budget-cap"
                type="number"
                min="1000"
                step="1000"
                value={budgetCap}
                onChange={(e) => {
                  setBudgetCap(e.target.value);
                  if (errors.budgetCap) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.budgetCap;
                      return next;
                    });
                  }
                }}
                aria-invalid={Boolean(errors.budgetCap)}
                aria-describedby={errors.budgetCap ? 'budget-error' : undefined}
                className={`flex-1 bg-neutral-surface border px-3.5 py-2.5 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.budgetCap ? 'border-status-danger' : 'border-neutral-border'
                }`}
              />
            </div>
            {errors.budgetCap && (
              <p id="budget-error" className="text-xs text-status-danger mt-1">
                {errors.budgetCap}
              </p>
            )}
          </div>
        </div>

        {/* 5. Cultural & Celebration Context (Optional, strictly opt-in) */}
        <div className="border-t border-neutral-border/60 pt-4 space-y-4">
          <div>
            <label
              htmlFor="event-theme"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1.5"
            >
              Ceremonial Tradition or Theme (Optional)
            </label>
            <input
              id="event-theme"
              type="text"
              value={traditionOrTheme}
              onChange={(e) => setTraditionOrTheme(e.target.value)}
              placeholder="e.g. Traditional South Indian Vivaha, Eco-friendly Outdoor Mela"
              className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2.5 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-neutral-muted mt-1">
              Strictly opt-in: Event Pilot adapts to your stated tradition and never assumes religious or cultural practices.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-neutral-border pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Establishing Plan...' : 'Create Celebration Plan'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
