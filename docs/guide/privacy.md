# Privacy & Security

## Data collected

Tab Manager Pro collects **no personal data**. Here is what is transmitted and stored:

### Data sent to the AI provider

Only during AI grouping or chat:

- **Title** of each tab
- **URL** of each tab

::: info
No page content, cookies, passwords, browsing history, or personal data is transmitted.
:::

### Data stored locally

All data is stored in `chrome.storage.local` (on your machine only):

- Provider configuration (API key encrypted by Chrome)
- Saved sessions
- Workspaces
- Chat history
- Preferences (language, active provider)

### Data sent to third parties

| Service | Data | When |
|---|---|---|
| Chosen AI provider | Tab titles + URLs | AI grouping or chat |
| Sentry | Anonymized errors | In case of bugs (no user data) |

## 100% local mode

With **Ollama**, no data leaves your machine. The AI model runs locally and the extension communicates only with `localhost`.

## API keys

- API keys are stored in `chrome.storage.local`
- They are never sent to our servers
- They are only used to authenticate requests to the chosen provider

## Extension permissions

| Permission | Justification |
|---|---|
| `tabs` | Read tab titles/URLs for AI grouping |
| `storage` | Save configuration and sessions |
| `tabGroups` | Create and manage tab groups |
| `sidePanel` | Display the chat interface |

## Source code

The extension is open source. You can audit the code at any time to verify our privacy practices.

## Contact

For any privacy-related questions, contact us at [your-email].
