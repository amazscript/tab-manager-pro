/**
 * Helper d'internationalisation.
 * Utilise chrome.i18n.getMessage() avec fallback sur la cle.
 */
export function t(key: string, ...substitutions: string[]): string {
  try {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  } catch {
    return key;
  }
}
