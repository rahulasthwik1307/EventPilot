import { AssistantIntent, StagedProposal } from './types';
import { StorageError, StorageResult } from '../events/types';

export const AI_CONVERSATION_STORAGE_PREFIX = 'event_pilot_ai_convo_v1_';

export interface StoredChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: AssistantIntent;
  modelUsed?: string;
  provider?: 'cloudflare' | 'gemini';
}

export interface StoredConversationState {
  schemaVersion: 1;
  eventId: string;
  messages: StoredChatMessage[];
  lastAnswer?: string | null;
  lastModel?: string | null;
  lastProvider?: 'cloudflare' | 'gemini' | null;
  proposals?: StagedProposal[];
  updatedAt: string;
}

export interface SaveConversationInput {
  messages: StoredChatMessage[];
  lastAnswer?: string | null;
  lastModel?: string | null;
  lastProvider?: 'cloudflare' | 'gemini' | null;
  proposals?: StagedProposal[];
}

export function getAiConversationStorageKey(eventId: string): string {
  return `${AI_CONVERSATION_STORAGE_PREFIX}${eventId}`;
}

export class LocalStorageAiConversationStorage {
  private isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      if (!window.localStorage) {
        return false;
      }
      const testKey = '__ep_ai_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private unavailableError(): StorageError {
    return {
      code: 'STORAGE_UNAVAILABLE',
      message: 'Browser localStorage is unavailable or blocked by security settings.',
    };
  }

  private handleStorageError(err: unknown, fallbackMessage: string): StorageError {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22)
    ) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: 'Browser storage quota exceeded. Please clear older conversation history.',
        cause: err,
      };
    }
    return {
      code: 'UNKNOWN',
      message: fallbackMessage,
      cause: err,
    };
  }

  getConversation(eventId: string): StorageResult<StoredConversationState | null> {
    if (!eventId) {
      return { success: true, data: null };
    }

    if (!this.isAvailable()) {
      return { success: false, data: null, error: this.unavailableError() };
    }

    const key = getAiConversationStorageKey(eventId);

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return { success: true, data: null };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        return {
          success: false,
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: 'Saved AI conversation data is corrupted and cannot be parsed.',
            cause: parseErr,
          },
        };
      }

      if (!parsed || typeof parsed !== 'object') {
        return {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Saved AI conversation data payload is not a valid object.',
          },
        };
      }

      const container = parsed as Record<string, unknown>;
      if (container.schemaVersion !== 1) {
        return {
          success: false,
          data: null,
          error: {
            code: 'VERSION_MISMATCH',
            message: `Incompatible AI conversation storage version: ${String(container.schemaVersion)}`,
          },
        };
      }

      const rawMessages = Array.isArray(container.messages) ? container.messages : [];
      const validMessages: StoredChatMessage[] = [];
      const seenIds = new Set<string>();

      for (const item of rawMessages) {
        if (
          item &&
          typeof item === 'object' &&
          typeof (item as StoredChatMessage).id === 'string' &&
          ((item as StoredChatMessage).sender === 'user' ||
            (item as StoredChatMessage).sender === 'assistant') &&
          typeof (item as StoredChatMessage).text === 'string' &&
          typeof (item as StoredChatMessage).timestamp === 'string'
        ) {
          const msg = item as StoredChatMessage;
          if (!seenIds.has(msg.id)) {
            seenIds.add(msg.id);
            validMessages.push({
              id: msg.id,
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.timestamp,
              intent: msg.intent,
              modelUsed: msg.modelUsed,
              provider: msg.provider,
            });
          }
        }
      }

      const rawProposals = Array.isArray(container.proposals) ? container.proposals : [];
      const validProposals: StagedProposal[] = [];
      for (const p of rawProposals) {
        if (p && typeof p === 'object' && typeof p.id === 'string' && typeof p.actionType === 'string') {
          validProposals.push(p as StagedProposal);
        }
      }

      const state: StoredConversationState = {
        schemaVersion: 1,
        eventId: typeof container.eventId === 'string' ? container.eventId : eventId,
        messages: validMessages,
        lastAnswer: typeof container.lastAnswer === 'string' ? container.lastAnswer : null,
        lastModel: typeof container.lastModel === 'string' ? container.lastModel : null,
        lastProvider:
          container.lastProvider === 'cloudflare' || container.lastProvider === 'gemini'
            ? container.lastProvider
            : null,
        proposals: validProposals,
        updatedAt:
          typeof container.updatedAt === 'string'
            ? container.updatedAt
            : new Date().toISOString(),
      };

      return { success: true, data: state };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: this.handleStorageError(err, 'Failed to retrieve AI conversation from storage.'),
      };
    }
  }

  saveConversation(
    eventId: string,
    input: SaveConversationInput
  ): StorageResult<StoredConversationState> {
    if (!eventId) {
      return {
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Event ID is required to save conversation.' },
      };
    }

    if (!this.isAvailable()) {
      return { success: false, error: this.unavailableError() };
    }

    const key = getAiConversationStorageKey(eventId);

    // Validate and deduplicate messages
    const validMessages: StoredChatMessage[] = [];
    const seenIds = new Set<string>();

    for (const msg of input.messages || []) {
      if (
        msg &&
        typeof msg === 'object' &&
        typeof msg.id === 'string' &&
        (msg.sender === 'user' || msg.sender === 'assistant') &&
        typeof msg.text === 'string' &&
        typeof msg.timestamp === 'string'
      ) {
        if (!seenIds.has(msg.id)) {
          seenIds.add(msg.id);
          validMessages.push(msg);
        }
      }
    }

    const validProposals: StagedProposal[] = [];
    for (const p of input.proposals || []) {
      if (p && typeof p === 'object' && typeof p.id === 'string' && typeof p.actionType === 'string') {
        validProposals.push(p);
      }
    }

    const state: StoredConversationState = {
      schemaVersion: 1,
      eventId,
      messages: validMessages,
      lastAnswer: input.lastAnswer || null,
      lastModel: input.lastModel || null,
      lastProvider: input.lastProvider || null,
      proposals: validProposals,
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      return { success: true, data: state };
    } catch (err) {
      return {
        success: false,
        error: this.handleStorageError(err, 'Failed to save AI conversation to local storage.'),
      };
    }
  }

  clearConversation(eventId: string): StorageResult<void> {
    if (!eventId) return { success: true };
    if (!this.isAvailable()) {
      return { success: false, error: this.unavailableError() };
    }

    const key = getAiConversationStorageKey(eventId);
    try {
      window.localStorage.removeItem(key);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: this.handleStorageError(err, 'Failed to clear AI conversation history.'),
      };
    }
  }

  deleteConversation(eventId: string): StorageResult<void> {
    return this.clearConversation(eventId);
  }
}

export const aiConversationStorage = new LocalStorageAiConversationStorage();
