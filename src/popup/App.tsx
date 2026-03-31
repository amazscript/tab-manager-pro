import React, { useState, useEffect } from 'react';
import { ProviderType, ProviderConfig, PROVIDER_LABELS, PROVIDER_PLACEHOLDERS } from '../utils/providers';
import { SessionsPanel } from '../components/SessionsPanel';
import { WorkspacesPanel } from '../components/WorkspacesPanel';

const ALL_PROVIDERS: ProviderType[] = ['anthropic', 'openai', 'gemini', 'mistral', 'ollama'];

const AI_LANGUAGES = [
  { code: 'fr', label: 'Francais' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Portugues' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

type Tab = 'ia' | 'sessions' | 'workspaces';

function App() {
  const [tab, setTab] = useState<Tab>('ia');
  const [activeProvider, setActiveProvider] = useState<ProviderType>('anthropic');
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({});
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [fallbackOrder, setFallbackOrder] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiLanguage, setAiLanguage] = useState('fr');

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
        if (res.fallbackOrder) setFallbackOrder(res.fallbackOrder);
        if (res.aiLanguage) setAiLanguage(res.aiLanguage);
        const current = configs[res.activeProvider || 'anthropic'];
        if (current) {
          setApiKeyInput(current.type === 'ollama' ? '' : (current.apiKey || ''));
          if (current.type === 'ollama') setOllamaUrl(current.baseUrl || 'http://localhost:11434');
        }
      }
    );
  }, []);

  const selectProvider = (type: ProviderType) => {
    setActiveProvider(type);
    const config = providerConfigs[type];
    if (config) {
      setApiKeyInput(type === 'ollama' ? '' : (config.apiKey || ''));
      if (type === 'ollama') setOllamaUrl(config.baseUrl || 'http://localhost:11434');
    } else {
      setApiKeyInput('');
      setOllamaUrl('http://localhost:11434');
    }
  };

  const saveConfig = () => {
    const newConfig: ProviderConfig = activeProvider === 'ollama'
      ? { type: 'ollama', baseUrl: ollamaUrl }
      : { type: activeProvider, apiKey: apiKeyInput };
    const updated = { ...providerConfigs, [activeProvider]: newConfig };
    setProviderConfigs(updated);
    const configuredFallbacks = ALL_PROVIDERS.filter(p => p !== activeProvider && updated[p]);
    setFallbackOrder(configuredFallbacks);
    chrome.storage.local.set({
      providerConfigs: updated,
      activeProvider,
      fallbackOrder: configuredFallbacks,
      aiLanguage,
    }, () => showMessage('Configuration sauvegardee !'));
  };

  const handleUngroupAll = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'UNGROUP_ALL_TABS' }, (response) => {
      setLoading(false);
      if (response?.success) showMessage(`${response.count} groupe(s) supprime(s) !`);
      else showMessage(formatError(response?.error));
    });
  };

  const handleAutoGroup = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'AUTO_GROUP_TABS' }, (response) => {
      setLoading(false);
      if (response?.success) showMessage('Organisation terminee !');
      else showMessage(formatError(response?.error));
    });
  };

  const formatError = (error?: string): string => {
    if (!error) return 'Une erreur inconnue est survenue.';
    const lower = error.toLowerCase();
    if (lower.includes('401') || lower.includes('authentication') || lower.includes('invalid'))
      return 'Cle API invalide. Verifiez votre cle dans les parametres.';
    if (lower.includes('404') || lower.includes('not_found'))
      return 'Modele IA introuvable. Mettez a jour l\'extension ou changez de provider.';
    if (lower.includes('402') || lower.includes('credit') || lower.includes('balance') || lower.includes('billing'))
      return 'Credits insuffisants sur votre compte. Rechargez ou changez de provider.';
    if (lower.includes('429') || lower.includes('rate'))
      return 'Trop de requetes. Reessayez dans quelques secondes.';
    if (lower.includes('500') || lower.includes('server'))
      return 'Erreur serveur du provider. Reessayez plus tard.';
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed'))
      return 'Erreur reseau. Verifiez votre connexion internet.';
    if (lower.includes('aucun provider'))
      return 'Aucun provider configure. Ajoutez une cle API ci-dessus.';
    return 'Erreur : ' + error.substring(0, 100);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const isConfigured = (type: ProviderType) => {
    const c = providerConfigs[type];
    if (!c) return false;
    return type === 'ollama' ? !!c.baseUrl : !!c.apiKey;
  };

  const canSave = activeProvider === 'ollama' ? !!ollamaUrl : !!apiKeyInput;
  const canGroup = isConfigured(activeProvider);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ia', label: 'IA' },
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
                {activeProvider === 'ollama' ? 'URL serveur' : `Cle API`}
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
                Sauvegarder
              </button>
            </div>

            {/* Langue IA */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Langue de l'IA</label>
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

            {/* Fallback */}
            {fallbackOrder.length > 0 && (
              <div className="mb-3 text-xs text-gray-500 bg-gray-50 rounded p-2">
                <span className="font-semibold">Fallback :</span>{' '}
                {fallbackOrder.filter(p => isConfigured(p)).map(p => PROVIDER_LABELS[p].split(' (')[0]).join(' > ') || 'Aucun'}
              </div>
            )}

            {/* Action */}
            <button
              onClick={handleAutoGroup}
              disabled={loading || !canGroup}
              aria-label="Regrouper les onglets via IA"
              aria-busy={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Analyse en cours...</span>
                </>
              ) : 'Regrouper via IA'}
            </button>

            {/* Supprimer tous les groupes */}
            <button
              onClick={handleUngroupAll}
              disabled={loading}
              className="w-full mt-2 text-xs text-gray-500 hover:text-red-500 py-1.5 transition-colors focus:outline-none"
            >
              Supprimer tous les groupes
            </button>

          </>
        )}

        {tab === 'sessions' && <SessionsPanel />}
        {tab === 'workspaces' && <WorkspacesPanel />}
      </div>

      {/* Message global (onglet IA) */}
      {tab === 'ia' && message && (
        <div className="px-3 pb-3">
          <div className={`text-xs text-center font-medium rounded-lg p-2.5 ${
            message.includes('terminee')
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
