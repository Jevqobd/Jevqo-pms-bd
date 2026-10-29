/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Globe,
  ExternalLink,
  ShieldAlert,
  Cpu,
  RotateCcw,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  groundingSources?: string[];
  timestamp: string;
}

interface GeminiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      role: 'model',
      content:
        'Hello! I am your Sportswear Enterprise AI Assistant. I can advise on production bottlenecks across your 3 facilities (Head Office, Print Factory, Sewing Factory), calculate roll nesting, troubleshoot heat press sublimation temperatures, or query real-time market standards using Google Search Grounding.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'operations_director' | 'prepress_engineer' | 'print_specialist' | 'sewing_qc_supervisor'>('operations_director');
  const [modelChoice, setModelChoice] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [enableSearch, setEnableSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newThread.map((m) => ({ role: m.role, content: m.content })),
          role: selectedRole,
          modelChoice,
          enableSearch,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'model',
            content: data.text || 'I have analyzed the request.',
            groundingSources: data.groundingSources,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'model',
          content: 'I encountered a network hiccup connecting to the server. Local parameters: Keep calendar heat press at 200°C for 35s dwell time on 160 GSM eyelet polyester.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `m-${Date.now()}`,
        role: 'model',
        content: `Conversation reset. Ready to assist as ${selectedRole.replace(/_/g, ' ')}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 text-xs animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">
                  Multi-Turn ERP Assistant
                </h3>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/20 font-mono font-bold">
                  {modelChoice}
                </span>
              </div>
              <p className="text-[11px] text-indigo-100">
                Specialized AI roles for Head Office, Print & Sewing Factories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Reset Chat History"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Roles & Controls Bar */}
        <div className="p-3 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Chatbot Persona / Role:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-xs"
              >
                <option value="operations_director">👑 Operations & Production Director</option>
                <option value="prepress_engineer">📐 Pre-Press & Pattern Engineer (Design 2)</option>
                <option value="print_specialist">🖨️ Sublimation & Heat Press Specialist</option>
                <option value="sewing_qc_supervisor">✂️ Sewing & QC Floor Master</option>
              </select>
            </div>

            <div className="w-36">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Model:
              </label>
              <select
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value as any)}
                className="w-full p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono text-xs"
              >
                <option value="gemini-3.8-flash">3.8-flash (General)</option>
                <option value="gemini-3.1-flash-lite">3.1-flash-lite (Fast)</option>
                <option value="gemini-4-argon">4-argon (Complex)</option>
              </select>
            </div>
          </div>

          {/* Google Search Grounding Toggle */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300 font-semibold">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => setEnableSearch(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Enable Google Search Grounding</span>
            </label>
            <span className="text-[10px] text-gray-400">
              {enableSearch ? 'Live Web Search Active' : 'Offline Factory Knowledge'}
            </span>
          </div>
        </div>

        {/* Scrollable Chat History Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white font-bold text-[10px]'
                    : 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`space-y-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Grounding Source Citations */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1 text-[10px]">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-500" /> Sources:
                    </span>
                    {msg.groundingSources.slice(0, 3).map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-0.5 max-w-[140px] truncate"
                      >
                        {new URL(src).hostname} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-gray-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 italic">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{enableSearch ? 'Searching Google & reasoning...' : 'Consulting manufacturing knowledge base...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Quick Chips */}
        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800 flex gap-1.5 overflow-x-auto text-[10px]">
          <button
            onClick={() => handleSendMessage('What temperature and dwell speed are recommended for calendar heat press transfer on 180 GSM poly interlock?')}
            className="px-2 py-1 rounded bg-white dark:bg-gray-800 border hover:border-indigo-400 whitespace-nowrap text-gray-600 dark:text-gray-300"
          >
            🔥 Heat Press Temp
          </button>
          <button
            onClick={() => handleSendMessage('How do I minimize fabric waste when nesting 50 football kits on 1.52m sublimation rolls?')}
            className="px-2 py-1 rounded bg-white dark:bg-gray-800 border hover:border-indigo-400 whitespace-nowrap text-gray-600 dark:text-gray-300"
          >
            📐 Roll Nesting
          </button>
          <button
            onClick={() => {
              setEnableSearch(true);
              handleSendMessage('Check current official FIFA tournament jersey numbering and sleeve badge size regulations');
            }}
            className="px-2 py-1 rounded bg-white dark:bg-gray-800 border hover:border-indigo-400 whitespace-nowrap text-gray-600 dark:text-gray-300"
          >
            🌐 FIFA Badge Specs (Search)
          </button>
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about factory orders, sublimation specs..."
            className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          <button
            disabled={loading || !input.trim()}
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
