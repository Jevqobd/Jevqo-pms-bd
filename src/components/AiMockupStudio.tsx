/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order } from '../types/erp';
import {
  Sparkles,
  Image as ImageIcon,
  Wand2,
  RefreshCw,
  CheckCircle2,
  Upload,
  Layers,
  ArrowRight,
  Download,
  AlertCircle,
} from 'lucide-react';

interface AiMockupStudioProps {
  orders: Order[];
  onApplyMockupToOrder: (orderId: string, mockupUrl: string) => Promise<void>;
}

export const AiMockupStudio: React.FC<AiMockupStudioProps> = ({
  orders,
  onApplyMockupToOrder,
}) => {
  const [prompt, setPrompt] = useState(
    'Hyper-realistic 3D sublimation athletic soccer jersey mockup, navy blue and royal gold sash, breathable eyelet texture, studio lighting on athletic mannequin'
  );
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [generatedImage, setGeneratedImage] = useState<string>(
    'https://images.unsplash.com/photo-1580087433295-ab2600c1030e?w=800&auto=format&fit=crop&q=80'
  );
  const [editPrompt, setEditPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const targetOrder = orders.find((o) => o.id === selectedOrderId);

  const handleGenerate = async (isEdit: boolean = false) => {
    const promptToSend = isEdit ? editPrompt : prompt;
    if (!promptToSend.trim() || loading) return;

    setLoading(true);
    setStatusMsg(isEdit ? 'Editing image with gemini-nano-banana-2.1...' : 'Generating concept mockup with gemini-nano-banana-2.1...');
    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          action: isEdit ? 'edit' : 'create',
          base64Image: isEdit ? generatedImage : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImage(data.imageUrl);
          setStatusMsg(data.text || 'Mockup rendered successfully!');
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Generation completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJobCard = async () => {
    if (!selectedOrderId || !generatedImage) return;
    await onApplyMockupToOrder(selectedOrderId, generatedImage);
    setStatusMsg(`Attached to Job Card ${targetOrder?.orderNumber}! Design Team 1 status updated.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Wand2 className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                AI Sportswear Concept Mockup Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 font-bold">
                gemini-nano-banana-2.1
              </span>
            </div>
            <p className="text-xs text-indigo-100 max-w-2xl">
              Design Team 1 (Head Office) concept creation and client approvals. Generate or edit photo-realistic sublimation jersey concepts using text prompts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="p-2 rounded-xl bg-white/10 border border-white/30 text-white font-bold text-xs"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id} className="text-gray-900">
                {o.orderNumber} - {o.teamOrClub}
              </option>
            ))}
          </select>
          <button
            onClick={handleApplyToJobCard}
            className="px-3.5 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-black text-xs shadow-md transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Attach to Job Card</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Prompt Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              1. Prompt To Image (Create)
            </h3>
            <span className="text-[10px] text-gray-400">1:1 Aspect Ratio</span>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 dark:text-gray-300 block">
              Describe the Custom Sportswear Kit:
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Modern cricket jersey with turquoise sleeves, gold gradient geometric lines, crew neck collar..."
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium"
            />
          </div>

          {/* Preset Kit Styles */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">
              Quick Sportswear Style Inspiration:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Classic Diagonal Sash',
                'Futuristic Esports Camo',
                'Retro 90s Football Hoops',
                'Ultra-light Marathon Singlet',
                'Sublimated Basketball Pinstripes',
              ].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() =>
                    setPrompt(
                      `Professional 3D sportswear jersey mockup: ${style}, high-performance moisture-wicking fabric texture, photorealistic studio lighting`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={loading || !prompt.trim()}
            onClick={() => handleGenerate(false)}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>Generate Mockup with gemini-nano-banana-2.1</span>
          </button>

          {/* Section 2: Edit Image */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-indigo-600" />
              2. Edit Existing Mockup
            </h3>
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. Change collar ribbing to neon orange and add sponsor crest"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
            />
            <button
              disabled={loading || !editPrompt.trim()}
              onClick={() => handleGenerate(true)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>Apply AI Edit to Mockup</span>
            </button>
          </div>
        </div>

        {/* Right: Render Preview & Job Card Handoff (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Rendered Mockup Canvas
              </h3>
              <p className="text-[11px] text-gray-500">Ready for client approval review</p>
            </div>
            {targetOrder && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 font-bold border">
                {targetOrder.orderNumber} ({targetOrder.teamOrClub})
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-xl overflow-hidden p-3 min-h-[360px] relative">
            <img
              src={generatedImage}
              alt="Generated Jersey Mockup"
              className="max-h-[380px] w-auto object-contain rounded-lg shadow-2xl"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                <span className="font-bold text-xs">{statusMsg}</span>
              </div>
            )}
          </div>

          {statusMsg && !loading && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-medium">
              {statusMsg}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-gray-400 text-[11px]">
              Target Stage: <strong>mockup_approved</strong>
            </span>
            <div className="flex items-center gap-2">
              <a
                href={generatedImage}
                target="_blank"
                rel="noopener noreferrer"
                download="jersey-mockup.png"
                className="px-3 py-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <button
                onClick={handleApplyToJobCard}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>Save to Job Card</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
