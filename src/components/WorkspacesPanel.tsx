/**
 * @module components/WorkspacesPanel
 * @description Workspaces management panel component for Tab Manager Pro.
 * Allows users to create named, color-coded workspaces from their currently open tabs,
 * reopen workspaces to restore a set of URLs, update workspaces with new tabs,
 * and delete workspaces they no longer need.
 */

import React, { useState, useEffect } from 'react';
import { Workspace, WORKSPACE_COLORS } from '../utils/storage';

/**
 * @description Workspaces panel component that provides a UI for creating, listing,
 * opening, updating, and deleting workspaces.
 *
 * A workspace is a named, color-coded collection of URLs captured from the user's
 * currently open tabs. Workspaces can be reopened later to restore those URLs.
 *
 * **State variables:**
 * - `workspaces` - Array of saved {@link Workspace} objects loaded from storage.
 * - `wsName` - Current value of the workspace name input field.
 * - `wsColor` - Currently selected color for the new workspace.
 * - `loading` - Whether an async operation (create/open) is in progress.
 * - `message` - Feedback message displayed to the user (auto-clears after 3 seconds).
 *
 * **Key handlers:**
 * - `loadWorkspaces` - Fetches the list of saved workspaces from the background script.
 * - `createWorkspace` - Creates a new workspace from the current tabs.
 * - `openWorkspace` - Opens all URLs in a saved workspace.
 * - `updateWorkspace` - Updates a workspace's URLs with the currently open tabs.
 * - `deleteWorkspace` - Removes a workspace from storage.
 *
 * @returns {React.JSX.Element} The rendered workspaces panel UI.
 *
 * @example
 * // Used within the popup App component:
 * <WorkspacesPanel />
 */
export function WorkspacesPanel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsName, setWsName] = useState('');
  const [wsColor, setWsColor] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * @description Fetches the list of saved workspaces from the background script
   * via the LIST_WORKSPACES message type and updates local state.
   */
  const loadWorkspaces = () => {
    chrome.runtime.sendMessage({ type: 'LIST_WORKSPACES' }, (res) => {
      if (res?.success) setWorkspaces(res.workspaces);
    });
  };

  /** @description Loads workspaces on component mount. */
  useEffect(() => { loadWorkspaces(); }, []);

  /**
   * @description Creates a new workspace from the currently open tabs.
   * Sends a CREATE_WORKSPACE message to the background script with the name and color.
   * On success, clears the input, shows a confirmation message, and refreshes the list.
   */
  const createWorkspace = () => {
    if (!wsName.trim()) return;
    setLoading(true);
    chrome.runtime.sendMessage(
      { type: 'CREATE_WORKSPACE', name: wsName.trim(), color: wsColor },
      (res) => {
        setLoading(false);
        if (res?.success) {
          setWsName('');
          showMessage(`Workspace "${res.workspace.name}" created (${res.workspace.urls.length} URLs)`);
          loadWorkspaces();
        } else {
          showMessage('Error: ' + (res?.error || 'Unknown'));
        }
      }
    );
  };

  /**
   * @description Opens all URLs from a saved workspace in the browser.
   * Sends an OPEN_WORKSPACE message to the background script.
   * @param {string} id - The unique identifier of the workspace to open.
   */
  const openWorkspace = (id: string) => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'OPEN_WORKSPACE', workspaceId: id }, (res) => {
      setLoading(false);
      if (res?.success) {
        showMessage('Workspace opened!');
      } else {
        showMessage('Error: ' + (res?.error || 'Unknown'));
      }
    });
  };

  /**
   * @description Updates an existing workspace's URLs with the currently open tabs.
   * Sends an UPDATE_WORKSPACE message to the background script.
   * @param {string} id - The unique identifier of the workspace to update.
   */
  const updateWorkspace = (id: string) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_WORKSPACE', workspaceId: id }, (res) => {
      if (res?.success) {
        showMessage('Workspace updated!');
        loadWorkspaces();
      }
    });
  };

  /**
   * @description Deletes a workspace from storage and refreshes the workspace list.
   * Sends a DELETE_WORKSPACE message to the background script.
   * @param {string} id - The unique identifier of the workspace to delete.
   */
  const deleteWorkspace = (id: string) => {
    chrome.runtime.sendMessage({ type: 'DELETE_WORKSPACE', workspaceId: id }, (res) => {
      if (res?.success) loadWorkspaces();
    });
  };

  /**
   * @description Displays a temporary feedback message that auto-clears after 3 seconds.
   * @param {string} msg - The message to display.
   */
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  /**
   * @description Maps a workspace color name to its corresponding Tailwind CSS background class.
   * @param {string} color - The color name (e.g., "blue", "red", "green").
   * @returns {string} The Tailwind CSS class for the color dot (e.g., "bg-blue-500").
   */
  const colorDot = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
      yellow: 'bg-yellow-500', purple: 'bg-purple-500', pink: 'bg-pink-500',
      cyan: 'bg-cyan-500', orange: 'bg-orange-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div>
      {/* Create */}
      <div className="mb-3">
        <div className="flex gap-1 mb-1.5">
          <input
            type="text"
            className="flex-1 border p-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            placeholder="Workspace name..."
            onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
          />
          <button
            onClick={createWorkspace}
            disabled={loading || !wsName.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:bg-gray-300 transition-colors"
          >
            Create
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {WORKSPACE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setWsColor(c.value)}
              className={`w-5 h-5 rounded-full ${colorDot(c.value)} transition-all ${
                wsColor === c.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* List */}
      {workspaces.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">&#x1F4C1;</div>
          <p className="text-xs text-gray-400">No workspaces</p>
          <p className="text-xs text-gray-300 mt-1">Create a workspace from your current tabs</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {workspaces.map(w => (
            <div key={w.id} className="bg-gray-50 rounded p-2 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${colorDot(w.color)} flex-shrink-0`} />
                <span className="font-semibold text-gray-800 truncate flex-1">{w.name}</span>
                <span className="text-gray-400">{w.urls.length} URLs</span>
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => openWorkspace(w.id)}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  Open
                </button>
                <button
                  onClick={() => updateWorkspace(w.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Update
                </button>
                <button
                  onClick={() => deleteWorkspace(w.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-xs text-center font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
