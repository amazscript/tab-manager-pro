import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

export class OllamaProvider implements IAIProvider {
  readonly name = 'ollama' as const;
  private baseUrl: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
  }

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
