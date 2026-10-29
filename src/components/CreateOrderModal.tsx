/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, SizeBreakdown, PlayerRosterItem } from '../types/erp';
import { X, Plus, Sparkles, DollarSign, Users, Layers, ShieldCheck } from 'lucide-react';
import { calculateOrderTotals, parseRosterInput } from '../utils/erpLogic';
import { askGeminiProductionCopilot } from '../services/geminiService';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: Order) => Promise<void>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
}) => {
  if (!isOpen) return null;

  const [clientName, setClientName] = useState('');
  const [orderType, setOrderType] = useState<'b2b' | 'b2c'>('b2b');
  const [clientPhone, setClientPhone] = useState('');
  const [teamOrClub, setTeamOrClub] = useState('');
  const [sportType, setSportType] = useState('Football / Soccer');
  const [fabricType, setFabricType] = useState('Micro-Eyelet 160 GSM');
  const [gsm, setGsm] = useState(160);
  const [unitPrice, setUnitPrice] = useState(16.0);
  const [advanceAmount, setAdvanceAmount] = useState(150.0);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Sizes & Roster
  const [sizeBreakdown, setSizeBreakdown] = useState<SizeBreakdown>({
    S: 4,
    M: 10,
    L: 8,
    XL: 2,
    '2XL': 0,
  });
  const [roster, setRoster] = useState<PlayerRosterItem[]>([]);
  const [rawRosterInput, setRawRosterInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute total qty from size breakdown
  const totalQuantity = Object.values(sizeBreakdown).reduce((a, b) => a + (b || 0), 0);
  const totals = calculateOrderTotals(totalQuantity, unitPrice, advanceAmount);

  const handleSizeChange = (sizeKey: string, val: number) => {
    setSizeBreakdown((prev) => ({
      ...prev,
      [sizeKey]: Math.max(0, val || 0),
    }));
  };

  const handleParseRosterWithAi = async () => {
    if (!rawRosterInput.trim()) return;
    setIsAiParsing(true);
    try {
      const aiResult = await askGeminiProductionCopilot(rawRosterInput, {
        teamName: teamOrClub,
        fabricType,
      });

      if (aiResult.parsedRoster && aiResult.parsedRoster.length > 0) {
        const formattedRoster = aiResult.parsedRoster.map((p, idx) => ({
          id: `p-${idx + 1}-${Date.now().toString(36)}`,
          name: p.name,
          number: p.number,
          size: p.size,
        }));
        setRoster(formattedRoster);
      }
      if (aiResult.sizeBreakdown) {
        setSizeBreakdown(aiResult.sizeBreakdown);
      }
    } catch (err) {
      // Local fallback
      const parsed = parseRosterInput(rawRosterInput);
      setRoster(parsed.roster);
      setSizeBreakdown(parsed.sizeBreakdown);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || totalQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      const orderNumber = `SW-2026-0${Math.floor(100 + Math.random() * 900)}`;
      const newOrder: Order = {
        id: `ord-${Date.now().toString(36)}`,
        orderNumber,
        orderType,
        channel: orderType === 'b2b' ? 'corporate_po' : 'retail_web',
        clientName,
        clientPhone,
        teamOrClub: teamOrClub || 'Team Jersey Order',
        sportType,
        fabricType,
        gsm,
        totalQuantity,
        unitPrice,
        totalAmount: totals.totalAmount,
        advanceAmount: totals.advanceAmount,
        dueAmount: totals.dueAmount,
        paymentStatus: totals.paymentStatus,
        paymentReference,
        paymentProofUrl,
        sizeBreakdown,
        roster: roster.length > 0 ? roster : undefined,
        stage: 'payment_pending',
        currentLocation: 'head_office',
        deliveryAddress,
        hasShortage: 'no',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'marketing@sportswear.erp',
      };

      await onCreateOrder(newOrder);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                Create New Sportswear Job Card
              </h2>
              <p className="text-xs text-gray-500">
                Marketing & CRM Department &bull; Head Office
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Section 1: Client & Team Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
                <Users className="w-3.5 h-3.5" /> 1. Client & Order Category
              </h3>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrderType('b2b')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    orderType === 'b2b' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500'
                  }`}
                >
                  B2B Club / Bulk
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('b2c')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                    orderType === 'b2c' ? 'bg-pink-600 text-white shadow-xs' : 'text-gray-500'
                  }`}
                >
                  B2C Direct / Retail
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Client / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangladesh Football Academy"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Contact Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  placeholder="+880 1712-345678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Team / Club / Tournament Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thunder FC Kit"
                  value={teamOrClub}
                  onChange={(e) => setTeamOrClub(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fabric & Sport Type */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
              <Layers className="w-3.5 h-3.5" /> 2. Sport & Sublimation Fabric
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Sport Type
                </label>
                <select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium"
                >
                  <option value="Football / Soccer">Football / Soccer</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Athletics / Running">Athletics / Running</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Esports">Esports</option>
                  <option value="Badminton">Badminton</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Fabric Type *
                </label>
                <select
                  value={fabricType}
                  onChange={(e) => {
                    setFabricType(e.target.value);
                    if (e.target.value.includes('180')) setGsm(180);
                    else if (e.target.value.includes('170')) setGsm(170);
                    else if (e.target.value.includes('130')) setGsm(130);
                    else setGsm(160);
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium"
                >
                  <option value="Micro-Eyelet 160 GSM">Micro-Eyelet 160 GSM (Popular)</option>
                  <option value="Poly Interlock 180 GSM">Poly Interlock 180 GSM (Durable)</option>
                  <option value="Dot Mesh Poly 170 GSM">Dot Mesh Poly 170 GSM (Breathable)</option>
                  <option value="FeatherPoly 130 GSM">FeatherPoly 130 GSM (Ultra Light)</option>
                  <option value="Spandex Poly Blend 200 GSM">Spandex Poly Blend 200 GSM (Compression)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Delivery Destination
                </label>
                <input
                  type="text"
                  placeholder="Dhaka / Chittagong / Courier pickup"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Roster & Size Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-750 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
                <Users className="w-3.5 h-3.5" /> 3. Jersey Sizes & Team Roster
              </h3>
              <span className="font-extrabold text-indigo-600">
                Total Quantity: {totalQuantity} pcs
              </span>
            </div>

            {/* Manual Size Inputs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['XS', 'S', 'M', 'L', 'XL', '2XL'].map((sz) => (
                <div key={sz} className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <span className="font-bold text-[11px] text-gray-500 block mb-1">{sz}</span>
                  <input
                    type="number"
                    min={0}
                    value={sizeBreakdown[sz] || 0}
                    onChange={(e) => handleSizeChange(sz, parseInt(e.target.value) || 0)}
                    className="w-full text-center font-bold text-xs p-1 border rounded"
                  />
                </div>
              ))}
            </div>

            {/* Smart / AI Roster Paste */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  Quick Paste WhatsApp Roster / Player List:
                </label>
                <button
                  type="button"
                  disabled={isAiParsing || !rawRosterInput.trim()}
                  onClick={handleParseRosterWithAi}
                  className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  {isAiParsing ? 'Parsing with Gemini...' : '⚡ AI Parse Roster'}
                </button>
              </div>
              <textarea
                rows={3}
                value={rawRosterInput}
                onChange={(e) => setRawRosterInput(e.target.value)}
                placeholder="Paste lines like:&#10;10 - Lionel Messi - L&#10;7 - Cristiano Ronaldo - M&#10;#8 | Bruno | XL"
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
              />
              {roster.length > 0 && (
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{roster.length} player roster entries generated and linked to this Job Card.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Pricing & Advance Payment */}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-600">
              <DollarSign className="w-3.5 h-3.5" /> 4. Pricing & Advance Payment
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-850 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="font-semibold text-gray-500 block mb-1">Unit Price ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-500 block mb-1">Total Bill ($)</label>
                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-extrabold text-sm text-gray-900 dark:text-white">
                  ${totals.totalAmount}
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-500 block mb-1">Advance Received ($)</label>
                <input
                  type="number"
                  step="10"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-500 block mb-1">Due Amount ($)</label>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 font-extrabold text-sm text-amber-700 dark:text-amber-300">
                  ${totals.dueAmount}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Payment Reference / Txn ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. bKash Txn ID / Bank Deposit Slip"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Payment Screenshot Link (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://... receipt image"
                  value={paymentProofUrl}
                  onChange={(e) => setPaymentProofUrl(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalQuantity <= 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order & Generate Job Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
