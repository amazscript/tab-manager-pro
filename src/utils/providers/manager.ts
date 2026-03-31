/**
 * @module manager
 * @description Provider management layer for Tab Manager Pro. Contains the factory function
 * that instantiates AI providers, the {@link ProviderManager} class that orchestrates
 * calls with automatic fallback, and a helper to load the provider configuration from
 * Chrome extension storage.
 */

import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ProviderType, ChatMessage } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { MistralProvider } from './mistral';
import { OllamaProvider } from './ollama';

/**
 * @description Factory function that creates an AI provider instance from a configuration object.
 * @param {ProviderConfig} config - The provider configuration specifying type, API key, etc.
 * @returns {IAIProvider} An instantiated AI provider ready for use.
 * @throws {Error} If `config.type` does not match any known provider.
 * @example
 * const provider = createProvider({ type: 'openai', apiKey: 'sk-...' });
 */
function createProvider(config: ProviderConfig): IAIProvider {
  switch (config.type) {
    case 'anthropic': return new AnthropicProvider(config);
    case 'openai': return new OpenAIProvider(config);
    case 'gemini': return new GeminiProvider(config);
    case 'mistral': return new MistralProvider(config);
    case 'ollama': return new OllamaProvider(config);
    default: throw new Error(`Unknown provider: ${config.type}`);
  }
}

/**
 * @description Configuration for {@link ProviderManager}, specifying a primary provider
 * and optional fallback providers to try in order.
 * @interface ProviderManagerConfig
 */
export interface ProviderManagerConfig {
  /** @description The primary provider configuration to try first. */
  primary: ProviderConfig;
  /** @description Optional ordered list of fallback provider configurations. */
  fallbacks?: ProviderConfig[];
}

/**
 * @description Manages AI provider calls with automatic fallback. When a call to the
 * primary provider fails or returns an empty result, subsequent providers from the
 * fallback list are tried in order until one succeeds or all have been exhausted.
 * @class
 * @example
 * const manager = new ProviderManager({
 *   primary: { type: 'anthropic', apiKey: 'sk-ant-...' },
 *   fallbacks: [{ type: 'openai', apiKey: 'sk-...' }],
 * });
 * const groups = await manager.suggestGroups(tabs);
 */
export class ProviderManager {
  /** @description Ordered list of provider configs: primary first, then fallbacks. */
  private configs: ProviderConfig[];

  /**
   * @description Creates a new ProviderManager with the given configuration.
   * @param {ProviderManagerConfig} config - The primary and optional fallback provider configs.
   */
  constructor(config: ProviderManagerConfig) {
    this.configs = [config.primary, ...(config.fallbacks || [])];
  }

  /**
   * @description Requests tab grouping suggestions from configured providers, trying each
   * in order until a non-empty result is returned.
   * @param {TabData[]} tabs - The browser tabs to analyze and group.
   * @param {string} [language] - The language code for group names (e.g. "fr", "en").
   * @returns {Promise<GroupingSuggestion[]>} A promise resolving to the grouping suggestions.
   * @throws {Error} If all configured providers fail or return empty results. The error
   * message includes details from each provider's failure.
   */
  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const errors: string[] = [];

    for (const config of this.configs) {
      try {
        const provider = createProvider(config);
        console.log(`[TabManagerPro] Trying ${config.type}...`);
        const result = await provider.suggestGroups(tabs, language);
        if (result.length > 0) {
          console.log(`[TabManagerPro] Success with ${config.type}`);
          return result;
        }
        errors.push(`${config.type}: empty response`);
      } catch (e: any) {
        console.warn(`[TabManagerPro] Failed ${config.type}:`, e.message);
        errors.push(`${config.type}: ${e.message}`);
      }
    }

    throw new Error(`All providers failed:\n${errors.join('\n')}`);
  }

  /**
   * @description Sends a chat conversation to configured providers, trying each in order
   * until one returns a successful response.
   * @param {ChatMessage[]} messages - The conversation history to send.
   * @param {string} [systemPrompt] - An optional system prompt to guide the AI's behavior.
   * @returns {Promise<string>} A promise resolving to the AI's text response.
   * @throws {Error} If all configured providers fail. The error message includes details
   * from each provider's failure.
   */
  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const errors: string[] = [];

    for (const config of this.configs) {
      try {
        const provider = createProvider(config);
        console.log(`[TabManagerPro] Chat with ${config.type}...`);
        return await provider.chat(messages, systemPrompt);
      } catch (e: any) {
        console.warn(`[TabManagerPro] Chat failed ${config.type}:`, e.message);
        errors.push(`${config.type}: ${e.message}`);
      }
    }

    throw new Error(`All providers failed:\n${errors.join('\n')}`);
  }
}

/**
 * @description Builds a {@link ProviderManagerConfig} from data stored in `chrome.storage.local`.
 * Reads the active provider, its configuration, and the fallback order. Also handles
 * backward compatibility with a legacy `apiKey` storage key for Anthropic.
 * @returns {Promise<ProviderManagerConfig>} A promise resolving to the fully constructed config.
 * @throws {Error} If no provider configuration is found for the active provider and no
 * legacy API key is available.
 * @example
 * const config = await loadProviderManagerConfig();
 * const manager = new ProviderManager(config);
 */
export async function loadProviderManagerConfig(): Promise<ProviderManagerConfig> {
  const data = await chrome.storage.local.get(['providerConfigs', 'activeProvider', 'fallbackOrder']);

  const configs = (data.providerConfigs || {}) as Record<string, ProviderConfig>;
  const activeProvider = (data.activeProvider || 'anthropic') as ProviderType;
  const fallbackOrder = (data.fallbackOrder || []) as ProviderType[];

  console.log('[TabManagerPro] Storage debug:', {
    activeProvider,
    hasConfigs: Object.keys(configs),
    configForActive: configs[activeProvider] ? {
      type: configs[activeProvider].type,
      hasApiKey: !!configs[activeProvider].apiKey,
      apiKeyLength: configs[activeProvider].apiKey?.length,
      apiKeyPrefix: configs[activeProvider].apiKey?.substring(0, 15),
    } : 'MISSING',
  });

  // Backward compatibility: if no config but a legacy Anthropic apiKey exists
  if (!configs[activeProvider]) {
    const legacy = await chrome.storage.local.get('apiKey');
    console.log('[TabManagerPro] Legacy apiKey check:', { hasLegacy: !!legacy.apiKey });
    if (legacy.apiKey) {
      configs['anthropic'] = { type: 'anthropic', apiKey: legacy.apiKey as string };
    }
  }

  const primary = configs[activeProvider];
  if (!primary) {
    throw new Error('No provider configured');
  }

  const fallbacks = fallbackOrder
    .filter(type => type !== activeProvider && configs[type])
    .map(type => configs[type]);

  return { primary, fallbacks };
}
