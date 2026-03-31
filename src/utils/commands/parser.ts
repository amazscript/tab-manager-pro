/**
 * @module parser
 * @description Natural language intent parser for Tab Manager Pro.
 * Matches user input text against a set of regex patterns (supporting both
 * French and English) to determine the intended command and extract parameters.
 * Falls back to a generic 'chat' intent when no command pattern matches.
 */

import { ParsedIntent, IntentType } from './types';

/**
 * @description Internal interface representing a single intent pattern configuration.
 * Each entry maps an intent type to one or more regex patterns and an optional
 * parameter extraction function.
 */
interface IntentPattern {
  /** @description The intent type this pattern detects. */
  type: IntentType;
  /** @description Array of regex patterns that trigger this intent. */
  patterns: RegExp[];
  /**
   * @description Optional function to extract command parameters from the matched text.
   * @param match - The RegExp match array from the pattern test.
   * @param text - The original user input text.
   * @returns A record of extracted parameter key-value pairs.
   */
  extractParams?: (match: RegExpMatchArray, text: string) => Record<string, string | undefined>;
}

/**
 * @description Array of all supported intent patterns, ordered by priority.
 * Each entry defines regex patterns (French and English) and optional parameter extraction.
 * @constant
 */
const intentPatterns: IntentPattern[] = [
  {
    type: 'close_duplicates',
    patterns: [
      /ferm\w*\s+(les\s+)?doublons/i,
      /suppr\w*\s+(les\s+)?doublons/i,
      /close\s+duplicat/i,
      /remove\s+duplicat/i,
      /doublons/i,
    ],
  },
  {
    type: 'sort_tabs',
    patterns: [
      /tri\w*\s+(les\s+)?onglets/i,
      /sort\w*\s+(the\s+)?tabs/i,
      /ordonn\w*\s+(les\s+)?onglets/i,
      /ranger\s+(les\s+)?onglets/i,
    ],
  },
  {
    type: 'close_inactive',
    patterns: [
      /ferm\w*\s+(les\s+)?(onglets?\s+)?inactif/i,
      /ferm\w*\s+(les\s+)?vieux\s+onglets/i,
      /close\s+(the\s+)?inactive/i,
      /close\s+old\s+tabs/i,
    ],
  },
  {
    type: 'group_tabs',
    patterns: [
      /group\w*\s+(les\s+)?onglets/i,
      /regroup\w*\s+(les\s+)?onglets/i,
      /organis\w*\s+(les\s+)?onglets/i,
      /group\s+(the\s+)?tabs/i,
      /organize\s+tabs/i,
    ],
  },
  {
    type: 'close_tab',
    patterns: [
      /ferm\w*\s+(l'?\s*onglet|la\s+page|le\s+tab)\s+(.+)/i,
      /close\s+(the\s+)?tab\s+(.+)/i,
    ],
    extractParams: (_match, text) => {
      const nameMatch = text.match(/(?:ferm\w*|close)\s+(?:l'?\s*onglet|la\s+page|le\s+tab|the\s+tab)\s+(.+)/i);
      return { query: nameMatch?.[1]?.trim() || '' };
    },
  },
  {
    type: 'save_session',
    patterns: [
      /sauvegard\w*\s+(la\s+)?session/i,
      /save\s+(the\s+)?session/i,
      /enregistr\w*\s+(la\s+)?session/i,
    ],
    extractParams: (_match, text) => {
      const nameMatch = text.match(/(?:sous\s+le\s+nom|(?:as|named?))\s+["']?([^"']+)["']?/i);
      return nameMatch ? { name: nameMatch[1].trim() } : {};
    },
  },
  {
    type: 'restore_session',
    patterns: [
      /restaur\w*\s+(la\s+)?session/i,
      /restore\s+(the\s+)?session/i,
      /ouvr\w*\s+(la\s+)?session/i,
      /charger?\s+(la\s+)?session/i,
    ],
    extractParams: (_match, text) => {
      const nameMatch = text.match(/session\s+["']?([^"']+)["']?/i);
      return nameMatch ? { name: nameMatch[1].trim() } : {};
    },
  },
  {
    type: 'create_workspace',
    patterns: [
      /cre\w*\s+(un\s+)?workspace/i,
      /nouveau\s+workspace/i,
      /create\s+(a\s+)?workspace/i,
      /new\s+workspace/i,
    ],
    extractParams: (_match, text) => {
      const nameMatch = text.match(/workspace\s+["']?([^"']+)["']?/i);
      return nameMatch ? { name: nameMatch[1].trim() } : {};
    },
  },
  {
    type: 'open_workspace',
    patterns: [
      /ouvr\w*\s+(le\s+)?workspace/i,
      /open\s+(the\s+)?workspace/i,
      /charger?\s+(le\s+)?workspace/i,
      /load\s+(the\s+)?workspace/i,
    ],
    extractParams: (_match, text) => {
      const nameMatch = text.match(/workspace\s+["']?([^"']+)["']?/i);
      return nameMatch ? { name: nameMatch[1].trim() } : {};
    },
  },
  {
    type: 'search_tabs',
    patterns: [
      /cherch\w*\s+(l'?\s*onglet|un\s+onglet|dans\s+les\s+onglets)/i,
      /trouv\w*\s+(l'?\s*onglet|un\s+onglet)/i,
      /search\s+(for\s+)?tab/i,
      /find\s+(a\s+)?tab/i,
    ],
    extractParams: (_match, text) => {
      const queryMatch = text.match(/(?:cherch\w*|trouv\w*|search|find)\s+(?:.*?)\s+["']?([^"']+)["']?$/i);
      return { query: queryMatch?.[1]?.trim() || '' };
    },
  },
];

/**
 * @description Parses a natural language text input and returns a structured intent
 * with its type, extracted parameters, and the original text. Patterns are evaluated
 * in priority order; the first match wins. If no command pattern matches, a 'chat'
 * intent is returned as a fallback.
 *
 * @param {string} text - The raw user input text to parse.
 * @returns {ParsedIntent} The parsed intent containing the recognized type, extracted parameters, and original text.
 *
 * @example
 * ```ts
 * const intent = parseIntent('close duplicates');
 * // => { type: 'close_duplicates', params: {}, originalText: 'close duplicates' }
 * ```
 *
 * @example
 * ```ts
 * const intent = parseIntent('save the session as "Friday work"');
 * // => { type: 'save_session', params: { name: 'Friday work' }, originalText: '...' }
 * ```
 *
 * @example
 * ```ts
 * const intent = parseIntent('hello there');
 * // => { type: 'chat', params: {}, originalText: 'hello there' }
 * ```
 */
export function parseIntent(text: string): ParsedIntent {
  for (const intent of intentPatterns) {
    for (const pattern of intent.patterns) {
      const match = text.match(pattern);
      if (match) {
        const params = (intent.extractParams?.(match, text) || {}) as Record<string, string | undefined>;
        return { type: intent.type, params, originalText: text };
      }
    }
  }

  return { type: 'chat', params: {}, originalText: text };
}
