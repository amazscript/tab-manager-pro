/**
 * @module mistral
 * @description AI provider implementation for the Mistral AI Chat Completions API.
 * Implements the {@link IAIProvider} interface to provide tab grouping suggestions
 * and chat capabilities via the Mistral API.
 */

import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

/**
 * @description AI provider that communicates with the Mistral AI API.
 * Uses the `/v1/chat/completions` endpoint.
 * @class
 * @implements {IAIProvider}
 * @example
 * const provider = new MistralProvider({ type: 'mistral', apiKey: 'api-...' });
 * const groups = await provider.suggestGroups(tabs, 'en');
 */
export class MistralProvider implements IAIProvider {
  /** @description The provider type identifier. */
  readonly name = 'mistral' as const;

  /** @description The Mistral API key used for authentication. */
  private apiKey: string;

  /** @description The Mistral model identifier to use for API requests. */
  private model: string;

  /**
   * @description Creates a new MistralProvider instance.
   * @param {ProviderConfig} config - The provider configuration containing API key and optional model.
   * @throws {Error} If `config.apiKey` is not provided.
   */
  constructor(config: ProviderConfig) {
    if (!config.apiKey) throw new Error('Mistral API key required');
    this.apiKey = config.apiKey;
    this.model = config.model || 'mistral-small-latest';
  }

  /**
   * @description Analyzes browser tabs and returns AI-generated grouping suggestions using Mistral.
   * @param {TabData[]} tabs - The browser tabs to analyze.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to an array of grouping suggestions.
   * @throws {Error} If the Mistral API returns a non-OK HTTP status.
   */
  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
      throw new Error(`Mistral API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return parseGroupingResponse(text);
  }

  /**
   * @description Sends a chat conversation to Mistral and returns the assistant's response.
   * If a system prompt is provided, it is prepended as a system message.
   * @param {ChatMessage[]} messages - The conversation history.
   * @param {string} [systemPrompt] - An optional system prompt to guide the model's behavior.
   * @returns {Promise<string>} A promise resolving to the model's text response.
   * @throws {Error} If the Mistral API returns a non-OK HTTP status.
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const apiMessages = [];
    if (systemPrompt) apiMessages.push({ role: 'system', content: systemPrompt });
    apiMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
      throw new Error(`Mistral API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
