/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Copy, Check, Bolt, Layers, Clock, AlertTriangle } from 'lucide-react';
import { askGeminiProductionCopilot, AiProductionAnalysisResult } from '../services/geminiService';
import { Order } from '../types/erp';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onApplyRosterToOrder?: (orderId: string, roster: any[], sizes: any) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  if (!isOpen) return null;

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState(orders[0]?.orderNumber || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiProductionAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const activeOrder = orders.find((o) => o.orderNumber === selectedOrderNumber) || orders[0];

  const handleRunAiAnalysis = async (customPrompt?: string) => {
    const promptToUse = customPrompt || inputPrompt;
    if (!promptToUse.trim()) return;

    setLoading(true);
    try {
      const response = await askGeminiProductionCopilot(promptToUse, {
        orderNumber: activeOrder?.orderNumber,
        teamName: activeOrder?.teamOrClub,
        totalQty: activeOrder?.totalQuantity,
        fabricType: activeOrder?.fabricType,
        stage: activeOrder?.stage,
      });
      setResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = () => {
    if (result?.clientUpdateMessage) {
      navigator.clipboard.writeText(result.clientUpdateMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Bolt className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  Gemini Production Copilot
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold font-mono">
                  gemini-3.1-flash-lite
                </span>
              </div>
              <p className="text-[11px] text-violet-100">
                Low-latency AI assistant for sublimation calculations, rosters & client updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Active Job Context Selector */}
          <div className="flex items-center justify-between gap-3 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Active Job Card Context:
            </span>
            <select
              value={selectedOrderNumber}
              onChange={(e) => setSelectedOrderNumber(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono font-bold"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.orderNumber}>
                  {o.orderNumber} - {o.teamOrClub} ({o.totalQuantity} pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Quick AI Action Buttons */}
          <div>
            <span className="font-bold text-gray-400 uppercase text-[10px] block mb-2">
              Instant 1-Click Low-Latency Prompts:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleRunAiAnalysis(
                    `Calculate fabric meterage, sublimation paper roll length, and CMYK ink for order ${activeOrder?.orderNumber} (${activeOrder?.totalQuantity} pcs of ${activeOrder?.fabricType}).`
                  )
                }
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition"
              >
                <strong className="block text-gray-900 dark:text-white font-bold">
                  🧵 Calculate Fabric & Sublimation Ink
                </strong>
                <span className="text-[11px] text-gray-500">
                  Linear meters with 6% cutting waste margin
                </span>
              </button>

              <button
                onClick={() =>
                  handleRunAiAnalysis(
                    `Draft a polite WhatsApp update message for the client about order ${activeOrder?.orderNumber} (${activeOrder?.teamOrClub}) currently at ${activeOrder?.stage}.`
                  )
                }
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition"
              >
                <strong className="block text-gray-900 dark:text-white font-bold">
                  📱 Draft Client WhatsApp Status
                </strong>
                <span className="text-[11px] text-gray-500">
                  Professional estimated delivery & status draft
                </span>
              </button>

              <button
                onClick={() =>
                  handleRunAiAnalysis(
                    `Analyze factory lead times and potential bottlenecks between Head Office, Print Factory, and Sewing Factory for this order.`
                  )
                }
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition"
              >
                <strong className="block text-gray-900 dark:text-white font-bold">
                  ⚠️ 3-Factory Bottleneck Audit
                </strong>
                <span className="text-[11px] text-gray-500">
                  Rotary calendar press & sewing queue check
                </span>
              </button>

              <button
                onClick={() => {
                  setInputPrompt(`10 - Lionel Messi - L\n7 - Cristiano Ronaldo - M\n8 - Bruno Fernandes - XL\n1 - Alisson Becker - XXL\n11 - Mohamed Salah - L`);
                }}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition"
              >
                <strong className="block text-gray-900 dark:text-white font-bold">
                  📋 Load Sample Roster for AI Parsing
                </strong>
                <span className="text-[11px] text-gray-500">
                  Extracts numbers, names, sizes automatically
                </span>
              </button>
            </div>
          </div>

          {/* Prompt Input Box */}
          <div className="space-y-1.5">
            <label className="font-semibold text-gray-700 dark:text-gray-300 block">
              Custom Prompt or Paste Raw Roster:
            </label>
            <div className="flex gap-2">
              <textarea
                rows={3}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask anything or paste WhatsApp roster e.g. 10 Messi L, 7 Ronaldo M..."
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end">
              <button
                disabled={loading || !inputPrompt.trim()}
                onClick={() => handleRunAiAnalysis()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                {loading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{loading ? 'Thinking...' : 'Generate with Gemini'}</span>
              </button>
            </div>
          </div>

          {/* AI Response Display */}
          {result && (
            <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-750 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-violet-600" />
                  Gemini Flash-Lite Output:
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  Sub-second response
                </span>
              </div>

              {/* Roster & Size breakdown if parsed */}
              {result.parsedRoster && result.parsedRoster.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200">
                    Parsed Team Roster ({result.parsedRoster.length} Players):
                  </h4>
                  <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-white dark:bg-gray-800 divide-y">
                    {result.parsedRoster.map((p, idx) => (
                      <div key={idx} className="py-1 flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-600">#{p.number} {p.name}</span>
                        <span className="font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                          Size {p.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Material Yield */}
              {result.fabricMetersNeeded && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg border">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Fabric Needed:</span>
                    <strong className="text-indigo-600 font-extrabold">{result.fabricMetersNeeded}m</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Sublimation Paper:</span>
                    <strong className="text-teal-600 font-extrabold">{result.transferPaperMeters}m</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">CMYK Ink:</span>
                    <strong className="text-amber-600 font-extrabold">~{result.inkEstimatedMl} ml</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Roll Allocation:</span>
                    <strong className="text-gray-900 dark:text-white font-extrabold">{result.suggestedRolls} Rolls</strong>
                  </div>
                </div>
              )}

              {/* Bottleneck / Risk */}
              {result.riskAssessment && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Production Scheduling Note:</strong>
                    <span>{result.riskAssessment}</span>
                  </div>
                </div>
              )}

              {/* WhatsApp message copy */}
              {result.clientUpdateMessage && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      WhatsApp Message Draft:
                    </span>
                    <button
                      onClick={handleCopyMessage}
                      className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[10px] flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                    {result.clientUpdateMessage}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
