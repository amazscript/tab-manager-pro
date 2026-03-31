/**
 * @module sidepanel/main
 * @description Entry point for the Tab Manager Pro side panel.
 * Mounts the {@link ChatPanel} component into the DOM element with id "root"
 * using React 18's createRoot API, wrapped in React.StrictMode for
 * development-time checks and warnings.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatPanel } from './ChatPanel';
// @ts-ignore
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChatPanel />
  </React.StrictMode>
);
