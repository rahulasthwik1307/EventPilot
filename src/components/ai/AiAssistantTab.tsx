'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  ShieldCheck,
  CheckCheck,
  XCircle,
  HelpCircle,
  Eye,
  AlertCircle,
  Info,
  Calendar,
  Wallet,
  Clock,
  Briefcase,
  Users,
  Compass,
} from 'lucide-react';
import { Event } from '../../features/events/types';
import { StagedProposal, AssistantIntent, ProjectedEventContext } from '../../features/ai/types';
import { projectPrivacySafeContext } from '../../features/ai/context-projector';
import {
  applyProposalToEvent,
  detectProposalConflicts,
  dismissProposal,
  markProposalAccepted,
} from '../../features/ai/proposal-engine';
import { StagedProposalCard } from './StagedProposalCard';
import { Button } from '../ui/Button';
import { CouponBadge, StatusPill } from '../ui/Badge';
import { Dialog } from '../ui/Dialog';

export interface AiAssistantTabProps {
  event: Event;
  onUpdateEvent: (updated: Event) => void;
  onNavigateTab?: (tab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'guests' | 'seating' | 'ai') => void;
}

const INTENT_OPTIONS: {
  id: AssistantIntent;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'general', label: 'General Advice', icon: Compass },
  { id: 'budget', label: 'Budget Ledger', icon: Wallet },
  { id: 'timeline', label: 'Timeline & Tasks', icon: Clock },
  { id: 'vendors', label: 'Vendor Sourcing', icon: Briefcase },
  { id: 'guests', label: 'Guests & Hospitality', icon: Users },
  { id: 'ideas', label: 'Traditions & Rituals', icon: Sparkles },
];

interface CachedAiResponse {
  answer: string;
  summary: string;
  recommendations: string[];
  proposals: StagedProposal[];
  modelUsed?: string;
  provider?: 'cloudflare' | 'gemini';
  latencyMs: number;
}

const memoryResponseCache = new Map<string, CachedAiResponse>();

