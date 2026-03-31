/**
 * @module ollama
 * @description AI provider implementation for the Ollama local inference server.
 * Implements the {@link IAIProvider} interface to provide tab grouping suggestions
 * and chat capabilities via a locally running Ollama instance. Unlike other providers,
 * Ollama does not require an API key -- only a base URL (defaults to localhost:11434).
 */

import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

/**
 * @description AI provider that communicates with a local Ollama server.
 * Uses the `/api/chat` endpoint with streaming disabled for synchronous responses.
 * @class
 * @implements {IAIProvider}
 * @example
 * const provider = new OllamaProvider({ type: 'ollama', baseUrl: 'http://localhost:11434' });
 * const groups = await provider.suggestGroups(tabs, 'en');
 */
export class OllamaProvider implements IAIProvider {
  /** @description The provider type identifier. */
  readonly name = 'ollama' as const;

  /** @description The base URL of the Ollama server (e.g. "http://localhost:11434"). */
  private baseUrl: string;

  /** @description The model identifier to use for Ollama requests. */
  private model: string;

  /**
   * @description Creates a new OllamaProvider instance.
   * @param {ProviderConfig} config - The provider configuration containing optional base URL and model.
   *   No API key is required for Ollama.
   */
  constructor(config: ProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3:latest';
  }

  /**
   * @description Analyzes browser tabs and returns AI-generated grouping suggestions using Ollama.
   * @param {TabData[]} tabs - The browser tabs to analyze.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to an array of grouping suggestions.
   * @throws {Error} If the Ollama server returns a non-OK HTTP status.
   */
  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: buildGroupingPrompt(tabs, language) }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.message?.content || '';
    return parseGroupingResponse(text);
  }

  /**
   * @description Sends a chat conversation to the Ollama server and returns the model's response.
   * If a system prompt is provided, it is prepended as a system message.
   * @param {ChatMessage[]} messages - The conversation history.
   * @param {string} [systemPrompt] - An optional system prompt to guide the model's behavior.
   * @returns {Promise<string>} A promise resolving to the model's text response.
   * @throws {Error} If the Ollama server returns a non-OK HTTP status.
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const apiMessages = [];
    if (systemPrompt) apiMessages.push({ role: 'system', content: systemPrompt });
    apiMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: apiMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }
}
