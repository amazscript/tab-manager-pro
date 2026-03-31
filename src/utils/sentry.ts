import * as Sentry from '@sentry/browser';

const SENTRY_DSN = ''; // A remplacer par le vrai DSN Sentry

let initialized = false;

export function initSentry() {
  if (initialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    release: `tab-manager-pro@${chrome.runtime.getManifest().version}`,
    // Limiter le volume en production
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Ne pas envoyer si pas de DSN configure
      if (!SENTRY_DSN) return null;
      // Retirer les infos sensibles (API keys)
      if (event.extra) {
        delete event.extra['apiKey'];
      }
      return event;
    },
  });

  initialized = true;
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error('[TabManagerPro]', error.message, context);
  if (initialized) {
    Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (initialized) {
    Sentry.captureMessage(message, level);
  }
}
