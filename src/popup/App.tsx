/**
 * @module popup/App
 * @description Main popup component for the Tab Manager Pro Chrome extension.
 * Provides the primary UI for configuring AI providers, triggering AI-based tab grouping,
 * managing sessions, and managing workspaces. Renders as a compact popup panel
 * with three navigable tabs: AI, Sessions, and Workspaces.
 */

import React, { useState, useEffect } from 'react';
import { ProviderType, ProviderConfig, PROVIDER_LABELS, PROVIDER_PLACEHOLDERS } from '../utils/providers';
import { SessionsPanel } from '../components/SessionsPanel';
import { WorkspacesPanel } from '../components/WorkspacesPanel';

/** @description List of all supported AI provider types. */
const ALL_PROVIDERS: ProviderType[] = ['anthropic', 'openai', 'gemini', 'mistral', 'ollama'];

/**
 * @description Available languages for AI responses.
 * Each entry maps a language code to its display label.
 */
const AI_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
];

/** @description Union type representing the three main navigation tabs in the popup. */
type Tab = 'ia' | 'sessions' | 'workspaces';

/**
 * @description Root popup application component for Tab Manager Pro.
 *
 * Manages three panels:
 * - **AI tab**: Configure AI providers (API keys, Ollama URL, language) and trigger
 *   AI-powered tab grouping or ungroup all tabs.
 * - **Sessions tab**: Delegates to {@link SessionsPanel} for saving/restoring tab sessions.
 * - **Workspaces tab**: Delegates to {@link WorkspacesPanel} for creating/opening workspaces.
 *
 * **State variables:**
 * - `tab` - Currently active navigation tab (`'ia'`, `'sessions'`, or `'workspaces'`).
 * - `activeProvider` - The currently selected AI provider type.
 * - `providerConfigs` - Map of provider type to its saved configuration (API key or base URL).
 * - `apiKeyInput` - Current value of the API key input field.
 * - `ollamaUrl` - Current value of the Ollama server URL input field.
 * - `loading` - Whether an async operation (grouping/ungrouping) is in progress.
 * - `message` - Feedback message displayed to the user (auto-clears after 5 seconds).
 * - `aiLanguage` - Selected language code for AI responses.
 *
 * @returns {React.JSX.Element} The rendered popup UI.
 *
 * @example
 * // Used as the root component in the popup entry point:
 * <App />
 */
