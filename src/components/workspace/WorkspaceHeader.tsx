import React, { useState } from 'react';
import { Calendar, Users, Wallet, Edit3, ArrowLeft, Trash2, MapPin, Sparkles, Sliders } from 'lucide-react';
import { Event } from '../../features/events/types';
import { calculateDaysRemaining, formatCurrency, formatDateDisplay } from '../../features/events/validation';
import { CouponBadge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';

export interface WorkspaceHeaderProps {
  event: Event;
  onEdit: () => void;
  onReplan?: () => void;
  onBackToWelcome: () => void;
  onDeleteEvent?: () => void;
}

export function WorkspaceHeader({
  event,
  onEdit,
  onReplan,
  onBackToWelcome,
  onDeleteEvent,
}: WorkspaceHeaderProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const daysLeft = calculateDaysRemaining(event.date);
  const countdownLabel =
    daysLeft === 0
      ? 'Today'
      : daysLeft > 0
      ? `${daysLeft} days away`
      : `${Math.abs(daysLeft)} days ago`;

  return (
    <>
      <header className="bg-neutral-surface border-b border-neutral-border py-4 px-4 sm:px-6 lg:px-8 shadow-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Back Link, Badges & Event Title */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onBackToWelcome}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-muted hover:text-neutral-text transition-colors py-1 px-2 rounded-md hover:bg-neutral-subtle -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Celebration Studio</span>
              </button>

              <CouponBadge variant={event.isSample ? 'terracotta' : 'marigold'}>
                {event.isSample ? 'SAMPLE SANDBOX' : 'PERSONAL EVENT · LOCAL'}
              </CouponBadge>

              <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-subtle border border-neutral-border text-neutral-muted">
                {event.type}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text tracking-tight truncate">
                {event.title}
              </h1>
              <span className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-subtle text-primary" title="Auspicious Milestone Planning">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Compact inline metadata ribbon */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-muted">
              {event.location && (
                <span className="flex items-center gap-1 text-neutral-text/90">
                  <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-muted flex-shrink-0" />
                <span>{formatDateDisplay(event.date)}</span>
                <span className="font-mono text-secondary font-medium">({countdownLabel})</span>
              </span>

              <span className="flex items-center gap-1 font-mono tabular-nums">
                <Users className="w-3.5 h-3.5 text-neutral-muted flex-shrink-0" />
                <span>{event.guestTarget} guests</span>
              </span>

              <span className="flex items-center gap-1 font-mono tabular-nums font-semibold text-neutral-text">
                <Wallet className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{formatCurrency(event.budgetCap, event.currency)}</span>
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 pt-2 md:pt-0 self-start md:self-auto flex-shrink-0">
            {onReplan && (
              <button
                type="button"
                onClick={onReplan}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary-subtle text-primary border border-primary/30 hover:bg-primary hover:text-white px-3.5 py-2 rounded-md transition-all shadow-xs active:translate-y-0.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Dynamic Replan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border px-3.5 py-2 rounded-md transition-all shadow-xs active:translate-y-0.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-neutral-muted" />
              <span>Edit Details</span>
            </button>

            {!event.isSample && onDeleteEvent && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete Event"
                className="p-2 text-neutral-muted hover:text-status-danger hover:bg-status-danger-subtle/50 rounded-md transition-colors"
                title="Delete Celebration"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Celebration Plan"
        description="This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-text leading-relaxed">
            Are you sure you want to delete <strong>{event.title}</strong>? All locally persisted planning data for this celebration will be permanently erased from this browser.
          </p>

          <div className="border-t border-neutral-border pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded-md text-sm font-medium text-neutral-text bg-neutral-surface hover:bg-neutral-subtle border border-neutral-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                onDeleteEvent?.();
              }}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-status-danger hover:bg-red-700 transition-colors"
            >
              Permanently Delete
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
