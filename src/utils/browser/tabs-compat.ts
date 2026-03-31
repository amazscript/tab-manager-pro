/**
 * Couche d'abstraction pour les operations sur les onglets.
 * Utilise chrome.tabGroups sur Chrome et VirtualGroupManager sur Firefox.
 */

import { IS_FIREFOX, SUPPORTS_TAB_GROUPS } from './detect';
import { VirtualGroupManager } from './virtual-groups';

export interface GroupTabsOptions {
  tabIds: number[];
  title: string;
  color: string;
  windowId?: number;
}

export async function groupTabs(options: GroupTabsOptions): Promise<void> {
  console.log('[TabManagerPro] groupTabs called:', {
    title: options.title,
    tabCount: options.tabIds.length,
    supportsTabGroups: SUPPORTS_TAB_GROUPS,
    hasTabGroupsAPI: typeof chrome?.tabGroups,
  });

  if (SUPPORTS_TAB_GROUPS) {
    // Chrome : utiliser l'API native
    const groupId = await chrome.tabs.group({
      tabIds: options.tabIds as [number, ...number[]],
      createProperties: options.windowId ? { windowId: options.windowId } : undefined,
    });
    console.log(`[TabManagerPro] Groupe Chrome cree: id=${groupId}, title="${options.title}"`);
    await chrome.tabGroups.update(groupId, {
      title: options.title,
      color: options.color as chrome.tabGroups.Color,
    });
  } else {
    console.log('[TabManagerPro] Utilisation des groupes virtuels (Firefox mode)');
    // Firefox : groupes virtuels
    await VirtualGroupManager.createGroup(options.tabIds, options.title, options.color);
  }
}

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

/** Recupère les infos de groupe pour un onglet */
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
