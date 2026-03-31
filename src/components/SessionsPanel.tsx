import React, { useState, useEffect } from 'react';
import { Session } from '../utils/storage';

export function SessionsPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSessions = () => {
    chrome.runtime.sendMessage({ type: 'LIST_SESSIONS' }, (res) => {
      if (res?.success) setSessions(res.sessions);
    });
  };

  useEffect(() => { loadSessions(); }, []);

  const saveSession = () => {
    if (!sessionName.trim()) return;
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'SAVE_SESSION', name: sessionName.trim() }, (res) => {
      setLoading(false);
      if (res?.success) {
        setSessionName('');
        showMessage('Session sauvegardee !');
        loadSessions();
      } else {
        showMessage('Erreur : ' + (res?.error || 'Inconnue'));
      }
    });
  };

  const restoreSession = (id: string) => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'RESTORE_SESSION', sessionId: id }, (res) => {
      setLoading(false);
      if (res?.success) {
        showMessage('Session restauree !');
      } else {
        showMessage('Erreur : ' + (res?.error || 'Inconnue'));
      }
    });
  };

  const deleteSession = (id: string) => {
    chrome.runtime.sendMessage({ type: 'DELETE_SESSION', sessionId: id }, (res) => {
      if (res?.success) loadSessions();
    });
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      {/* Sauvegarder */}
      <div className="mb-3">
        <div className="flex gap-1">
          <input
            type="text"
            className="flex-1 border p-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Nom de la session..."
            onKeyDown={(e) => e.key === 'Enter' && saveSession()}
          />
          <button
            onClick={saveSession}
            disabled={loading || !sessionName.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:bg-gray-300 transition-colors"
          >
            Sauver
          </button>
        </div>
      </div>

      {/* Liste */}
      {sessions.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">&#x1F4BE;</div>
          <p className="text-xs text-gray-400">Aucune session sauvegardee</p>
          <p className="text-xs text-gray-300 mt-1">Sauvegardez vos onglets pour les retrouver plus tard</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {sessions.map(s => (
            <div key={s.id} className="bg-gray-50 rounded p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 truncate flex-1">{s.name}</span>
                <span className="text-gray-400 ml-2 whitespace-nowrap">{formatDate(s.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">
                  {s.windowCount} fen. / {s.tabCount} onglets
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => restoreSession(s.id)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    Ouvrir
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <p className={`mt-2 text-xs text-center font-medium ${message.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
