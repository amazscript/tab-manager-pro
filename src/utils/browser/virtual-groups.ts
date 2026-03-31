/**
 * Groupes Virtuels pour Firefox.
 * Firefox ne supporte pas chrome.tabGroups, donc on stocke les groupes
 * dans chrome.storage et on utilise un content script pour afficher
 * des badges visuels sur les onglets.
 */

export interface VirtualGroup {
  id: string;
  title: string;
  color: string;
  collapsed: boolean;
  tabIds: number[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class VirtualGroupManager {
  private static STORAGE_KEY = 'virtualGroups';

  static async getAll(): Promise<VirtualGroup[]> {
    const data = await chrome.storage.local.get(this.STORAGE_KEY);
    return (data[this.STORAGE_KEY] || []) as VirtualGroup[];
  }

  private static async saveAll(groups: VirtualGroup[]): Promise<void> {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: groups });
    // Notifier les content scripts pour mettre a jour les badges
    await this.notifyContentScripts(groups);
  }

  static async createGroup(
    tabIds: number[],
    title: string,
    color: string
  ): Promise<VirtualGroup> {
    const groups = await this.getAll();

    // Retirer ces tabs des autres groupes
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
    // Nettoyer les groupes vides
    const filtered = groups.filter(g => g.tabIds.length > 0);
    await this.saveAll(filtered);

    return group;
  }

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

  static async removeGroup(groupId: string): Promise<void> {
    const groups = await this.getAll();
    const filtered = groups.filter(g => g.id !== groupId);
    await this.saveAll(filtered);
  }

  static async getGroupForTab(tabId: number): Promise<VirtualGroup | undefined> {
    const groups = await this.getAll();
    return groups.find(g => g.tabIds.includes(tabId));
  }

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
