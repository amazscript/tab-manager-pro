/**
 * @module storage/workspaces
 * @description Provides workspace management for Tab Manager Pro.
 * A workspace is a named, color-coded collection of URLs that can be opened together
 * in a new browser window with all tabs grouped under a single tab group.
 * Workspaces are persisted in Chrome local storage and can be created from the current
 * tabs, opened, updated, renamed, or deleted.
 */

import { Workspace, WorkspaceUrl } from './types';
import { groupTabs } from '../browser';

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
 * @description Manages thematic workspaces — creating, opening, updating, listing, deleting, and renaming.
 * All methods are static and interact directly with Chrome local storage.
 *
 * @class WorkspaceManager
 *
 * @example
 * // Create a workspace from the current window's tabs
 * const ws = await WorkspaceManager.createFromCurrentTabs('Research', 'blue');
 *
 * // Open a workspace in a new window
 * await WorkspaceManager.open(ws.id);
 *
 * // List all workspaces
 * const workspaces = await WorkspaceManager.list();
 */
export class WorkspaceManager {
  /**
   * @description Creates a new workspace from the tabs currently open in the active window.
   * Tabs with `chrome://` URLs are excluded. The resulting workspace is persisted to storage.
   *
   * @param {string} name - A descriptive name for the workspace.
   * @param {string} color - The color to associate with the workspace (e.g. 'blue', 'red').
   * @returns {Promise<Workspace>} The newly created workspace object.
   *
   * @example
   * const workspace = await WorkspaceManager.createFromCurrentTabs('Dev Tools', 'green');
   * console.log(`Created workspace with ${workspace.urls.length} URLs`);
   */
  static async createFromCurrentTabs(name: string, color: string): Promise<Workspace> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const urls: WorkspaceUrl[] = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://'))
      .map(t => ({ url: t.url!, title: t.title || '' }));

    return WorkspaceManager.create(name, color, urls);
  }

  /**
   * @description Creates a new workspace with the specified name, color, and URL list.
   * The workspace is prepended to the stored workspaces array so it appears first.
   *
   * @param {string} name - A descriptive name for the workspace.
   * @param {string} color - The color to associate with the workspace (e.g. 'blue', 'red').
   * @param {WorkspaceUrl[]} urls - The list of URLs to include in the workspace.
   * @returns {Promise<Workspace>} The newly created and persisted workspace object.
   *
   * @example
   * const urls = [
   *   { url: 'https://github.com', title: 'GitHub' },
   *   { url: 'https://stackoverflow.com', title: 'Stack Overflow' },
   * ];
   * const workspace = await WorkspaceManager.create('Coding', 'purple', urls);
   */
  static async create(name: string, color: string, urls: WorkspaceUrl[]): Promise<Workspace> {
    const workspace: Workspace = {
      id: generateId(),
      name,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      urls,
    };

    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    workspaces.unshift(workspace);
    await chrome.storage.local.set({ workspaces });

    return workspace;
  }

  /**
   * @description Opens a workspace in a new browser window. All workspace URLs are opened
   * as tabs, and all tabs are grouped together under a single tab group named
   * after the workspace with its associated color.
   *
   * @param {string} workspaceId - The unique ID of the workspace to open.
   * @returns {Promise<void>}
   * @throws {Error} Throws if no workspace with the given ID is found.
   * @throws {Error} Throws if the workspace has no URLs.
   *
   * @example
   * try {
   *   await WorkspaceManager.open('lxk3f9a1bc');
   * } catch (err) {
   *   console.error('Failed to open workspace:', err.message);
   * }
   */
  static async open(workspaceId: string): Promise<void> {
    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (workspace.urls.length === 0) throw new Error('Workspace is empty');

    // Open in a new window
    const win = await chrome.windows.create({
      url: workspace.urls[0].url,
      focused: true,
    });

    if (!win?.id) return;

    const winId = win.id;

    // Open remaining tabs
    for (let i = 1; i < workspace.urls.length; i++) {
      await chrome.tabs.create({
        windowId: winId,
        url: workspace.urls[i].url,
      });
    }

    // Group all tabs and name the group
    const allTabs = await chrome.tabs.query({ windowId: winId });
    const tabIds = allTabs.map(t => t.id!).filter(Boolean);
    if (tabIds.length > 0) {
      await groupTabs({
        tabIds,
        title: workspace.name,
        color: workspace.color,
        windowId: winId,
      });
    }
  }

  /**
   * @description Replaces the URL list of an existing workspace with the tabs currently
   * open in the active window. Tabs with `chrome://` URLs are excluded.
   * The workspace's `updatedAt` timestamp is refreshed.
   *
   * @param {string} workspaceId - The unique ID of the workspace to update.
   * @returns {Promise<Workspace>} The updated workspace object.
   * @throws {Error} Throws if no workspace with the given ID is found.
   *
   * @example
   * const updated = await WorkspaceManager.updateFromCurrentTabs('lxk3f9a1bc');
   * console.log(`Workspace now contains ${updated.urls.length} URLs`);
   */
  static async updateFromCurrentTabs(workspaceId: string): Promise<Workspace> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const urls: WorkspaceUrl[] = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://'))
      .map(t => ({ url: t.url!, title: t.title || '' }));

    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    workspace.urls = urls;
    workspace.updatedAt = Date.now();
    await chrome.storage.local.set({ workspaces });

    return workspace;
  }

  /**
   * @description Retrieves all saved workspaces from Chrome local storage.
   *
   * @returns {Promise<Workspace[]>} An array of all saved workspaces, ordered by most recent first.
   *
   * @example
   * const workspaces = await WorkspaceManager.list();
   * console.log(`Found ${workspaces.length} workspaces`);
   */
  static async list(): Promise<Workspace[]> {
    const data = await chrome.storage.local.get('workspaces');
    return (data.workspaces || []) as Workspace[];
  }

  /**
   * @description Permanently deletes a workspace from Chrome local storage.
   *
   * @param {string} workspaceId - The unique ID of the workspace to delete.
   * @returns {Promise<void>}
   *
   * @example
   * await WorkspaceManager.delete('lxk3f9a1bc');
   */
  static async delete(workspaceId: string): Promise<void> {
    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const filtered = workspaces.filter(w => w.id !== workspaceId);
    await chrome.storage.local.set({ workspaces: filtered });
  }

  /**
   * @description Renames an existing workspace and updates its `updatedAt` timestamp.
   * If no workspace matches the given ID, the operation is silently ignored.
   *
   * @param {string} workspaceId - The unique ID of the workspace to rename.
   * @param {string} newName - The new name to assign to the workspace.
   * @returns {Promise<void>}
   *
   * @example
   * await WorkspaceManager.rename('lxk3f9a1bc', 'Frontend Development');
   */
  static async rename(workspaceId: string, newName: string): Promise<void> {
    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      workspace.name = newName;
      workspace.updatedAt = Date.now();
      await chrome.storage.local.set({ workspaces });
    }
  }
}