export function AiAssistantTab({
  event,
  onUpdateEvent,
  onNavigateTab,
}: AiAssistantTabProps) {
  const [intent, setIntent] = useState<AssistantIntent>('general');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);

  const [conversationalAnswer, setConversationalAnswer] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'cloudflare' | 'gemini' | null>(null);
  const [proposals, setProposals] = useState<StagedProposal[]>([]);
  const [proposalFilter, setProposalFilter] = useState<'all' | 'staged' | 'applied' | 'dismissed'>('all');
  const [responseLatencyMs, setResponseLatencyMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [is503DemandError, setIs503DemandError] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // High-precision live elapsed timer during active assistant inference
  useEffect(() => {
    if (!isLoading) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 100);
    return () => clearInterval(timer);
  }, [isLoading]);

  // Automatically detect conflicts if event state changes (e.g. deleted category)
  useEffect(() => {
    setProposals((prev) => (prev.length > 0 ? detectProposalConflicts(event, prev) : prev));
  }, [event]);

  // Projected safe context for transparency inspector
  const safeContext: ProjectedEventContext = useMemo(() => {
    return projectPrivacySafeContext(event);
  }, [event]);

  // Archetype-aware starter prompts
  const starterPrompts = useMemo(() => {
    const isWedding = event.type === 'wedding';
    const isBirthday = event.type === 'birthday';

    if (intent === 'budget') {
      return [
        'Audit our current category allocations against typical Indian wedding vendor costs and suggest adjustments.',
        'We need to allocate a 10% contingency reserve for unexpected ceremonial expenses.',
        'Review our catering budget against our expected guest attendance count.',
      ];
    }

    if (intent === 'timeline') {
      return isWedding
        ? [
            'What essential rituals or tasks are missing between 60 days and 2 weeks prior?',
            'Suggest a checklist for sound equipment, Nadaswaram, and power backup testing.',
            'Create milestone anchor tasks for guest welcome kits and transit scheduling.',
          ]
        : [
            'Suggest key setup milestones starting 2 weeks before the celebration.',
            'Create tasks for return gifts, decoration arrival, and vendor confirmations.',
          ];
    }

    if (intent === 'vendors') {
      return [
        'Provide a vendor vetting checklist and key contract questions for traditional caterers.',
        'What should we ask mandap and floral decorators regarding setup and teardown timings?',
        'Suggest typical payment milestones and deposit norms for photographers in India.',
      ];
    }

    if (intent === 'guests') {
      return [
        'How should we structure elder seating and dining arrangements for smooth hospitality?',
        'Provide recommendations for RSVP follow-up timeline and arrival hospitality desks.',
        'Suggest seating considerations for mixed dietary preferences (Sattvic, Jain, Vegan).',
      ];
    }

    if (intent === 'ideas') {
      return isWedding
        ? [
            'Suggest traditional welcome ritual ideas with marigold garlands and rosewater sprinkle.',
            'What are meaningful eco-friendly return gift ideas for family and elders?',
            'Help us craft an auspicious and graceful flow for the evening Sangeet.',
          ]
        : [
            'Suggest creative Indian birthday party themes with interactive games for kids and elders.',
            'What are memorable return gift ideas supporting local craft artisans?',
          ];
    }

    // General intent
    return isWedding
      ? [
          'Conduct a holistic review of our wedding plan and identify the top 3 priority areas.',
          'Help us review our overall readiness across budget, milestones, and guest hospitality.',
          'What are common unexpected pitfalls during South Indian weddings and how do we prevent them?',
        ]
      : [
          'Provide a comprehensive review of our celebration plan and recommend next steps.',
          'Review our timeline and budget for any potential gaps or schedule crunches.',
        ];
  }, [event.type, intent]);

  // Submit request to server-side assistant route
  const handleSubmit = async (customPrompt?: string) => {
    const textToSubmit = (customPrompt || prompt).trim();
    if (!textToSubmit || isLoading) return;

    const cacheKey = `${event.id}:${intent}:${textToSubmit.toLowerCase().trim()}`;
    const cached = memoryResponseCache.get(cacheKey);

    // Instant response from in-memory cache (0ms)
    if (cached) {
      setConversationalAnswer(cached.answer);
      if (cached.modelUsed) setActiveModel(cached.modelUsed);
      if (cached.provider) setActiveProvider(cached.provider);
      setResponseLatencyMs(0);
      const validated = detectProposalConflicts(event, cached.proposals);
      setProposals(validated);
      setProposalFilter('all');
      setErrorMessage(null);
      setIs503DemandError(false);
      setLastSubmittedPrompt(textToSubmit);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIs503DemandError(false);
    setLastSubmittedPrompt(textToSubmit);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          intent,
          userPrompt: textToSubmit,
          context: projectPrivacySafeContext(event, intent),
        }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;
      setResponseLatencyMs(elapsed);

      if (!response.ok) {
        if (response.status === 503 || data?.code === 'MODEL_UNAVAILABLE') {
          setIs503DemandError(true);
          setErrorMessage(
            data?.error ||
              data?.message ||
              'Gemini 3.8 Flash is currently experiencing high demand. Please try again shortly.'
          );
        } else {
          setErrorMessage(
            data?.error || data?.message || 'Failed to communicate with planning assistant.'
          );
        }
        return;
      }

      setConversationalAnswer(data.answer);
      if (data.modelUsed) setActiveModel(data.modelUsed);
      if (data.provider) setActiveProvider(data.provider);

      // Re-validate proposals against current event
      const freshProposals: StagedProposal[] = data.proposals || [];
      const validated = detectProposalConflicts(event, freshProposals);
      setProposals(validated);
      setProposalFilter('all');

      // Cache successful response for instant re-retrieval
      memoryResponseCache.set(cacheKey, {
        answer: data.answer,
        summary: data.summary || '',
        recommendations: data.recommendations || [],
        proposals: freshProposals,
        modelUsed: data.modelUsed,
        provider: data.provider,
        latencyMs: elapsed,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'A network error occurred while connecting to the assistant.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // User accepts a staged proposal -> deterministic application
  const handleAcceptProposal = (id: string) => {
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal || proposal.status !== 'staged') return;

    const result = applyProposalToEvent(event, proposal);
    if (result.success) {
      onUpdateEvent(result.event);
      setProposals((prev) => markProposalAccepted(prev, id));
    } else {
      setErrorMessage(result.error || 'Failed to apply proposal to event.');
    }
  };

  // User dismisses a proposal
  const handleDismissProposal = (id: string) => {
    setProposals((prev) => dismissProposal(prev, id));
  };

  // Bulk actions
  const stagedCount = useMemo(
    () => proposals.filter((p) => p.status === 'staged').length,
    [proposals]
  );

  const handleAcceptAllStaged = () => {
    let currentEvent = event;
    const acceptedIds: string[] = [];

    for (const proposal of proposals) {
      if (proposal.status === 'staged') {
        const res = applyProposalToEvent(currentEvent, proposal);
        if (res.success) {
          currentEvent = res.event;
          acceptedIds.push(proposal.id);
        }
      }
    }

    if (acceptedIds.length > 0) {
      onUpdateEvent(currentEvent);
      setProposals((prev) =>
        prev.map((p) =>
          acceptedIds.includes(p.id)
            ? { ...p, status: 'accepted', appliedAt: new Date().toISOString() }
            : p
        )
      );
    }
  };

  const handleDismissAllStaged = () => {
    setProposals((prev) =>
      prev.map((p) => (p.status === 'staged' ? { ...p, status: 'dismissed' } : p))
    );
  };

  // Filtered proposal list for display
  const displayedProposals = useMemo(() => {
    if (proposalFilter === 'staged') {
      return proposals.filter((p) => p.status === 'staged');
    }
    if (proposalFilter === 'applied') {
      return proposals.filter((p) => p.status === 'accepted');
    }
    if (proposalFilter === 'dismissed') {
      return proposals.filter((p) => p.status === 'dismissed' || p.status === 'conflict');
    }
    return proposals;
  }, [proposals, proposalFilter]);

  return (
    <div className="space-y-8" data-testid="ai-assistant-tab">
      {/* Editorial Header & Privacy Banner */}
      <section className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-md bg-primary-subtle text-primary">
                <Sparkles className="w-5 h-5 text-primary" />
              </span>
              <h2 className="font-display font-semibold text-2xl text-neutral-text">
                AI Planning Assistant
              </h2>
              <CouponBadge variant="marigold">Cloudflare AI + Fallback</CouponBadge>
            </div>
            <p className="text-sm text-neutral-muted">
              AI proposes structured advisory changes. You review before/after diffs before any change is applied.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="self-start sm:self-center"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 text-status-success" />
            Inspect Safe Context
          </Button>
        </div>

        {/* Privacy Guard Notice */}
        <div className="mt-4 flex items-center justify-between bg-neutral-subtle/80 rounded-md px-3.5 py-2.5 text-xs text-neutral-muted border border-neutral-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
            <span>
              <strong className="text-neutral-text font-medium">Privacy Guard Active:</strong> Only high-level event metadata (archetype, city, budget caps, aggregate counts) is shared. Guest names, contact details, dietary notes, and personal contacts are strictly excluded.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-xs text-neutral-text-muted">
            Zero PII Transmitted
          </span>
        </div>
      </section>

      {/* Main Interactive Assistant Console */}
      <section className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-sm space-y-6">
        {/* Intent Selection Tabs */}
        <div>
          <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2.5">
            1. Select Planning Focus Area
          </label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Planning Intent">
            {INTENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = intent === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIntent(opt.id)}
                  aria-checked={isSelected}
                  role="radio"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-neutral-text font-semibold shadow-sm ring-1 ring-primary'
                      : 'bg-neutral-subtle text-neutral-text hover:bg-neutral-subtle/80 border border-neutral-border'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-neutral-text' : 'text-neutral-muted'}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested Starter Prompts */}
        <div>
          <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">
            2. Choose a Suggested Question or Type Your Own
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {starterPrompts.map((starter, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(starter);
                  handleSubmit(starter);
                }}
                disabled={isLoading}
                className="text-left p-3 rounded-md border border-neutral-border bg-neutral-subtle/50 hover:bg-primary-subtle/40 hover:border-primary/40 transition-all text-xs text-neutral-text line-clamp-3 disabled:opacity-50"
              >
                <span className="font-semibold text-primary block mb-0.5">Idea {idx + 1}</span>
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              id="ai-assistant-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the planning assistant for advice on budgeting, timeline milestones, vendor vetting questions, or cultural traditions..."
              disabled={isLoading}
              className="w-full rounded-md border border-neutral-border bg-neutral-bg px-3.5 py-3 text-sm text-neutral-text placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y transition-all disabled:opacity-60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-neutral-muted">
              Press Ask Assistant to generate cultural recommendations and staged proposals.
            </p>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !prompt.trim()}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                  Consulting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Ask Assistant
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-6 rounded-md bg-neutral-subtle/70 border border-neutral-border flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-2.5 rounded-full bg-primary-subtle text-primary">
              <Sparkles className="w-7 h-7 text-primary animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-neutral-text text-sm flex items-center justify-center gap-2">
                <span>Consulting AI Planning Assistant...</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-primary text-neutral-text">
                  {(elapsedMs / 1000).toFixed(1)}s
                </span>
              </h4>
              <p className="text-xs text-neutral-muted max-w-md">
                Synthesizing celebration context, cultural traditions, and structured proposal diffs...
              </p>
            </div>
          </div>
        )}

        {/* Error / Resilience Banner */}
        {errorMessage && !isLoading && (
          <div
            role="alert"
            className={`p-4 rounded-md border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              is503DemandError
                ? 'bg-status-warning-subtle text-status-warning border-status-warning/40'
                : 'bg-status-danger-subtle text-status-danger border-status-danger/40'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {is503DemandError
                    ? 'AI Assistant High Demand (Spike)'
                    : 'Assistant Communication Notice'}
                </p>
                <p className="text-xs mt-0.5 opacity-90">
                  {errorMessage}
                </p>
                {is503DemandError && (
                  <p className="text-xs mt-1 italic">
                    Your local planning data is completely secure. You can retry in a few moments, or continue manual planning.
                  </p>
                )}
              </div>
            </div>

            {lastSubmittedPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubmit(lastSubmittedPrompt)}
                className="shrink-0 bg-neutral-surface"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry Request
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Assistant Conversational Answer Section */}
      {conversationalAnswer && !isLoading && (
        <section className="bg-neutral-surface border border-neutral-border rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-border/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-lg text-neutral-text">
                Planning Guidance &amp; Insights
              </h3>
            </div>
            {activeModel && (
              <span className="text-xs font-mono text-neutral-muted bg-neutral-subtle px-2.5 py-1 rounded border border-neutral-border self-start sm:self-auto flex items-center gap-1.5 shadow-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse" />
                <span className="font-semibold text-neutral-text">
                  {responseLatencyMs === 0
                    ? '⚡ 0ms (Instant Cache)'
                    : `⚡ ${((responseLatencyMs ?? 1200) / 1000).toFixed(1)}s`}
                </span>
                <span>·</span>
                <span>{activeProvider === 'cloudflare' ? 'Cloudflare Workers AI' : 'Gemini Fallback'}</span>
                <span>·</span>
                <span>{activeModel.split('/').pop()}</span>
              </span>
            )}
          </div>

          <div className="prose prose-sm max-w-none text-neutral-text leading-relaxed whitespace-pre-line text-sm bg-neutral-subtle/50 p-4 rounded-md border border-neutral-border/70">
            {conversationalAnswer}
          </div>
        </section>
      )}

      {/* Staged Proposals Review Section */}
      {proposals.length > 0 && !isLoading && (
        <section className="space-y-4" data-testid="staged-proposals-section">
          {/* Section Header with Bulk Actions & Filter */}
          <div className="bg-neutral-surface border border-neutral-border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-lg text-neutral-text">
                  Proposed Actions
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-primary-subtle text-primary font-bold">
                  {proposals.length} total
                </span>
                {stagedCount > 0 && (
                  <StatusPill status="warning">
                    {stagedCount} need review
                  </StatusPill>
                )}
              </div>
              <p className="text-xs text-neutral-muted mt-0.5">
                Review before/after diffs. Accepted proposals update allocations or insert tasks deterministically.
              </p>
            </div>

            {/* Bulk Action Buttons */}
            {stagedCount > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismissAllStaged}
                  className="text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1 text-neutral-muted" />
                  Dismiss All
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptAllStaged}
                  className="text-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Accept All ({stagedCount})
                </Button>
              </div>
            )}
          </div>

          {/* Proposal Filter Tabs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-muted font-medium">Filter proposals:</span>
            {(['all', 'staged', 'applied', 'dismissed'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setProposalFilter(filterKey)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-all ${
                  proposalFilter === filterKey
                    ? 'bg-neutral-text text-neutral-surface'
                    : 'bg-neutral-subtle text-neutral-muted hover:text-neutral-text'
                }`}
              >
                {filterKey === 'applied' ? 'Applied' : filterKey}
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {displayedProposals.map((proposal) => (
              <StagedProposalCard
                key={proposal.id}
                proposal={proposal}
                currency={event.currency}
                onAccept={handleAcceptProposal}
                onDismiss={handleDismissProposal}
                onNavigateTab={(tab) => {
                  if (onNavigateTab) onNavigateTab(tab);
                }}
              />
            ))}

            {displayedProposals.length === 0 && (
              <div className="p-8 text-center text-neutral-muted text-xs bg-neutral-surface border border-neutral-border rounded-lg">
                No proposals matching filter &ldquo;{proposalFilter}&rdquo;.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Safe Context Transparency Modal */}
      <Dialog
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        title="Privacy Guard — Minimal Projected Context"
        description="Event Pilot uses strict context projection. This is the exact, complete payload sent to the AI engine for planning analysis. Notice that no guest names, contact numbers, dietary restrictions, or private vendor notes are present."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto bg-neutral-subtle p-3.5 rounded-md border border-neutral-border font-mono text-xs text-neutral-text">
            <pre>{JSON.stringify(safeContext, null, 2)}</pre>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrivacyModalOpen(false)}
            >
              Close Inspector
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
