import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LocalStorageAiConversationStorage,
  getAiConversationStorageKey,
  aiConversationStorage,
  StoredConversationState,
  StoredChatMessage,
} from '../conversation-storage';
import { StagedProposal } from '../types';

describe('LocalStorageAiConversationStorage', () => {
  let storage: LocalStorageAiConversationStorage;

  const mockMessage1: StoredChatMessage = {
    id: 'msg-1',
    sender: 'user',
    text: 'Can we reduce catering expenses by 10%?',
    timestamp: '2026-10-26T10:00:00.000Z',
  };

  const mockMessage2: StoredChatMessage = {
    id: 'msg-2',
    sender: 'assistant',
    text: 'I found 2 ways to reduce catering costs.',
    timestamp: '2026-10-26T10:00:05.000Z',
  };

  const mockProposal: StagedProposal = {
    id: 'prop-1',
    title: 'Trim Beverage Package',
    explanation: 'Switching to standard mocktail bar saves 15,000 INR.',
    actionType: 'adjust_budget_allocation',
    status: 'staged',
    payload: {
      actionType: 'adjust_budget_allocation',
      categoryName: 'Catering & Dining',
      currentAllocated: 400000,
      proposedAllocated: 385000,
      rationale: 'Switching to standard mocktail bar saves 15,000 INR.',
    },
  };

  beforeEach(() => {
    window.localStorage.clear();
    storage = new LocalStorageAiConversationStorage();
  });

  describe('Basic Read and Write Operations', () => {
    it('returns null data when no conversation exists for an event', () => {
      const res = storage.getConversation('evt-1');
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });

    it('returns null when eventId is empty string', () => {
      const res = storage.getConversation('');
      expect(res.success).toBe(true);
      expect(res.data).toBeNull();
    });

    it('saves and retrieves a conversation state cleanly', () => {
      const saveRes = storage.saveConversation('evt-1', {
        messages: [mockMessage1, mockMessage2],
        lastAnswer: mockMessage2.text,
        lastModel: '@cf/meta/llama-3.1-8b-instruct',
        lastProvider: 'cloudflare',
        proposals: [mockProposal],
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.data?.schemaVersion).toBe(1);
      expect(saveRes.data?.eventId).toBe('evt-1');
      expect(saveRes.data?.messages).toHaveLength(2);
      expect(saveRes.data?.proposals).toHaveLength(1);
      expect(saveRes.data?.lastAnswer).toBe(mockMessage2.text);

      const getRes = storage.getConversation('evt-1');
      expect(getRes.success).toBe(true);
      expect(getRes.data).not.toBeNull();
      expect(getRes.data?.messages[0].text).toBe(mockMessage1.text);
      expect(getRes.data?.proposals?.[0].id).toBe(mockProposal.id);
    });

    it('deduplicates messages by id when saving', () => {
      const duplicateMsg: StoredChatMessage = { ...mockMessage1 };
      const saveRes = storage.saveConversation('evt-1', {
        messages: [mockMessage1, duplicateMsg, mockMessage2],
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.data?.messages).toHaveLength(2);
      expect(saveRes.data?.messages.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
    });

    it('filters out malformed messages and proposals safely', () => {
      const malformedMessages = [
        null,
        undefined,
        {},
        { id: 123 }, // invalid id type
        { id: 'ok', sender: 'unknown_role', text: 'hi', timestamp: '2026-01-01' }, // invalid sender
        mockMessage1,
      ] as unknown as StoredChatMessage[];

      const malformedProposals = [
        null,
        { title: 'no id or actionType' },
        mockProposal,
      ] as unknown as StagedProposal[];

      const saveRes = storage.saveConversation('evt-1', {
        messages: malformedMessages,
        proposals: malformedProposals,
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.data?.messages).toHaveLength(1);
      expect(saveRes.data?.messages[0].id).toBe('msg-1');
      expect(saveRes.data?.proposals).toHaveLength(1);
      expect(saveRes.data?.proposals?.[0].id).toBe('prop-1');
    });
  });

  describe('Event Isolation and Deletion', () => {
    it('isolates conversation state between different personal events', () => {
      storage.saveConversation('evt-A', {
        messages: [mockMessage1],
      });

      storage.saveConversation('evt-B', {
        messages: [mockMessage2],
      });

      const resA = storage.getConversation('evt-A');
      const resB = storage.getConversation('evt-B');

      expect(resA.data?.messages[0].id).toBe('msg-1');
      expect(resB.data?.messages[0].id).toBe('msg-2');
    });

    it('isolates sample event sandbox conversation from personal events', () => {
      storage.saveConversation('sample', {
        messages: [mockMessage1],
      });

      const personalRes = storage.getConversation('evt-1');
      expect(personalRes.data).toBeNull();

      const sampleRes = storage.getConversation('sample');
      expect(sampleRes.data?.messages[0].id).toBe('msg-1');
    });

    it('clears conversation cleanly for a specific event', () => {
      storage.saveConversation('evt-1', {
        messages: [mockMessage1],
      });

      expect(storage.getConversation('evt-1').data).not.toBeNull();

      const clearRes = storage.clearConversation('evt-1');
      expect(clearRes.success).toBe(true);

      expect(storage.getConversation('evt-1').data).toBeNull();
    });

    it('supports deleteConversation as an alias for clearConversation', () => {
      storage.saveConversation('evt-1', {
        messages: [mockMessage1],
      });

      const delRes = storage.deleteConversation('evt-1');
      expect(delRes.success).toBe(true);
      expect(storage.getConversation('evt-1').data).toBeNull();
    });
  });

  describe('Error Resilience and Edge Cases', () => {
    it('handles corrupted JSON without crashing and preserves raw string', () => {
      const key = getAiConversationStorageKey('evt-corrupted');
      window.localStorage.setItem(key, '{not valid json!!!}');

      const res = storage.getConversation('evt-corrupted');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('PARSE_ERROR');
      expect(res.data).toBeNull();

      // Ensure data was not wiped out blindly
      expect(window.localStorage.getItem(key)).toBe('{not valid json!!!}');
    });

    it('rejects payload that is not a JSON object', () => {
      const key = getAiConversationStorageKey('evt-scalar');
      window.localStorage.setItem(key, '"just a string"');

      const res = storage.getConversation('evt-scalar');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION_FAILED');
    });

    it('rejects payload with mismatched schemaVersion', () => {
      const key = getAiConversationStorageKey('evt-old-schema');
      window.localStorage.setItem(
        key,
        JSON.stringify({ schemaVersion: 999, eventId: 'evt-old-schema', messages: [] })
      );

      const res = storage.getConversation('evt-old-schema');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VERSION_MISMATCH');
    });

    it('returns VALIDATION_FAILED if eventId is missing during save', () => {
      const res = storage.saveConversation('', {
        messages: [mockMessage1],
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION_FAILED');
    });

    it('handles QuotaExceededError gracefully when saving', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation((key: string) => {
          if (key === '__ep_ai_storage_test__') {
            return;
          }
          const error = new DOMException('Storage full', 'QuotaExceededError');
          throw error;
        });

      const res = storage.saveConversation('evt-1', {
        messages: [mockMessage1],
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('QUOTA_EXCEEDED');

      setItemSpy.mockRestore();
    });

    it('handles unavailable localStorage gracefully', () => {
      const originalLocalStorage = window.localStorage;
      try {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get() {
            throw new Error('Access denied by browser security');
          },
        });

        const restrictedStorage = new LocalStorageAiConversationStorage();
        const res = restrictedStorage.getConversation('evt-1');

        expect(res.success).toBe(false);
        expect(res.error?.code).toBe('STORAGE_UNAVAILABLE');
      } finally {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          value: originalLocalStorage,
        });
      }
    });
  });

  describe('Singleton export', () => {
    it('exports a valid aiConversationStorage singleton instance', () => {
      expect(aiConversationStorage).toBeInstanceOf(LocalStorageAiConversationStorage);
    });
  });
});
