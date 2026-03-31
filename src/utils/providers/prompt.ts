import { TabData } from './types';

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
};

export function buildGroupingPrompt(tabs: TabData[], language = 'fr'): string {
  const tabList = JSON.stringify(tabs.map(t => ({ id: t.id, title: t.title, url: t.url })));
  const langName = LANGUAGE_NAMES[language] || 'French';

  return `Analyze the following browser tabs and suggest relevant thematic groupings for a Chrome browser.
Group names MUST be written in ${langName}.
Return ONLY a valid JSON array with this format: Array<{ groupName: string, tabs: number[], color: 'grey'|'blue'|'red'|'yellow'|'green'|'pink'|'purple'|'cyan'|'orange' }>.

Tabs: ${tabList}`;
}

export function parseGroupingResponse(text: string) {
  const match = text.match(/\[.*\]/s);
  return match ? JSON.parse(match[0]) : [];
}
