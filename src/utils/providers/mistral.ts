import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

export class MistralProvider implements IAIProvider {
  readonly name = 'mistral' as const;
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) throw new Error('Mistral API key requis');
    this.apiKey = config.apiKey;
    this.model = config.model || 'mistral-small-latest';
  }

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
