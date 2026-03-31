import { CURRENT_SCHEMA_VERSION } from './types';

type MigrationFn = (data: Record<string, any>) => Record<string, any>;

/**
 * Migrations indexees par version cible.
 * migrate[1] transforme les donnees de la version 0 (ou sans version) vers la version 1.
 */
const migrations: Record<number, MigrationFn> = {
  1: (data) => {
    // Migration initiale : ajouter les champs sessions et workspaces s'ils n'existent pas
    return {
      ...data,
      schemaVersion: 1,
      sessions: data.sessions || [],
      workspaces: data.workspaces || [],
    };
  },
};

/**
 * Applique toutes les migrations necessaires pour amener les donnees a la version courante.
 * Retourne les donnees migrees et un booleen indiquant si une migration a eu lieu.
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
