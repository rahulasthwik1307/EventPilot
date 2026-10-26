'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Sliders, Sparkles } from 'lucide-react';
import { CurrencyCode, Event, EventType, EventPreferences } from '../../features/events/types';
import { validateEventInput } from '../../features/events/validation';
import { eventStorage } from '../../features/events/storage';
import { reanchorTimelineOnDateChange } from '../../features/events/timeline-engine';
import { recalculatePerGuestExpenses } from '../../features/events/budget-engine';
import { Dialog } from '../ui/Dialog';
import { PreferencesForm } from '../preferences/PreferencesForm';
import { createEmptyPreferences } from '../../features/preferences/preferences';
import { calculateScenarioFinancials } from '../../features/tradeoffs/scenario-engine';
import { generateTradeOffOptions } from '../../features/tradeoffs/tradeoff-generator';
import { ScenarioImpactPreview } from '../tradeoffs/ScenarioImpactPreview';

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
  const [activeTab, setActiveTab] = useState<'details' | 'preferences'>('details');
  const [preferences, setPreferences] = useState<EventPreferences>(
    event.preferences || createEmptyPreferences()
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Scenario impact and trade-off states
  const [selectedTradeOffIds, setSelectedTradeOffIds] = useState<string[]>([]);
  const [showImpactPreview, setShowImpactPreview] = useState(false);
  const initialEventUpdatedAtRef = useRef(event.updatedAt);
  const initialEventVersionRef = useRef(event.version ?? 1);
  const isStale = Boolean(
    (event.updatedAt && event.updatedAt !== initialEventUpdatedAtRef.current) ||
    (typeof event.version === 'number' && event.version !== initialEventVersionRef.current)
  );

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
      setPreferences(event.preferences || createEmptyPreferences());
      setActiveTab('details');
      setErrors({});
      setSaveError(null);
      setSelectedTradeOffIds([]);
      setShowImpactPreview(false);
      initialEventUpdatedAtRef.current = event.updatedAt;
      initialEventVersionRef.current = event.version ?? 1;
    }
  }, [isOpen, event]);

  const numGuestTarget = Number(guestTarget);
  const numBudgetCap = Number(budgetCap);
  const isNumericValid =
    !isNaN(numGuestTarget) && numGuestTarget > 0 && !isNaN(numBudgetCap) && numBudgetCap > 0;
  const hasParametersChanged =
    isNumericValid &&
    (numGuestTarget !== event.guestTarget || numBudgetCap !== event.budgetCap);

  const scenarioFinancials = useMemo(() => {
    if (!isNumericValid) return null;
    return calculateScenarioFinancials(event, {
      guestTarget: numGuestTarget,
      budgetCap: numBudgetCap,
    });
  }, [event, numGuestTarget, numBudgetCap, isNumericValid]);

  const tradeOffOptions = useMemo(() => {
    if (!scenarioFinancials) return [];
    return generateTradeOffOptions(event, scenarioFinancials);
  }, [event, scenarioFinancials]);

  const handleToggleTradeOff = (tradeOffId: string) => {
    setSelectedTradeOffIds((prev) =>
      prev.includes(tradeOffId) ? prev.filter((id) => id !== tradeOffId) : [...prev, tradeOffId]
    );
  };

  const handleRefreshStale = () => {
    initialEventUpdatedAtRef.current = event.updatedAt;
    initialEventVersionRef.current = event.version ?? 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // W3-01: Reject stale saves in the UI immediately
    if (isStale) {
      setSaveError(
        'This celebration was updated in another session or window. Please review the updated details before saving to prevent overwriting changes.'
      );
      return;
    }

    let finalGuestTarget = Number(guestTarget);
    let updatedExpenses = event.expenses ? [...event.expenses] : [];

    // Apply any selected trade-off adjustments deterministically
    if (selectedTradeOffIds.length > 0 && tradeOffOptions.length > 0) {
      for (const option of tradeOffOptions) {
        if (!selectedTradeOffIds.includes(option.id)) continue;

        if (option.impactType === 'guest_scaling' && typeof option.proposedAmount === 'number') {
          finalGuestTarget = option.proposedAmount;
        } else if (
          option.impactType === 'budget_reduction' &&
          option.targetExpenseId &&
          typeof option.proposedAmount === 'number'
        ) {
          updatedExpenses = updatedExpenses.map((exp) => {
            if (exp.id === option.targetExpenseId) {
              if (exp.costModel === 'per_guest' && exp.unitCost && finalGuestTarget > 0) {
                const newUnitCost = Math.round(option.proposedAmount / finalGuestTarget);
                return {
                  ...exp,
                  unitCost: newUnitCost,
                  estimatedAmount: option.proposedAmount,
                  updatedAt: new Date().toISOString(),
                };
              }
              return {
                ...exp,
                estimatedAmount: option.proposedAmount,
                updatedAt: new Date().toISOString(),
              };
            }
            return exp;
          });
        }
      }
    }

    // Deterministically update variable (per-guest) expenses if guest target changed
    if (finalGuestTarget !== event.guestTarget) {
      updatedExpenses = recalculatePerGuestExpenses(updatedExpenses, finalGuestTarget);
    }

    const validation = validateEventInput({
      type: event.type,
      title,
      date,
      location,
      guestTarget: finalGuestTarget,
      budgetCap: Number(budgetCap),
      currency,
      culturalContext: traditionOrTheme || notes ? { traditionOrTheme, notes } : undefined,
      preferences,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      if (validation.errors.title || validation.errors.date || validation.errors.guestTarget || validation.errors.budgetCap) {
        setActiveTab('details');
      }
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
      expenses: updatedExpenses,
      preferences,
      milestones: updatedMilestones,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    };

    const saveOptions = {
      expectedUpdatedAt: initialEventUpdatedAtRef.current,
      expectedVersion: initialEventVersionRef.current,
    };
    let saveRes;
    if (event.isSample) {
      saveRes = eventStorage.saveSampleEvent(updated, saveOptions);
    } else {
      saveRes = eventStorage.savePersonalEvent(updated, saveOptions);
    }

    if (!saveRes.success) {
      if (saveRes.error?.code === 'CONCURRENCY_CONFLICT') {
        setSaveError(
          'This celebration was updated in another session or window. Please review the updated details before saving to prevent overwriting changes.'
        );
      } else {
        setSaveError(saveRes.error?.message || 'Failed to persist event updates.');
      }
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onSuccess(saveRes.data || updated);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Celebration Details"
      description="Update core parameters and celebration preferences for this workspace."
      maxWidth="lg"
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

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="Event Edit Views"
          className="flex items-center gap-2 border-b border-neutral-border pb-3 text-xs"
        >
          <button
            id="edit-tab-details"
            role="tab"
            aria-selected={activeTab === 'details'}
            aria-controls="edit-panel-details"
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'details'
                ? 'bg-primary text-neutral-text shadow-xs'
                : 'text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle'
            }`}
          >
            Core Parameters
          </button>
          <button
            id="edit-tab-preferences"
            role="tab"
            aria-selected={activeTab === 'preferences'}
            aria-controls="edit-panel-preferences"
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'bg-primary text-neutral-text shadow-xs'
                : 'text-neutral-muted hover:text-neutral-text hover:bg-neutral-subtle'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebration Preferences</span>
          </button>
        </div>

        {activeTab === 'details' ? (
          <div
            id="edit-panel-details"
            role="tabpanel"
            aria-labelledby="edit-tab-details"
            className="space-y-4"
          >
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
                aria-required="true"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'edit-title-error' : undefined}
                className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.title && (
                <p id="edit-title-error" className="text-xs text-status-danger mt-1">
                  {errors.title}
                </p>
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
                  aria-required="true"
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? 'edit-date-error' : undefined}
                  className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.date && (
                  <p id="edit-date-error" className="text-xs text-status-danger mt-1">
                    {errors.date}
                  </p>
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
                  aria-required="true"
                  aria-invalid={Boolean(errors.guestTarget)}
                  aria-describedby={errors.guestTarget ? 'edit-guest-target-error' : undefined}
                  className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.guestTarget && (
                  <p id="edit-guest-target-error" className="text-xs text-status-danger mt-1">
                    {errors.guestTarget}
                  </p>
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
                    aria-required="true"
                    aria-invalid={Boolean(errors.budgetCap)}
                    aria-describedby={errors.budgetCap ? 'edit-budget-cap-error' : undefined}
                    className="flex-1 min-w-0 bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {errors.budgetCap && (
                  <p id="edit-budget-cap-error" className="text-xs text-status-danger mt-1">
                    {errors.budgetCap}
                  </p>
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

            {/* Live Scenario Impact Preview & Trade-Offs */}
            {(hasParametersChanged || showImpactPreview) && scenarioFinancials && (
              <div className="pt-2">
                <ScenarioImpactPreview
                  financials={scenarioFinancials}
                  tradeOffOptions={tradeOffOptions}
                  selectedTradeOffIds={selectedTradeOffIds}
                  onToggleTradeOff={handleToggleTradeOff}
                  isStale={isStale}
                  onRefreshStale={handleRefreshStale}
                />
              </div>
            )}

            {!hasParametersChanged && !showImpactPreview && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowImpactPreview(true)}
                  className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Preview scenario impact for current values</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            id="edit-panel-preferences"
            role="tabpanel"
            aria-labelledby="edit-tab-preferences"
            className="py-1"
          >
            <PreferencesForm
              eventType={event.type}
              values={preferences}
              onChange={setPreferences}
              disabled={isSaving}
              source="user_edit"
            />
          </div>
        )}

        <div className="border-t border-neutral-border pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isStale}
            title={isStale ? 'Event data changed in another session. Please recalculate or refresh before saving.' : undefined}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-colors shadow-xs disabled:opacity-60 text-center"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
