import React, { useState } from 'react';
import { Calendar, Users, Wallet, Edit3, ArrowLeft, Trash2, MapPin } from 'lucide-react';
import { Event } from '../../features/events/types';
import { calculateDaysRemaining, formatCurrency, formatDateDisplay } from '../../features/events/validation';
import { CouponBadge } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';

export interface WorkspaceHeaderProps {
  event: Event;
  onEdit: () => void;
  onBackToWelcome: () => void;
  onDeleteEvent?: () => void;
}

export function WorkspaceHeader({
  event,
  onEdit,
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
      <header className="bg-neutral-surface border-b border-neutral-border py-5 px-4 sm:px-8 shadow-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Navigation and Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackToWelcome}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-muted hover:text-neutral-text transition-colors py-1 px-2 rounded hover:bg-neutral-subtle -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Celebration Studio</span>
              </button>

              <CouponBadge variant={event.isSample ? 'terracotta' : 'marigold'}>
                {event.isSample ? 'SAMPLE SANDBOX' : 'PERSONAL EVENT · LOCAL'}
              </CouponBadge>

              <span className="text-xs font-mono uppercase text-neutral-muted">
                {event.type}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text tracking-tight">
              {event.title}
            </h1>

            {event.location && (
              <p className="text-xs text-neutral-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                <span>{event.location}</span>
              </p>
            )}
          </div>

          {/* Right: Aligned Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-border/60">
            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs sm:text-sm font-mono tabular-nums">
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase font-semibold text-neutral-muted tracking-wider">
                  Timeline
                </p>
                <p className="font-semibold text-neutral-text">
                  {countdownLabel}
                </p>
              </div>

              <div className="w-px h-8 bg-neutral-border" />

              <div className="text-left sm:text-right">
                <p className="text-xs uppercase font-semibold text-neutral-muted tracking-wider">
                  Guest Target
                </p>
                <p className="font-semibold text-neutral-text">
                  {event.guestTarget}
                </p>
              </div>

              <div className="w-px h-8 bg-neutral-border" />

              <div className="text-left sm:text-right">
                <p className="text-xs uppercase font-semibold text-neutral-muted tracking-wider">
                  Budget Cap
                </p>
                <p className="font-semibold text-neutral-text">
                  {formatCurrency(event.budgetCap, event.currency)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border px-3 py-2 rounded-md transition-colors"
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
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
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
