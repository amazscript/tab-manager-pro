/**
 * @module prompt
 * @description Prompt construction and response parsing utilities for the AI provider system.
 * Provides functions to build the tab-grouping prompt sent to any AI provider and to
 * parse the JSON array of grouping suggestions from the raw AI response text.
 */

import { TabData } from './types';

/**
 * @description Mapping from ISO 639-1 language codes to their full English names.
 * Used to instruct the AI to generate group names in the requested language.
 * @constant
 */
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

/**
 * @description Builds the prompt string that instructs an AI model to analyze browser tabs
 * and return thematic grouping suggestions as a JSON array.
 * @param {TabData[]} tabs - The browser tabs to include in the prompt.
 * @param {string} [language='fr'] - The ISO 639-1 language code for group names. Defaults to French.
 * @returns {string} The fully constructed prompt string ready to send to an AI provider.
 * @example
 * const prompt = buildGroupingPrompt(
 *   [{ id: 1, title: 'GitHub', url: 'https://github.com' }],
 *   'en'
 * );
 * // Returns a prompt asking the AI to group the tabs with English group names.
 */
export function buildGroupingPrompt(tabs: TabData[], language = 'fr'): string {
  const tabList = JSON.stringify(tabs.map(t => ({ id: t.id, title: t.title, url: t.url })));
  const langName = LANGUAGE_NAMES[language] || 'French';

  return `Analyze the following browser tabs and suggest relevant thematic groupings for a Chrome browser.
Group names MUST be written in ${langName}.
Return ONLY a valid JSON array with this format: Array<{ groupName: string, tabs: number[], color: 'grey'|'blue'|'red'|'yellow'|'green'|'pink'|'purple'|'cyan'|'orange' }>.

Tabs: ${tabList}`;
}

/**
 * @description Parses the raw text response from an AI provider to extract the JSON array
 * of grouping suggestions. Searches for the first JSON array pattern in the text.
 * @param {string} text - The raw text response from the AI provider.
 * @returns {Array<{ groupName: string; tabs: number[]; color?: string }>} The parsed array
 *   of grouping suggestions, or an empty array if no valid JSON array is found.
 * @throws {SyntaxError} If a JSON array pattern is found but contains invalid JSON.
 * @example
 * const suggestions = parseGroupingResponse('Here is the result: [{"groupName":"Dev","tabs":[1,2],"color":"blue"}]');
 * // Returns [{ groupName: 'Dev', tabs: [1, 2], color: 'blue' }]
 */
export function parseGroupingResponse(text: string) {
  const match = text.match(/\[.*\]/s);
  return match ? JSON.parse(match[0]) : [];
}
