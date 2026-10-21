import React from 'react';
import { Calendar, Users, Wallet, ArrowRight, Trash2 } from 'lucide-react';
import { Event } from '../../features/events/types';
import { formatCurrency, formatDateDisplay, calculateDaysRemaining } from '../../features/events/validation';
import { CouponBadge } from '../ui/Badge';

export interface SavedEventsListProps {
  events: Event[];
  onSelectEvent: (id: string) => void;
  onDeleteEvent: (id: string, title: string) => void;
}

export function SavedEventsList({
  events,
  onSelectEvent,
  onDeleteEvent,
}: SavedEventsListProps) {
  if (events.length === 0) return null;

  return (
    <section className="py-8 border-t border-neutral-border px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-secondary">
              Personal Ledger
            </span>
            <h2 className="font-display text-2xl font-semibold text-neutral-text">
              Your Saved Celebrations
            </h2>
          </div>
          <span className="text-xs text-neutral-muted">
            {events.length} {events.length === 1 ? 'event' : 'events'} stored locally
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const daysLeft = calculateDaysRemaining(event.date);
            const countdownLabel =
              daysLeft === 0
                ? 'Today'
                : daysLeft > 0
                ? `${daysLeft} days away`
                : `${Math.abs(daysLeft)} days ago`;

            return (
              <div
                key={event.id}
                className="bg-neutral-surface border border-neutral-border rounded-lg p-5 shadow-card hover:border-neutral-border-strong transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <CouponBadge variant="stone">
                      {event.type}
                    </CouponBadge>
                    <span className="text-xs font-mono text-neutral-muted">
                      {countdownLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-neutral-text mb-2 line-clamp-1">
                    {event.title}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-xs text-neutral-muted border-t border-neutral-border/60 pt-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-muted" />
                      <span className="truncate">{formatDateDisplay(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Users className="w-3.5 h-3.5 text-neutral-muted" />
                      <span>{event.guestTarget} guests</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums text-right justify-end font-medium text-neutral-text">
                      <Wallet className="w-3.5 h-3.5 text-secondary" />
                      <span>{formatCurrency(event.budgetCap, event.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-border/40">
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border font-medium text-xs py-2 px-3 rounded-md transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(event.id, event.title)}
                    aria-label={`Delete ${event.title}`}
                    className="p-2 text-neutral-muted hover:text-status-danger hover:bg-status-danger-subtle/50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
