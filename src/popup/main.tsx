/**
 * @module popup/main
 * @description Entry point for the Tab Manager Pro popup page.
 * Mounts the root {@link App} component into the DOM element with id "root"
 * using React 18's createRoot API, wrapped in React.StrictMode for
 * development-time checks and warnings.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// @ts-ignore
import '../index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
