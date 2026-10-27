'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { TimelineMilestone } from '../../features/events/types';
import {
  calculateMilestoneDate,
} from '../../features/events/timeline-engine';
import { formatDateDisplay } from '../../features/events/validation';
import { Dialog } from '../ui/Dialog';

export interface MilestoneDialogProps {
  isOpen: boolean;
  onClose: () => void;
  milestone?: TimelineMilestone | null; // null if creating
  eventDate: string;
  onSave: (milestone: {
    id: string;
    title: string;
    offsetDays: number;
    description?: string;
  }) => void;
}

export function MilestoneDialog({
  isOpen,
  onClose,
  milestone,
  eventDate,
  onSave,
}: MilestoneDialogProps) {
  const [title, setTitle] = useState('');
  const [offsetDays, setOffsetDays] = useState('0');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (milestone) {
        setTitle(milestone.title);
        setOffsetDays(String(milestone.offsetDays));
        setDescription(milestone.description || '');
      } else {
        setTitle('');
        setOffsetDays('-14');
        setDescription('');
      }
      setErrors({});
    }
  }, [isOpen, milestone]);

  const offsetNum = Number(offsetDays);
  const effectiveDate = calculateMilestoneDate(
    eventDate,
    Number.isFinite(offsetNum) ? offsetNum : 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Milestone title is required.';
    } else if (trimmedTitle.length < 2) {
      newErrors.title = 'Milestone title must be at least 2 characters.';
    } else if (trimmedTitle.length > 100) {
      newErrors.title = 'Milestone title cannot exceed 100 characters.';
    }

    if (!Number.isFinite(offsetNum) || !Number.isInteger(offsetNum)) {
      newErrors.offsetDays = 'Offset days must be an integer (e.g. -30 for 30 days before, 0 for day of event).';
    } else if (offsetNum > 365 || offsetNum < -1825) {
      newErrors.offsetDays = 'Offset days must be between -1825 (5 years prior) and +365 (1 year post).';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: milestone ? milestone.id : `m-custom-${Date.now()}`,
      title: trimmedTitle,
      offsetDays: offsetNum,
      description: description.trim() || undefined,
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={milestone ? 'Edit Timeline Milestone' : 'Add Timeline Milestone'}
      description="Define an anchor milestone relative to your celebration date."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="milestone-title-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Milestone Title <span className="text-secondary">*</span>
          </label>
          <input
            id="milestone-title-input"
            type="text"
            placeholder="e.g. 1 Month Prior — Invitations & RSVPs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'milestone-title-error' : undefined}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.title && (
            <p id="milestone-title-error" className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="milestone-offset-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-text mb-1"
          >
            Day Offset Relative to Event <span className="text-secondary">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="milestone-offset-input"
              type="number"
              step="1"
              value={offsetDays}
              onChange={(e) => setOffsetDays(e.target.value)}
              aria-invalid={Boolean(errors.offsetDays)}
              aria-describedby={errors.offsetDays ? 'milestone-offset-error' : undefined}
              className="w-32 bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-neutral-muted">
              {offsetNum === 0
                ? 'Day of celebration'
                : offsetNum < 0
                ? `${Math.abs(offsetNum)} days prior to celebration`
                : `${offsetNum} days after celebration`}
            </span>
          </div>
          {errors.offsetDays && (
            <p id="milestone-offset-error" className="text-xs text-status-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.offsetDays}</span>
            </p>
          )}
        </div>

        {/* Live Date Preview */}
        <div className="bg-neutral-subtle/70 border border-neutral-border rounded-md p-3 flex items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-secondary flex-shrink-0" />
          <div>
            <span className="font-semibold text-neutral-text">Effective Calendar Date: </span>
            <span className="font-mono text-neutral-text font-bold">
              {formatDateDisplay(effectiveDate)}
            </span>{' '}
            <span className="text-neutral-muted font-mono">({effectiveDate})</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="milestone-desc-input"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-muted mb-1"
          >
            Description &amp; Goals
          </label>
          <textarea
            id="milestone-desc-input"
            rows={2}
            placeholder="e.g. Confirm catering guest counts, print programs, and coordinate vendor arrivals"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-neutral-surface border border-neutral-border px-3.5 py-2 rounded-md text-sm text-neutral-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border-t border-neutral-border pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border transition-colors text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md text-sm font-semibold text-neutral-text bg-primary hover:bg-primary-hover hover:text-white transition-all shadow-sm text-center"
          >
            {milestone ? 'Save Milestone' : 'Create Milestone'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
