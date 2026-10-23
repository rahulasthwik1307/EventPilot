import React from 'react';
import { Heart, Cake, Users, ArrowRight, Sparkles } from 'lucide-react';
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
            const accentGradient =
              item.type === 'wedding'
                ? 'from-primary via-secondary to-primary'
                : item.type === 'birthday'
                ? 'from-secondary via-primary to-secondary'
                : 'from-primary via-neutral-border-strong to-primary';

            return (
              <div
                key={item.type}
                className="group relative bg-neutral-surface rounded-lg border border-neutral-border p-6 sm:p-7 shadow-card hover:border-neutral-border-strong hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle auspicious stationery top header accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient}`} />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-secondary-subtle/80 flex items-center justify-center text-secondary border border-secondary/30 transition-transform group-hover:scale-105">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CouponBadge variant="terracotta">{item.badge}</CouponBadge>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-neutral-text mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-neutral-text/85 leading-relaxed mb-4 text-pretty">
                    {item.description}
                  </p>

                  <ul className="space-y-2 border-t border-neutral-border/60 pt-3.5 mb-6">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-neutral-text/75 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectType(item.type)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-primary hover:text-neutral-text text-neutral-text border border-neutral-border hover:border-primary font-semibold text-sm py-2.5 px-3 rounded-md transition-all active:scale-[0.98] shadow-xs"
                >
                  <span>Start {item.type === 'wedding' ? 'Wedding' : item.type === 'birthday' ? 'Birthday' : 'Community'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-muted group-hover:text-neutral-text group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
