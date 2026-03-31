# Ollama (Local)

The **100% local** mode: no data ever leaves your machine.

## Prerequisites

1. Install Ollama from [ollama.com](https://ollama.com)
2. Download a model:
   ```bash
   ollama pull llama3
   ```

## Launch

### Method 1: Terminal (recommended for Chrome)

```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

The `OLLAMA_ORIGINS` variable allows requests from the Chrome extension (CORS).

### Method 2: Permanent variable (macOS)

```bash
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
```

Then launch the Ollama application normally.

::: warning Important
If you launch Ollama via the macOS app **without** the `OLLAMA_ORIGINS` variable, the extension will receive a 403 error (CORS blocked).
:::

## Configuration in the extension

1. Select **Ollama** in the popup
2. Verify the URL: `http://localhost:11434`
3. Click **Save**

## Technical details

| Parameter | Value |
|---|---|
| Default model | `llama3` |
| Endpoint | `http://localhost:11434/api/chat` |
| Authentication | None |
| Stream | Disabled |

## Recommended models

| Model | Size | RAM required | Quality |
|---|---|---|---|
| `llama3` | 8B | 8 GB | Very good |
| `gemma2:9b` | 9B | 8 GB | Very good |
| `llama3.2:1b` | 1.2B | 2 GB | Decent |
| `gemma2:2b` | 2.6B | 4 GB | Good |

To install a model:
```bash
ollama pull llama3
ollama pull gemma2:9b
```

## Advantages

- **Free**: no API cost
- **Private**: no data sent online
- **Offline**: works without internet
- **Customizable**: use any compatible model

## Troubleshooting

### "Ollama is not accessible" error
- Check that Ollama is running: `curl http://localhost:11434/api/tags`
- Check CORS: `curl -I -H "Origin: chrome-extension://test" http://localhost:11434/api/tags`
- If 403: relaunch with `OLLAMA_ORIGINS="chrome-extension://*"`

### "model not found" error
- List your models: `ollama list`
- Install the missing model: `ollama pull llama3`

### Slow responses
- Larger models (8B+) require more RAM and time
- Try a lighter model (`llama3.2:1b`, `gemma2:2b`)
- On Mac with Apple Silicon chip, performance is better
