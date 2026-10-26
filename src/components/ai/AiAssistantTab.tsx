'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  Trash2,
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
import {
  aiConversationStorage,
  StoredChatMessage,
  getAiConversationStorageKey,
} from '../../features/ai/conversation-storage';
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

export type SessionChatMessage = StoredChatMessage;

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

  // Synchronously load saved conversation from local storage for initial render
  const initialSavedState = useMemo(() => {
    if (typeof window === 'undefined' || !event?.id) return null;
    const res = aiConversationStorage.getConversation(event.id);
    return res.success ? res.data : null;
  }, [event.id]);

  const [sessionMessages, setSessionMessages] = useState<SessionChatMessage[]>(
    () => initialSavedState?.messages || []
  );
  const [activeEventId, setActiveEventId] = useState(event.id);
  const activeEventIdRef = useRef(event.id);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [conversationalAnswer, setConversationalAnswer] = useState<string | null>(
    () => initialSavedState?.lastAnswer || null
  );
  const [activeModel, setActiveModel] = useState<string | null>(
    () => initialSavedState?.lastModel || null
  );
  const [activeProvider, setActiveProvider] = useState<'cloudflare' | 'gemini' | null>(
    () => initialSavedState?.lastProvider || null
  );
  const [proposals, setProposals] = useState<StagedProposal[]>(() => {
    if (!initialSavedState?.proposals) return [];
    return detectProposalConflicts(event, initialSavedState.proposals);
  });
  const [proposalFilter, setProposalFilter] = useState<'all' | 'staged' | 'applied' | 'dismissed'>('all');
  const [responseLatencyMs, setResponseLatencyMs] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [is503DemandError, setIs503DemandError] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Helper to reload saved conversation for the active event
  const loadSavedConversation = useCallback((targetEvent: Event) => {
    try {
      const res = aiConversationStorage.getConversation(targetEvent.id);
      if (res.success && res.data) {
        setSessionMessages(res.data.messages || []);
        setConversationalAnswer(res.data.lastAnswer || null);
        setActiveModel(res.data.lastModel || null);
        setActiveProvider(res.data.lastProvider || null);
        const storedProposals = res.data.proposals || [];
        setProposals(detectProposalConflicts(targetEvent, storedProposals));
      } else {
        setSessionMessages([]);
        setConversationalAnswer(null);
        setActiveModel(null);
        setActiveProvider(null);
        setProposals([]);
      }
    } catch {
      setSessionMessages([]);
      setConversationalAnswer(null);
      setActiveModel(null);
      setActiveProvider(null);
      setProposals([]);
    }
  }, []);

  // Synchronize active event reference and reload conversation when user switches events
  useEffect(() => {
    activeEventIdRef.current = event.id;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (event.id !== activeEventId) {
      setActiveEventId(event.id);
      setIsLoading(false);
      setErrorMessage(null);
      loadSavedConversation(event);
    }
  }, [event.id, activeEventId, event, loadSavedConversation]);

  // Cross-tab conversation synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !event.id) return;
    const storageKey = getAiConversationStorageKey(event.id);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        loadSavedConversation(event);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [event.id, event, loadSavedConversation]);

  // Clear conversation history action
  const handleClearHistory = useCallback(() => {
    aiConversationStorage.clearConversation(event.id);
    setSessionMessages([]);
    setConversationalAnswer(null);
    setActiveModel(null);
    setActiveProvider(null);
    setProposals([]);
    setErrorMessage(null);
  }, [event.id]);

  // Cleanup pending controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

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
          'Guest comfort matters more than elaborate decoration; how should we balance our budget?',
          'The budget is a hard limit; help us review our non-negotiables.',
        ]
      : [
          'Provide a comprehensive review of our celebration plan and recommend next steps.',
          'Review our timeline and budget for any potential gaps or schedule crunches.',
          'We need wheelchair-accessible arrangements and ground-floor seating.',
        ];
  }, [event.type, intent]);

  // Submit request to server-side assistant route
  const handleSubmit = async (customPrompt?: string) => {
    const textToSubmit = (customPrompt || prompt).trim();
    if (!textToSubmit || isLoading) return;

    // Record user message in session-only history
    const userMsg: SessionChatMessage = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      text: textToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSessionMessages((prev) => [...prev, userMsg]);

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

      const cachedAssistantMsg: SessionChatMessage = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'assistant',
        text: cached.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent,
        modelUsed: cached.modelUsed,
        provider: cached.provider,
      };
      const updatedMessages = [...sessionMessages, userMsg, cachedAssistantMsg];
      setSessionMessages(updatedMessages);

      aiConversationStorage.saveConversation(event.id, {
        messages: updatedMessages,
        lastAnswer: cached.answer,
        lastModel: cached.modelUsed,
        lastProvider: cached.provider,
        proposals: validated,
      });
      return;
    }

    // Cancel any prior in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const targetEventId = event.id;

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
          eventId: targetEventId,
          intent,
          userPrompt: textToSubmit,
          context: projectPrivacySafeContext(event, intent),
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;

      // Identity guard: if user switched events while fetch was pending, drop result
      if (activeEventIdRef.current !== targetEventId || controller.signal.aborted) {
        return;
      }

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

      // Record assistant reply in history
      const asstMsg: SessionChatMessage = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent,
        modelUsed: data.modelUsed,
        provider: data.provider,
      };
      const updatedMessages = [...sessionMessages, userMsg, asstMsg];
      setSessionMessages(updatedMessages);

      // Persist completed conversation state to local storage
      aiConversationStorage.saveConversation(event.id, {
        messages: updatedMessages,
        lastAnswer: data.answer,
        lastModel: data.modelUsed,
        lastProvider: data.provider,
        proposals: validated,
      });

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
      if (err.name === 'AbortError' || controller.signal.aborted || activeEventIdRef.current !== targetEventId) {
        return;
      }
      setErrorMessage(
        err?.message || 'A network error occurred while connecting to the assistant.'
      );
    } finally {
      if (activeEventIdRef.current === targetEventId) {
        setIsLoading(false);
      }
    }
  };

  // User accepts a staged proposal -> deterministic application
  const handleAcceptProposal = (id: string) => {
    if (activeEventIdRef.current !== event.id) return;
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal || proposal.status !== 'staged') return;

    // Stale proposal protection: re-validate proposal against current event state
    const checked = detectProposalConflicts(event, [proposal]);
    if (checked[0].status === 'conflict') {
      const conflictProposals = proposals.map((p) =>
        p.id === id ? { ...p, status: 'conflict' as const, conflictReason: checked[0].conflictReason } : p
      );
      setProposals(conflictProposals);
      aiConversationStorage.saveConversation(event.id, {
        messages: sessionMessages,
        lastAnswer: conversationalAnswer,
        lastModel: activeModel,
        lastProvider: activeProvider,
        proposals: conflictProposals,
      });
      setErrorMessage(checked[0].conflictReason || 'Proposal is stale and conflicts with current celebration state.');
      return;
    }

    const result = applyProposalToEvent(event, proposal);
    if (result.success) {
      onUpdateEvent(result.event);
      const nextProposals = markProposalAccepted(proposals, id);
      setProposals(nextProposals);
      aiConversationStorage.saveConversation(event.id, {
        messages: sessionMessages,
        lastAnswer: conversationalAnswer,
        lastModel: activeModel,
        lastProvider: activeProvider,
        proposals: nextProposals,
      });
    } else {
      setErrorMessage(result.error || 'Failed to apply proposal to event.');
    }
  };

  // User dismisses a proposal
  const handleDismissProposal = (id: string) => {
    const nextProposals = dismissProposal(proposals, id);
    setProposals(nextProposals);
    aiConversationStorage.saveConversation(event.id, {
      messages: sessionMessages,
      lastAnswer: conversationalAnswer,
      lastModel: activeModel,
      lastProvider: activeProvider,
      proposals: nextProposals,
    });
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
      const nextProposals = proposals.map((p) =>
        acceptedIds.includes(p.id)
          ? { ...p, status: 'accepted' as const, appliedAt: new Date().toISOString() }
          : p
      );
      setProposals(nextProposals);
      aiConversationStorage.saveConversation(event.id, {
        messages: sessionMessages,
        lastAnswer: conversationalAnswer,
        lastModel: activeModel,
        lastProvider: activeProvider,
        proposals: nextProposals,
      });
    }
  };

  const handleDismissAllStaged = () => {
    const nextProposals = proposals.map((p) =>
      p.status === 'staged' ? { ...p, status: 'dismissed' as const } : p
    );
    setProposals(nextProposals);
    aiConversationStorage.saveConversation(event.id, {
      messages: sessionMessages,
      lastAnswer: conversationalAnswer,
      lastModel: activeModel,
      lastProvider: activeProvider,
      proposals: nextProposals,
    });
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
      <section className="relative overflow-hidden bg-white border border-[#E7DFD5] rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Top decorative hairline accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C2410C] via-[#D97706] to-[#C2410C]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7DFD5]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-[#FEF3C7] text-[#D97706]">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C2410C] font-bold">
                Cultural Advisory &amp; Co-Pilot
              </span>
              <CouponBadge variant="marigold">Cloudflare AI + Fallback</CouponBadge>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              AI Planning Assistant
            </h2>
            <p className="text-xs text-[#78716C] mt-1 max-w-2xl leading-relaxed">
              AI proposes structured advisory changes. You review before/after diffs before any change is applied.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="self-start sm:self-center text-xs font-mono font-semibold bg-[#FAF8F5] border-[#E7DFD5] text-[#1C1917] hover:bg-[#F5F2EB]"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 text-[#059669]" />
            Inspect Safe Context
          </Button>
        </div>

        {/* Privacy Guard Notice */}
        <div className="mt-4 flex items-center justify-between bg-[#FAF8F5] rounded-lg px-4 py-3 text-xs text-[#78716C] border border-[#E7DFD5]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
            <span>
              <strong className="text-[#1C1917] font-semibold">Privacy Guard Active:</strong> Only high-level event metadata (archetype, city, budget caps, aggregate counts) is shared. Guest names, contact details, dietary notes, and personal contacts are strictly excluded.
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[11px] font-bold text-[#059669] px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] shrink-0">
            Zero PII Transmitted
          </span>
        </div>
      </section>

      {/* Main Interactive Assistant Console */}
      <section className="bg-white border border-[#E7DFD5] rounded-xl p-6 sm:p-8 shadow-sm space-y-7">
        {/* Focus Area Selection Deck */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#E7DFD5]/60">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1C1917] tracking-tight">
                Select Planning Focus Area
              </h3>
              <p className="text-xs text-[#78716C]">
                Target assistant recommendations and structured proposals to a specific dimension of your celebration.
              </p>
            </div>
            <div className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7DFD5] text-[#78716C]">
              <span>Focus:</span>
              <strong className="text-[#C2410C]">
                {INTENT_OPTIONS.find((opt) => opt.id === intent)?.label}
              </strong>
            </div>
          </div>

          {/* 6 Responsive Focus Area Cards (2 cols mobile, 3 cols tablet, 6 cols desktop) */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
            role="radiogroup"
            aria-label="Planning Intent"
          >
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
                  className={`group relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 ${
                    isSelected
                      ? 'bg-[#FFFBEB] border-[#D97706] ring-1 ring-[#D97706]/40 shadow-xs'
                      : 'bg-[#FAF8F5] border-[#E7DFD5] hover:bg-white hover:border-[#D6CCC2] hover:shadow-xs'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#FEF3C7] text-[#C2410C] border border-[#FDE68A]'
                        : 'bg-white text-[#78716C] border border-[#E7DFD5] group-hover:text-[#1C1917] group-hover:border-[#D6CCC2]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs leading-snug transition-colors ${
                      isSelected ? 'font-bold text-[#9A3412]' : 'font-medium text-[#57534E] group-hover:text-[#1C1917]'
                    }`}
                  >
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] absolute bottom-1.5 left-1/2 -translate-x-1/2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested Inquiries / Starter Cards */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <h4 className="font-serif text-base font-bold text-[#1C1917]">
                Suggested Questions for {INTENT_OPTIONS.find((opt) => opt.id === intent)?.label}
              </h4>
            </div>
            <span className="text-[11px] font-mono text-[#A8A29E] hidden sm:inline">
              Click any inquiry to ask immediately
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
            {starterPrompts.map((starter, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(starter);
                  handleSubmit(starter);
                }}
                disabled={isLoading}
                className="text-left p-4 rounded-xl border border-[#E7DFD5] bg-[#FAF8F5] hover:bg-white hover:border-[#D97706] hover:shadow-md transition-all text-xs text-[#1C1917] disabled:opacity-50 group flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#92400E] px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A]">
                      Idea {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-[#A8A29E] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all">
                      &rarr;
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#1C1917] leading-relaxed font-sans font-normal">
                    {starter}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-[#E7DFD5]/70 flex items-center justify-between text-[11px] font-mono text-[#78716C] group-hover:text-[#D97706]">
                  <span>Submit to assistant</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Ask now &rarr;
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-3 pt-1"
        >
          <div className="bg-[#FAF8F5] border border-[#E7DFD5] rounded-xl p-3 focus-within:bg-white focus-within:border-[#D97706] focus-within:ring-1 focus-within:ring-[#D97706]/40 transition-all">
            <label
              htmlFor="ai-assistant-prompt"
              className="block text-[11px] font-mono font-semibold uppercase text-[#78716C] mb-1.5"
            >
              Custom Inquiries &amp; Celebration Instructions
            </label>
            <textarea
              id="ai-assistant-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the planning assistant for advice on budgeting, timeline milestones, vendor vetting questions, or cultural traditions..."
              disabled={isLoading}
              className="w-full bg-transparent text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none resize-y transition-all disabled:opacity-60 leading-relaxed min-h-[72px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[#78716C] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              <span>
                Generates culturally tailored advice, calculation sanity checks, and staged diff proposals.
              </span>
            </p>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !prompt.trim()}
              className="self-end sm:self-auto min-w-[150px] font-bold text-xs font-mono active:scale-[0.98] transition-all bg-primary hover:bg-primary-hover text-neutral-text border-0 shadow-sm px-5 py-2.5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Consulting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  <span>Ask Assistant</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Loading Indicator */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="p-8 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="p-3 rounded-full bg-[#FEF3C7] text-[#D97706]">
              <Sparkles className="w-6 h-6 text-[#D97706] animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-[#1C1917] text-sm flex items-center justify-center gap-2">
                <span>Consulting AI Planning Assistant...</span>
                <span
                  aria-hidden="true"
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-primary text-neutral-text"
                >
                  {(elapsedMs / 1000).toFixed(1)}s
                </span>
              </h4>
              <p className="text-xs text-[#78716C] max-w-md leading-relaxed">
                Synthesizing celebration context, cultural traditions, and structured proposal diffs...
              </p>
            </div>
          </div>
        )}

        {/* Error / Resilience Banner */}
        {errorMessage && !isLoading && (
          <div
            role="alert"
            className={`p-4 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              is503DemandError
                ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-current" />
              <div>
                <p className="font-bold">
                  {is503DemandError
                    ? 'AI Assistant High Demand (Spike)'
                    : 'Assistant Communication Notice'}
                </p>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
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
                className="shrink-0 bg-white border-[#E7DFD5] text-[#1C1917] text-xs font-mono hover:bg-[#FAF8F5]"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Retry Request
              </Button>
            )}
          </div>
        )}

        {/* Conversation History Stream */}
        {sessionMessages.length > 0 && (
          <div className="pt-4 border-t border-[#E7DFD5] space-y-3" data-testid="conversation-history-stream">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5 font-mono text-[11px]">
                <Compass className="w-3.5 h-3.5 text-[#D97706]" />
                Conversation History ({sessionMessages.length} {sessionMessages.length === 1 ? 'message' : 'messages'})
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#059669] font-mono font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Stored Locally in Browser</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#78716C] hover:text-[#DC2626] transition-colors px-2 py-0.5 rounded hover:bg-[#FEF2F2]"
                  aria-label="Clear conversation history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>
            {sessionMessages.length > 1 && (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {sessionMessages.slice(0, -1).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#FFEDD5]/60 text-[#1C1917] border border-[#FED7AA]'
                          : 'bg-[#FAF8F5] text-[#1C1917] border border-[#E7DFD5]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-[#78716C] mb-1 font-mono">
                        <span className="font-bold text-[#1C1917]">
                          {msg.sender === 'user' ? 'You' : 'Planning Assistant'}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Assistant Conversational Answer Section */}
      {conversationalAnswer && !isLoading && (
        <section className="bg-white border border-[#E7DFD5] rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#E7DFD5]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97706]" />
              <h3 className="font-serif font-bold text-lg text-[#1C1917]">
                Planning Guidance &amp; Insights
              </h3>
            </div>
            {activeModel && (
              <span className="text-[11px] font-mono text-[#78716C] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E7DFD5] self-start sm:self-auto flex items-center gap-1.5 shadow-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span className="font-bold text-[#1C1917]">
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

          <div className="prose prose-sm max-w-none text-[#1C1917] leading-relaxed whitespace-pre-line text-xs sm:text-sm bg-[#FAF8F5] p-5 rounded-xl border border-[#E7DFD5]">
            {conversationalAnswer}
          </div>
        </section>
      )}

      {/* Staged Proposals Review Section */}
      {proposals.length > 0 && !isLoading && (
        <section className="space-y-4" data-testid="staged-proposals-section">
          {/* Section Header with Bulk Actions & Filter */}
          <div className="bg-white border border-[#E7DFD5] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#1C1917]">
                  Proposed Actions
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold border border-[#FDE68A]">
                  {proposals.length} total
                </span>
                {stagedCount > 0 && (
                  <StatusPill status="warning">
                    {stagedCount} need review
                  </StatusPill>
                )}
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
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
                  className="text-xs font-mono text-[#78716C] hover:text-[#1C1917] border-[#E7DFD5] bg-[#FAF8F5]"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1 text-[#A8A29E]" />
                  <span>Dismiss All</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptAllStaged}
                  className="text-xs font-mono font-bold bg-primary hover:bg-primary-hover text-neutral-text border-0 shadow-sm"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  <span>Accept All ({stagedCount})</span>
                </Button>
              </div>
            )}
          </div>

          {/* Proposal Filter Tabs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#78716C] font-semibold font-mono text-[11px] uppercase">Filter proposals:</span>
            {(['all', 'staged', 'applied', 'dismissed'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setProposalFilter(filterKey)}
                className={`px-3 py-1 rounded-lg capitalize font-mono text-xs transition-all ${
                  proposalFilter === filterKey
                    ? 'bg-[#1C1917] text-white font-bold'
                    : 'bg-[#FAF8F5] text-[#78716C] border border-[#E7DFD5] hover:text-[#1C1917]'
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
              <div className="p-8 text-center text-[#78716C] text-xs bg-white border border-[#E7DFD5] rounded-xl">
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
          <div className="max-h-96 overflow-y-auto bg-[#FAF8F5] p-4 rounded-xl border border-[#E7DFD5] font-mono text-xs text-[#1C1917] leading-relaxed">
            <pre className="whitespace-pre-wrap">{JSON.stringify(safeContext, null, 2)}</pre>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrivacyModalOpen(false)}
              className="border-[#E7DFD5] text-[#1C1917] hover:bg-[#FAF8F5]"
            >
              Close Inspector
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
