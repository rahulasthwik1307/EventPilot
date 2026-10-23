'use client';

import React from 'react';
import { VariantHeroProps } from './types';
import { EventType } from '../../../features/events/types';
import { Compass, Sparkles, ArrowRight, ShieldCheck, Heart, Cake, Users, Flame, Star } from 'lucide-react';

export function CinematicNocturneHero({
  onOpenSample,
  onCreateEvent,
  onSelectType,
}: VariantHeroProps) {
  const archetypes: {
    type: EventType;
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      type: 'wedding',
      title: 'Vivaha & Sacred Rites',
      subtitle: 'Multi-Day Celebrations',
      description: 'Synchronize Sangeet, Muhurtam, and Reception with complex family seating.',
      highlights: ['350 Guests Planned', '12 Budget Ledgers', 'Muhurtam Countdown'],
      icon: Heart,
      accentColor: 'border-amber-500/30 text-amber-400 group-hover:border-amber-400',
    },
    {
      type: 'birthday',
      title: 'Janmadina Milestones',
      subtitle: 'Anniversaries & Jubilees',
      description: 'Dedicated celebration timelines for milestone birthdays with custom catering.',
      highlights: ['Theme Coordination', 'Dietary Restrictions', 'Cake & Tribute Timing'],
      icon: Cake,
      accentColor: 'border-orange-500/30 text-orange-400 group-hover:border-orange-400',
    },
    {
      type: 'community',
      title: 'Utsav & Civic Galas',
      subtitle: 'Cultural Festivals',
      description: 'Society Diwali melas, cultural galas, volunteer rosters, and civic permits.',
      highlights: ['Multi-Tier Sponsorship', 'Permit Management', 'Volunteer Rosters'],
      icon: Users,
      accentColor: 'border-yellow-500/30 text-yellow-400 group-hover:border-yellow-400',
    },
  ];

  return (
    <section className="relative overflow-hidden py-10 md:py-16 px-4 sm:px-6 bg-[#0C0A10] text-[#FAF7F2] rounded-2xl my-4 border border-amber-500/20 shadow-2xl">
      {/* Ambient Nocturne Light Blooms (Simulating celebratory celestial diyas & starlight) */}
      <div
        className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-0"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none -z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        {/* Cinematic Headline & Thesis */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>The Nocturne Almanac · Precision Celebration Planning</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12]">
            Celebration Artistry Meets Architectural Certainty.
          </h1>

          <p className="text-base sm:text-lg text-stone-300 leading-relaxed font-sans max-w-2xl mx-auto text-pretty">
            Plan magnificent Indian weddings, milestone anniversaries, and community festivals with
            unwavering financial clarity. Pure deterministic calculations, zero data leakage, and total peace of mind.
          </p>

          {/* Glowing Cinematic CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onCreateEvent}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold px-7 py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-stone-950" aria-hidden="true" />
              <span>Begin Your Celebration</span>
            </button>

            <button
              type="button"
              onClick={onOpenSample}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white border border-amber-500/30 hover:border-amber-500/60 font-medium px-6 py-3.5 rounded-lg transition-all backdrop-blur-md active:scale-[0.98]"
            >
              <Compass className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Explore Starlight Sample Plan</span>
            </button>
          </div>
        </div>

        {/* Cinematic Translucent Sample Artifact */}
        <div className="max-w-3xl mx-auto">
          <div className="backdrop-blur-xl bg-stone-900/70 border border-amber-500/30 rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-amber-400/50 transition-all duration-300">
            {/* Top Amber Hairline Accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">
                    Aarav &amp; Meera&apos;s Vivaha Almanac
                  </h3>
                  <span className="text-xs text-amber-300/80 font-mono">
                    Official Demonstration Workspace
                  </span>
                </div>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  89 Days to Muhurtam
                </span>
              </div>
            </div>

            {/* Glowing Metric Bar */}
            <div className="grid grid-cols-3 divide-x divide-stone-800 py-4 text-xs font-mono">
              <div className="px-4 first:pl-0">
                <span className="text-stone-400 block text-xs font-sans">Budget Cap</span>
                <span className="font-bold text-white text-base">₹25,00,000</span>
              </div>
              <div className="px-4">
                <span className="text-stone-400 block text-xs font-sans">Ceremonial Milestones</span>
                <span className="font-bold text-white text-base">9 Scheduled</span>
              </div>
              <div className="px-4 last:pr-0">
                <span className="text-stone-400 block text-xs font-sans">Confirmed Guests</span>
                <span className="font-bold text-amber-300 text-base">350 Seats</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-800 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Encrypted in browser local storage · Zero cloud telemetry</span>
              </div>
              <button
                type="button"
                onClick={onOpenSample}
                className="font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Launch Live Inspection</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Cinematic Archetype Cards */}
        <div className="space-y-4 pt-4">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold text-white">
              Tailored Celebration Archetypes
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Select a domain template with pre-configured ceremony milestones and budget structures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {archetypes.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  className="group relative backdrop-blur-md bg-stone-900/50 border border-stone-800 hover:border-amber-500/40 rounded-xl p-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center text-amber-400 border border-stone-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded">
                        {item.subtitle}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-white mb-1.5 group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <ul className="space-y-1.5 border-t border-stone-800/80 pt-3 mb-5">
                      {item.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-stone-400 flex items-center gap-2">
                          <Star className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectType(item.type)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-stone-800/80 hover:bg-amber-500 text-stone-200 hover:text-stone-950 font-semibold text-xs py-2.5 px-3 rounded-lg border border-stone-700 hover:border-amber-400 transition-all duration-200"
                  >
                    <span>Configure {item.type === 'wedding' ? 'Vivaha' : item.type === 'birthday' ? 'Birthday' : 'Festival'}</span>
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
