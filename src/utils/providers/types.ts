/**
 * @module types
 * @description Core type definitions for the AI provider system used by Tab Manager Pro.
 * Defines interfaces for tab data, grouping suggestions, provider configuration,
 * chat messages, and the common AI provider contract. Also exports display-related
 * constants such as provider labels and placeholder strings.
 */

/**
 * @description Represents a single browser tab with its essential metadata.
 * @interface TabData
 */
export interface TabData {
  /** @description The unique Chrome tab identifier. */
  id: number;
  /** @description The human-readable title of the tab. */
  title: string;
  /** @description The full URL of the tab. */
  url: string;
}

/**
 * @description Represents a suggested thematic group of tabs, as returned by an AI provider.
 * @interface GroupingSuggestion
 */
export interface GroupingSuggestion {
  /** @description The display name for the tab group (localized to the requested language). */
  groupName: string;
  /** @description Array of tab IDs that belong to this group. */
  tabs: number[];
  /** @description Optional Chrome tab-group color. */
  color?: string;
}

/**
 * @description Union type of all supported AI provider identifiers.
 */
export type ProviderType = 'anthropic' | 'openai' | 'gemini' | 'mistral' | 'ollama';

/**
 * @description Configuration object for instantiating an AI provider.
 * @interface ProviderConfig
 */
export interface ProviderConfig {
  /** @description The type of AI provider to use. */
  type: ProviderType;
  /** @description The API key for the provider (not required for Ollama). */
  apiKey?: string;
  /** @description Base URL for the provider API. Used for Ollama (localhost) or custom endpoints. */
  baseUrl?: string;
  /** @description The model identifier to use (e.g. "claude-sonnet-4-20250514", "gpt-4o-mini"). */
  model?: string;
}

/**
 * @description Represents a single message in a chat conversation with an AI provider.
 * @interface ChatMessage
 */
export interface ChatMessage {
  /** @description The role of the message sender, either the user or the AI assistant. */
  role: 'user' | 'assistant';
  /** @description The text content of the message. */
  content: string;
}

/**
 * @description Common interface that all AI provider implementations must satisfy.
 * Provides tab grouping suggestions and free-form chat capabilities.
 * @interface IAIProvider
 */
export interface IAIProvider {
  /** @description The identifier of this provider. */
  readonly name: ProviderType;

  /**
   * @description Analyzes the given tabs and returns AI-generated grouping suggestions.
   * @param {TabData[]} tabs - The browser tabs to analyze and group.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to an array of grouping suggestions.
   */
  suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]>;

  /**
   * @description Sends a chat conversation to the AI provider and returns its response.
   * @param {ChatMessage[]} messages - The conversation history to send.
   * @param {string} [systemPrompt] - An optional system prompt to guide the AI's behavior.
   * @returns {Promise<string>} A promise resolving to the AI's text response.
   */
  chat(messages: ChatMessage[], systemPrompt?: string): Promise<string>;
}

/**
 * @description Human-readable display labels for each supported AI provider.
 * @constant
 * @example
 * // PROVIDER_LABELS['anthropic'] === 'Claude (Anthropic)'
 */
export const PROVIDER_LABELS: Record<ProviderType, string> = {
  anthropic: 'Claude (Anthropic)',
  openai: 'GPT-4o-mini (OpenAI)',
  gemini: 'Gemini (Google)',
  mistral: 'Mistral AI',
  ollama: 'Ollama (Local)',
};

/**
 * @description Placeholder strings shown in the UI for each provider's API key or URL input field.
 * @constant
 * @example
 * // PROVIDER_PLACEHOLDERS['openai'] === 'sk-...'
 */
export const PROVIDER_PLACEHOLDERS: Record<ProviderType, string> = {
  anthropic: 'sk-ant-...',
  openai: 'sk-...',
  gemini: 'AIza...',
  mistral: 'api-...',
  ollama: 'http://localhost:11434',
};
