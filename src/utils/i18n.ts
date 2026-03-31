/**
 * @module i18n
 * @description Internationalization (i18n) helper for Tab Manager Pro.
 * Wraps the Chrome i18n API to provide safe message retrieval with automatic
 * fallback to the message key when a translation is unavailable or an error occurs.
 */

/**
 * @description Retrieves a localized message string using the Chrome i18n API.
 * If the message is not found or an error occurs (e.g., when running outside
 * a Chrome extension context), the raw key is returned as a fallback.
 *
 * @param key - The message key as defined in the _locales messages.json files.
 * @param substitutions - Optional substitution strings to replace $1, $2, etc. placeholders.
 * @returns The localized message string, or the key itself if no translation is available.
 */
export function t(key: string, ...substitutions: string[]): string {
  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  } catch {
    return key;
  }
}
