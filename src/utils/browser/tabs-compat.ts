/**
 * @module browser/tabs-compat
 * @description Cross-browser abstraction layer for tab grouping operations.
 * Provides a unified API that uses Chrome's native `chrome.tabGroups` when available
 * and falls back to {@link VirtualGroupManager} on browsers without native support (e.g. Firefox).
 */

import { IS_FIREFOX, SUPPORTS_TAB_GROUPS } from './detect';
import { VirtualGroupManager } from './virtual-groups';

/**
 * @description Configuration options for grouping tabs together.
 *
 * @interface GroupTabsOptions
 * @property {number[]} tabIds - The browser tab IDs to include in the group.
 * @property {string} title - The display title for the tab group.
 * @property {string} color - The color for the tab group (e.g. 'blue', 'red', 'grey').
 * @property {number} [windowId] - The window ID in which to create the group. Optional; defaults to the tabs' current window.
 */
export interface GroupTabsOptions {
  tabIds: number[];
  title: string;
  color: string;
  windowId?: number;
}

/**
 * @description Groups the specified tabs together under a named, colored tab group.
 * On Chrome (or Chromium-based browsers), uses the native `chrome.tabs.group` and
 * `chrome.tabGroups.update` APIs. On Firefox, delegates to {@link VirtualGroupManager.createGroup}.
 *
 * @param {GroupTabsOptions} options - The grouping configuration.
 * @returns {Promise<void>}
 *
 * @example
 * await groupTabs({
 *   tabIds: [101, 102, 103],
 *   title: 'Research',
 *   color: 'blue',
 *   windowId: 1,
 * });
 */
export async function groupTabs(options: GroupTabsOptions): Promise<void> {
  console.log('[TabManagerPro] groupTabs called:', {
    title: options.title,
    tabCount: options.tabIds.length,
    supportsTabGroups: SUPPORTS_TAB_GROUPS,
    hasTabGroupsAPI: typeof chrome?.tabGroups,
  });

  if (SUPPORTS_TAB_GROUPS) {
    // Chrome: use the native API
    const groupId = await chrome.tabs.group({
      tabIds: options.tabIds as [number, ...number[]],
      createProperties: options.windowId ? { windowId: options.windowId } : undefined,
    });
    console.log(`[TabManagerPro] Chrome group created: id=${groupId}, title="${options.title}"`);
    await chrome.tabGroups.update(groupId, {
      title: options.title,
      color: options.color as chrome.tabGroups.Color,
    });
  } else {
    console.log('[TabManagerPro] Using virtual groups (Firefox mode)');
    // Firefox: virtual groups
    await VirtualGroupManager.createGroup(options.tabIds, options.title, options.color);
  }
}

/**
 * @description Removes a tab from its current group.
 * On Chrome, uses `chrome.tabs.ungroup`. On Firefox, delegates to
 * {@link VirtualGroupManager.removeTab}. Silently ignores errors if the tab
 * is not in any group.
 *
 * @param {number} tabId - The browser tab ID to ungroup.
 * @returns {Promise<void>}
 *
 * @example
 * await ungroupTab(42);
 */
export async function ungroupTab(tabId: number): Promise<void> {
  if (SUPPORTS_TAB_GROUPS) {
    try {
      await chrome.tabs.ungroup(tabId);
    } catch {
      // Tab may not be in a group
    }
  } else {
    await VirtualGroupManager.removeTab(tabId);
  }
}

/**
 * @description Retrieves the group information (title and color) for a given tab.
 * On Chrome, queries the native `chrome.tabGroups` API. On Firefox, looks up the tab
 * in virtual groups via {@link VirtualGroupManager.getGroupForTab}.
 *
 * @param {number} tabId - The browser tab ID to look up.
 * @returns {Promise<{title: string, color: string} | null>} An object with the group's title
 *   and color, or `null` if the tab is not in any group.
 *
 * @example
 * const info = await getTabGroupInfo(101);
 * if (info) {
 *   console.log(`Tab is in group "${info.title}" (${info.color})`);
 * } else {
 *   console.log('Tab is not grouped');
 * }
 */
export async function getTabGroupInfo(tabId: number): Promise<{
  title: string;
  color: string;
} | null> {
  if (SUPPORTS_TAB_GROUPS) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.groupId && tab.groupId !== -1) {
        const group = await chrome.tabGroups.get(tab.groupId);
        return { title: group.title || '', color: group.color };
      }
    } catch {
      // Tab or group not found
    }
    return null;
  } else {
    const vg = await VirtualGroupManager.getGroupForTab(tabId);
    return vg ? { title: vg.title, color: vg.color } : null;
  }
}
