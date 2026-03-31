/** Version actuelle du schema de donnees */
export const CURRENT_SCHEMA_VERSION = 1;

/** Un onglet sauvegarde dans une session */
export interface SavedTab {
  url: string;
  title: string;
  pinned: boolean;
  groupId?: number;
  favIconUrl?: string;
}

/** Un groupe d'onglets sauvegarde */
export interface SavedTabGroup {
  id: number;
  title: string;
  color: string;
  collapsed: boolean;
}

/** Une fenetre sauvegardee */
export interface SavedWindow {
  tabs: SavedTab[];
  groups: SavedTabGroup[];
  focused: boolean;
  state?: string; // 'normal' | 'minimized' | 'maximized' | 'fullscreen'
}

/** Une session complete */
export interface Session {
  id: string;
  name: string;
  createdAt: number;
  windows: SavedWindow[];
  tabCount: number;
  windowCount: number;
}

/** Un workspace thematique */
export interface Workspace {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  urls: WorkspaceUrl[];
}

export interface WorkspaceUrl {
  url: string;
  title: string;
}

/** Structure complete du storage */
export interface StorageSchema {
  schemaVersion: number;
  sessions: Session[];
  workspaces: Workspace[];
  // Les autres cles existantes (providerConfigs, activeProvider, etc.)
  [key: string]: any;
}

export const WORKSPACE_COLORS = [
  { value: 'blue', label: 'Bleu' },
  { value: 'red', label: 'Rouge' },
  { value: 'green', label: 'Vert' },
  { value: 'yellow', label: 'Jaune' },
  { value: 'purple', label: 'Violet' },
  { value: 'pink', label: 'Rose' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'orange', label: 'Orange' },
] as const;
