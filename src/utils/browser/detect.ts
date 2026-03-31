export type BrowserType = 'chrome' | 'firefox' | 'unknown';

export function detectBrowser(): BrowserType {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    // Verifier si chrome.tabGroups existe (Chrome uniquement)
    if (typeof chrome.tabGroups !== 'undefined') {
      return 'chrome';
    }
    // @ts-ignore - browser is the Firefox namespace
    if (typeof browser !== 'undefined' && browser.runtime?.id) {
      return 'firefox';
    }
    return 'chrome';
  }
  return 'unknown';
}

export const IS_FIREFOX = detectBrowser() === 'firefox';
export const IS_CHROME = detectBrowser() === 'chrome';
export const SUPPORTS_TAB_GROUPS = typeof chrome !== 'undefined' && typeof chrome.tabGroups !== 'undefined';
export const SUPPORTS_SIDE_PANEL = IS_CHROME;
