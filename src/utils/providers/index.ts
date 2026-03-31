/**
 * @module providers
 * @description Public barrel export for the AI provider system. Re-exports all types,
 * constants, and the {@link ProviderManager} class needed by the rest of the application
 * to interact with AI providers for tab grouping and chat.
 */

export type { IAIProvider, TabData, GroupingSuggestion, ProviderConfig, ProviderType, ChatMessage } from './types';
export { PROVIDER_LABELS, PROVIDER_PLACEHOLDERS } from './types';
export { ProviderManager, loadProviderManagerConfig } from './manager';
export type { ProviderManagerConfig } from './manager';
