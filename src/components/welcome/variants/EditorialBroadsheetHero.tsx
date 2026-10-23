'use client';

import React from 'react';
import { VariantHeroProps } from './types';
import { EventType } from '../../../features/events/types';
import { Compass, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Heart, Cake, Users } from 'lucide-react';
import { CouponBadge } from '../../ui/Badge';

export function EditorialBroadsheetHero({
  onOpenSample,
  onCreateEvent,
  onSelectType,
}: VariantHeroProps) {
  const archetypes: {
    type: EventType;
    numeral: string;
    name: string;
    summary: string;
    spec: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      type: 'wedding',
      numeral: 'I',
      name: 'Vivaha & Multi-Day Rites',
      summary: 'Chronological rituals (Sangeet, Muhurtam, Reception) with family seating matrices.',
      spec: '12 categories · 350+ guests · 9 milestones',
      icon: Heart,
    },
    {
      type: 'birthday',
      numeral: 'II',
      name: 'Janmadina & Milestones',
      summary: 'Focused celebration milestones with custom entertainment and catering schedules.',
      spec: '6 categories · 75 guests · 4 milestones',
      icon: Cake,
    },
    {
      type: 'community',
      numeral: 'III',
      name: 'Utsav & Civic Gatherings',
      summary: 'Neighborhood festivals, Diwali melas, permits, and multi-tier funding ledgers.',
      spec: '8 categories · 500+ guests · Volunteer rosters',
      icon: Users,
    },
  ];

  return (
    <section className="py-8 md:py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Editorial Top Rule & Publication Bar */}
        <div className="border-y border-neutral-border-strong py-2.5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-neutral-muted gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-text uppercase tracking-widest">
              Event Pilot Broadsheet
            </span>
            <span className="text-neutral-border-strong">/</span>
            <span>Vol. MMXXVI · Issue 01</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-text">
            <span>Deterministic Math Engine</span>
            <span className="text-neutral-border-strong">·</span>
            <span className="font-semibold text-secondary">Local-First Storage</span>
          </div>
        </div>

        {/* 7 / 5 Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (7 cols): The Great Editorial Voice */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-neutral-text tracking-tight leading-[1.08] text-balance">
              Every Milestone Celebration, Chronologically Ordered &amp; Strictly Costed.
            </h1>

            <p className="text-base sm:text-lg text-neutral-text/90 leading-relaxed font-sans max-w-xl text-pretty">
              Refusing the chaos of loose spreadsheets and generic productivity boards. Event Pilot delivers an
              architectural planning studio rooted in the classical Panchang almanac: every rupee audited, every
              auspicious Muhurtam scheduled, and all attendee records preserved strictly in your browser.
            </p>

            {/* Editorial Action Cluster */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onCreateEvent}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-semibold px-6 py-3.5 rounded-sm transition-all shadow-xs border border-primary-hover active:translate-y-0.5 focus-visible:outline-2"
              >
                <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
                <span>Commence New Celebration</span>
              </button>

              <button
                type="button"
                onClick={onOpenSample}
                className="inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border-strong font-medium px-5 py-3.5 rounded-sm transition-all shadow-xs active:translate-y-0.5"
              >
                <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
                <span>Review Master Sample Plan</span>
              </button>
            </div>

            {/* Editorial Archetype Table of Contents */}
            <div className="pt-8 border-t border-neutral-border space-y-3">
              <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-muted">
                Section II · Planning Archetypes
              </h2>

              <div className="divide-y divide-neutral-border/70 border-y border-neutral-border/70">
                {archetypes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.type}
                      className="group py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-subtle/40 px-2 -mx-2 transition-colors rounded-xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="font-mono text-sm font-bold text-secondary w-5 pt-0.5">
                          {item.numeral}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-neutral-text group-hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                            <span className="text-xs font-mono text-neutral-muted hidden sm:inline">
                              [{item.spec}]
                            </span>
                          </div>
                          <p className="text-xs text-neutral-text/80 mt-0.5 max-w-md">
                            {item.summary}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectType(item.type)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-text hover:text-secondary whitespace-nowrap self-start sm:self-center px-3 py-1.5 rounded-xs border border-neutral-border hover:border-secondary bg-neutral-surface transition-all"
                      >
                        <span>Select {item.numeral}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Tactile Ceremony Ledger Pass */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-surface border border-neutral-border-strong rounded-sm shadow-card p-6 relative overflow-hidden">
              {/* Top stationery rule */}
              <div className="flex items-center justify-between border-b border-neutral-border-strong/80 pb-3 mb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-secondary font-bold">
                    Official Pre-Loaded File
                  </span>
                  <h3 className="font-display text-lg font-bold text-neutral-text mt-0.5">
                    Aarav &amp; Meera&apos;s Vivaha Ledger
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-full border border-secondary/40 bg-secondary-subtle/50 flex items-center justify-center text-secondary font-serif font-bold text-xs">
                  ॐ
                </div>
              </div>

              <div className="text-xs text-neutral-text/85 space-y-3 font-sans">
                <p>
                  A complete multi-day Hindu Vivaha featuring 3 scheduled ceremonial occasions, 12 budget
                  categories, and 350 RSVP-tracked guests across assigned dining seating.
                </p>

                {/* Perforated Stub Data Section */}
                <div className="border-t border-b border-dashed border-neutral-border-strong py-3.5 my-3 space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-muted">Allocated Budget Cap:</span>
                    <span className="font-bold text-neutral-text text-sm">₹25,00,000</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-muted">Timeline Milestones:</span>
                    <span className="font-bold text-neutral-text">9 Scheduled Events</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-muted">Countdown to Muhurtam:</span>
                    <span className="font-bold text-secondary">89 Days Remaining</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-neutral-muted">Family RSVP Density:</span>
                    <span className="font-bold text-neutral-text">350 Confirmed</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenSample}
                    className="w-full inline-flex items-center justify-center gap-2 bg-neutral-text hover:bg-neutral-text/90 text-white font-medium text-xs py-3 px-4 rounded-sm transition-all shadow-xs"
                  >
                    <span>Inspect Pre-Loaded Master Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Security Seal Note */}
              <div className="mt-4 pt-3 border-t border-neutral-border flex items-center gap-2 text-xs text-neutral-muted">
                <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
                <span>Deterministic math verified. Local browser persistence active.</span>
              </div>
            </div>

            {/* Editorial Colophon */}
            <div className="p-4 bg-neutral-subtle/60 border border-neutral-border rounded-sm text-xs text-neutral-text/80 space-y-1.5">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-neutral-text block">
                Colophon &amp; Trust Guarantee
              </span>
              <p className="leading-relaxed">
                Event Pilot processes all calculations locally on your device. No guest telephone numbers,
                addresses, or financial entries are transmitted to remote cloud databases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
