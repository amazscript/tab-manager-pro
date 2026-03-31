import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Tab Manager Pro',
  description: 'AI-powered Chrome extension to organize your tabs intelligently',
  lang: 'en-US',
  base: '/tab-manager-pro/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/features/ai-grouping' },
      { text: 'AI Providers', link: '/providers/overview' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Why Tab Manager Pro?', link: '/guide/why' },
          { text: 'Installation', link: '/guide/getting-started' },
          { text: 'Quick Setup', link: '/guide/quick-setup' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'AI Grouping', link: '/features/ai-grouping' },
          { text: 'Sessions', link: '/features/sessions' },
          { text: 'Workspaces', link: '/features/workspaces' },
          { text: 'AI Chat', link: '/features/chat' },
          { text: 'Voice Commands', link: '/features/commands' },
        ],
      },
      {
        text: 'AI Providers',
        items: [
          { text: 'Overview', link: '/providers/overview' },
          { text: 'Anthropic (Claude)', link: '/providers/anthropic' },
          { text: 'OpenAI (GPT)', link: '/providers/openai' },
          { text: 'Google Gemini', link: '/providers/gemini' },
          { text: 'Mistral AI', link: '/providers/mistral' },
          { text: 'Ollama (Local)', link: '/providers/ollama' },
        ],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Privacy & Security', link: '/guide/privacy' },
          { text: 'FAQ', link: '/guide/faq' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/amazscript/tab-manager-pro' },
    ],
    footer: {
      message: 'Tab Manager Pro — Organize your tabs with AI',
      copyright: 'Copyright 2025 Tab Manager Pro',
    },
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/amazscript/tab-manager-pro/edit/main/:path',
      text: 'Edit this page',
    },
  },
});
