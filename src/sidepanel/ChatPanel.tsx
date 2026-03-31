/**
 * @module sidepanel/ChatPanel
 * @description Side panel chat component for Tab Manager Pro.
 * Provides a conversational AI interface where users can control their browser tabs
 * using natural language commands (e.g., "Close duplicates", "Group tabs").
 * Messages are sent to the background script for intent parsing and AI processing.
 * Supports chat history persistence and quick-action suggestion chips.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../utils/providers';
import { ChatHistoryEntry } from '../utils/commands';

/**
 * @description Represents a single message displayed in the chat UI.
 * @property {string} id - Unique identifier for the message.
 * @property {'user' | 'assistant'} role - Whether the message is from the user or the AI assistant.
 * @property {string} content - The text content of the message.
 * @property {{ success: boolean; message: string }} [commandResult] - Result of a command execution, if applicable.
 * @property {number} timestamp - Unix timestamp of when the message was created.
 */
interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  commandResult?: { success: boolean; message: string };
  timestamp: number;
}

/** @description Pre-defined quick-action suggestions displayed when the chat is empty. */
const SUGGESTIONS = [
  'Close duplicates',
  'Group tabs',
  'Sort tabs',
  'Save session',
  'Close inactive tabs',
];

/**
 * @description Chat panel component rendered in the Chrome side panel.
 *
 * Allows users to interact with an AI assistant that can execute tab management
 * commands or answer general questions about their open tabs.
 *
 * **State variables:**
 * - `messages` - Array of displayed chat messages (both user and assistant).
 * - `input` - Current value of the text input field.
 * - `loading` - Whether a message is being processed by the background script.
 *
 * **Refs:**
 * - `messagesEndRef` - Used to auto-scroll to the latest message.
 *
 * **Key handlers:**
 * - `sendMessage` - Sends a user message to the background script for processing.
 * - `clearHistory` - Clears all chat history from storage and resets the UI.
 * - `formatChatError` - Converts raw error strings into user-friendly messages.
 *
 * @returns {React.JSX.Element} The rendered chat panel UI.
 *
 * @example
 * // Used as the root component in the side panel entry point:
 * <ChatPanel />
 */
export function ChatPanel() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * @description Loads the persisted chat history from the background script on mount.
   * Converts each {@link ChatHistoryEntry} into a pair of user/assistant {@link DisplayMessage} objects.
   */
  useEffect(() => {
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

  /**
   * @description Auto-scrolls the message list to the bottom whenever new messages are added.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * @description Sends a message to the background script for processing.
   * Appends the user message to the display, builds conversation history (last 20 messages),
   * and handles the AI response or error. Can be called with explicit text (e.g., from
   * suggestion chips) or uses the current input field value.
   * @param {string} [text] - Optional explicit message text. If omitted, uses the input field value.
   */
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

  /**
   * @description Converts raw error strings from the background script into
   * user-friendly chat error messages. Detects authentication, billing,
   * rate-limiting, and configuration issues.
   * @param {string} [error] - The raw error message string.
   * @returns {string} A human-readable error message for display in the chat.
   */
  const formatChatError = (error?: string): string => {
    if (!error) return 'An error occurred. Please try again.';
    const lower = error.toLowerCase();
    if (lower.includes('401') || lower.includes('authentication'))
      return 'Invalid API key. Configure it in the extension popup.';
    if (lower.includes('402') || lower.includes('credit') || lower.includes('balance'))
      return 'Insufficient credits. Top up your account or switch providers.';
    if (lower.includes('429') || lower.includes('rate'))
      return 'Too many requests. Please wait a few seconds.';
    if (lower.includes('no provider configured') || lower.includes('aucun provider'))
      return 'No provider configured. Open the popup to add an API key.';
    return 'Connection error. Please check your configuration.';
  };

  /**
   * @description Clears all persisted chat history via the background script
   * and resets the local message list to empty.
   */
  const clearHistory = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_CHAT_HISTORY' }, (res) => {
      if (res?.success) setMessages([]);
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white" role="main" aria-label="AI Chat">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
        <h1 className="text-white font-bold text-sm">Tab Manager Pro - Chat</h1>
        <button
          onClick={clearHistory}
          className="text-blue-100 hover:text-white text-xs transition-colors"
          title="Clear history"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" role="log" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">Start with a command or a question</p>
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
                  {msg.commandResult.success ? 'Command executed' : 'Failed'}
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
            placeholder="e.g. Close duplicates, Group my tabs..."
            disabled={loading}
            aria-label="Message to send"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
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
