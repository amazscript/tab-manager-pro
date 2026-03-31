import { ChatHistoryEntry } from './types';

const MAX_HISTORY = 100;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class ChatHistory {
  static async add(entry: Omit<ChatHistoryEntry, 'id' | 'timestamp'>): Promise<ChatHistoryEntry> {
    const fullEntry: ChatHistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    const data = await chrome.storage.local.get('chatHistory');
    const history = (data.chatHistory || []) as ChatHistoryEntry[];
    history.unshift(fullEntry);

    // Limiter la taille
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

    await chrome.storage.local.set({ chatHistory: history });
    return fullEntry;
  }

  static async list(limit = 50): Promise<ChatHistoryEntry[]> {
    const data = await chrome.storage.local.get('chatHistory');
    const history = (data.chatHistory || []) as ChatHistoryEntry[];
    return history.slice(0, limit);
  }

  static async clear(): Promise<void> {
    await chrome.storage.local.set({ chatHistory: [] });
  }
}
