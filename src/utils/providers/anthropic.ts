/**
 * @module anthropic
 * @description AI provider implementation for the Anthropic (Claude) API.
 * Implements the {@link IAIProvider} interface to provide tab grouping suggestions
 * and chat capabilities via the Anthropic Messages API.
 */

import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

/**
 * @description AI provider that communicates with the Anthropic Messages API (Claude).
 * Supports both tab grouping analysis and free-form chat conversations.
 * @class
 * @implements {IAIProvider}
 * @example
 * const provider = new AnthropicProvider({ type: 'anthropic', apiKey: 'sk-ant-...' });
 * const groups = await provider.suggestGroups(tabs, 'en');
 */
export class AnthropicProvider implements IAIProvider {
  /** @description The provider type identifier. */
  readonly name = 'anthropic' as const;

  /** @description The Anthropic API key used for authentication. */
  private apiKey: string;

  /** @description The model identifier to use for API requests. */
  private model: string;

  /**
   * @description Creates a new AnthropicProvider instance.
   * @param {ProviderConfig} config - The provider configuration containing API key and optional model.
   * @throws {Error} If `config.apiKey` is not provided.
   */
  constructor(config: ProviderConfig) {
    if (!config.apiKey) throw new Error('Anthropic API key required');
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  /**
   * @description Sends a request to the Anthropic Messages API and returns the text response.
   * @param {{ role: string; content: string }[]} messages - The messages array to send.
   * @param {string} [systemPrompt] - An optional system-level instruction for the model.
   * @param {number} [maxTokens=1000] - Maximum number of tokens in the response.
   * @returns {Promise<string>} A promise resolving to the text content of the API response.
   * @throws {Error} If the API returns a non-OK HTTP status, with the status code and error body.
   */
  private async callAPI(messages: { role: string; content: string }[], systemPrompt?: string, maxTokens = 1000): Promise<string> {
    const body: any = {
      model: this.model,
      max_tokens: maxTokens,
      messages,
    };
    if (systemPrompt) body.system = systemPrompt;

    console.log('[TabManagerPro] Anthropic request:', {
      model: body.model,
      apiKeyPrefix: this.apiKey.substring(0, 15) + '...',
      apiKeyLength: this.apiKey.length,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[TabManagerPro] Anthropic error:', response.status, err);
      throw new Error(`${response.status} ${err}`);
    }

    const data = await response.json();
    return data.content?.[0]?.type === 'text' ? data.content[0].text : '';
  }

  /**
   * @description Analyzes browser tabs and returns AI-generated grouping suggestions using Claude.
   * @param {TabData[]} tabs - The browser tabs to analyze.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to an array of grouping suggestions.
   * @throws {Error} If the Anthropic API call fails.
   */
  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const text = await this.callAPI(
      [{ role: 'user', content: buildGroupingPrompt(tabs, language) }],
      undefined,
      1000
    );
    return parseGroupingResponse(text);
  }

  /**
   * @description Sends a chat conversation to Claude and returns the assistant's response.
   * @param {ChatMessage[]} messages - The conversation history.
   * @param {string} [systemPrompt] - An optional system prompt to guide Claude's behavior.
   * @returns {Promise<string>} A promise resolving to Claude's text response.
   * @throws {Error} If the Anthropic API call fails.
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    return this.callAPI(
      messages.map(m => ({ role: m.role, content: m.content })),
      systemPrompt,
      2000
    );
  }
}
