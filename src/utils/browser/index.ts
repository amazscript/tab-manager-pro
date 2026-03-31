/**
 * @module browser
 * @description Public barrel file for the browser utilities subsystem of Tab Manager Pro.
 * Re-exports browser detection flags, virtual group management, and the cross-browser
 * tab grouping abstraction layer.
 */

export { detectBrowser, IS_FIREFOX, IS_CHROME, SUPPORTS_TAB_GROUPS, SUPPORTS_SIDE_PANEL } from './detect';
export type { BrowserType } from './detect';
export { VirtualGroupManager } from './virtual-groups';
export type { VirtualGroup } from './virtual-groups';
export { groupTabs, ungroupTab, getTabGroupInfo } from './tabs-compat';
export type { GroupTabsOptions } from './tabs-compat';
