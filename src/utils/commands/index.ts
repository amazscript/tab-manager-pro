/**
 * @module commands
 * @description Public barrel export for the Tab Manager Pro command system.
 * Re-exports all types, the intent parser, the command executor, and the chat history manager.
 */

export type { IntentType, ParsedIntent, CommandResult, ChatHistoryEntry } from './types';
export { parseIntent } from './parser';
export { executeCommand } from './executor';
export { ChatHistory } from './history';
