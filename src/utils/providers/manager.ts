import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ProviderType, ChatMessage } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { MistralProvider } from './mistral';
import { OllamaProvider } from './ollama';

function createProvider(config: ProviderConfig): IAIProvider {
  switch (config.type) {
    case 'anthropic': return new AnthropicProvider(config);
    case 'openai': return new OpenAIProvider(config);
    case 'gemini': return new GeminiProvider(config);
    case 'mistral': return new MistralProvider(config);
    case 'ollama': return new OllamaProvider(config);
    default: throw new Error(`Provider inconnu: ${config.type}`);
  }
}

export interface ProviderManagerConfig {
  primary: ProviderConfig;
  fallbacks?: ProviderConfig[];
}

export class ProviderManager {
  private configs: ProviderConfig[];

  constructor(config: ProviderManagerConfig) {
    this.configs = [config.primary, ...(config.fallbacks || [])];
  }

  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const errors: string[] = [];

    for (const config of this.configs) {
      try {
        const provider = createProvider(config);
        console.log(`[TabManagerPro] Essai avec ${config.type}...`);
        const result = await provider.suggestGroups(tabs, language);
        if (result.length > 0) {
          console.log(`[TabManagerPro] Succès avec ${config.type}`);
          return result;
        }
        errors.push(`${config.type}: réponse vide`);
      } catch (e: any) {
        console.warn(`[TabManagerPro] Échec ${config.type}:`, e.message);
        errors.push(`${config.type}: ${e.message}`);
      }
    }

    throw new Error(`Tous les providers ont échoué:\n${errors.join('\n')}`);
  }

  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const errors: string[] = [];

    for (const config of this.configs) {
      try {
        const provider = createProvider(config);
        console.log(`[TabManagerPro] Chat avec ${config.type}...`);
        return await provider.chat(messages, systemPrompt);
      } catch (e: any) {
        console.warn(`[TabManagerPro] Chat échec ${config.type}:`, e.message);
        errors.push(`${config.type}: ${e.message}`);
      }
    }

    throw new Error(`Tous les providers ont échoué:\n${errors.join('\n')}`);
  }
}

/** Construit un ProviderManagerConfig à partir des données stockées dans chrome.storage */
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

  // Rétro-compatibilité : si pas de config mais une apiKey Anthropic existe
  if (!configs[activeProvider]) {
    const legacy = await chrome.storage.local.get('apiKey');
    console.log('[TabManagerPro] Legacy apiKey check:', { hasLegacy: !!legacy.apiKey });
    if (legacy.apiKey) {
      configs['anthropic'] = { type: 'anthropic', apiKey: legacy.apiKey as string };
    }
  }

  const primary = configs[activeProvider];
  if (!primary) {
    throw new Error('Aucun provider configuré');
  }

  const fallbacks = fallbackOrder
    .filter(type => type !== activeProvider && configs[type])
    .map(type => configs[type]);

  return { primary, fallbacks };
}
