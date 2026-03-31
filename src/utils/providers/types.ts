export interface TabData {
  id: number;
  title: string;
  url: string;
}

export interface GroupingSuggestion {
  groupName: string;
  tabs: number[];
  color?: string;
}

export type ProviderType = 'anthropic' | 'openai' | 'gemini' | 'mistral' | 'ollama';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string; // Pour Ollama (localhost) ou endpoints custom
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IAIProvider {
  readonly name: ProviderType;
  suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]>;
  chat(messages: ChatMessage[], systemPrompt?: string): Promise<string>;
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  anthropic: 'Claude (Anthropic)',
  openai: 'GPT-4o-mini (OpenAI)',
  gemini: 'Gemini (Google)',
  mistral: 'Mistral AI',
  ollama: 'Ollama (Local)',
};

export const PROVIDER_PLACEHOLDERS: Record<ProviderType, string> = {
  anthropic: 'sk-ant-...',
  openai: 'sk-...',
  gemini: 'AIza...',
  mistral: 'api-...',
  ollama: 'http://localhost:11434',
};
