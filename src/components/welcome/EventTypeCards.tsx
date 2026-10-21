import React from 'react';
import { Heart, Cake, Users, ArrowRight } from 'lucide-react';
import { EventType } from '../../features/events/types';
import { CouponBadge } from '../ui/Badge';

export interface EventTypeCardsProps {
  onSelectType: (type: EventType) => void;
}

export function EventTypeCards({ onSelectType }: EventTypeCardsProps) {
  const eventTypes: {
    type: EventType;
    title: string;
    badge: string;
    description: string;
    highlights: string[];
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      type: 'wedding',
      title: 'Vivaha & Weddings',
      badge: 'Multi-Day Ceremonies',
      description:
        'High vendor density, chronological ritual milestones (Sangeet, Muhurtam, Reception), and intricate family seating.',
      highlights: ['Multi-ceremony timeline', 'Complex guest seating & RSVP', 'Multi-category budget tracking'],
      icon: Heart,
    },
    {
      type: 'birthday',
      title: 'Milestone Birthdays',
      badge: 'Personal Milestones',
      description:
        'Focused celebration milestones with custom entertainment, catering coordination, and age-appropriate themes.',
      highlights: ['Theme & decor checklist', 'Guest count & dietary notes', 'Entertainment & cake milestones'],
      icon: Cake,
    },
    {
      type: 'community',
      title: 'Community Festivals',
      badge: 'Civic & Cultural Gatherings',
      description:
        'Neighborhood Utsavs, society Diwali melas, cultural galas with permits, task delegation, and multi-tier funding.',
      highlights: ['Volunteer task delegation', 'Civic permits & logistics', 'Sponsorship & expense ledgers'],
      icon: Users,
    },
  ];

  return (
    <section className="py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-text">
            Three Planning Archetypes
          </h2>
          <p className="text-sm text-neutral-muted mt-2 max-w-xl mx-auto">
            Choose an archetype configured with domain-specific categories, timelines, and planning structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventTypes.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                className="group relative bg-neutral-surface rounded-lg border border-neutral-border p-6 shadow-card hover:border-neutral-border-strong transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-secondary-subtle/80 flex items-center justify-center text-secondary border border-secondary/30">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CouponBadge variant="terracotta">{item.badge}</CouponBadge>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-neutral-text mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-neutral-text/80 leading-relaxed mb-4 text-pretty">
                    {item.description}
                  </p>

                  <ul className="space-y-1.5 border-t border-neutral-border/60 pt-3 mb-6">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-neutral-muted flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-secondary" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectType(item.type)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border hover:border-neutral-border-strong font-medium text-sm py-2 px-3 rounded-md transition-colors"
                >
                  <span>Start {item.type === 'wedding' ? 'Wedding' : item.type === 'birthday' ? 'Birthday' : 'Community'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-muted group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
