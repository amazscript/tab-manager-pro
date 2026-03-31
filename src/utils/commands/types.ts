export type IntentType =
  | 'close_duplicates'
  | 'group_tabs'
  | 'close_tab'
  | 'save_session'
  | 'restore_session'
  | 'create_workspace'
  | 'open_workspace'
  | 'sort_tabs'
  | 'close_inactive'
  | 'search_tabs'
  | 'chat';

export interface ParsedIntent {
  type: IntentType;
  params: Record<string, string | undefined>;
  originalText: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ChatHistoryEntry {
  id: string;
  timestamp: number;
  userMessage: string;
  assistantMessage: string;
  intent?: IntentType;
  commandResult?: CommandResult;
}
