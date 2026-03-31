/**
 * @module storage/migration
 * @description Handles data schema migrations for Tab Manager Pro's Chrome local storage.
 * When the storage schema evolves, migration functions are registered here by version number.
 * On extension startup, {@link migrateIfNeeded} is called to bring stored data up to date.
 */

import { CURRENT_SCHEMA_VERSION } from './types';

/**
 * @description A function that transforms stored data from one schema version to the next.
 * @callback MigrationFn
 * @param {Record<string, any>} data - The current stored data object.
 * @returns {Record<string, any>} The transformed data object with the new schema applied.
 */
type MigrationFn = (data: Record<string, any>) => Record<string, any>;

/**
 * @description Registry of migration functions indexed by their target version number.
 * Each migration transforms data from `version - 1` to `version`.
 *
 * @example
 * // migrations[1] transforms data from version 0 (or no version) to version 1.
 * // migrations[2] would transform data from version 1 to version 2, etc.
 */
const migrations: Record<number, MigrationFn> = {
  1: (data) => {
    // Initial migration: add sessions and workspaces fields if missing
    return {
      ...data,
      schemaVersion: 1,
      sessions: data.sessions || [],
      workspaces: data.workspaces || [],
    };
  },
};

/**
 * @description Checks the current schema version in Chrome local storage and applies
 * all necessary migrations sequentially to bring the data up to {@link CURRENT_SCHEMA_VERSION}.
 * If the data is already at the current version, no changes are made.
 *
 * @returns {Promise<boolean>} `true` if one or more migrations were applied, `false` if already up to date.
 *
 * @example
 * // Typically called during extension initialization
 * const didMigrate = await migrateIfNeeded();
 * if (didMigrate) {
 *   console.log('Storage was migrated to the latest schema version.');
 * }
 */
export async function migrateIfNeeded(): Promise<boolean> {
  const data = await chrome.storage.local.get(null);
  const currentVersion = (data.schemaVersion as number) || 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return false;
  }

  let migrated = { ...data };
  for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    const fn = migrations[v];
    if (fn) {
      console.log(`[TabManagerPro] Migration v${v - 1} -> v${v}`);
      migrated = fn(migrated);
    }
  }

  await chrome.storage.local.set(migrated);
  return true;
}
