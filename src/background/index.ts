import { TabData, ChatMessage } from '../utils/providers';
import { ProviderManager, loadProviderManagerConfig } from '../utils/providers';
import { SessionManager } from '../utils/storage';
import { WorkspaceManager } from '../utils/storage';
import { migrateIfNeeded } from '../utils/storage';
import { parseIntent, executeCommand, ChatHistory } from '../utils/commands';
import { groupTabs } from '../utils/browser';
import { initSentry, captureError } from '../utils/sentry';

// Initialiser Sentry
initSentry();

// Migration au demarrage du service worker
migrateIfNeeded().then(migrated => {
  if (migrated) console.log('[TabManagerPro] Migration du schema terminee');
});

// Ouvrir l'onboarding au premier install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.get('onboardingComplete', (data) => {
      if (!data.onboardingComplete) {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sendResponse);
    return true; // Keep channel open for async response
  }
});

type MessageHandler = (message: any, sendResponse: (response: any) => void) => void;

const messageHandlers: Record<string, MessageHandler> = {
  AUTO_GROUP_TABS: (_msg, sendResponse) => handleAutoGrouping(sendResponse),
  UNGROUP_ALL_TABS: (_msg, sendResponse) => {
    handleUngroupAll()
      .then(count => sendResponse({ success: true, count }))
      .catch(err => sendResponse({ success: false, error: err.message }));
  },

  // Sessions
  SAVE_SESSION: (msg, sendResponse) => {
    SessionManager.captureCurrentSession(msg.name || 'Session sans nom')
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

async function handleAutoGrouping(sendResponse: (response: any) => void) {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabData: TabData[] = tabs
      .filter(t => t.id !== undefined)
      .map(t => ({ id: t.id!, title: t.title || '', url: t.url || '' }));

    const config = await loadProviderManagerConfig();
    const manager = new ProviderManager(config);
    const { aiLanguage } = await chrome.storage.local.get('aiLanguage');
    const language = (aiLanguage as string) || 'fr';
    const groups = await manager.suggestGroups(tabData, language);

    console.log('[TabManagerPro] Onglets envoyes:', tabData.map(t => ({ id: t.id, title: t.title.substring(0, 30) })));
    console.log('[TabManagerPro] Groupes recus:', JSON.stringify(groups));

    // Verifier que les tab IDs retournes par l'IA correspondent a de vrais onglets
    const validTabIds = new Set(tabData.map(t => t.id));
    let groupedCount = 0;

    for (const group of groups) {
      const validTabs = group.tabs.filter(id => validTabIds.has(id));
      console.log(`[TabManagerPro] Groupe "${group.groupName}": ${group.tabs.length} tabs IA -> ${validTabs.length} valides`);

      if (validTabs.length > 0) {
        try {
          await groupTabs({
            tabIds: validTabs,
            title: group.groupName,
            color: group.color || 'grey',
          });
          groupedCount++;
        } catch (e: any) {
          console.error(`[TabManagerPro] Erreur groupement "${group.groupName}":`, e.message);
        }
      }
    }

    sendResponse({ success: true, count: groupedCount });
  } catch (error: any) {
    captureError(error, { action: 'handleAutoGrouping' });
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUngroupAll(): Promise<number> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groupedTabs = tabs.filter(t => t.groupId && t.groupId !== -1);

  if (groupedTabs.length === 0) return 0;

  // Collecter les group IDs uniques
  const groupIds = new Set(groupedTabs.map(t => t.groupId));

  // Degrouper tous les onglets
  const tabIds = groupedTabs.map(t => t.id!).filter(Boolean);
  if (tabIds.length > 0) {
    chrome.tabs.ungroup(tabIds as [number, ...number[]]);
  }

  return groupIds.size;
}

const CHAT_SYSTEM_PROMPT = `Tu es l'assistant de Tab Manager Pro, une extension Chrome de gestion d'onglets.
Tu peux aider l'utilisateur a organiser ses onglets, gerer ses sessions et workspaces.
Reponds de maniere concise et utile en francais.
Si l'utilisateur demande une action sur ses onglets, explique ce que tu as fait.`;

async function handleChatMessage(
  text: string,
  conversationHistory: ChatMessage[]
): Promise<{ reply: string; commandResult?: { success: boolean; message: string } }> {
  const intent = parseIntent(text);

  let commandResult;
  let reply: string;

  if (intent.type !== 'chat') {
    // Executer la commande
    commandResult = await executeCommand(intent);
    reply = commandResult.message;
  } else {
    // Mode conversation libre avec l'IA
    const config = await loadProviderManagerConfig();
    const manager = new ProviderManager(config);

    // Ajouter le contexte des onglets actuels
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabContext = tabs.map(t => `- ${t.title} (${t.url})`).join('\n');
    const systemWithContext = `${CHAT_SYSTEM_PROMPT}\n\nOnglets actuels de l'utilisateur :\n${tabContext}`;

    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: text },
    ];

    reply = await manager.chat(messages, systemWithContext);
  }

  // Sauvegarder dans l'historique
  await ChatHistory.add({
    userMessage: text,
    assistantMessage: reply,
    intent: intent.type !== 'chat' ? intent.type : undefined,
    commandResult,
  });

  return { reply, commandResult };
}
