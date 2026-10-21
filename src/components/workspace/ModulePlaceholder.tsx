import React from 'react';
import {
  Wallet,
  Clock,
  Briefcase,
  Users,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { WorkspaceTab } from './WorkspaceNavigation';
import { CouponBadge } from '../ui/Badge';

export interface ModulePlaceholderProps {
  tab: WorkspaceTab;
  onReturnToOverview: () => void;
}

export function ModulePlaceholder({
  tab,
  onReturnToOverview,
}: ModulePlaceholderProps) {
  const details = {
    overview: {
      title: 'Overview',
      milestone: 'Milestone 1 · Live',
      description: 'Central celebration summary, deterministic metrics, and local persistence.',
      icon: Wallet,
      features: [],
    },
    budget: {
      title: 'Budget & Expense Ledger',
      milestone: 'Scheduled for Milestone 2',
      description:
        'Granular expense lines grouped by budget category with recorded payment statuses (projected, deposit_paid, settled).',
      icon: Wallet,
      features: [
        'Category budget allocation and variance tracking',
        'Deposit records and settled balance ledger',
        'Deterministic sum and per-guest expense calculations',
      ],
    },
    timeline: {
      title: 'Timeline Milestones & Task Matrix',
      milestone: 'Scheduled for Milestone 2',
      description:
        'Chronological schedule calculated from relative day offsets (offset_days) from the main celebration date.',
      icon: Clock,
      features: [
        'Phase anchors (e.g. -90 days, -30 days, -1 day, celebration day)',
        'Checklist tasks with priority and due date',
        'Deterministic date calculations without timezone drift',
      ],
    },
    vendors: {
      title: 'Vendor Records & Quote Tracker',
      milestone: 'Scheduled for Milestone 3',
      description:
        'Private service provider tracking containing contact details, quoted prices, booked status, notes, and deposit milestones.',
      icon: Briefcase,
      features: [
        'Private vendor directory (not an external booking agency)',
        'Quote comparison and deposit schedule tracking',
        'Links between vendor quotes and budget expense lines',
      ],
    },
    guests: {
      title: 'Guests & RSVP Management',
      milestone: 'Milestone 3 · Live',
      description:
        'Individual attendee tracking with invitation groups, RSVP responses, dietary notes, and plus-one commitments.',
      icon: Users,
      features: [
        'RSVP status ledger (pending, confirmed, declined)',
        'Dietary preferences and allergy records kept private',
        'Household groups and plus-one tracking',
      ],
    },
    seating: {
      title: 'Seating & Table Allocation',
      milestone: 'Milestone 3 · Live',
      description:
        'Interactive table arrangement, capacity limits, and dynamic assignment tracking.',
      icon: Users,
      features: [
        'Tables with capacity limits and conflict warnings',
        'Guest seating assignments and occupancy indicators',
        'Dietary summary per table for catering coordinators',
      ],
    },
    ai: {
      title: 'AI Planning Assistant & Staged Proposals',
      milestone: 'Scheduled for Milestone 4',
      description:
        'Gemini-powered recommendation engine generating structured proposals held in staging diff drawers for explicit human approval.',
      icon: Sparkles,
      features: [
        'Staged proposal diff comparisons before accepting changes',
        'Human-in-the-loop review: selective acceptance, editing, or dismissal',
        'No automatic overwriting of user-entered plans or actual expenses',
      ],
    },
  }[tab];

  const Icon = details.icon;

  return (
    <div className="bg-neutral-surface border border-neutral-border rounded-lg p-8 sm:p-12 shadow-card max-w-2xl mx-auto text-center space-y-6">
      <div className="w-12 h-12 rounded-lg bg-secondary-subtle mx-auto flex items-center justify-center text-secondary border border-secondary/30">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2">
          <CouponBadge variant="terracotta">{details.milestone}</CouponBadge>
        </div>
        <h3 className="font-display text-2xl font-semibold text-neutral-text">
          {details.title}
        </h3>
        <p className="text-sm text-neutral-text/80 leading-relaxed max-w-md mx-auto">
          {details.description}
        </p>
      </div>

      {details.features.length > 0 && (
        <div className="bg-neutral-subtle/70 border border-neutral-border p-4 rounded-md text-left text-xs space-y-2 max-w-md mx-auto">
          <p className="font-semibold text-neutral-text uppercase tracking-wider text-xs">
            Planned Domain Capabilities:
          </p>
          <ul className="space-y-1.5 text-neutral-muted">
            {details.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={onReturnToOverview}
          className="inline-flex items-center gap-2 bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border px-4 py-2 rounded-md text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Workspace Overview</span>
        </button>
      </div>
    </div>
  );
}
