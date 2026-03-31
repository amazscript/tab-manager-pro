import { Workspace, WorkspaceUrl } from './types';
import { groupTabs } from '../browser';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class WorkspaceManager {
  /** Cree un workspace a partir des onglets actuels */
  static async createFromCurrentTabs(name: string, color: string): Promise<Workspace> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const urls: WorkspaceUrl[] = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://'))
      .map(t => ({ url: t.url!, title: t.title || '' }));

    return WorkspaceManager.create(name, color, urls);
  }

  /** Cree un workspace avec des URLs specifiques */
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

  /** Ouvre un workspace dans une nouvelle fenetre */
  static async open(workspaceId: string): Promise<void> {
    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) throw new Error('Workspace introuvable');

    if (workspace.urls.length === 0) throw new Error('Workspace vide');

    // Ouvrir dans une nouvelle fenetre
    const win = await chrome.windows.create({
      url: workspace.urls[0].url,
      focused: true,
    });

    if (!win?.id) return;

    const winId = win.id;

    // Ouvrir les onglets restants
    for (let i = 1; i < workspace.urls.length; i++) {
      await chrome.tabs.create({
        windowId: winId,
        url: workspace.urls[i].url,
      });
    }

    // Grouper tous les onglets et nommer le groupe
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

  /** Met a jour un workspace avec les onglets actuels */
  static async updateFromCurrentTabs(workspaceId: string): Promise<Workspace> {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const urls: WorkspaceUrl[] = tabs
      .filter(t => t.url && !t.url.startsWith('chrome://'))
      .map(t => ({ url: t.url!, title: t.title || '' }));

    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) throw new Error('Workspace introuvable');

    workspace.urls = urls;
    workspace.updatedAt = Date.now();
    await chrome.storage.local.set({ workspaces });

    return workspace;
  }

  /** Liste tous les workspaces */
  static async list(): Promise<Workspace[]> {
    const data = await chrome.storage.local.get('workspaces');
    return (data.workspaces || []) as Workspace[];
  }

  /** Supprime un workspace */
  static async delete(workspaceId: string): Promise<void> {
    const data = await chrome.storage.local.get('workspaces');
    const workspaces = (data.workspaces || []) as Workspace[];
    const filtered = workspaces.filter(w => w.id !== workspaceId);
    await chrome.storage.local.set({ workspaces: filtered });
  }

  /** Renomme un workspace */
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
