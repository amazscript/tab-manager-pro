# Installation

## Chrome Web Store

::: warning Coming soon
Tab Manager Pro is not yet available on the Chrome Web Store. It will be published soon. In the meantime, you can install it manually from source (see below).
:::

## Manual installation (developers)

If you want to install the extension from source:

```bash
git clone https://github.com/amazscript/tab-manager-pro.git
cd tab-manager-pro
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder

## First launch

On first launch, an **onboarding wizard** guides you through 5 steps:

1. **Welcome** — Overview of features
2. **Choose AI provider** — Select your preferred AI engine
3. **Configuration** — Enter your API key or Ollama URL
4. **Discovery** — Tour of the main features
5. **Ready!** — Start organizing your tabs

::: tip You can skip the onboarding
Click "Skip" if you want to configure the extension later from the popup.
:::

## Required permissions

| Permission | Usage |
|---|---|
| `tabs` | Read and organize your tabs |
| `storage` | Save your configuration and sessions |
| `tabGroups` | Create and manage tab groups |
| `sidePanel` | Display the chat side panel |

::: info No browsing data is collected
Only the titles and URLs of your tabs are sent to the chosen AI provider for analysis. With Ollama, nothing leaves your machine.
:::
