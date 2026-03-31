import { ParsedIntent, CommandResult } from './types';
import { SessionManager } from '../storage/sessions';
import { WorkspaceManager } from '../storage/workspaces';

export async function executeCommand(intent: ParsedIntent): Promise<CommandResult> {
  switch (intent.type) {
    case 'close_duplicates':
      return closeDuplicates();
    case 'sort_tabs':
      return sortTabs();
    case 'close_inactive':
      return closeInactiveTabs();
    case 'group_tabs':
      return groupTabs();
    case 'close_tab':
      return closeTabByQuery(intent.params.query || '');
    case 'save_session':
      return saveSession(intent.params.name);
    case 'restore_session':
      return restoreSession(intent.params.name);
    case 'create_workspace':
      return createWorkspace(intent.params.name);
    case 'open_workspace':
      return openWorkspace(intent.params.name);
    case 'search_tabs':
      return searchTabs(intent.params.query || '');
    default:
      return { success: false, message: 'Commande non reconnue' };
  }
}

async function closeDuplicates(): Promise<CommandResult> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const seen = new Map<string, number>();
  const toClose: number[] = [];

  for (const tab of tabs) {
    if (!tab.url || !tab.id) continue;
    const url = tab.url.replace(/\/$/, ''); // normaliser trailing slash
    if (seen.has(url)) {
      toClose.push(tab.id);
    } else {
      seen.set(url, tab.id);
    }
  }

  if (toClose.length === 0) {
    return { success: true, message: 'Aucun doublon trouve.' };
  }

  await chrome.tabs.remove(toClose);
  return { success: true, message: `${toClose.length} doublon(s) ferme(s).` };
}

async function sortTabs(): Promise<CommandResult> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const sorted = [...tabs].sort((a, b) => {
    const domainA = new URL(a.url || '').hostname;
    const domainB = new URL(b.url || '').hostname;
    return domainA.localeCompare(domainB);
  });

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].id) {
      await chrome.tabs.move(sorted[i].id!, { index: i });
    }
  }

  return { success: true, message: `${sorted.length} onglets tries par domaine.` };
}

async function closeInactiveTabs(): Promise<CommandResult> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const toClose = tabs.filter(t => !t.active && !t.pinned && t.id);

  if (toClose.length === 0) {
    return { success: true, message: 'Aucun onglet inactif a fermer.' };
  }

  await chrome.tabs.remove(toClose.map(t => t.id!));
  return { success: true, message: `${toClose.length} onglet(s) inactif(s) ferme(s).` };
}

async function groupTabs(): Promise<CommandResult> {
  // Declencher le groupement IA via message au background
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'AUTO_GROUP_TABS' }, (response) => {
      if (response?.success) {
        resolve({ success: true, message: `${response.count} groupe(s) cree(s) par l'IA.` });
      } else {
        resolve({ success: false, message: response?.error || 'Erreur lors du groupement.' });
      }
    });
  });
}

async function closeTabByQuery(query: string): Promise<CommandResult> {
  if (!query) return { success: false, message: 'Quel onglet fermer ?' };

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const q = query.toLowerCase();
  const matches = tabs.filter(t =>
    t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    return { success: false, message: `Aucun onglet correspondant a "${query}".` };
  }

  await chrome.tabs.remove(matches.map(t => t.id!).filter(Boolean));
  return { success: true, message: `${matches.length} onglet(s) ferme(s).` };
}

async function saveSession(name?: string): Promise<CommandResult> {
  const sessionName = name || `Session ${new Date().toLocaleDateString('fr-FR')}`;
  const session = await SessionManager.captureCurrentSession(sessionName);
  return {
    success: true,
    message: `Session "${session.name}" sauvegardee (${session.tabCount} onglets).`,
  };
}

async function restoreSession(name?: string): Promise<CommandResult> {
  const sessions = await SessionManager.listSessions();
  if (sessions.length === 0) {
    return { success: false, message: 'Aucune session sauvegardee.' };
  }

  let session;
  if (name) {
    const q = name.toLowerCase();
    session = sessions.find(s => s.name.toLowerCase().includes(q));
    if (!session) return { success: false, message: `Session "${name}" introuvable.` };
  } else {
    session = sessions[0]; // la plus recente
  }

  await SessionManager.restoreSession(session.id);
  return { success: true, message: `Session "${session.name}" restauree.` };
}

async function createWorkspace(name?: string): Promise<CommandResult> {
  const wsName = name || `Workspace ${new Date().toLocaleDateString('fr-FR')}`;
  const workspace = await WorkspaceManager.createFromCurrentTabs(wsName, 'blue');
  return {
    success: true,
    message: `Workspace "${workspace.name}" cree avec ${workspace.urls.length} URLs.`,
  };
}

async function openWorkspace(name?: string): Promise<CommandResult> {
  const workspaces = await WorkspaceManager.list();
  if (workspaces.length === 0) {
    return { success: false, message: 'Aucun workspace sauvegarde.' };
  }

  let workspace;
  if (name) {
    const q = name.toLowerCase();
    workspace = workspaces.find(w => w.name.toLowerCase().includes(q));
    if (!workspace) return { success: false, message: `Workspace "${name}" introuvable.` };
  } else {
    workspace = workspaces[0];
  }

  await WorkspaceManager.open(workspace.id);
  return { success: true, message: `Workspace "${workspace.name}" ouvert.` };
}

async function searchTabs(query: string): Promise<CommandResult> {
  if (!query) return { success: false, message: 'Que cherchez-vous ?' };

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const q = query.toLowerCase();
  const matches = tabs.filter(t =>
    t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    return { success: true, message: `Aucun onglet correspondant a "${query}".` };
  }

  const list = matches.map(t => `- ${t.title}`).join('\n');
  return {
    success: true,
    message: `${matches.length} onglet(s) trouve(s) :\n${list}`,
    data: matches.map(t => ({ id: t.id, title: t.title, url: t.url })),
  };
}
