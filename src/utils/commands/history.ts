/**
 * @module history
 * @description Chat history persistence layer for Tab Manager Pro.
 * Provides a static class to store, retrieve, and clear chat conversation entries
 * in Chrome's local storage. History is capped at a maximum number of entries.
 */

import { ChatHistoryEntry } from './types';

/**
 * @description Maximum number of chat history entries to retain in storage.
 * When the limit is exceeded, the oldest entries are discarded.
 * @constant {number}
 */
const MAX_HISTORY = 100;

/**
 * @description Generates a unique identifier by combining the current timestamp
 * (base-36) with a random alphanumeric suffix.
 *
 * @returns {string} A unique string identifier.
 *
 * @example
 * ```ts
 * const id = generateId();
 * // => 'lxyz1234ab'
 * ```
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * @description Static class for managing chat history in Chrome local storage.
 * All methods are static and async, interacting directly with `chrome.storage.local`.
 *
 * @example
 * ```ts
 * // Add an entry
 * const entry = await ChatHistory.add({
 *   userMessage: 'close duplicates',
 *   assistantMessage: '3 duplicate(s) closed.',
 *   intent: 'close_duplicates',
 * });
 *
 * // List recent entries
 * const recent = await ChatHistory.list(10);
 *
 * // Clear all history
 * await ChatHistory.clear();
 * ```
 */
export class ChatHistory {
  /**
   * @description Adds a new entry to the chat history. The entry is automatically
   * assigned a unique `id` and the current `timestamp`. It is prepended to the
   * history array (most recent first). If the history exceeds {@link MAX_HISTORY},
   * the oldest entries are truncated.
   *
   * @param {Omit<ChatHistoryEntry, 'id' | 'timestamp'>} entry - The chat entry data without id and timestamp.
   * @returns {Promise<ChatHistoryEntry>} The complete entry with generated id and timestamp.
   *
   * @example
   * ```ts
   * const entry = await ChatHistory.add({
   *   userMessage: 'sort tabs',
   *   assistantMessage: '12 tabs sorted by domain.',
   *   intent: 'sort_tabs',
   *   commandResult: { success: true, message: '12 tabs sorted by domain.' },
   * });
   * ```
   */
  static async add(entry: Omit<ChatHistoryEntry, 'id' | 'timestamp'>): Promise<ChatHistoryEntry> {
    const fullEntry: ChatHistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };

    const data = await chrome.storage.local.get('chatHistory');
    const history = (data.chatHistory || []) as ChatHistoryEntry[];
    history.unshift(fullEntry);

    // Limit size
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

    await chrome.storage.local.set({ chatHistory: history });
    return fullEntry;
  }

  /**
   * @description Retrieves the most recent chat history entries from storage.
   *
   * @param {number} [limit=50] - The maximum number of entries to return.
   * @returns {Promise<ChatHistoryEntry[]>} An array of chat history entries, most recent first.
   *
   * @example
   * ```ts
   * const history = await ChatHistory.list(20);
   * console.log(history.length); // <= 20
   * ```
   */
  static async list(limit = 50): Promise<ChatHistoryEntry[]> {
    const data = await chrome.storage.local.get('chatHistory');
    const history = (data.chatHistory || []) as ChatHistoryEntry[];
    return history.slice(0, limit);
  }

  /**
   * @description Clears all chat history entries from storage by replacing
   * the stored array with an empty one.
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```ts
   * await ChatHistory.clear();
   * ```
   */
  static async clear(): Promise<void> {
    await chrome.storage.local.set({ chatHistory: [] });
  }
}
