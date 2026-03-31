import { Session, SavedWindow, SavedTab, SavedTabGroup } from './types';
import { groupTabs } from '../browser';

function isRestorableUrl(url: string): boolean {
  if (!url) return false;
  return !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://') &&
    !url.startsWith('moz-extension://');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class SessionManager {
  /** Capture la session courante (toutes les fenetres) */
  static async captureCurrentSession(name: string): Promise<Session> {
    const windows = await chrome.windows.getAll({ populate: true });
    const savedWindows: SavedWindow[] = [];

    for (const win of windows) {
      if (win.type !== 'normal' || !win.tabs) continue;

      // Recuperer les groupes de cette fenetre
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
          // Groupe introuvable, on ignore
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

    // Sauvegarder
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    sessions.unshift(session);
    await chrome.storage.local.set({ sessions });

    return session;
  }

  /** Restaure une session (ouvre les fenetres et onglets) */
  static async restoreSession(sessionId: string): Promise<void> {
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    const session = sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session introuvable');

    for (const savedWin of session.windows) {
      // Filtrer les onglets non restaurables
      const restorableTabs = savedWin.tabs.filter(t => isRestorableUrl(t.url));
      if (restorableTabs.length === 0) continue;

      // Creer la fenetre avec le premier onglet
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
          // Ignorer les onglets qui ne peuvent pas etre ouverts
          createdTabIds.push(0);
        }
      }

      // Pinner le premier onglet si necessaire
      if (savedWin.tabs[0].pinned && win.tabs?.[0]?.id) {
        await chrome.tabs.update(win.tabs[0].id, { pinned: true });
      }

      // Recreer les groupes
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

  /** Liste toutes les sessions sauvegardees */
  static async listSessions(): Promise<Session[]> {
    const data = await chrome.storage.local.get('sessions');
    return (data.sessions || []) as Session[];
  }

  /** Supprime une session */
  static async deleteSession(sessionId: string): Promise<void> {
    const data = await chrome.storage.local.get('sessions');
    const sessions = (data.sessions || []) as Session[];
    const filtered = sessions.filter(s => s.id !== sessionId);
    await chrome.storage.local.set({ sessions: filtered });
  }

  /** Renomme une session */
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
