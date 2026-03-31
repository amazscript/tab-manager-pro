/**
 * @module storage
 * @description Public barrel file for the storage subsystem of Tab Manager Pro.
 * Re-exports all types, constants, and manager classes related to session and
 * workspace persistence, as well as the storage migration utility.
 */

export type {
  Session,
  SavedTab,
  SavedTabGroup,
  SavedWindow,
  Workspace,
  WorkspaceUrl,
} from './types';
export { CURRENT_SCHEMA_VERSION, WORKSPACE_COLORS } from './types';
export { migrateIfNeeded } from './migration';
export { SessionManager } from './sessions';
export { WorkspaceManager } from './workspaces';
