/**
 * @module gemini
 * @description AI provider implementation for the Google Gemini (Generative Language) API.
 * Implements the {@link IAIProvider} interface to provide tab grouping suggestions
 * and chat capabilities via the Gemini generateContent endpoint.
 */

import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

/**
 * @description AI provider that communicates with the Google Gemini API.
 * Uses the `generateContent` endpoint from the Generative Language API v1beta.
 * @class
 * @implements {IAIProvider}
 * @example
 * const provider = new GeminiProvider({ type: 'gemini', apiKey: 'AIza...' });
 * const groups = await provider.suggestGroups(tabs, 'en');
 */
export class GeminiProvider implements IAIProvider {
  /** @description The provider type identifier. */
  readonly name = 'gemini' as const;

  /** @description The Google API key used for authentication. */
  private apiKey: string;

  /** @description The Gemini model identifier to use for API requests. */
  private model: string;

  /**
   * @description Creates a new GeminiProvider instance.
   * @param {ProviderConfig} config - The provider configuration containing API key and optional model.
   * @throws {Error} If `config.apiKey` is not provided.
   */
  constructor(config: ProviderConfig) {
    if (!config.apiKey) throw new Error('Gemini API key required');
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash';
  }

  /**
   * @description Analyzes browser tabs and returns AI-generated grouping suggestions using Gemini.
   * @param {TabData[]} tabs - The browser tabs to analyze.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to an array of grouping suggestions.
   * @throws {Error} If the Gemini API returns a non-OK HTTP status.
   */
  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildGroupingPrompt(tabs, language) }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseGroupingResponse(text);
  }

  /**
   * @description Sends a chat conversation to Gemini and returns the model's response.
   * Maps the "assistant" role to Gemini's "model" role and supports optional system instructions.
   * @param {ChatMessage[]} messages - The conversation history.
   * @param {string} [systemPrompt] - An optional system instruction to guide the model's behavior.
   * @returns {Promise<string>} A promise resolving to the model's text response.
   * @throws {Error} If the Gemini API returns a non-OK HTTP status.
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        generationConfig: { maxOutputTokens: 2000 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
