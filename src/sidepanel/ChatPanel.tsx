import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../utils/providers';
import { ChatHistoryEntry } from '../utils/commands';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  commandResult?: { success: boolean; message: string };
  timestamp: number;
}

const SUGGESTIONS = [
  'Ferme les doublons',
  'Groupe les onglets',
  'Trie les onglets',
  'Sauvegarde la session',
  'Ferme les onglets inactifs',
];

export function ChatPanel() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Charger l'historique
    chrome.runtime.sendMessage({ type: 'LIST_CHAT_HISTORY' }, (res) => {
      if (res?.success && res.history) {
        const displayed: DisplayMessage[] = [];
        for (const entry of (res.history as ChatHistoryEntry[]).reverse()) {
          displayed.push({
            id: entry.id + '-u',
            role: 'user',
            content: entry.userMessage,
            timestamp: entry.timestamp,
          });
          displayed.push({
            id: entry.id + '-a',
            role: 'assistant',
            content: entry.assistantMessage,
            commandResult: entry.commandResult,
            timestamp: entry.timestamp,
          });
        }
        setMessages(displayed);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Construire l'historique de conversation pour le contexte IA
    const conversationHistory: ChatMessage[] = messages
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    chrome.runtime.sendMessage(
      { type: 'CHAT_MESSAGE', text: msg, history: conversationHistory },
      (res) => {
        setLoading(false);
        if (res?.success) {
          const assistantMsg: DisplayMessage = {
            id: Date.now().toString() + '-r',
            role: 'assistant',
            content: res.reply,
            commandResult: res.commandResult,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          const errorMsg: DisplayMessage = {
            id: Date.now().toString() + '-e',
            role: 'assistant',
            content: formatChatError(res?.error),
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    );
  };

  const formatChatError = (error?: string): string => {
    if (!error) return 'Une erreur est survenue. Reessayez.';
    const lower = error.toLowerCase();
    if (lower.includes('401') || lower.includes('authentication'))
      return 'Cle API invalide. Configurez-la dans la popup de l\'extension.';
    if (lower.includes('402') || lower.includes('credit') || lower.includes('balance'))
      return 'Credits insuffisants. Rechargez votre compte ou changez de provider.';
    if (lower.includes('429') || lower.includes('rate'))
      return 'Trop de requetes. Attendez quelques secondes.';
    if (lower.includes('aucun provider'))
      return 'Aucun provider configure. Ouvrez la popup pour ajouter une cle API.';
    return 'Erreur de connexion. Verifiez votre configuration.';
  };

  const clearHistory = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_CHAT_HISTORY' }, (res) => {
      if (res?.success) setMessages([]);
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white" role="main" aria-label="Chat IA">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
        <h1 className="text-white font-bold text-sm">Tab Manager Pro - Chat</h1>
        <button
          onClick={clearHistory}
          className="text-blue-100 hover:text-white text-xs transition-colors"
          title="Effacer l'historique"
        >
          Effacer
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" role="log" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">Commencez par une commande ou une question</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              {msg.commandResult && (
                <div className={`text-xs mb-1 font-semibold ${
                  msg.commandResult.success ? 'text-green-600' : 'text-red-500'
                }`}>
                  {msg.commandResult.success ? 'Commande executee' : 'Echec'}
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ex: Ferme les doublons, Groupe mes onglets..."
            disabled={loading}
            aria-label="Message a envoyer"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Envoyer le message"
            className="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:bg-gray-300 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95l14.095-5.927a.75.75 0 0 0 0-1.37L3.105 2.288Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
