# Tab Manager Pro

Chrome extension that transforms tab chaos into smart groups, powered by 5 AI engines.

## Features

- **AI-powered tab grouping** - Automatically organizes tabs by topic using AI analysis
- **5 AI providers** - Claude (Anthropic), GPT (OpenAI), Gemini (Google), Mistral, and Ollama (local/offline)
- **Sessions & Workspaces** - Save and restore complete browsing sessions with thematic workspaces
- **AI Chat** - Conversational interface in a side panel to manage tabs with natural language commands
- **Multilingual** - English, French, and Spanish (via `chrome.i18n`)
- **Privacy-first** - Only tab titles and URLs are sent to the AI provider. With Ollama, nothing leaves your machine.

## Tech Stack

- **Manifest V3** - Modern Chrome extension architecture
- **React 19** + **Tailwind CSS 4** - UI framework
- **Vite** + **CRXJS** - Build toolchain
- **TypeScript** - Type safety
- **Sentry** - Error monitoring

## Installation

### From source

```bash
git clone https://github.com/amazscript/tab-manager-pro.git
cd tab-manager-pro
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development

```bash
npm run dev
```

## Permissions

| Permission | Usage |
|---|---|
| `tabs` | Read and organize tabs |
| `storage` | Save configuration and sessions |
| `tabGroups` | Create and manage tab groups |
| `sidePanel` | Display the AI chat side panel |

## Documentation

Full documentation available at: https://amazscript.github.io/tab-manager-pro/

## License

ISC
