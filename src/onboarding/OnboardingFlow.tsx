/**
 * @module onboarding/OnboardingFlow
 * @description Onboarding wizard component for Tab Manager Pro.
 * Guides new users through a multi-step setup flow: welcome screen, AI provider
 * selection, API key configuration, feature overview, and a completion screen.
 * Opens automatically on first install of the extension.
 */

import React, { useState } from 'react';
import { ProviderType, PROVIDER_LABELS, PROVIDER_PLACEHOLDERS } from '../utils/providers';

/** @description Labels for each step in the onboarding wizard progress bar. */
const STEPS = ['Welcome', 'Provider', 'Setup', 'Features', 'Ready!'];

/** @description List of AI provider types available for selection during onboarding. */
const PROVIDERS: ProviderType[] = ['anthropic', 'openai', 'gemini', 'mistral', 'ollama'];

/**
 * @description Multi-step onboarding wizard component.
 *
 * Walks the user through initial setup of Tab Manager Pro in five steps:
 * 1. **Welcome** - Introduction to the extension and its features.
 * 2. **Provider** - Selection of the preferred AI provider.
 * 3. **Setup** - Configuration of the API key or Ollama server URL.
 * 4. **Features** - Overview of key features (grouping, sessions, workspaces, chat).
 * 5. **Ready** - Confirmation screen with a button to close and start using the extension.
 *
 * **State variables:**
 * - `step` - Current step index (0-4) in the wizard.
 * - `provider` - The selected AI provider type.
 * - `apiKey` - The API key entered by the user.
 * - `ollamaUrl` - The Ollama server URL entered by the user.
 * - `saving` - Whether the configuration is currently being saved to storage.
 * - `saved` - Whether the configuration has been successfully saved.
 *
 * **Key handlers:**
 * - `next` / `prev` - Navigate between wizard steps.
 * - `saveAndNext` - Persists the provider configuration and advances to the next step.
 * - `finish` - Marks onboarding as complete and closes the tab.
 * - `skipOnboarding` - Skips the entire wizard and closes the tab.
 *
 * @returns {React.JSX.Element} The rendered onboarding wizard UI.
 *
 * @example
 * // Used as the root component in the onboarding entry point:
 * <OnboardingFlow />
 */
export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<ProviderType>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /**
   * @description Advances to the next wizard step, clamped to the maximum step index.
   */
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));

  /**
   * @description Returns to the previous wizard step, clamped to step 0.
   */
  const prev = () => setStep(s => Math.max(s - 1, 0));

  /**
   * @description Saves the selected provider configuration (API key or Ollama URL)
   * to chrome.storage.local, marks onboarding as complete, and advances to the next step.
   * Sets the `saved` flag on success so the final step can display a confirmation.
   */
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

  /**
   * @description Marks onboarding as complete in storage and closes the onboarding tab.
   */
  const finish = () => {
    chrome.storage.local.set({ onboardingComplete: true }, () => {
      window.close();
    });
  };

  /**
   * @description Skips the entire onboarding flow, marks it as complete, and closes the tab.
   */
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
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-5xl mb-4">
                <span role="img" aria-label="tabs">&#x1F4CB;</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Welcome to Tab Manager Pro
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The extension that uses artificial intelligence to automatically
                organize your Chrome tabs into thematic groups.
              </p>
              <div className="space-y-2 text-left text-sm text-gray-600 mb-8">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Smart AI grouping (Claude, GPT, Gemini, Mistral, Ollama)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Session save and restore</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>Thematic workspaces for your projects</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">&#x2022;</span>
                  <span>AI chat to control your tabs with natural language</span>
                </div>
              </div>
              <button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Start setup
              </button>
              <button onClick={skipOnboarding} className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600">
                Skip introduction
              </button>
            </div>
          )}

          {/* Step 1: Choose provider */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Choose your AI provider</h2>
              <p className="text-sm text-gray-500 mb-5">
                You can add more providers later in the settings.
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
                      {p === 'anthropic' && 'Claude model — Excellent for semantic analysis'}
                      {p === 'openai' && 'GPT-4o-mini — Fast and affordable'}
                      {p === 'gemini' && 'Gemini 2.0 Flash — Google integration'}
                      {p === 'mistral' && 'Mistral Small — High-performance European model'}
                      {p === 'ollama' && 'Local mode — No data sent online'}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={prev} className="text-gray-500 hover:text-gray-700 text-sm">Back</button>
                <button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: API key setup */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Configure {PROVIDER_LABELS[provider]}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {provider === 'ollama'
                  ? 'Make sure Ollama is running on your machine.'
                  : 'Enter your API key. It is stored locally in your browser only.'}
              </p>

              {provider === 'ollama' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ollama Server URL</label>
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
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">API Key</label>
                  <input
                    type="password"
                    className="w-full border-2 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={PROVIDER_PLACEHOLDERS[provider]}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Your key is stored locally in chrome.storage only.
                  </p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={prev} className="text-gray-500 hover:text-gray-700 text-sm">Back</button>
                <button
                  onClick={saveAndNext}
                  disabled={saving || (provider !== 'ollama' && !apiKey.trim())}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-300"
                >
                  {saving ? 'Saving...' : 'Save and continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Discover the features</h2>
              <p className="text-sm text-gray-500 mb-5">
                Here's how to use Tab Manager Pro every day:
              </p>

              <div className="space-y-4">
                <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">&#x1F3AF;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">AI Grouping</div>
                    <div className="text-xs text-gray-600">Click "Group with AI" in the popup to automatically organize your tabs.</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">&#x1F4BE;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Sessions</div>
                    <div className="text-xs text-gray-600">Save all your open tabs and restore them later with one click.</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">&#x1F4C1;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">Workspaces</div>
                    <div className="text-xs text-gray-600">Create thematic workspaces to quickly switch between your projects.</div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-yellow-50 rounded-lg">
                  <span className="text-2xl">&#x1F4AC;</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">AI Chat</div>
                    <div className="text-xs text-gray-600">Open the side panel to control your tabs with natural language: "Close duplicates".</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={prev} className="text-gray-500 hover:text-gray-700 text-sm">Back</button>
                <button onClick={next} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-5xl mb-4">
                <span role="img" aria-label="rocket">&#x1F680;</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                All set!
              </h2>
              <p className="text-gray-600 mb-2">
                {saved
                  ? `${PROVIDER_LABELS[provider]} is configured.`
                  : 'You can configure your provider in the popup.'}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Click the extension icon in your toolbar to get started.
              </p>

              <button onClick={finish} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                Start using Tab Manager Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
