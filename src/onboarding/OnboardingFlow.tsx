import React, { useState } from 'react';
import { ProviderType, PROVIDER_LABELS, PROVIDER_PLACEHOLDERS } from '../utils/providers';

const STEPS = ['Bienvenue', 'Provider', 'Configuration', 'Decouverte', 'Pret !'];
const PROVIDERS: ProviderType[] = ['anthropic', 'openai', 'gemini', 'mistral', 'ollama'];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<ProviderType>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const saveAndNext = () => {
    setSaving(true);
    const config = provider === 'ollama'
      ? { type: provider, baseUrl: ollamaUrl }
      : { type: provider, apiKey };

    chrome.storage.local.set({
      providerConfigs: { [provider]: config },
      activeProvider: provider,
      onboardingComplete: true,
    }, () => {
      setSaving(false);
      setSaved(true);
      next();
    });
  };

  const finish = () => {
    chrome.storage.local.set({ onboardingComplete: true }, () => {
      window.close();
    });
  };

  const skipOnboarding = () => {
    chrome.storage.local.set({ onboardingComplete: true }, () => {
      window.close();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="flex bg-gray-50 border-b">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center py-3 text-xs font-semibold transition-colors ${
                i === step
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500'
                  : i < step
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}
            >
              {i < step ? '\u2713' : i + 1}. {s}
            </div>
          ))}
        </div>

        <div className="p-8">
          {/* Step 0: Bienvenue */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-5xl mb-4">
                <span role="img" aria-label="tabs">&#x1F4CB;</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Bienvenue sur Tab Manager Pro
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                L'extension qui utilise l'intelligence artificielle pour organiser
                automatiquement vos onglets Chrome en groupes thematiques.
              </p>
              <div className="space-y-2 text-left text-sm text-gray-600 mb-8">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Groupement intelligent par IA (Claude, GPT, Gemini, Mistral, Ollama)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Sauvegarde et restauration de sessions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Workspaces thematiques pour vos projets</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Chat IA pour controler vos onglets en langage naturel</span>
                </div>
              </div>
              <button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Commencer la configuration
              </button>
              <button onClick={skipOnboarding} className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600">
                Passer l'introduction
              </button>
            </div>
          )}

          {/* Step 1: Choix du provider */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Choisissez votre provider IA</h2>
              <p className="text-sm text-gray-500 mb-5">
                Vous pourrez en ajouter d'autres plus tard dans les parametres.
              </p>
              <div className="space-y-2">
                {PROVIDERS.map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      provider === p
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-800">{PROVIDER_LABELS[p]}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p === 'anthropic' && 'Modele Claude - Excellent pour l\'analyse semantique'}
                      {p === 'openai' && 'GPT-4o-mini - Rapide et economique'}
                      {p === 'gemini' && 'Gemini 2.0 Flash - Integration Google'}
                      {p === 'mistral' && 'Mistral Small - Modele europeen performant'}
                      {p === 'ollama' && 'Mode local - Aucune donnee envoyee en ligne'}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={prev} className="text-gray-500 hover:text-gray-700 text-sm">Retour</button>
                <button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configuration API key */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Configurez {PROVIDER_LABELS[provider]}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {provider === 'ollama'
                  ? 'Verifiez que Ollama est lance sur votre machine.'
                  : 'Entrez votre cle API. Elle reste stockee localement dans votre navigateur.'}
              </p>

              {provider === 'ollama' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">URL du serveur Ollama</label>
                  <input
                    type="text"
                    className="w-full border-2 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cle API</label>
                  <input
                    type="password"
                    className="w-full border-2 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={PROVIDER_PLACEHOLDERS[provider]}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Votre cle est stockee uniquement en local dans chrome.storage.
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={prev} className="text-gray-500 hover:text-gray-700 text-sm">Retour</button>
                <button
                  onClick={saveAndNext}
                  disabled={saving || (provider !== 'ollama' && !apiKey.trim())}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-300"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Decouverte */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Decouvrez les fonctionnalites</h2>
              <p className="text-sm text-gray-500 mb-5">
                Voici comment utiliser Tab Manager Pro au quotidien :
              </p>

              <div className="space-y-4">
                <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">&#x1F3AF;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Groupement IA</div>
                    <div className="text-xs text-gray-600">Cliquez sur "Regrouper via IA" dans la popup pour organiser automatiquement vos onglets.</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">&#x1F4BE;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Sessions</div>
                    <div className="text-xs text-gray-600">Sauvegardez tous vos onglets ouverts et restaurez-les plus tard en un clic.</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">&#x1F4C1;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Workspaces</div>
                    <div className="text-xs text-gray-600">Creez des espaces de travail thematiques pour basculer rapidement entre vos projets.</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-yellow-50 rounded-lg">
                  <span className="text-2xl">&#x1F4AC;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Chat IA</div>
                    <div className="text-xs text-gray-600">Ouvrez le panneau lateral pour controler vos onglets en langage naturel : "Ferme les doublons".</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={prev} className="text-gray-500 hover:text-gray-700 text-sm">Retour</button>
                <button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Pret */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-5xl mb-4">
                <span role="img" aria-label="rocket">&#x1F680;</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Tout est pret !
              </h2>
              <p className="text-gray-600 mb-2">
                {saved
                  ? `${PROVIDER_LABELS[provider]} est configure.`
                  : 'Vous pouvez configurer votre provider dans la popup.'}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Cliquez sur l'icone de l'extension dans votre barre d'outils pour commencer.
              </p>

              <button onClick={finish} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Commencer a utiliser Tab Manager Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
