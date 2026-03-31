/**
 * @module background/index
 * @description Background service worker for the Tab Manager Pro Chrome extension.
 * Serves as the central message hub that handles all communication between the popup,
 * side panel, and Chrome APIs. Responsibilities include:
 * - AI-powered tab auto-grouping and ungrouping
 * - Session management (save, list, restore, delete)
 * - Workspace management (create, list, open, update, delete)
 * - Chat message processing (intent parsing, command execution, AI conversation)
 * - Chat history management (list, clear)
 * - Onboarding tab creation on first install
 * - Schema migration on service worker startup
 * - Sentry error tracking initialization
 */

import { TabData, ChatMessage } from '../utils/providers';
import { ProviderManager, loadProviderManagerConfig } from '../utils/providers';
import { SessionManager } from '../utils/storage';
import { WorkspaceManager } from '../utils/storage';
import { migrateIfNeeded } from '../utils/storage';
import { parseIntent, executeCommand, ChatHistory } from '../utils/commands';
import { groupTabs } from '../utils/browser';
import { initSentry, captureError } from '../utils/sentry';

// Initialize Sentry
initSentry();

// Run migration on service worker startup
migrateIfNeeded().then(migrated => {
  if (migrated) console.log('[TabManagerPro] Schema migration complete');
});

/**
 * @description Listens for the extension's first install event and opens
 * the onboarding page if the user has not completed onboarding yet.
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.get('onboardingComplete', (data) => {
      if (!data.onboardingComplete) {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
      }
    });
  }
});

/**
 * @description Central message listener that routes incoming messages from the popup
 * and side panel to the appropriate handler function based on the message `type` field.
 * Returns `true` to keep the message channel open for asynchronous responses.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sendResponse);
    return true; // Keep channel open for async response
  }
});

/**
 * @description Type definition for a message handler function.
 * @param {any} message - The incoming message object.
 * @param {(response: any) => void} sendResponse - Callback to send a response back to the sender.
 */
type MessageHandler = (message: any, sendResponse: (response: any) => void) => void;

/**
 * @description Registry of all message handlers, keyed by message type.
 * Each handler processes a specific message type and sends back a response
 * with a `success` boolean and relevant data or error information.
 *
 * Supported message types:
 * - `AUTO_GROUP_TABS` - Triggers AI-powered tab auto-grouping.
 * - `UNGROUP_ALL_TABS` - Removes all tab groups in the current window.
 * - `SAVE_SESSION` - Saves the current tabs as a named session.
 * - `LIST_SESSIONS` - Returns all saved sessions.
 * - `RESTORE_SESSION` - Restores tabs from a saved session.
 * - `DELETE_SESSION` - Deletes a saved session.
 * - `CREATE_WORKSPACE` - Creates a new workspace from current tabs.
 * - `LIST_WORKSPACES` - Returns all saved workspaces.
 * - `OPEN_WORKSPACE` - Opens all URLs in a saved workspace.
 * - `UPDATE_WORKSPACE` - Updates a workspace with current tabs.
 * - `DELETE_WORKSPACE` - Deletes a saved workspace.
 * - `CHAT_MESSAGE` - Processes a chat message (command or AI conversation).
 * - `LIST_CHAT_HISTORY` - Returns the chat history.
 * - `CLEAR_CHAT_HISTORY` - Clears all chat history.
 */
