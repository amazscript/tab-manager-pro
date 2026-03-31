/**
 * @module sentry
 * @description Sentry error tracking integration for Tab Manager Pro.
 * Provides initialization, error capture, and message logging utilities
 * that wrap the Sentry SDK. Sensitive data (e.g., API keys) is stripped
 * before events are sent. All functions are safe to call before initialization;
 * they will either no-op or fall back to console logging.
 */

import * as Sentry from '@sentry/browser';

/**
 * @description The Sentry Data Source Name (DSN) used to route events to the correct project.
 * Must be replaced with an actual DSN for Sentry integration to function.
 * @constant {string}
 */
const SENTRY_DSN = ''; // Replace with your actual Sentry DSN

/**
 * @description Tracks whether Sentry has been successfully initialized.
 * Prevents duplicate initialization and guards capture calls.
 */
let initialized = false;

/**
 * @description Initializes the Sentry SDK with the configured DSN, environment,
 * and release version derived from the Chrome extension manifest. Does nothing
 * if already initialized or if no DSN is configured.
 *
 * The following configuration is applied:
 * - Environment: `'production'`
 * - Release: `tab-manager-pro@{manifest version}`
 * - Traces sample rate: 10%
 * - Sensitive fields (e.g., `apiKey`) are stripped from event extras before sending
 *
 * @returns {void}
 *
 * @example
 * ```ts
 * // Call once at extension startup
 * initSentry();
 * ```
 */
export function initSentry() {
  if (initialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    release: `tab-manager-pro@${chrome.runtime.getManifest().version}`,
    // Limit volume in production
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Don't send if no DSN configured
      if (!SENTRY_DSN) return null;
      // Remove sensitive info (API keys)
      if (event.extra) {
        delete event.extra['apiKey'];
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * @description Captures an error and sends it to Sentry with optional context.
 * Always logs to the console regardless of Sentry initialization status.
 *
 * @param {Error} error - The error object to capture.
 * @param {Record<string, any>} [context] - Optional key-value pairs to attach as extra context to the Sentry event.
 * @returns {void}
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   captureError(err as Error, { tabId: 42, action: 'close' });
 * }
 * ```
 */
export function captureError(error: Error, context?: Record<string, any>) {
  console.error('[TabManagerPro]', error.message, context);
  if (initialized) {
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * @description Sends a plain text message to Sentry at the specified severity level.
 * Does nothing if Sentry has not been initialized.
 *
 * @param {string} message - The message text to send.
 * @param {'info' | 'warning' | 'error'} [level='info'] - The severity level for the message.
 * @returns {void}
 *
 * @example
 * ```ts
 * captureMessage('User opened workspace with 50 tabs', 'info');
 * captureMessage('API rate limit approaching', 'warning');
 * ```
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (initialized) {
    Sentry.captureMessage(message, level);
  }
}
