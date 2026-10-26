'use client';

import React, { useState } from 'react';
import { Heart, Cake, Users, AlertCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { CurrencyCode, Event, EventType, EventPreferences } from '../../features/events/types';
import { validateEventInput, formatCurrency } from '../../features/events/validation';
import { eventStorage } from '../../features/events/storage';
import { generateStarterCategories } from '../../features/events/budget-engine';
import { generateStarterMilestones, generateStarterTasks } from '../../features/events/timeline-engine';
import { Dialog } from '../ui/Dialog';
import { PreferencesForm } from '../preferences/PreferencesForm';
import { createEmptyPreferences } from '../../features/preferences/preferences';

export interface EventCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: Event) => void;
  initialType?: EventType;
}

export const ARCHETYPE_SUGGESTED_DEFAULTS: Record<
  EventType,
  { guestTarget: number; budgetCap: number }
> = {
  wedding: { guestTarget: 250, budgetCap: 1500000 },
  birthday: { guestTarget: 50, budgetCap: 150000 },
  community: { guestTarget: 500, budgetCap: 500000 },
};

export function EventCreateDialog({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'wedding',
}: EventCreateDialogProps) {
  const initialDefaults =
    ARCHETYPE_SUGGESTED_DEFAULTS[initialType] || ARCHETYPE_SUGGESTED_DEFAULTS.wedding;
  const [type, setType] = useState<EventType>(initialType);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [guestTarget, setGuestTarget] = useState<string>(String(initialDefaults.guestTarget));
  const [budgetCap, setBudgetCap] = useState<string>(String(initialDefaults.budgetCap));
  const [isGuestTargetDirty, setIsGuestTargetDirty] = useState(false);
  const [isBudgetCapDirty, setIsBudgetCapDirty] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [traditionOrTheme, setTraditionOrTheme] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [preferences, setPreferences] = useState<EventPreferences>(createEmptyPreferences());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial type when dialog opens with specific type
  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      const defaults =
        ARCHETYPE_SUGGESTED_DEFAULTS[initialType] || ARCHETYPE_SUGGESTED_DEFAULTS.wedding;
      setGuestTarget(String(defaults.guestTarget));
      setBudgetCap(String(defaults.budgetCap));
      setIsGuestTargetDirty(false);
      setIsBudgetCapDirty(false);
      setStep(1);
      setPreferences(createEmptyPreferences());
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, initialType]);

  const handleSelectArchetype = (newType: EventType) => {
    setType(newType);
    const defaults =
      ARCHETYPE_SUGGESTED_DEFAULTS[newType] || ARCHETYPE_SUGGESTED_DEFAULTS.wedding;
    if (!isGuestTargetDirty) {
      setGuestTarget(String(defaults.guestTarget));
      if (errors.guestTarget) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.guestTarget;
          return next;
        });
      }
    }
    if (!isBudgetCapDirty) {
      setBudgetCap(String(defaults.budgetCap));
      if (errors.budgetCap) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.budgetCap;
          return next;
        });
      }
    }
    if (errors.type) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.type;
        return next;
      });
    }
  };

  const handleProceedToStep2 = () => {
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

    setErrors({});
    setStep(2);
  };

  const createEventWithData = (includePreferences: boolean) => {
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
      preferences: includePreferences ? preferences : undefined,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.errors.title || validation.errors.date || validation.errors.guestTarget || validation.errors.budgetCap) {
        setStep(1);
      }
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
        version: 1,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventWithData(step === 2);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Create Celebration Plan' : 'Personalize Celebration Preferences'}
      description={
        step === 1
          ? 'Enter the core details to establish your deterministic planning workspace.'
          : 'Tailor priorities, financial flexibility, and guest comfort for this celebration (optional).'
      }
      maxWidth={step === 1 ? 'lg' : 'xl'}
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

        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded font-mono font-semibold ${
                step === 1 ? 'bg-primary text-neutral-text' : 'bg-neutral-subtle text-neutral-muted'
              }`}
            >
              Step {step} of 2
            </span>
            <span className="font-semibold text-neutral-text">
              {step === 1 ? 'Baseline Parameters' : 'Celebration Priorities (Optional)'}
            </span>
          </div>
          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              <span>Personalize Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-neutral-muted hover:text-neutral-text flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Baseline</span>
            </button>
          )}
        </div>

        {step === 1 ? (
          <>
            {/* 1. Archetype Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-2">
                Celebration Archetype <span className="text-secondary">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                      aria-pressed={isSelected}
                      onClick={() => handleSelectArchetype(item.id)}
                      className={`flex sm:flex-col items-center justify-start sm:justify-center p-3 rounded-md border text-left sm:text-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-subtle/50 text-neutral-text font-semibold shadow-sm'
                          : 'border-neutral-border bg-neutral-surface hover:bg-neutral-subtle text-neutral-text/80'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mr-3 sm:mr-0 sm:mb-1.5 flex-shrink-0 ${
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
                placeholder={
                  type === 'wedding'
                    ? "e.g. Priya & Rohan's Vivaha Celebration"
                    : type === 'birthday'
                    ? "e.g. Grandma's 80th Milestone Celebration"
                    : "e.g. Diwali Community Festival 2026"
                }
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
                    setIsGuestTargetDirty(true);
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
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs text-neutral-muted">Quick:</span>
                  {[50, 150, 250, 500].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setGuestTarget(String(count));
                        setIsGuestTargetDirty(true);
                        if (errors.guestTarget) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.guestTarget;
                            return next;
                          });
                        }
                      }}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        guestTarget === String(count)
                          ? 'bg-primary-subtle border-primary text-neutral-text font-semibold'
                          : 'bg-neutral-subtle border-neutral-border text-neutral-muted hover:text-neutral-text hover:border-neutral-text'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="event-budget-cap"
                  className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1.5"
                >
                  Total Budget Cap <span className="text-secondary">*</span>
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    aria-label="Event Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="flex-shrink-0 bg-neutral-subtle border border-neutral-border px-3 py-2.5 rounded-md text-sm font-mono text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
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
                      setIsBudgetCapDirty(true);
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
                    className={`flex-1 min-w-0 bg-neutral-surface border px-3.5 py-2.5 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.budgetCap ? 'border-status-danger' : 'border-neutral-border'
                    }`}
                  />
                </div>
                {errors.budgetCap && (
                  <p id="budget-error" className="text-xs text-status-danger mt-1">
                    {errors.budgetCap}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-neutral-muted">Quick:</span>
                    {(currency === 'INR'
                      ? [
                          { label: '₹10L', val: 1000000 },
                          { label: '₹25L', val: 2500000 },
                          { label: '₹50L', val: 5000000 },
                          { label: '₹1Cr', val: 10000000 },
                        ]
                      : [
                          { label: '25k', val: 25000 },
                          { label: '50k', val: 50000 },
                          { label: '100k', val: 100000 },
                          { label: '250k', val: 250000 },
                        ]
                    ).map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setBudgetCap(String(preset.val));
                          if (errors.budgetCap) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.budgetCap;
                              return next;
                            });
                          }
                        }}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                          budgetCap === String(preset.val)
                            ? 'bg-primary-subtle border-primary text-neutral-text font-semibold'
                            : 'bg-neutral-subtle border-neutral-border text-neutral-muted hover:text-neutral-text hover:border-neutral-text'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  {Number(budgetCap) > 0 && (
                    <span className="text-xs font-mono font-medium text-secondary">
                      {formatCurrency(Number(budgetCap), currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Live Calculation Dial: Cost Per Guest Ratio */}
            {Number(budgetCap) > 0 && Number(guestTarget) > 0 && (
              <div className="bg-neutral-subtle border border-neutral-border p-3.5 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary-subtle text-primary">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-text block">
                      Live Allocation Dial
                    </span>
                    <span className="text-neutral-muted">
                      Deterministic per-guest ratio computed in real time
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-neutral-muted block text-[11px]">Planned per guest:</span>
                  <strong className="text-secondary text-sm font-bold">
                    {formatCurrency(Math.round(Number(budgetCap) / Number(guestTarget)), currency)} / guest
                  </strong>
                </div>
              </div>
            )}

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

            {/* Step 1 Actions */}
            <div className="border-t border-neutral-border pt-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-all active:scale-[0.98] text-center"
              >
                Cancel
              </button>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-subtle hover:bg-neutral-border/40 border border-neutral-border transition-all active:scale-[0.98]"
                >
                  <span>Next: Personalize</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-center"
                >
                  {isSubmitting ? 'Establishing Plan...' : 'Create Celebration Plan'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Step 2 Body */}
            <div className="space-y-4">
              <div className="bg-primary-subtle/30 border border-primary/20 rounded-md p-3 text-xs text-neutral-text flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Optional Personalization:</span> Your choices establish verified constraints for intelligent trade-off suggestions and safe AI replanning. You can skip any question or refine later in conversation.
                </div>
              </div>

              <PreferencesForm
                eventType={type}
                values={preferences}
                onChange={setPreferences}
                disabled={isSubmitting}
              />
            </div>

            {/* Step 2 Actions */}
            <div className="border-t border-neutral-border pt-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => createEventWithData(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium text-neutral-muted hover:text-neutral-text transition-all text-center"
                >
                  Skip Personalization
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-center"
                >
                  {isSubmitting ? 'Establishing Plan...' : 'Save & Create Celebration Plan'}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
