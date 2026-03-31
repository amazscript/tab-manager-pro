/**
 * @module openai
 * @description AI provider implementation for the OpenAI Chat Completions API.
 * Implements the {@link IAIProvider} interface to provide tab grouping suggestions
 * and chat capabilities via OpenAI-compatible endpoints.
 */

import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

/**
 * @description AI provider that communicates with the OpenAI Chat Completions API.
 * Supports custom base URLs, making it compatible with OpenAI-compatible third-party services.
 * @class
 * @implements {IAIProvider}
 * @example
 * const provider = new OpenAIProvider({ type: 'openai', apiKey: 'sk-...' });
 * const groups = await provider.suggestGroups(tabs, 'en');
 */
export class OpenAIProvider implements IAIProvider {
  /** @description The provider type identifier. */
  readonly name = 'openai' as const;

  /** @description The OpenAI API key used for authentication. */
  private apiKey: string;

  /** @description The model identifier to use for API requests. */
  private model: string;

  /** @description The base URL for the OpenAI-compatible API. */
  private baseUrl: string;

  /**
   * @description Creates a new OpenAIProvider instance.
   * @param {ProviderConfig} config - The provider configuration containing API key, optional model, and optional base URL.
   * @throws {Error} If `config.apiKey` is not provided.
   */
  constructor(config: ProviderConfig) {
    if (!config.apiKey) throw new Error('OpenAI API key required');
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  /**
   * @description Analyzes browser tabs and returns AI-generated grouping suggestions using OpenAI.
   * @param {TabData[]} tabs - The browser tabs to analyze.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to an array of grouping suggestions.
   * @throws {Error} If the OpenAI API returns a non-OK HTTP status.
   */
  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: buildGroupingPrompt(tabs, language) }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return parseGroupingResponse(text);
  }

  /**
   * @description Sends a chat conversation to OpenAI and returns the assistant's response.
   * If a system prompt is provided, it is prepended as a system message.
   * @param {ChatMessage[]} messages - The conversation history.
   * @param {string} [systemPrompt] - An optional system prompt to guide the model's behavior.
   * @returns {Promise<string>} A promise resolving to the model's text response.
   * @throws {Error} If the OpenAI API returns a non-OK HTTP status.
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const apiMessages = [];
    if (systemPrompt) apiMessages.push({ role: 'system', content: systemPrompt });
    apiMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: apiMessages,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
