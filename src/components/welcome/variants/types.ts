import React from 'react';
import { Event, EventType } from '../../../features/events/types';

export type LandingVariantId =
  | 'baseline'
  | 'editorial'
  | 'cinematic'
  | 'expressive'
  | 'interactive';

export interface VariantHeroProps {
  onOpenSample: () => void;
  onCreateEvent: () => void;
  onSelectType: (type: EventType) => void;
}

export interface VariantMeta {
  id: LandingVariantId;
  label: string;
  tagline: string;
  category: string;
  typography: string;
  palette: string;
  motionNote: string;
}

export const LANDING_VARIANTS: VariantMeta[] = [
  {
    id: 'baseline',
    label: 'Baseline (Current)',
    tagline: 'Standard Centered Stationery Layout',
    category: 'Preserved Original',
    typography: 'Eczar Serif + Plus Jakarta Sans',
    palette: 'Ivory (#FDFBF7) · Amber (#D97706) · Terracotta (#C2410C)',
    motionNote: 'Gentle card lift, standard CSS transition',
  },
  {
    id: 'editorial',
    label: '1. The Grand Broadsheet',
    tagline: 'Bold Editorial Asymmetric Layout with High-Contrast Typography',
    category: 'Editorial Asymmetric',
    typography: 'Oversized Eczar (64px) + Almanac Data Tapes in JetBrains Mono',
    palette: 'Carbon Ink (#1C1917) on Unbleached Kora Paper (#FDFBF7)',
    motionNote: 'Crisp layout snap, perforated slip hover reveals, zero float',
  },
  {
    id: 'cinematic',
    label: '2. Nocturne & Starlight',
    tagline: 'Luminous Evening Celebration Atmosphere with Ambient Radiance',
    category: 'Cinematic Atmospheric',
    typography: 'Luminous Eczar Display + Sleek Sans in High Contrast',
    palette: 'Obsidian Night (#0C0A10) · Golden Diya (#F59E0B) · Royal Vermillion',
    motionNote: 'Ambient breathing light blooms, subtle glass refraction',
  },
  {
    id: 'expressive',
    label: '3. Kala & Utsav',
    tagline: 'Monumental Typography, Dynamic Marquee, and Expressive Geometry',
    category: 'Experimental & Expressive',
    typography: 'Monumental Staggered Headlines + Micro-Spaced Tags',
    palette: 'Saffron Gold (#D97706) · Deep Sindoor (#C2410C) · Turmeric Accent',
    motionNote: 'Continuous ticker scroll, tactile isometric card spring',
  },
  {
    id: 'interactive',
    label: '4. The Living Chronicle',
    tagline: 'Experiential Journey Stepper & Live Celebration Playground',
    category: 'Interactive Storytelling',
    typography: 'Refined Modern Serif + Crisp Proportional Metrics',
    palette: 'Champagne Ivory (#FAF7F2) · Warm Sandstone · Forest Emerald (#15803D)',
    motionNote: 'Live slider calculations, smooth node illumination transitions',
  },
];
