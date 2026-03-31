/**
 * @module storage/types
 * @description Core type definitions and constants for the Tab Manager Pro storage layer.
 * Defines the data structures used to persist sessions, workspaces, and their
 * constituent parts (tabs, tab groups, windows) in Chrome local storage.
 */

/**
 * @description Current data schema version used to determine whether storage migration is needed.
 * Incremented each time the storage schema changes in a backward-incompatible way.
 * @constant {number}
 * @example
 * if (data.schemaVersion < CURRENT_SCHEMA_VERSION) {
 *   // Run migrations
 * }
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * @description Represents a single tab saved within a session.
 * Contains only the data necessary to restore the tab later.
 *
 * @interface SavedTab
 * @property {string} url - The full URL of the tab.
 * @property {string} title - The page title of the tab.
 * @property {boolean} pinned - Whether the tab was pinned in the browser.
 * @property {number} [groupId] - The Chrome tab group ID, if the tab belonged to a group.
 *   Omitted (undefined) when the tab is not in any group.
 * @property {string} [favIconUrl] - The URL of the tab's favicon, if available.
 */
export interface SavedTab {
  url: string;
  title: string;
  pinned: boolean;
  groupId?: number;
  favIconUrl?: string;
}

/**
 * @description Represents a saved Chrome tab group within a session window.
 *
 * @interface SavedTabGroup
 * @property {number} id - The original Chrome tab group ID (used to match tabs to groups during restore).
 * @property {string} title - The display title of the tab group.
 * @property {string} color - The color of the tab group (e.g. 'blue', 'red', 'grey').
 * @property {boolean} collapsed - Whether the group was collapsed when saved.
 */
export interface SavedTabGroup {
  id: number;
  title: string;
  color: string;
  collapsed: boolean;
}

/**
 * @description Represents a saved browser window within a session, including its tabs and groups.
 *
 * @interface SavedWindow
 * @property {SavedTab[]} tabs - The list of tabs that were open in this window.
 * @property {SavedTabGroup[]} groups - The tab groups present in this window.
 * @property {boolean} focused - Whether this window was the focused window at capture time.
 * @property {string} [state] - The window state: 'normal', 'minimized', 'maximized', or 'fullscreen'.
 */
export interface SavedWindow {
  tabs: SavedTab[];
  groups: SavedTabGroup[];
  focused: boolean;
  state?: string; // 'normal' | 'minimized' | 'maximized' | 'fullscreen'
}

/**
 * @description Represents a complete saved session — a snapshot of all browser windows at a point in time.
 *
 * @interface Session
 * @property {string} id - Unique identifier for the session (base-36 timestamp + random suffix).
 * @property {string} name - User-provided display name for the session.
 * @property {number} createdAt - Unix timestamp (milliseconds) of when the session was captured.
 * @property {SavedWindow[]} windows - The list of saved windows in this session.
 * @property {number} tabCount - Total number of tabs across all windows.
 * @property {number} windowCount - Total number of windows in this session.
 */
export interface Session {
  id: string;
  name: string;
  createdAt: number;
  windows: SavedWindow[];
  tabCount: number;
  windowCount: number;
}

/**
 * @description Represents a thematic workspace — a named collection of URLs that can be opened together.
 *
 * @interface Workspace
 * @property {string} id - Unique identifier for the workspace (base-36 timestamp + random suffix).
 * @property {string} name - User-provided display name for the workspace.
 * @property {string} color - The color associated with this workspace (used for the tab group when opened).
 * @property {number} createdAt - Unix timestamp (milliseconds) of when the workspace was created.
 * @property {number} updatedAt - Unix timestamp (milliseconds) of the last update.
 * @property {WorkspaceUrl[]} urls - The list of URLs belonging to this workspace.
 */
export interface Workspace {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  urls: WorkspaceUrl[];
}

/**
 * @description Represents a single URL entry within a workspace.
 *
 * @interface WorkspaceUrl
 * @property {string} url - The full URL.
 * @property {string} title - The page title associated with the URL.
 */
export interface WorkspaceUrl {
  url: string;
  title: string;
}

/**
 * @description The complete shape of data stored in Chrome local storage by Tab Manager Pro.
 * Includes versioning for migration support and allows additional arbitrary keys.
 *
 * @interface StorageSchema
 * @property {number} schemaVersion - The schema version of the stored data.
 * @property {Session[]} sessions - All saved sessions.
 * @property {Workspace[]} workspaces - All saved workspaces.
 */
export interface StorageSchema {
  schemaVersion: number;
  sessions: Session[];
  workspaces: Workspace[];
  [key: string]: any;
}

/**
 * @description Available color options for workspaces.
 * Each entry provides a machine-readable value and a human-readable label.
 * Defined as a readonly tuple for type safety.
 *
 * @constant
 * @example
 * // Iterate over workspace colors to build a color picker
 * WORKSPACE_COLORS.forEach(({ value, label }) => {
 *   console.log(`${label}: ${value}`);
 * });
 */
export const WORKSPACE_COLORS = [
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'orange', label: 'Orange' },
] as const;
