import React, { useState, useEffect } from 'react';
import { Workspace, WORKSPACE_COLORS } from '../utils/storage';

export function WorkspacesPanel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsName, setWsName] = useState('');
  const [wsColor, setWsColor] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadWorkspaces = () => {
    chrome.runtime.sendMessage({ type: 'LIST_WORKSPACES' }, (res) => {
      if (res?.success) setWorkspaces(res.workspaces);
    });
  };

  useEffect(() => { loadWorkspaces(); }, []);

  const createWorkspace = () => {
    if (!wsName.trim()) return;
    setLoading(true);
    chrome.runtime.sendMessage(
      { type: 'CREATE_WORKSPACE', name: wsName.trim(), color: wsColor },
      (res) => {
        setLoading(false);
        if (res?.success) {
          setWsName('');
          showMessage(`Workspace "${res.workspace.name}" cree (${res.workspace.urls.length} URLs)`);
          loadWorkspaces();
        } else {
          showMessage('Erreur : ' + (res?.error || 'Inconnue'));
        }
      }
    );
  };

  const openWorkspace = (id: string) => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'OPEN_WORKSPACE', workspaceId: id }, (res) => {
      setLoading(false);
      if (res?.success) {
        showMessage('Workspace ouvert !');
      } else {
        showMessage('Erreur : ' + (res?.error || 'Inconnue'));
      }
    });
  };

  const updateWorkspace = (id: string) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_WORKSPACE', workspaceId: id }, (res) => {
      if (res?.success) {
        showMessage('Workspace mis a jour !');
        loadWorkspaces();
      }
    });
  };

  const deleteWorkspace = (id: string) => {
    chrome.runtime.sendMessage({ type: 'DELETE_WORKSPACE', workspaceId: id }, (res) => {
      if (res?.success) loadWorkspaces();
    });
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const colorDot = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
      yellow: 'bg-yellow-500', purple: 'bg-purple-500', pink: 'bg-pink-500',
      cyan: 'bg-cyan-500', orange: 'bg-orange-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div>
      {/* Creer */}
      <div className="mb-3">
        <div className="flex gap-1 mb-1.5">
          <input
            type="text"
            className="flex-1 border p-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
            placeholder="Nom du workspace..."
            onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
          />
          <button
            onClick={createWorkspace}
            disabled={loading || !wsName.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:bg-gray-300 transition-colors"
          >
            Creer
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {WORKSPACE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setWsColor(c.value)}
              className={`w-5 h-5 rounded-full ${colorDot(c.value)} transition-all ${
                wsColor === c.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Liste */}
      {workspaces.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">&#x1F4C1;</div>
          <p className="text-xs text-gray-400">Aucun workspace</p>
          <p className="text-xs text-gray-300 mt-1">Creez un espace de travail avec vos onglets actuels</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {workspaces.map(w => (
            <div key={w.id} className="bg-gray-50 rounded p-2 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${colorDot(w.color)} flex-shrink-0`} />
                <span className="font-semibold text-gray-800 truncate flex-1">{w.name}</span>
                <span className="text-gray-400">{w.urls.length} URLs</span>
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => openWorkspace(w.id)}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  Ouvrir
                </button>
                <button
                  onClick={() => updateWorkspace(w.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  MAJ
                </button>
                <button
                  onClick={() => deleteWorkspace(w.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  Suppr.
                </button>
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
