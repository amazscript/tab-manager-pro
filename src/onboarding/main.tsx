/**
 * @module onboarding/main
 * @description Entry point for the Tab Manager Pro onboarding page.
 * Mounts the {@link OnboardingFlow} component into the DOM element with id "root"
 * using React 18's createRoot API, wrapped in React.StrictMode for
 * development-time checks and warnings. This page is opened automatically
 * on first install of the extension.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { OnboardingFlow } from './OnboardingFlow';
// @ts-ignore
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OnboardingFlow />
  </React.StrictMode>
);
