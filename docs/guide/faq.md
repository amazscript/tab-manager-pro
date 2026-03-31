# FAQ

## General

### Is the extension free?

Tab Manager Pro offers a free plan with basic features and a Pro plan with advanced features. You must provide your own API key for cloud providers (except Gemini which has a free quota).

### Does the extension work on Firefox?

Yes! On Firefox, tab groups are not natively supported. Tab Manager Pro uses a **virtual groups** system with visual badges injected into pages.

### What languages are supported?

The interface is available in **French, English, and Spanish**. AI responses can be generated in **9 languages**: French, English, Spanish, German, Portuguese, Italian, Arabic, Chinese, and Japanese.

## AI Providers

### Which provider should I choose?

- **Zero budget**: Ollama (local, free) or Gemini (free quota)
- **Best quality**: Anthropic Claude or OpenAI GPT
- **Privacy**: Ollama (nothing leaves your machine)
- **Speed**: Gemini Flash

### Can I use multiple providers?

Yes. Configure as many providers as you want. The **fallback** system automatically switches to a backup provider in case of failure.

### Are my API keys secure?

Your keys are stored locally in `chrome.storage.local`, managed by Chrome. They are never sent to our servers.

## Ollama

### Why do I get a 403 error with Ollama?

Ollama blocks CORS requests by default. Launch it with:
```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

### Ollama is slow, how can I speed it up?

- Use a smaller model (`llama3.2:1b` instead of `llama3`)
- On Mac, make sure you have enough free RAM
- Apple Silicon chips (M1/M2/M3/M4) offer better performance

### Which Ollama model do you recommend?

`llama3` (8B) offers the best quality/speed balance for tab grouping.

## Troubleshooting

### "Invalid API key"

Check that your key is correct and that your account has credits. Regenerate the key if necessary.

### "Network error"

Check your internet connection. For Ollama, verify that it is running on `localhost:11434`.

### "Insufficient credits"

Top up your account with the relevant provider, or switch to Gemini (free) or Ollama (local).

### Groups don't match my tabs

AI does its best with the available titles and URLs. For better results:
- Make sure page titles are descriptive
- Try a different provider
- Try in a different language

### The extension doesn't work after an update

1. Go to `chrome://extensions`
2. Find Tab Manager Pro
3. Click the reload button
4. Close and reopen the popup
