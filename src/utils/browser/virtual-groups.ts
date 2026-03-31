/**
 * @module browser/virtual-groups
 * @description Virtual tab group implementation for Firefox.
 * Firefox does not support the native `chrome.tabGroups` API, so this module
 * provides an equivalent abstraction by storing group data in Chrome local storage
 * and notifying content scripts to display visual badges on tabs.
 */

/**
 * @description Represents a virtual tab group stored in local storage.
 * Used as a Firefox-compatible alternative to Chrome's native tab groups.
 *
 * @interface VirtualGroup
 * @property {string} id - Unique identifier for the virtual group (base-36 timestamp + random suffix).
 * @property {string} title - Display title of the group.
 * @property {string} color - Color of the group (e.g. 'blue', 'red').
 * @property {boolean} collapsed - Whether the group is visually collapsed.
 * @property {number[]} tabIds - Array of browser tab IDs that belong to this group.
 */
export interface VirtualGroup {
  id: string;
  title: string;
  color: string;
  collapsed: boolean;
  tabIds: number[];
}

/**
 * @description Generates a short, unique identifier by combining a base-36 timestamp
 * with a random base-36 suffix.
 *
 * @returns {string} A unique ID string (e.g. "lxk3f9a1bc").
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * @description Manages virtual tab groups for browsers that lack native tab group support (e.g. Firefox).
 * Groups are persisted in Chrome local storage under the `virtualGroups` key.
 * Content scripts are notified via messaging whenever groups change so they can
 * update visual badges on tabs.
 *
 * @class VirtualGroupManager
 *
 * @example
 * // Create a virtual group
 * const group = await VirtualGroupManager.createGroup([1, 2, 3], 'Research', 'blue');
 *
 * // Get all groups
 * const groups = await VirtualGroupManager.getAll();
 *
 * // Remove a tab from its group
 * await VirtualGroupManager.removeTab(2);
 */
export class VirtualGroupManager {
  /** @description The Chrome local storage key used to persist virtual groups. */
  private static STORAGE_KEY = 'virtualGroups';

  /**
   * @description Retrieves all virtual groups from Chrome local storage.
   *
   * @returns {Promise<VirtualGroup[]>} An array of all stored virtual groups.
   *
   * @example
   * const groups = await VirtualGroupManager.getAll();
   * console.log(`Found ${groups.length} virtual groups`);
   */
  static async getAll(): Promise<VirtualGroup[]> {
    const data = await chrome.storage.local.get(this.STORAGE_KEY);
    return (data[this.STORAGE_KEY] || []) as VirtualGroup[];
  }

