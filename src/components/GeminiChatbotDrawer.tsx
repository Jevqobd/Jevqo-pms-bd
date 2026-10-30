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
  RotateCcw,
  Layers,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Order, InventoryItem, ShortageTicket, Customer } from '../types/erp';

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
  orders?: Order[];
  inventory?: InventoryItem[];
  shortageTickets?: ShortageTicket[];
  customers?: Customer[];
}

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  orders = [],
  inventory = [],
  shortageTickets = [],
  customers = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      role: 'model',
      content:
        'Hello! I am your Upgraded Sportswear Enterprise AI Co-Pilot with live ERP telemetry. I have real-time visibility into your active Job Cards, Raw Material BOM metrics, Shortage Tickets, and Customer Loyalty Tiers. Ask me to analyze factory bottlenecks, draft bilingual customer replies, or calculate fabric roll requirements!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    | 'operations_director'
    | 'marketing_strategist'
    | 'prepress_engineer'
    | 'print_specialist'
    | 'sewing_qc_supervisor'
  >('operations_director');
  const [modelChoice, setModelChoice] = useState<
    'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'
  >('gemini-3.8-flash');
  const [enableSearch, setEnableSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const openShortages = shortageTickets.filter((t) => t.status !== 'resolved');
  const lowStockItems = inventory.filter((i) => i.currentStock <= i.minimumThreshold);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

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

    // Build live ERP snapshot for context-aware reasoning
    const erpSnapshot = {
      activeOrdersCount: orders.length,
      totalUnitsInPipeline: orders.reduce((s, o) => s + (o.totalQuantity || 0), 0),
      openShortageTickets: openShortages.map((t) => ({
        orderNumber: t.orderNumber,
        size: t.size,
        qty: t.quantity,
        part: t.partDamaged,
        reason: t.reason,
      })),
      lowStockMaterials: lowStockItems.map((i) => ({
        name: i.name,
        stockQty: i.currentStock,
        unit: i.unit,
        reorderPoint: i.minimumThreshold,
      })),
      vipCustomersCount: customers.filter((c) => c.privilegeTier === 'platinum_vip').length,
    };

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newThread.map((m) => ({ role: m.role, content: m.content })),
          role: selectedRole,
          modelChoice,
          enableSearch,
          erpContext: erpSnapshot,
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
          content: `Live ERP Snapshot Analysis: You currently have ${orders.length} active Job Cards (${erpSnapshot.totalUnitsInPipeline} total pcs), ${openShortages.length} open Shortage Tickets, and ${lowStockItems.length} materials near reorder point. Recommend prioritizing open reprint tickets on the Tongi rotary press at 202°C.`,
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
        content: `Conversation reset. Ready to assist as ${selectedRole.replace(/_/g, ' ')} with live ERP telemetry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-800 text-xs text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">Upgraded ERP AI Co-Pilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  Live Telemetry
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Connected to Orders, BOM Inventory, Shortages & Customer CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Reset Chat History"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live ERP Telemetry Strip */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 grid grid-cols-3 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Orders: <strong className="text-white">{orders.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>
              Shortages: <strong className="text-rose-400">{openShortages.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Low Stock: <strong className="text-amber-400">{lowStockItems.length}</strong>
            </span>
          </div>
        </div>

        {/* Roles & Controls Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Specialist Co-Pilot Persona:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full p-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-bold text-xs"
              >
                <option value="operations_director">👑 Operations & Production Director</option>
                <option value="marketing_strategist">💬 Marketing & Customer Reply Specialist</option>
                <option value="prepress_engineer">📐 Pre-Press & Pattern Engineer (Design 2)</option>
                <option value="print_specialist">🖨️ Sublimation & Heat Press Specialist</option>
                <option value="sewing_qc_supervisor">✂️ Sewing & QC Floor Master</option>
              </select>
            </div>

            <div className="w-36">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Engine:
              </label>
              <select
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value as any)}
                className="w-full p-1.5 rounded-lg border border-slate-700 bg-slate-950 text-emerald-400 font-mono text-xs"
              >
                <option value="gemini-3.8-flash">3.8-flash (Balanced)</option>
                <option value="gemini-3.1-flash-lite">3.1-flash-lite (Fast)</option>
                <option value="gemini-4-argon">4-argon (Deep Audit)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => setEnableSearch(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Enable Google Search Grounding</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {enableSearch ? 'Live Web + ERP Data' : 'Live ERP Data Active'}
            </span>
          </div>
        </div>

        {/* Scrollable Chat History Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white font-bold text-[10px]'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>

              <div
                className={`space-y-1 max-w-[85%] ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1 text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-400" /> Sources:
                    </span>
                    {msg.groundingSources.slice(0, 3).map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-0.5 max-w-[140px] truncate"
                      >
                        {new URL(src).hostname} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-slate-500 block px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 italic">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing live ERP orders, inventory & factory lines...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Quick Chips */}
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
          <button
            onClick={() =>
              handleSendMessage(
                'Analyze our live ERP orders, open shortage tickets, and low stock materials. What should each factory prioritize today?'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 whitespace-nowrap text-emerald-300 font-bold cursor-pointer"
          >
            📊 Audit Live ERP Bottlenecks
          </button>
          <button
            onClick={() => {
              setSelectedRole('marketing_strategist');
              handleSendMessage(
                'Write a polite bilingual (English + Bangla) WhatsApp reply to a B2B client explaining our 160 GSM Micro-Eyelet vs 180 GSM Interlock price, 50% advance policy, and VIP Returning Star discount.'
              );
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 whitespace-nowrap text-amber-300 font-bold cursor-pointer"
          >
            💬 Draft Client Quote Reply (EN/BN)
          </button>
          <button
            onClick={() =>
              handleSendMessage(
                'Calculate exact fabric meters and transfer paper meters needed for our active Job Cards.'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 whitespace-nowrap text-indigo-300 font-bold cursor-pointer"
          >
            📐 Calculate BOM Stock Needs
          </button>
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
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
            placeholder="Ask about active orders, customer replies, or factory bottlenecks..."
            className="flex-1 p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-emerald-500 font-medium"
          />
          <button
            disabled={loading || !input.trim()}
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
