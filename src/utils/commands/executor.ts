/**
 * @module executor
 * @description Command executor for Tab Manager Pro.
 * Receives a parsed intent and dispatches it to the appropriate handler function
 * that interacts with the Chrome tabs/runtime API, session manager, or workspace manager.
 */

import { ParsedIntent, CommandResult } from './types';
import { SessionManager } from '../storage/sessions';
import { WorkspaceManager } from '../storage/workspaces';

/**
 * @description Executes a command based on the given parsed intent. Dispatches to the
 * appropriate internal handler depending on the intent type.
 *
 * @param {ParsedIntent} intent - The parsed intent containing the command type and parameters.
 * @returns {Promise<CommandResult>} The result of the command execution, including success status and a message.
 *
 * @example
 * ```ts
 * const result = await executeCommand({
 *   type: 'close_duplicates',
 *   params: {},
 *   originalText: 'close duplicates',
 * });
 * // => { success: true, message: '3 duplicate(s) closed.' }
 * ```
 */
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
      return { success: false, message: 'Unrecognized command' };
  }
}

/**
 * @description Finds and closes duplicate tabs in the current window.
 * Duplicates are identified by comparing URLs (with trailing slashes stripped).
 * The first occurrence of each URL is kept; subsequent duplicates are closed.
 *
 * @returns {Promise<CommandResult>} Result indicating how many duplicates were closed,
 * or that no duplicates were found.
 */
async function closeDuplicates(): Promise<CommandResult> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const seen = new Map<string, number>();
  const toClose: number[] = [];

  for (const tab of tabs) {
    if (!tab.url || !tab.id) continue;
    const url = tab.url.replace(/\/$/, '');
    if (seen.has(url)) {
      toClose.push(tab.id);
    } else {
      seen.set(url, tab.id);
    }
  }

  if (toClose.length === 0) {
    return { success: true, message: 'No duplicates found.' };
  }

  await chrome.tabs.remove(toClose);
  return { success: true, message: `${toClose.length} duplicate(s) closed.` };
}

/**
 * @description Sorts all tabs in the current window alphabetically by their hostname.
 * Tabs are physically reordered using the Chrome tabs API.
 *
 * @returns {Promise<CommandResult>} Result indicating how many tabs were sorted.
 */
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

  return { success: true, message: `${sorted.length} tabs sorted by domain.` };
}

/**
 * @description Closes all inactive (non-active, non-pinned) tabs in the current window.
 *
 * @returns {Promise<CommandResult>} Result indicating how many inactive tabs were closed,
 * or that there were none to close.
 */
async function closeInactiveTabs(): Promise<CommandResult> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const toClose = tabs.filter(t => !t.active && !t.pinned && t.id);

  if (toClose.length === 0) {
    return { success: true, message: 'No inactive tabs to close.' };
  }

  await chrome.tabs.remove(toClose.map(t => t.id!));
  return { success: true, message: `${toClose.length} inactive tab(s) closed.` };
}

/**
 * @description Triggers AI-based tab grouping by sending a message to the background
 * script. The background script performs the actual grouping logic.
 *
 * @returns {Promise<CommandResult>} Result indicating how many groups were created,
 * or an error message if grouping failed.
 */
async function groupTabs(): Promise<CommandResult> {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'AUTO_GROUP_TABS' }, (response) => {
      if (response?.success) {
        resolve({ success: true, message: `${response.count} group(s) created by AI.` });
      } else {
        resolve({ success: false, message: response?.error || 'Error during grouping.' });
      }
    });
  });
}

/**
 * @description Closes all tabs whose title or URL contains the given query string
 * (case-insensitive match).
 *
 * @param {string} query - The search query to match against tab titles and URLs.
 * @returns {Promise<CommandResult>} Result indicating how many tabs were closed,
 * or a failure message if no query was provided or no tabs matched.
 */
async function closeTabByQuery(query: string): Promise<CommandResult> {
  if (!query) return { success: false, message: 'Which tab should I close?' };

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const q = query.toLowerCase();
  const matches = tabs.filter(t =>
    t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    return { success: false, message: `No tab matching "${query}".` };
  }

  await chrome.tabs.remove(matches.map(t => t.id!).filter(Boolean));
  return { success: true, message: `${matches.length} tab(s) closed.` };
}

