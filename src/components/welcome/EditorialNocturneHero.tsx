'use client';

import React from 'react';
import { EventType } from '../../features/events/types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Cake,
  Users
} from 'lucide-react';

export interface EditorialNocturneHeroProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
  onSelectType: (type: EventType) => void;
}

export function EditorialNocturneHero({
  onOpenSample,
  onCreateEvent,
  onSelectType,
}: EditorialNocturneHeroProps) {
  const archetypes: {
    type: EventType;
    numeral: string;
    title: string;
    tagline: string;
    description: string;
    metrics: string;
    highlights: string[];
    icon: React.ComponentType<{ className?: string }>;
    isFeatured?: boolean;
  }[] = [
    {
      type: 'wedding',
      numeral: 'I',
      title: 'Vivaha & Weddings',
      tagline: 'Multi-Day Ceremonial Sequence',
      description:
        'Architectural coordination of chronological rites—Sangeet, Muhurtam, and Reception—with intricate family dining matrices.',
      metrics: '350 Confirmed Seats · 12 Budget Ledgers · 9 Milestones',
      highlights: [
        'Auspicious Muhurtam countdown locks',
        'Complex 8-seat family table assignments',
        'Vendor disbursements tracked to the rupee',
      ],
      icon: Heart,
      isFeatured: true,
    },
    {
      type: 'birthday',
      numeral: 'II',
      title: 'Milestone Birthdays',
      tagline: 'Personal & Jubilee Gatherings',
      description:
        'Focused celebration schedules with custom entertainment milestones, catering coordination, and age themes.',
      metrics: '75 Guests · 6 Categories',
      highlights: ['Theme & decor checklist', 'Dietary restriction registers'],
      icon: Cake,
      isFeatured: false,
    },
    {
      type: 'community',
      numeral: 'III',
      title: 'Community Festivals',
      tagline: 'Cultural Festivals & Melas',
      description:
        'Neighborhood Diwali melas, society cultural galas with civic permits, volunteer task rosters, and sponsorship.',
      metrics: '500+ Guests · Multi-Tier Ledgers',
      highlights: ['Volunteer team delegation', 'Civic permit verification'],
      icon: Users,
      isFeatured: false,
    },
  ];

  return (
    <section className="py-8 md:py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Editorial Masthead Ticker Rule */}
        <div className="border-y border-neutral-border-strong py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-neutral-muted gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-neutral-text uppercase tracking-widest">
              Event Pilot · Editorial Nocturne
            </span>
            <span className="text-neutral-border-strong">/</span>
            <span className="text-secondary font-medium">Vol. MMXXVI · Panchang Edition</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-text">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success" aria-hidden="true" />
              <span>Deterministic Math Core</span>
            </span>
            <span className="text-neutral-border-strong">·</span>
            <span className="font-semibold text-secondary">Local-First Storage</span>
          </div>
        </div>

        {/* Asymmetrical Hero Grid: 7 Columns Editorial Canvas + 5 Columns Nocturne Feature Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Section (7 cols): Stately Editorial Broadsheet Canvas */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-text tracking-tight leading-[1.08] text-balance">
                Every Milestone Celebration,<br />
                Art-Directed &amp; Audited in Secret.
              </h1>

              <p className="text-base sm:text-lg text-neutral-text/90 font-sans leading-relaxed max-w-xl text-pretty">
                Bridging the architectural discipline of a classical Panchang almanac with the atmospheric radiance
                of an evening celebration. Every rupee audited to the exact paisa, every ritual synchronized, and
                your entire guest registry preserved strictly within your private browser storage.
              </p>
            </div>

            {/* Editorial Action Cluster */}
            <div className="pt-2 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  type="button"
                  onClick={onCreateEvent}
                  className="inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-neutral-text font-bold px-7 py-3.5 rounded-sm transition-all shadow-xs border border-primary-hover active:translate-y-0.5 focus-visible:outline-2"
                >
                  <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
                  <span>Create New Celebration</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenSample}
                  className="inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border-strong font-semibold px-6 py-3.5 rounded-sm transition-all shadow-xs active:translate-y-0.5"
                >
                  <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
                  <span>Explore Sample Event</span>
                </button>
              </div>

              {/* Colophon Trust Row */}
              <div className="flex items-center gap-4 text-xs text-neutral-muted pt-2 font-mono">
                <span className="flex items-center gap-1.5 text-neutral-text">
                  <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
                  <span>Zero Cloud Telemetry</span>
                </span>
                <span>·</span>
                <span>Verified Client-Side Storage</span>
                <span>·</span>
                <span className="text-secondary font-medium">100% Private</span>
              </div>
            </div>
          </div>

          {/* Right Section (5 cols): Cinematic Nocturne Feature Panel */}
          <div className="lg:col-span-5 relative">
            <div className="h-full bg-[#121016] text-[#FAF7F2] rounded-xl border border-amber-500/30 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-amber-400/50 transition-all duration-300">
              {/* Subtle Diya Lamp Warm Radial Bloom */}
              <div
                className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/15 rounded-full blur-[70px] pointer-events-none -z-0"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-600/10 rounded-full blur-[70px] pointer-events-none -z-0"
                aria-hidden="true"
              />

              {/* Ceremonial Jali Archway Vector Line Art Watermark */}
              <svg
                className="absolute top-2 right-2 w-36 h-36 text-amber-500/10 pointer-events-none -z-0"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <path d="M10,90 C10,40 50,10 50,10 C50,10 90,40 90,90 Z" />
                <path d="M25,90 C25,55 50,30 50,30 C50,30 75,55 75,90 Z" />
                <circle cx="50" cy="50" r="12" />
                <circle cx="50" cy="50" r="6" />
                <line x1="50" y1="10" x2="50" y2="90" />
                <line x1="10" y1="90" x2="90" y2="90" />
              </svg>

              {/* Top Panel Bar */}
              <div className="relative z-10 border-b border-stone-800 pb-3.5 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                      Featured Master File
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                    89 Days to Muhurtam
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white mt-2">
                  Aarav &amp; Meera&apos;s Vivaha Almanac
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  Three-day Vedic vivaha with 3 ceremonial occasions, 12 budget ledgers, and 350 RSVP seats.
                </p>
              </div>

              {/* High-Contrast Nocturne Metric Matrix */}
              <div className="relative z-10 border-y border-stone-800 py-3.5 my-2 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400">Allocated Budget Cap:</span>
                  <span className="font-bold text-white text-sm">₹25,00,000</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400">Ceremonial Milestones:</span>
                  <span className="font-bold text-white">9 Scheduled Rites</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400">Family Guest Registrations:</span>
                  <span className="font-bold text-amber-300">350 Confirmed Seats</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-stone-400">Storage Architecture:</span>
                  <span className="font-bold text-emerald-400">100% In-Browser</span>
                </div>
              </div>

              {/* Action & Verification Seal */}
              <div className="relative z-10 pt-3 space-y-3">
                <button
                  type="button"
                  onClick={onOpenSample}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs py-3 px-4 rounded-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_22px_rgba(245,158,11,0.4)] active:scale-[0.98]"
                >
                  <span>Launch Live Master Inspection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Deterministic math verified down to the rupee.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetrical Celebration Archetype Suite */}
        <div className="pt-6 border-t border-neutral-border space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
                Section II · Architectural Archetypes
              </span>
              <h2 className="font-display text-2xl font-bold text-neutral-text mt-0.5">
                Three Grounded Planning Templates
              </h2>
            </div>
            <p className="text-xs text-neutral-muted max-w-sm">
              Pre-configured with domain-specific categories, timelines, and ceremonial structures.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {archetypes.map((item) => {
              const Icon = item.icon;
              const colSpan = item.isFeatured ? 'lg:col-span-6' : 'lg:col-span-3';

              return (
                <div
                  key={item.type}
                  className={`${colSpan} bg-neutral-surface border border-neutral-border hover:border-neutral-border-strong rounded-sm p-5 shadow-card hover:shadow-md transition-all flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-neutral-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-secondary">
                          {item.numeral}.
                        </span>
                        <h3 className="font-display text-base font-bold text-neutral-text group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <div className="w-7 h-7 rounded-xs bg-secondary-subtle/80 flex items-center justify-center text-secondary">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <p className="text-xs text-neutral-text/85 mb-3 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="font-mono text-xs text-neutral-text bg-neutral-subtle/70 px-2.5 py-1.5 rounded-xs border border-neutral-border mb-3">
                      {item.metrics}
                    </div>

                    {item.isFeatured && (
                      <ul className="space-y-1.5 border-t border-neutral-border/60 pt-3 mb-4">
                        {item.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-neutral-text/80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectType(item.type)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xs border border-neutral-border hover:border-primary bg-neutral-surface hover:bg-primary hover:text-neutral-text transition-all mt-2"
                  >
                    <span>Start {item.type === 'wedding' ? 'Wedding' : item.type === 'birthday' ? 'Birthday' : 'Community'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
