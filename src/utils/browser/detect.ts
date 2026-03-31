/**
 * @module browser/detect
 * @description Browser detection utilities for Tab Manager Pro.
 * Determines the current browser environment (Chrome, Firefox, or unknown) and
 * exposes boolean flags indicating available browser-specific features such as
 * native tab groups and side panel support.
 */

/**
 * @description Union type representing the detected browser environment.
 * - `'chrome'` — Google Chrome or Chromium-based browser with tab group support.
 * - `'firefox'` — Mozilla Firefox (uses the `browser` namespace).
 * - `'unknown'` — Unrecognized environment where `chrome.runtime` is not available.
 */
export type BrowserType = 'chrome' | 'firefox' | 'unknown';

/**
 * @description Detects the current browser by inspecting available runtime APIs.
 * Checks for the `chrome.tabGroups` API (Chrome-only) and the `browser` namespace (Firefox).
 *
 * @returns {BrowserType} The detected browser type: `'chrome'`, `'firefox'`, or `'unknown'`.
 *
 * @example
 * const browser = detectBrowser();
 * if (browser === 'chrome') {
 *   // Use native tab group APIs
 * } else if (browser === 'firefox') {
 *   // Fall back to virtual groups
 * }
 */
export function detectBrowser(): BrowserType {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    // Check if chrome.tabGroups exists (Chrome only)
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

/**
 * @description `true` if the current browser is detected as Firefox.
 * @constant {boolean}
 */
export const IS_FIREFOX = detectBrowser() === 'firefox';

/**
 * @description `true` if the current browser is detected as Chrome (or Chromium-based).
 * @constant {boolean}
 */
export const IS_CHROME = detectBrowser() === 'chrome';

/**
 * @description `true` if the browser supports the native `chrome.tabGroups` API.
 * When `false`, the extension falls back to virtual groups stored in local storage.
 * @constant {boolean}
 */
export const SUPPORTS_TAB_GROUPS = typeof chrome !== 'undefined' && typeof chrome.tabGroups !== 'undefined';

/**
 * @description `true` if the browser supports the Chrome Side Panel API.
 * Currently only available in Chrome.
 * @constant {boolean}
 */
export const SUPPORTS_SIDE_PANEL = IS_CHROME;
