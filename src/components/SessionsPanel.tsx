/**
 * @module components/SessionsPanel
 * @description Sessions management panel component for Tab Manager Pro.
 * Allows users to save snapshots of all currently open browser windows and tabs,
 * view saved sessions with metadata (date, window/tab counts), restore sessions
 * to reopen all their tabs, and delete sessions they no longer need.
 */

import React, { useState, useEffect } from 'react';
import { Session } from '../utils/storage';

/**
 * @description Sessions panel component that provides a UI for saving, listing,
 * restoring, and deleting tab sessions.
 *
 * A session captures all open windows and their tabs at a given moment. Users can
 * name each session and later restore it to reopen all saved tabs.
 *
 * **State variables:**
 * - `sessions` - Array of saved {@link Session} objects loaded from storage.
 * - `sessionName` - Current value of the session name input field.
 * - `loading` - Whether a save or restore operation is in progress.
 * - `message` - Feedback message displayed to the user (auto-clears after 3 seconds).
 *
 * **Key handlers:**
 * - `loadSessions` - Fetches the list of saved sessions from the background script.
 * - `saveSession` - Captures the current tabs into a new named session.
 * - `restoreSession` - Reopens all tabs from a saved session.
 * - `deleteSession` - Removes a saved session from storage.
 *
 * @returns {React.JSX.Element} The rendered sessions panel UI.
 *
 * @example
 * // Used within the popup App component:
 * <SessionsPanel />
 */
export function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * @description Fetches the list of saved sessions from the background script
   * via the LIST_SESSIONS message type and updates local state.
   */
  const loadSessions = () => {
    chrome.runtime.sendMessage({ type: 'LIST_SESSIONS' }, (res) => {
      if (res?.success) setSessions(res.sessions);
    });
  };

  /** @description Loads sessions on component mount. */
  useEffect(() => { loadSessions(); }, []);

  /**
   * @description Saves the current browser tabs as a new named session.
   * Sends a SAVE_SESSION message to the background script with the trimmed session name.
   * On success, clears the input field, shows a confirmation message, and refreshes the list.
   */
  const saveSession = () => {
    if (!sessionName.trim()) return;
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'SAVE_SESSION', name: sessionName.trim() }, (res) => {
      setLoading(false);
      if (res?.success) {
        setSessionName('');
        showMessage('Session saved!');
        loadSessions();
      } else {
        showMessage('Error: ' + (res?.error || 'Unknown'));
      }
    });
  };

  /**
   * @description Restores a previously saved session by reopening all its tabs.
   * Sends a RESTORE_SESSION message to the background script.
   * @param {string} id - The unique identifier of the session to restore.
   */
  const restoreSession = (id: string) => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'RESTORE_SESSION', sessionId: id }, (res) => {
      setLoading(false);
      if (res?.success) {
        showMessage('Session restored!');
      } else {
        showMessage('Error: ' + (res?.error || 'Unknown'));
      }
    });
  };

  /**
   * @description Deletes a saved session from storage and refreshes the session list.
   * Sends a DELETE_SESSION message to the background script.
   * @param {string} id - The unique identifier of the session to delete.
   */
  const deleteSession = (id: string) => {
    chrome.runtime.sendMessage({ type: 'DELETE_SESSION', sessionId: id }, (res) => {
      if (res?.success) loadSessions();
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
   * @description Formats a Unix timestamp into a localized short date string
   * with day, month, hour, and minute.
   * @param {number} ts - The Unix timestamp in milliseconds.
   * @returns {string} The formatted date string (e.g., "03/31, 02:30 PM").
   */
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Save */}
      <div className="mb-3">
        <div className="flex gap-1">
          <input
            type="text"
            className="flex-1 border p-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Session name..."
            onKeyDown={(e) => e.key === 'Enter' && saveSession()}
          />
          <button
            onClick={saveSession}
            disabled={loading || !sessionName.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:bg-gray-300 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* List */}
      {sessions.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">&#x1F4BE;</div>
          <p className="text-xs text-gray-400">No saved sessions</p>
          <p className="text-xs text-gray-300 mt-1">Save your tabs to restore them later</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {sessions.map(s => (
            <div key={s.id} className="bg-gray-50 rounded p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 truncate flex-1">{s.name}</span>
                <span className="text-gray-400 ml-2 whitespace-nowrap">{formatDate(s.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  {s.windowCount} win. / {s.tabCount} tabs
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => restoreSession(s.id)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
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
