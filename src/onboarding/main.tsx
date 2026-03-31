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
