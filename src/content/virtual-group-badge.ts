/**
 * @module virtual-group-badge
 * @description Content script for Firefox that displays a visual badge at the top
 * of the page to indicate the virtual group a tab belongs to. A thin colored bar
 * is rendered across the top of the viewport, with a small label showing the group name.
 *
 * The badge is controlled via messages from the background script:
 * - `UPDATE_VIRTUAL_GROUP_BADGE` with a `group` payload creates/updates the badge.
 * - `UPDATE_VIRTUAL_GROUP_BADGE` without a `group` payload removes the badge.
 */

/**
 * @description The DOM element ID used for the badge bar element.
 * Also used as a prefix for the label element (`${BADGE_ID}-label`).
 * @constant {string}
 */
const BADGE_ID = 'tmp-virtual-group-badge';

/**
 * @description Mapping of color names to their hex color values.
 * Used to translate group color identifiers into CSS background colors.
 * @constant {Record<string, string>}
 */
const COLOR_MAP: Record<string, string> = {
  grey: '#6b7280',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  pink: '#ec4899',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
};

/**
 * @description Creates or updates the visual group badge at the top of the page.
 * If the badge DOM elements do not exist, they are created and appended to the
 * document root element. If they already exist, only the color and title are updated.
 *
 * The badge consists of two elements:
 * 1. A thin (3px) colored bar spanning the full width of the viewport.
 * 2. A small label positioned below the bar showing the group title.
 *
 * Both elements use `pointer-events: none` to avoid interfering with page interaction
 * and `z-index: 2147483647` (max 32-bit int) to stay above all page content.
 *
 * @param {string} title - The group name to display in the badge label.
 * @param {string} color - The color key (must match a key in {@link COLOR_MAP}). Falls back to grey if unrecognized.
 * @returns {void}
 *
 * @example
 * ```ts
 * createOrUpdateBadge('Work', 'blue');
 * // Renders a blue bar with "Work" label at the top of the page.
 * ```
 */
function createOrUpdateBadge(title: string, color: string): void {
  let badge = document.getElementById(BADGE_ID);

  if (!badge) {
    badge = document.createElement('div');
    badge.id = BADGE_ID;
    badge.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      height: 3px;
      transition: all 0.3s ease;
      pointer-events: none;
    `;

    const label = document.createElement('div');
    label.id = BADGE_ID + '-label';
    label.style.cssText = `
      position: fixed;
      top: 3px;
      left: 8px;
      z-index: 2147483647;
      font-size: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 1px 6px;
      border-radius: 0 0 4px 4px;
      color: white;
      font-weight: 600;
      pointer-events: none;
      opacity: 0.85;
      transition: all 0.3s ease;
    `;

    document.documentElement.appendChild(badge);
    document.documentElement.appendChild(label);
  }

  const bgColor = COLOR_MAP[color] || COLOR_MAP.grey;
  badge.style.backgroundColor = bgColor;

  const label = document.getElementById(BADGE_ID + '-label');
  if (label) {
    label.textContent = title;
    label.style.backgroundColor = bgColor;
  }
}

/**
 * @description Removes the badge bar and label elements from the DOM, if they exist.
 * Safe to call even when no badge is currently displayed.
 *
 * @returns {void}
 */
function removeBadge(): void {
  document.getElementById(BADGE_ID)?.remove();
  document.getElementById(BADGE_ID + '-label')?.remove();
}

// Listen for messages from the background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_VIRTUAL_GROUP_BADGE') {
    if (message.group) {
      createOrUpdateBadge(message.group.title, message.group.color);
    } else {
      removeBadge();
    }
  }
});
