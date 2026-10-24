import React from 'react';
import { Calendar, Users, Wallet, ArrowRight, Trash2 } from 'lucide-react';
import { Event } from '../../features/events/types';
import { formatCurrency, formatDateDisplay, calculateDaysRemaining } from '../../features/events/validation';

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
    <section className="py-12 bg-neutral-subtle rounded-2xl p-6 sm:p-8 mt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-text">
            Your Saved Celebrations
          </h2>
          <span className="text-sm font-medium text-neutral-muted">
            {events.length} {events.length === 1 ? 'celebration' : 'celebrations'} saved locally in browser
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="bg-neutral-surface rounded-xl p-6 transition-transform duration-200 hover:translate-y-[-2px] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold bg-primary-subtle text-primary px-2.5 py-1 rounded-md capitalize">
                      {event.type}
                    </span>
                    <span className="text-sm font-medium text-secondary">
                      {countdownLabel}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-neutral-text line-clamp-1">
                    {event.title}
                  </h3>

                  <div className="grid grid-cols-3 gap-3 text-sm text-neutral-text bg-neutral-subtle p-3 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-neutral-muted" />
                      <span className="truncate">{formatDateDisplay(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-neutral-muted" />
                      <span>{event.guestTarget} guests</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end font-semibold text-primary">
                      <Wallet className="w-4 h-4" />
                      <span>{formatCurrency(event.budgetCap, event.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm py-2.5 px-4 rounded-md transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEvent(event.id, event.title)}
                    aria-label={`Delete ${event.title}`}
                    className="p-2.5 text-neutral-muted hover:text-status-danger hover:bg-neutral-subtle rounded-md transition-colors"
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
