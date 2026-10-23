'use client';

import React from 'react';
import { VariantHeroProps } from './types';
import { EventType } from '../../../features/events/types';
import { Compass, Sparkles, ArrowRight, ShieldCheck, Heart, Cake, Users, Activity, Flame } from 'lucide-react';

export function ExpressiveUtsavHero({
  onOpenSample,
  onCreateEvent,
  onSelectType,
}: VariantHeroProps) {
  const archetypes: {
    type: EventType;
    index: string;
    title: string;
    tag: string;
    summary: string;
    metrics: string;
    icon: React.ComponentType<{ className?: string }>;
    accentBg: string;
  }[] = [
    {
      type: 'wedding',
      index: '01',
      title: 'Grand Vivaha Rites',
      tag: 'Multi-Day Celebrations',
      summary: 'Chronological rites, Muhurtam timeline locks, and complex family dining matrices.',
      metrics: '350 Seats · 12 Categories',
      icon: Heart,
      accentBg: 'bg-primary text-neutral-text',
    },
    {
      type: 'birthday',
      index: '02',
      title: 'Milestone Janmadina',
      tag: 'Personal Jubilees',
      summary: 'Focused celebration milestones with custom entertainment, catering, and age themes.',
      metrics: '75 Seats · 6 Categories',
      icon: Cake,
      accentBg: 'bg-secondary text-white',
    },
    {
      type: 'community',
      index: '03',
      title: 'Community Utsavs',
      tag: 'Civic & Cultural Melas',
      summary: 'Neighborhood festivals, Diwali melas, volunteer task delegation, and civic permits.',
      metrics: '500+ Seats · Multi-Tier Ledgers',
      icon: Users,
      accentBg: 'bg-neutral-text text-white',
    },
  ];

  return (
    <section className="py-8 md:py-14 px-4 sm:px-6 relative overflow-hidden">
      {/* Geometric Sacred Yantra / Rangoli Vector Watermark (Pure clean geometry) */}
      <svg
        className="absolute top-10 right-4 w-72 h-72 text-primary/10 pointer-events-none -z-10 animate-pulse-gently"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="90" />
        <circle cx="100" cy="100" r="60" />
        <polygon points="100,10 178,145 22,145" />
        <polygon points="100,190 178,55 22,55" />
        <circle cx="100" cy="100" r="25" />
      </svg>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Continuous Dynamic Marquee Ticker Tape */}
        <div className="bg-neutral-text text-neutral-bg py-2.5 px-4 rounded-md overflow-hidden shadow-xs">
          <div className="flex items-center gap-8 text-xs font-mono tracking-wider whitespace-nowrap overflow-x-auto scrollbar-none">
            <span className="flex items-center gap-2 text-primary font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>LIVE ALMANAC PROTOCOL</span>
            </span>
            <span>·</span>
            <span>89 DAYS TO VIVAHA MUHURTAM</span>
            <span>·</span>
            <span>₹25,00,000 AUDITED LEDGER CAP</span>
            <span>·</span>
            <span>LOCAL BROWSER PERSISTENCE ACTIVE</span>
            <span>·</span>
            <span>ZERO REMOTE PROFILING</span>
            <span>·</span>
            <span className="text-secondary font-bold">100% DETERMINISTIC CALENDAR MATH</span>
          </div>
        </div>

        {/* Monumental Typographic Headline */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase px-2.5 py-1 bg-primary text-neutral-text font-bold rounded-xs">
              Panchang &amp; Utsav Edition
            </span>
            <span className="font-mono text-xs text-neutral-muted">
              Precision Cultural Planning Studio
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold text-neutral-text uppercase tracking-tight leading-[0.98]">
            Master Every Ritual.<br />
            <span className="text-secondary font-black">Audit Every Rupee.</span>
          </h1>

          <p className="text-base sm:text-xl text-neutral-text/90 font-sans max-w-2xl leading-relaxed text-pretty">
            An uncompromising, high-craft planning atelier for Indian weddings, milestone birthdays, and community
            festivals. Everything costed down to the exact rupee, scheduled to the auspicious minute.
          </p>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onCreateEvent}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-neutral-text font-bold text-sm px-7 py-3.5 rounded-sm transition-transform active:scale-[0.98] shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-neutral-text" aria-hidden="true" />
              <span>Create New Celebration</span>
            </button>

            <button
              type="button"
              onClick={onOpenSample}
              className="inline-flex items-center justify-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border-2 border-neutral-text font-bold text-sm px-6 py-3.5 rounded-sm transition-transform active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-secondary" aria-hidden="true" />
              <span>Explore Master Vivaha Plan</span>
            </button>
          </div>
        </div>

        {/* Monumental Interactive Sample Showcase */}
        <div className="bg-neutral-surface border-2 border-neutral-text rounded-sm p-6 shadow-[4px_4px_0_0_#1C1917] relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-neutral-text pb-4 mb-4">
            <div>
              <span className="font-mono text-xs font-bold text-secondary uppercase tracking-wider block">
                Pre-Loaded Reference Event
              </span>
              <h2 className="font-display text-2xl font-bold text-neutral-text">
                Aarav &amp; Meera&apos;s Vivaha Almanac
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-neutral-subtle px-3 py-1.5 rounded-xs border border-neutral-border-strong">
                89 Days to Muhurtam
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs mb-4">
            <div className="bg-neutral-subtle/70 p-3 rounded-xs border border-neutral-border">
              <span className="text-neutral-muted block text-xs">Allocated Budget</span>
              <span className="text-base font-bold text-neutral-text">₹25,00,000</span>
            </div>
            <div className="bg-neutral-subtle/70 p-3 rounded-xs border border-neutral-border">
              <span className="text-neutral-muted block text-xs">Milestones &amp; Rites</span>
              <span className="text-base font-bold text-neutral-text">9 Scheduled</span>
            </div>
            <div className="bg-neutral-subtle/70 p-3 rounded-xs border border-neutral-border">
              <span className="text-neutral-muted block text-xs">Seated Family Guests</span>
              <span className="text-base font-bold text-neutral-text">350 Confirmed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-muted">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              <span>Client-side local storage verified · No telemetry</span>
            </div>
            <button
              type="button"
              onClick={onOpenSample}
              className="inline-flex items-center gap-1.5 font-bold text-secondary hover:text-secondary-hover text-sm"
            >
              <span>Open Master Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expressive Archetypes */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-neutral-border pb-2">
            <h2 className="font-display text-xl font-bold text-neutral-text uppercase">
              Select Celebration Archetype
            </h2>
            <span className="text-xs font-mono text-neutral-muted">
              3 Domain Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {archetypes.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  className="bg-neutral-surface border-2 border-neutral-text rounded-sm p-5 shadow-[3px_3px_0_0_#1C1917] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#1C1917] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-xs ${item.accentBg}`}>
                        {item.index}
                      </span>
                      <span className="text-xs font-mono font-semibold text-neutral-muted">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-neutral-text mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-text/80 mb-4 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="font-mono text-xs font-semibold text-neutral-text bg-neutral-subtle px-2.5 py-1.5 rounded-xs border border-neutral-border mb-4">
                      {item.metrics}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectType(item.type)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-neutral-text hover:bg-neutral-text/90 text-white font-bold text-xs py-2.5 px-3 rounded-xs transition-colors"
                  >
                    <span>Launch Archetype</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
