# Quick Setup

## Choose an AI provider

Open the extension popup and select your provider in the **AI** tab:

| Provider | Key required | Cost | Quality |
|---|---|---|---|
| Anthropic (Claude) | Yes | Paid | Excellent |
| OpenAI (GPT) | Yes | Paid | Excellent |
| Google Gemini | Yes | Free (quota) | Very good |
| Mistral AI | Yes | Paid | Very good |
| Ollama (Local) | No | Free | Variable |

## Configuration with an API key

1. Click on the provider button (e.g., **Anthropic**)
2. Paste your API key in the field
3. Click **Save**

::: details Where to find your API key?
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Gemini**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Mistral**: [console.mistral.ai](https://console.mistral.ai/)
:::

## Configuration with Ollama (free and local)

1. Install [Ollama](https://ollama.com) on your machine
2. Download a model:
   ```bash
   ollama pull llama3
   ```
3. Launch Ollama with CORS permissions for Chrome:
   ```bash
   OLLAMA_ORIGINS="chrome-extension://*" ollama serve
   ```
4. In the extension, select **Ollama** and verify the URL (`http://localhost:11434`)
5. Click **Save**

::: warning Important for macOS
If Ollama is running via the macOS app, quit it first (icon in the menu bar > Quit), then relaunch from the terminal with `OLLAMA_ORIGINS`.
:::

## Choose the language

Below the configuration field, select the **AI language**. Group names will be generated in this language.

Available languages: French, English, Spanish, German, Portuguese, Italian, Arabic, Chinese, Japanese.

## Test

Click the **Group with AI** button — your tabs will be analyzed and organized into color-coded groups!
