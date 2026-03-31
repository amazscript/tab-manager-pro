# AI Providers

Tab Manager Pro is **AI engine agnostic**. You choose the provider that suits you best.

## Comparison

| Provider | Model | Cost | Latency | Local mode |
|---|---|---|---|---|
| [Anthropic](/providers/anthropic) | Claude Sonnet | ~$0.003/request | ~2s | No |
| [OpenAI](/providers/openai) | GPT-4o-mini | ~$0.001/request | ~2s | No |
| [Google Gemini](/providers/gemini) | Gemini 2.0 Flash | Free (quota) | ~1.5s | No |
| [Mistral](/providers/mistral) | Mistral Small | ~$0.002/request | ~2s | No |
| [Ollama](/providers/ollama) | llama3, gemma2... | Free | ~5-20s | **Yes** |

::: tip Recommendation
- **Best value**: Google Gemini (free with generous quota)
- **Best quality**: Anthropic Claude or OpenAI GPT
- **Maximum privacy**: Ollama (everything stays local)
:::

## Fallback system

Configure multiple providers and define a **fallback order**. If the main provider fails, the extension automatically switches to the next one.

Example: Anthropic (primary) > Gemini (fallback 1) > Ollama (fallback 2)

## Change provider

1. Open the popup
2. Click on the desired provider button
3. Enter the API key (or URL for Ollama)
4. Click **Save**

Already configured providers are displayed in **green**.

## Data sent

Only the following information is transmitted to the provider:

- **Title** of each tab
- **URL** of each tab

No page content, cookies, passwords, or personal data is sent.