/**
 * @description Saves the current window's tabs as a named session using the SessionManager.
 * If no name is provided, a default name with the current date is generated.
 *
 * @param {string} [name] - Optional session name. Defaults to "Session {current date}".
 * @returns {Promise<CommandResult>} Result with the saved session name and tab count.
 */
async function saveSession(name?: string): Promise<CommandResult> {
  const sessionName = name || `Session ${new Date().toLocaleDateString('en-US')}`;
  const session = await SessionManager.captureCurrentSession(sessionName);
  return {
    success: true,
    message: `Session "${session.name}" saved (${session.tabCount} tabs).`,
  };
}

/**
 * @description Restores a previously saved session by name. If no name is provided,
 * the most recent session is restored. Session lookup is case-insensitive and
 * uses substring matching.
 *
 * @param {string} [name] - Optional session name to search for. If omitted, the first (most recent) session is used.
 * @returns {Promise<CommandResult>} Result indicating the restored session name,
 * or a failure message if no sessions exist or the named session was not found.
 */
async function restoreSession(name?: string): Promise<CommandResult> {
  const sessions = await SessionManager.listSessions();
  if (sessions.length === 0) {
    return { success: false, message: 'No saved sessions.' };
  }

  let session;
  if (name) {
    const q = name.toLowerCase();
    session = sessions.find(s => s.name.toLowerCase().includes(q));
    if (!session) return { success: false, message: `Session "${name}" not found.` };
  } else {
    session = sessions[0];
  }

  await SessionManager.restoreSession(session.id);
  return { success: true, message: `Session "${session.name}" restored.` };
}

/**
 * @description Creates a new workspace from the current window's tabs.
 * If no name is provided, a default name with the current date is generated.
 *
 * @param {string} [name] - Optional workspace name. Defaults to "Workspace {current date}".
 * @returns {Promise<CommandResult>} Result with the created workspace name and URL count.
 */
async function createWorkspace(name?: string): Promise<CommandResult> {
  const wsName = name || `Workspace ${new Date().toLocaleDateString('en-US')}`;
  const workspace = await WorkspaceManager.createFromCurrentTabs(wsName, 'blue');
  return {
    success: true,
    message: `Workspace "${workspace.name}" created with ${workspace.urls.length} URLs.`,
  };
}

/**
 * @description Opens an existing workspace by name. If no name is provided,
 * the first workspace in the list is opened. Workspace lookup is case-insensitive
 * and uses substring matching.
 *
 * @param {string} [name] - Optional workspace name to search for. If omitted, the first workspace is used.
 * @returns {Promise<CommandResult>} Result indicating the opened workspace name,
 * or a failure message if no workspaces exist or the named workspace was not found.
 */
async function openWorkspace(name?: string): Promise<CommandResult> {
  const workspaces = await WorkspaceManager.list();
  if (workspaces.length === 0) {
    return { success: false, message: 'No saved workspaces.' };
  }

  let workspace;
  if (name) {
    const q = name.toLowerCase();
    workspace = workspaces.find(w => w.name.toLowerCase().includes(q));
    if (!workspace) return { success: false, message: `Workspace "${name}" not found.` };
  } else {
    workspace = workspaces[0];
  }

  await WorkspaceManager.open(workspace.id);
  return { success: true, message: `Workspace "${workspace.name}" opened.` };
}

/**
 * @description Searches for tabs in the current window whose title or URL contains
 * the given query string (case-insensitive). Returns a formatted list of matches
 * along with structured data.
 *
 * @param {string} query - The search query to match against tab titles and URLs.
 * @returns {Promise<CommandResult>} Result containing the number of matches and a formatted list,
 * with a `data` array of matching tab objects (id, title, url). Returns a failure
 * message if no query was provided.
 */
async function searchTabs(query: string): Promise<CommandResult> {
  if (!query) return { success: false, message: 'What are you looking for?' };

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const q = query.toLowerCase();
  const matches = tabs.filter(t =>
    t.title?.toLowerCase().includes(q) || t.url?.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    return { success: true, message: `No tab matching "${query}".` };
  }

  const list = matches.map(t => `- ${t.title}`).join('\n');
  return {
    success: true,
    message: `${matches.length} tab(s) found:\n${list}`,
    data: matches.map(t => ({ id: t.id, title: t.title, url: t.url })),
  };
}