const messageHandlers: Record<string, MessageHandler> = {
  AUTO_GROUP_TABS: (_msg, sendResponse) => handleAutoGrouping(sendResponse),
  UNGROUP_ALL_TABS: (_msg, sendResponse) => {
    handleUngroupAll()
      .then(count => sendResponse({ success: true, count }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },

  // Sessions
  SAVE_SESSION: (msg, sendResponse) => {
    SessionManager.captureCurrentSession(msg.name || 'Unnamed session')
      .then(session => sendResponse({ success: true, session }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  LIST_SESSIONS: (_msg, sendResponse) => {
    SessionManager.listSessions()
      .then(sessions => sendResponse({ success: true, sessions }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  RESTORE_SESSION: (msg, sendResponse) => {
    SessionManager.restoreSession(msg.sessionId)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  DELETE_SESSION: (msg, sendResponse) => {
    SessionManager.deleteSession(msg.sessionId)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },

  // Workspaces
  CREATE_WORKSPACE: (msg, sendResponse) => {
    WorkspaceManager.createFromCurrentTabs(msg.name || 'Workspace', msg.color || 'blue')
      .then(workspace => sendResponse({ success: true, workspace }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  LIST_WORKSPACES: (_msg, sendResponse) => {
    WorkspaceManager.list()
      .then(workspaces => sendResponse({ success: true, workspaces }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  OPEN_WORKSPACE: (msg, sendResponse) => {
    WorkspaceManager.open(msg.workspaceId)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  UPDATE_WORKSPACE: (msg, sendResponse) => {
    WorkspaceManager.updateFromCurrentTabs(msg.workspaceId)
      .then(workspace => sendResponse({ success: true, workspace }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  DELETE_WORKSPACE: (msg, sendResponse) => {
    WorkspaceManager.delete(msg.workspaceId)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },

  // Chat
  CHAT_MESSAGE: (msg, sendResponse) => {
    handleChatMessage(msg.text, msg.history || [])
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  LIST_CHAT_HISTORY: (_msg, sendResponse) => {
    ChatHistory.list()
      .then(history => sendResponse({ success: true, history }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },
  CLEAR_CHAT_HISTORY: (_msg, sendResponse) => {
    ChatHistory.clear()
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },

};

/**
 * @description Handles AI-powered automatic tab grouping. Queries all tabs in the current
 * window, sends them to the configured AI provider for semantic analysis, then creates
 * Chrome tab groups based on the AI's suggested groupings. Validates that AI-returned
 * tab IDs match actual open tabs before grouping.
 * @param {(response: any) => void} sendResponse - Callback to send the result back to the caller.
 * @returns {Promise<void>}
 */
async function handleAutoGrouping(sendResponse: (response: any) => void) {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabData: TabData[] = tabs
      .filter(t => t.id !== undefined)
      .map(t => ({ id: t.id!, title: t.title || '', url: t.url || '' }));

    const config = await loadProviderManagerConfig();
    const manager = new ProviderManager(config);
    const { aiLanguage } = await chrome.storage.local.get('aiLanguage');
    const language = (aiLanguage as string) || 'en';
    const groups = await manager.suggestGroups(tabData, language);

    console.log('[TabManagerPro] Tabs sent:', tabData.map(t => ({ id: t.id, title: t.title.substring(0, 30) })));
    console.log('[TabManagerPro] Groups received:', JSON.stringify(groups));

    // Verify that tab IDs returned by AI match actual tabs
    const validTabIds = new Set(tabData.map(t => t.id));
    let groupedCount = 0;

    for (const group of groups) {
      const validTabs = group.tabs.filter(id => validTabIds.has(id));
      console.log(`[TabManagerPro] Group "${group.groupName}": ${group.tabs.length} AI tabs -> ${validTabs.length} valid`);

      if (validTabs.length > 0) {
        try {
          await groupTabs({
            tabIds: validTabs,
            title: group.groupName,
            color: group.color || 'grey',
          });
          groupedCount++;
        } catch (e: any) {
          console.error(`[TabManagerPro] Grouping error "${group.groupName}":`, e.message);
        }
      }
    }

    sendResponse({ success: true, count: groupedCount });
  } catch (error: any) {
    captureError(error, { action: 'handleAutoGrouping' });
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * @description Removes all tab groups in the current window by ungrouping every grouped tab.
 * @returns {Promise<number>} The number of unique tab groups that were removed.
 */
async function handleUngroupAll(): Promise<number> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groupedTabs = tabs.filter(t => t.groupId && t.groupId !== -1);

  if (groupedTabs.length === 0) return 0;

  // Collect unique group IDs
  const groupIds = new Set(groupedTabs.map(t => t.groupId));

  // Ungroup all tabs
  const tabIds = groupedTabs.map(t => t.id!).filter(Boolean);
  if (tabIds.length > 0) {
    chrome.tabs.ungroup(tabIds as [number, ...number[]]);
  }

  return groupIds.size;
}

/**
 * @description System prompt used for AI chat conversations. Instructs the AI to act
 * as a helpful tab management assistant that can organize tabs, manage sessions,
 * and manage workspaces.
 */
const CHAT_SYSTEM_PROMPT = `You are the assistant for Tab Manager Pro, a Chrome extension for tab management.
You can help the user organize their tabs, manage sessions and workspaces.
Reply concisely and helpfully in English.
If the user requests an action on their tabs, explain what you did.`;

/**
 * @description Processes an incoming chat message from the side panel. First attempts
 * to parse the message as a tab management command (e.g., "close duplicates", "sort tabs").
 * If a command is detected, it is executed directly. Otherwise, the message is sent to
 * the configured AI provider for a conversational response, with the user's current tabs
 * included as context. The result is saved to chat history.
 * @param {string} text - The user's chat message text.
 * @param {ChatMessage[]} conversationHistory - Previous messages in the conversation for context.
 * @returns {Promise<{ reply: string; commandResult?: { success: boolean; message: string } }>}
 *   The AI reply text and optional command execution result.
 */
async function handleChatMessage(
  text: string,
  conversationHistory: ChatMessage[]
): Promise<{ reply: string; commandResult?: { success: boolean; message: string } }> {
  const intent = parseIntent(text);

  let commandResult;
  let reply: string;

  if (intent.type !== 'chat') {
    // Execute the command
    commandResult = await executeCommand(intent);
    reply = commandResult.message;
  } else {
    // Free conversation mode with AI
    const config = await loadProviderManagerConfig();
    const manager = new ProviderManager(config);

    // Add current tabs context
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabContext = tabs.map(t => `- ${t.title} (${t.url})`).join('\n');
    const systemWithContext = `${CHAT_SYSTEM_PROMPT}\n\nUser's current tabs:\n${tabContext}`;

    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: text },
    ];

    reply = await manager.chat(messages, systemWithContext);
  }

  // Save to history
  await ChatHistory.add({
    userMessage: text,
    assistantMessage: reply,
    intent: intent.type !== 'chat' ? intent.type : undefined,
    commandResult,
  });

  return { reply, commandResult };
}