function App() {
  const [tab, setTab] = useState<Tab>('ia');
  const [activeProvider, setActiveProvider] = useState<ProviderType>('anthropic');
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({});
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLanguage, setAiLanguage] = useState('en');

  /**
   * @description Loads saved provider configurations, active provider, and AI language
   * from chrome.storage.local on component mount. Also handles legacy migration
   * where an `apiKey` was stored directly (pre-multi-provider support).
   */
  useEffect(() => {
    chrome.storage.local.get(
      ['providerConfigs', 'activeProvider', 'fallbackOrder', 'apiKey', 'aiLanguage'],
      (res: { [key: string]: any }) => {
        const configs: Record<string, ProviderConfig> = res.providerConfigs || {};
        if (!configs['anthropic'] && res.apiKey) {
          configs['anthropic'] = { type: 'anthropic', apiKey: res.apiKey };
        }
        setProviderConfigs(configs);
        if (res.activeProvider) setActiveProvider(res.activeProvider);
        if (res.aiLanguage) setAiLanguage(res.aiLanguage);
        const current = configs[res.activeProvider || 'anthropic'];
        if (current) {
          setApiKeyInput(current.type === 'ollama' ? '' : (current.apiKey || ''));
          if (current.type === 'ollama') setOllamaUrl(current.baseUrl || 'http://localhost:11434');
        }
      }
    );
  }, []);

  /**
   * @description Switches the active AI provider, persists the selection to storage,
   * and updates the input fields to reflect the selected provider's saved configuration.
   * @param {ProviderType} type - The provider type to select.
   */
  const selectProvider = (type: ProviderType) => {
    setActiveProvider(type);
    chrome.storage.local.set({ activeProvider: type });
    const config = providerConfigs[type];
    if (config) {
      setApiKeyInput(type === 'ollama' ? '' : (config.apiKey || ''));
      if (type === 'ollama') setOllamaUrl(config.baseUrl || 'http://localhost:11434');
    } else {
      setApiKeyInput('');
      setOllamaUrl('http://localhost:11434');
    }
  };

  /**
   * @description Saves the current provider configuration (API key or Ollama URL)
   * and AI language preference to chrome.storage.local.
   */
  const saveConfig = () => {
    const newConfig: ProviderConfig = activeProvider === 'ollama'
      ? { type: 'ollama', baseUrl: ollamaUrl }
      : { type: activeProvider, apiKey: apiKeyInput };
    const updated = { ...providerConfigs, [activeProvider]: newConfig };
    setProviderConfigs(updated);
    chrome.storage.local.set({
      providerConfigs: updated,
      activeProvider,
      aiLanguage,
    }, () => showMessage('Configuration saved!'));
  };

  /**
   * @description Sends a message to the background script to remove all tab groups
   * in the current window. Displays a success or error message upon completion.
   */
  const handleUngroupAll = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'UNGROUP_ALL_TABS' }, (response) => {
      setLoading(false);
      if (response?.success) showMessage(`${response.count} group(s) removed!`);
      else showMessage(formatError(response?.error));
    });
  };

  /**
   * @description Sends a message to the background script to automatically group tabs
   * using AI analysis. Displays a success or error message upon completion.
   */
  const handleAutoGroup = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'AUTO_GROUP_TABS' }, (response) => {
      setLoading(false);
      if (response?.success) showMessage('Tabs organized!');
      else showMessage(formatError(response?.error));
    });
  };

  /**
   * @description Converts raw error strings from the background script into
   * user-friendly error messages. Detects common error patterns such as
   * authentication failures, rate limits, network issues, and missing configuration.
   * @param {string} [error] - The raw error message string.
   * @returns {string} A human-readable error message.
   */
  const formatError = (error?: string): string => {
    if (!error) return 'An unknown error occurred.';
    const lower = error.toLowerCase();
    if (lower.includes('ollama') && (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch') || lower.includes('econnrefused')))
      return 'Ollama is not reachable. Make sure it is installed and running on your machine.';
    if (lower.includes('401') || lower.includes('authentication') || lower.includes('invalid'))
      return 'Invalid API key. Please check your key in the settings.';
    if (lower.includes('404') || lower.includes('not_found'))
      return 'AI model not found. Update the extension or switch providers.';
    if (lower.includes('402') || lower.includes('credit') || lower.includes('balance') || lower.includes('billing'))
      return 'Insufficient credits on your account. Top up or switch providers.';
    if (lower.includes('429') || lower.includes('rate'))
      return 'Too many requests. Please try again in a few seconds.';
    if (lower.includes('500') || lower.includes('server'))
      return 'Provider server error. Please try again later.';
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed'))
      return 'Network error. Please check your internet connection.';
    if (lower.includes('no provider configured') || lower.includes('aucun provider'))
      return 'No provider configured. Add an API key above.';
    if (lower.includes('api key required') || lower.includes('api key requis'))
      return 'API key missing. Add your key above and save.';
    return 'An error occurred. Please check your configuration and try again.';
  };

  /**
   * @description Displays a temporary feedback message that auto-clears after 5 seconds.
   * @param {string} msg - The message to display.
   */
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  /**
   * @description Checks whether a given provider has been configured with
   * a valid API key (or base URL for Ollama).
   * @param {ProviderType} type - The provider type to check.
   * @returns {boolean} True if the provider has a valid configuration.
   */
  const isConfigured = (type: ProviderType) => {
    const c = providerConfigs[type];
    if (!c) return false;
    return type === 'ollama' ? !!c.baseUrl : !!c.apiKey;
  };

  /** @description Whether the current input is valid and the save button should be enabled. */
  const canSave = activeProvider === 'ollama' ? !!ollamaUrl : !!apiKeyInput;

  /** @description Whether the active provider is configured and the group button should be enabled. */
  const canGroup = isConfigured(activeProvider);

  /** @description Tab navigation items with their IDs and display labels. */
  const tabs: { id: Tab; label: string }[] = [
    { id: 'ia', label: 'AI' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'workspaces', label: 'Workspaces' },
  ];

  return (
    <div className="w-80 bg-white shadow-lg border border-gray-100" role="main" aria-label="Tab Manager Pro">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold text-blue-600">Tab Manager Pro</h1>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 px-2" role="tablist" aria-label="Navigation">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-xs font-semibold py-2 transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              tab === t.id
                ? 'text-blue-600 border-blue-500'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3" role="tabpanel" id={`panel-${tab}`} aria-label={tabs.find(t => t.id === tab)?.label}>
        {tab === 'ia' && (
          <>
            {/* Provider selector */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Provider</label>
              <div className="flex flex-wrap gap-1">
                {ALL_PROVIDERS.map(type => (
                  <button
                    key={type}
                    onClick={() => selectProvider(type)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      activeProvider === type
                        ? 'bg-blue-500 text-white border-blue-500'
                        : isConfigured(type)
                          ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {PROVIDER_LABELS[type].split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                {activeProvider === 'ollama' ? 'Server URL' : 'API Key'}
              </label>
              {activeProvider === 'ollama' ? (
                <input
                  type="text"
                  className="w-full border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                />
              ) : (
                <input
                  type="password"
                  className="w-full border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={PROVIDER_PLACEHOLDERS[activeProvider]}
                />
              )}
              <button
                onClick={saveConfig}
                disabled={!canSave}
                className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded w-full transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>

            {/* AI Language */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">AI Language</label>
              <select
                value={aiLanguage}
                onChange={(e) => {
                  setAiLanguage(e.target.value);
                  chrome.storage.local.set({ aiLanguage: e.target.value });
                }}
                className="w-full border p-2 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AI_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Action */}
            <button
              onClick={handleAutoGroup}
              disabled={loading || !canGroup}
              aria-label="Group tabs using AI"
              aria-busy={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Analyzing...</span>
                </>
              ) : 'Group with AI'}
            </button>

            {/* Remove all groups */}
            <button
              onClick={handleUngroupAll}
              disabled={loading}
              className="w-full mt-2 text-xs text-gray-500 hover:text-red-500 py-1.5 transition-colors focus:outline-none"
            >
              Remove all groups
            </button>

          </>
        )}

        {tab === 'sessions' && <SessionsPanel />}
        {tab === 'workspaces' && <WorkspacesPanel />}
      </div>

      {/* Global message (AI tab) */}
      {tab === 'ia' && message && (
        <div className="px-3 pb-3">
          <div className={`text-xs text-center font-medium rounded-lg p-2.5 ${
            message.includes('organized') || message.includes('removed') || message.includes('saved')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
