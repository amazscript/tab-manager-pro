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
