/**
 * @module storage/sessions
 * @description Provides session management for Tab Manager Pro.
 * A session is a complete snapshot of all browser windows, tabs, and tab groups
 * at a given point in time. This module handles capturing, restoring, listing,
 * deleting, and renaming sessions persisted in Chrome local storage.
 */

import { Session, SavedWindow, SavedTab, SavedTabGroup } from './types';
import { groupTabs } from '../browser';

/**
 * @description Checks whether a given URL can be restored by the extension.
 * Browser-internal pages (chrome://, about:, edge://, moz-extension://, chrome-extension://)
 * cannot be opened programmatically and are therefore excluded.
 *
 * @param {string} url - The URL to check.
 * @returns {boolean} `true` if the URL can be opened via `chrome.tabs.create`, `false` otherwise.
 *
 * @example
 * isRestorableUrl('https://example.com');    // true
 * isRestorableUrl('chrome://settings');       // false
 * isRestorableUrl('');                        // false
 */
function isRestorableUrl(url: string): boolean {
  if (!url) return false;
  return !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://') &&
    !url.startsWith('moz-extension://');
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
 * @description Manages browser sessions — capturing, restoring, listing, deleting, and renaming.
 * All methods are static and interact directly with Chrome local storage.
 *
 * @class SessionManager
 *
 * @example
 * // Capture the current session
 * const session = await SessionManager.captureCurrentSession('My Work Session');
 *
 * // List all sessions
 * const sessions = await SessionManager.listSessions();
 *
 * // Restore a session
 * await SessionManager.restoreSession(session.id);
 */
export class SessionManager {
  /**
   * @description Captures the current browser state (all normal windows, their tabs, and tab groups)
   * and saves it as a new session in Chrome local storage. The new session is prepended
   * to the sessions list so it appears first.
   *
   * @param {string} name - A descriptive name for the session.
   * @returns {Promise<Session>} The newly created and persisted session object.
   *
   * @example
   * const session = await SessionManager.captureCurrentSession('Friday afternoon');
   * console.log(`Captured ${session.tabCount} tabs across ${session.windowCount} windows`);
   */
  static async captureCurrentSession(name: string): Promise<Session> {
    const windows = await chrome.windows.getAll({ populate: true });
    const savedWindows: SavedWindow[] = [];

    for (const win of windows) {
      if (win.type !== 'normal' || !win.tabs) continue;

      // Get groups for this window
      const groupIds = new Set(
        win.tabs.filter(t => t.groupId && t.groupId !== -1).map(t => t.groupId)
      );
      const groups: SavedTabGroup[] = [];
      for (const gid of groupIds) {
        try {
          const group = await chrome.tabGroups.get(gid);
          groups.push({
            id: group.id,
            title: group.title || '',
            color: group.color,
            collapsed: group.collapsed,
          });
        } catch {
          // Group not found, skip
        }
      }

      const tabs: SavedTab[] = win.tabs.map(t => ({
        url: t.url || '',
        title: t.title || '',
        pinned: t.pinned || false,
        groupId: t.groupId !== -1 ? t.groupId : undefined,
        favIconUrl: t.favIconUrl,
      }));

      savedWindows.push({
        tabs,
        groups,
        focused: win.focused || false,
        state: win.state,
      });
    }

    const tabCount = savedWindows.reduce((sum, w) => sum + w.tabs.length, 0);

    const session: Session = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      windows: savedWindows,
      tabCount,
      windowCount: savedWindows.length,
    };

    // Save
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    sessions.unshift(session);
    await chrome.storage.local.set({ sessions });

    return session;
  }

  /**
   * @description Restores a previously saved session by opening new browser windows and tabs
   * to match the session's state. Tabs with non-restorable URLs are skipped.
   * Tab groups are recreated with their original titles and colors.
   *
   * @param {string} sessionId - The unique ID of the session to restore.
   * @returns {Promise<void>}
   * @throws {Error} Throws if no session with the given ID is found in storage.
   *
   * @example
   * try {
   *   await SessionManager.restoreSession('lxk3f9a1bc');
   * } catch (err) {
   *   console.error('Failed to restore session:', err.message);
   * }
   */
  static async restoreSession(sessionId: string): Promise<void> {
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    for (const savedWin of session.windows) {
      // Filter non-restorable tabs
      const restorableTabs = savedWin.tabs.filter(t => isRestorableUrl(t.url));
      if (restorableTabs.length === 0) continue;

      // Create window with the first tab
      const firstUrl = restorableTabs[0].url;
      const win = await chrome.windows.create({
        url: firstUrl,
        focused: true,
      });
      if (!win?.id) continue;

      const winId = win.id;
      const createdTabIds: number[] = [];
      if (win.tabs?.[0]?.id) createdTabIds.push(win.tabs[0].id);

      for (let i = 1; i < restorableTabs.length; i++) {
        const st = restorableTabs[i];
        try {
          const tab = await chrome.tabs.create({
            windowId: winId,
            url: st.url,
            pinned: st.pinned,
          });
          if (tab.id) createdTabIds.push(tab.id);
        } catch {
          // Skip tabs that cannot be opened
          createdTabIds.push(0);
        }
      }

      // Pin the first tab if needed
      if (savedWin.tabs[0].pinned && win.tabs?.[0]?.id) {
        await chrome.tabs.update(win.tabs[0].id, { pinned: true });
      }

      // Recreate groups
      for (const savedGroup of savedWin.groups) {
        const memberIndices = savedWin.tabs
          .map((t, idx) => (t.groupId === savedGroup.id ? idx : -1))
          .filter(idx => idx !== -1);

        const memberTabIds = memberIndices
          .map(idx => createdTabIds[idx])
          .filter((id): id is number => id !== undefined);

        if (memberTabIds.length > 0) {
          await groupTabs({
            tabIds: memberTabIds,
            title: savedGroup.title,
            color: savedGroup.color,
            windowId: winId,
          });
        }
      }
    }
  }

  /**
   * @description Retrieves all saved sessions from Chrome local storage.
   *
   * @returns {Promise<Session[]>} An array of all saved sessions, ordered by most recent first.
   *
   * @example
   * const sessions = await SessionManager.listSessions();
   * console.log(`Found ${sessions.length} saved sessions`);
   */
  static async listSessions(): Promise<Session[]> {
    const data = await chrome.storage.local.get('sessions');
    return (data.sessions || []) as Session[];
  }

  /**
   * @description Permanently deletes a session from Chrome local storage.
   *
   * @param {string} sessionId - The unique ID of the session to delete.
   * @returns {Promise<void>}
   *
   * @example
   * await SessionManager.deleteSession('lxk3f9a1bc');
   */
  static async deleteSession(sessionId: string): Promise<void> {
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    const filtered = sessions.filter(s => s.id !== sessionId);
    await chrome.storage.local.set({ sessions: filtered });
  }

  /**
   * @description Renames an existing session. If no session matches the given ID,
   * the operation is silently ignored.
   *
   * @param {string} sessionId - The unique ID of the session to rename.
   * @param {string} newName - The new name to assign to the session.
   * @returns {Promise<void>}
   *
   * @example
   * await SessionManager.renameSession('lxk3f9a1bc', 'Monday morning tabs');
   */
  static async renameSession(sessionId: string, newName: string): Promise<void> {
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.name = newName;
      await chrome.storage.local.set({ sessions });
    }
  }
}