  /**
   * @description Persists the given virtual groups array to Chrome local storage
   * and notifies all content scripts to update their visual badges.
   *
   * @param {VirtualGroup[]} groups - The complete list of virtual groups to save.
   * @returns {Promise<void>}
   */
  private static async saveAll(groups: VirtualGroup[]): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: groups });
    // Notify content scripts to update badges
    await this.notifyContentScripts(groups);
  }

  /**
   * @description Creates a new virtual group with the specified tabs, title, and color.
   * Any tabs that already belong to another group are first removed from that group.
   * Empty groups are automatically cleaned up after reassignment.
   *
   * @param {number[]} tabIds - The browser tab IDs to include in the new group.
   * @param {string} title - The display title of the group.
   * @param {string} color - The color of the group (e.g. 'blue', 'red').
   * @returns {Promise<VirtualGroup>} The newly created virtual group.
   *
   * @example
   * const group = await VirtualGroupManager.createGroup([10, 11, 12], 'Shopping', 'green');
   * console.log(`Created group "${group.title}" with ${group.tabIds.length} tabs`);
   */
  static async createGroup(
    tabIds: number[],
    title: string,
    color: string
  ): Promise<VirtualGroup> {
    const groups = await this.getAll();

    // Remove these tabs from other groups
    for (const g of groups) {
      g.tabIds = g.tabIds.filter(id => !tabIds.includes(id));
    }

    const group: VirtualGroup = {
      id: generateId(),
      title,
      color,
      collapsed: false,
      tabIds,
    };

    groups.push(group);
    // Clean up empty groups
    const filtered = groups.filter(g => g.tabIds.length > 0);
    await this.saveAll(filtered);

    return group;
  }

  /**
   * @description Updates properties of an existing virtual group (title, color, and/or collapsed state).
   * If no group matches the given ID, the operation is silently ignored.
   *
   * @param {string} groupId - The unique ID of the group to update.
   * @param {Partial<Pick<VirtualGroup, 'title' | 'color' | 'collapsed'>>} updates - An object containing the properties to update.
   * @returns {Promise<void>}
   *
   * @example
   * await VirtualGroupManager.updateGroup('lxk3f9a1bc', { title: 'New Title', color: 'red' });
   */
  static async updateGroup(
    groupId: string,
    updates: Partial<Pick<VirtualGroup, 'title' | 'color' | 'collapsed'>>
  ): Promise<void> {
    const groups = await this.getAll();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      Object.assign(group, updates);
      await this.saveAll(groups);
    }
  }

  /**
   * @description Removes a virtual group entirely.
   *
   * @param {string} groupId - The unique ID of the group to remove.
   * @returns {Promise<void>}
   *
   * @example
   * await VirtualGroupManager.removeGroup('lxk3f9a1bc');
   */
  static async removeGroup(groupId: string): Promise<void> {
    const groups = await this.getAll();
    const filtered = groups.filter(g => g.id !== groupId);
    await this.saveAll(filtered);
  }

  /**
   * @description Finds the virtual group that contains a given tab.
   *
   * @param {number} tabId - The browser tab ID to look up.
   * @returns {Promise<VirtualGroup | undefined>} The virtual group containing the tab, or `undefined` if the tab is not in any group.
   *
   * @example
   * const group = await VirtualGroupManager.getGroupForTab(42);
   * if (group) {
   *   console.log(`Tab 42 belongs to group "${group.title}"`);
   * }
   */
  static async getGroupForTab(tabId: number): Promise<VirtualGroup | undefined> {
    const groups = await this.getAll();
    return groups.find(g => g.tabIds.includes(tabId));
  }

  /**
   * @description Removes a specific tab from whichever virtual group it belongs to.
   * If removing the tab leaves a group empty, that group is automatically deleted.
   * Does nothing if the tab is not in any group.
   *
   * @param {number} tabId - The browser tab ID to remove from its group.
   * @returns {Promise<void>}
   *
   * @example
   * await VirtualGroupManager.removeTab(42);
   */
  static async removeTab(tabId: number): Promise<void> {
    const groups = await this.getAll();
    let changed = false;
    for (const g of groups) {
      const idx = g.tabIds.indexOf(tabId);
      if (idx !== -1) {
        g.tabIds.splice(idx, 1);
        changed = true;
      }
    }
    if (changed) {
      const filtered = groups.filter(g => g.tabIds.length > 0);
      await this.saveAll(filtered);
    }
  }

  /**
   * @description Sends a message to all open tabs' content scripts with updated
   * virtual group badge information. Tabs with internal URLs (about:, moz-extension:)
   * are skipped. Errors are silently ignored since content scripts may not be loaded.
   *
   * @param {VirtualGroup[]} groups - The current list of all virtual groups.
   * @returns {Promise<void>}
   */
  private static async notifyContentScripts(groups: VirtualGroup[]): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const groupMap: Record<number, { title: string; color: string }> = {};
      for (const g of groups) {
        for (const tabId of g.tabIds) {
          groupMap[tabId] = { title: g.title, color: g.color };
        }
      }

      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-extension:')) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_VIRTUAL_GROUP_BADGE',
              group: groupMap[tab.id] || null,
            });
          } catch {
            // Tab may not have content script loaded
          }
        }
      }
    } catch {
      // Ignore errors during broadcast
    }
  }
}
