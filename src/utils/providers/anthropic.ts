import { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ChatMessage } from './types';
import { buildGroupingPrompt, parseGroupingResponse } from './prompt';

export class AnthropicProvider implements IAIProvider {
  readonly name = 'anthropic' as const;
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) throw new Error('Anthropic API key requis');
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

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

  async suggestGroups(tabs: TabData[], language?: string): Promise<GroupingSuggestion[]> {
    const text = await this.callAPI(
      [{ role: 'user', content: buildGroupingPrompt(tabs, language) }],
      undefined,
      1000
    );
    return parseGroupingResponse(text);
  }

  async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    return this.callAPI(
      messages.map(m => ({ role: m.role, content: m.content })),
      systemPrompt,
      2000
    );
  }
}
