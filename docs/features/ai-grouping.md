# Automatic AI Grouping

The core of Tab Manager Pro: organize your tabs in **a single click** using artificial intelligence.

## How does it work?

1. Click **Group with AI** in the popup
2. The extension sends the titles and URLs of your tabs to the AI provider
3. The AI analyzes the content and suggests thematic groups
4. The groups are applied with **distinct colors**

## Example

Before:
```
- GitHub - my-project/issues
- Stack Overflow - React hooks question
- YouTube - Music playlist
- Gmail - Inbox
- GitHub - my-project/pull/42
- MDN - Array.prototype.map()
- Netflix - Home
```

After AI grouping:
```
[Dev - blue]     GitHub issues, GitHub PR, Stack Overflow, MDN
[Media - red]    YouTube, Netflix
[Email - green]  Gmail
```

## Available colors

The AI automatically assigns a color to each group from the 9 Chrome colors:

`grey` `blue` `red` `yellow` `green` `pink` `purple` `cyan` `orange`

## Remove groups

Click **Remove all groups** at the bottom of the popup to ungroup all your tabs.

## Fallback system

If your main provider fails (network error, quota exceeded...), the extension automatically tries the configured backup providers, in the defined order.

## Tips

::: tip For better results
- The more tabs you have, the more relevant the grouping will be
- Tabs with descriptive titles are better categorized
- Try different providers to compare grouping quality
:::
