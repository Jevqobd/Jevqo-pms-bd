/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, UserRole, OrderStage, ShortageTicket } from '../types/erp';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Printer,
  Scissors,
  Truck,
  ExternalLink,
  DollarSign,
  FileText,
  Users,
  Layers,
  Sparkles,
  Download,
  Share2,
  QrCode,
} from 'lucide-react';
import { calculateFabricConsumption, STAGE_ORDER } from '../utils/erpLogic';
import confetti from 'canvas-confetti';

interface OrderModalProps {
  order: Order | null;
  onClose: () => void;
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onOpenRaiseShortage: (order: Order) => void;
  onOpenQrBundleModal?: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  onClose,
  currentRole,
  onUpdateOrder,
  onOpenRaiseShortage,
  onOpenQrBundleModal,
}) => {
  if (!order) return null;

  const [activeTab, setActiveTab] = useState<'workflow' | 'roster' | 'materials' | 'invoice'>('workflow');
  const [mockupInput, setMockupInput] = useState(order.mockupUrl || '');
  const [mockupNotesInput, setMockupNotesInput] = useState(order.mockupNotes || '');
  const [printReadyInput, setPrintReadyInput] = useState(order.printReadyLink || '');
  const [patternSpecInput, setPatternSpecInput] = useState(order.patternSpecSheet || '');
  const [courierInput, setCourierInput] = useState(order.courierName || 'Pathao Express');
  const [trackingInput, setTrackingInput] = useState(order.trackingNumber || '');
  const [deliveryAddressInput, setDeliveryAddressInput] = useState(order.deliveryAddress || '');
  const [isSaving, setIsSaving] = useState(false);

  const materials = calculateFabricConsumption(order.sizeBreakdown || {}, order.fabricType);

  const handleStageChange = async (nextStage: OrderStage, extra: Partial<Order> = {}) => {
    setIsSaving(true);
    try {
      if (nextStage === 'delivered') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
      await onUpdateOrder(order.id, { stage: nextStage, ...extra });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDesignFiles = async () => {
    setIsSaving(true);
    try {
      await onUpdateOrder(order.id, {
        mockupUrl: mockupInput,
        mockupNotes: mockupNotesInput,
        printReadyLink: printReadyInput,
        patternSpecSheet: patternSpecInput,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStageIndex = STAGE_ORDER.indexOf(order.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border border-indigo-200 dark:border-indigo-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Job Card: {order.orderNumber}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                  {order.totalQuantity} Units
                </span>
                {order.hasShortage === 'yes' && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    RE-PRINT ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {order.teamOrClub} &bull; Client: {order.clientName} ({order.clientPhone || 'No phone'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              title="Print or Save Customer Approval PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Approval PDF</span>
            </button>

            {onOpenQrBundleModal && (
              <button
                onClick={() => onOpenQrBundleModal(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Bundle QR Tag</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Manufacturing Progress Visualizer */}
        <div className="px-6 py-3 bg-gray-100/60 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1.5">
            <span className={currentStageIndex >= 1 ? 'text-indigo-600 font-extrabold' : ''}>
              1. Office & Verification
            </span>
            <span className={currentStageIndex >= 3 ? 'text-indigo-600 font-extrabold' : ''}>
              2. Design Specs
            </span>
            <span className={currentStageIndex >= 6 ? 'text-indigo-600 font-extrabold' : ''}>
              3. Print & Press
            </span>
            <span className={currentStageIndex >= 9 ? 'text-indigo-600 font-extrabold' : ''}>
              4. Sewing & QC
            </span>
            <span className={currentStageIndex >= 12 ? 'text-emerald-600 font-extrabold' : ''}>
              5. Delivered
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(8, (currentStageIndex / (STAGE_ORDER.length - 1)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-gray-200 dark:border-gray-800 text-xs font-bold bg-white dark:bg-gray-900">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'workflow'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            ⚙️ Factory Workflow & Actions
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'roster'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            👥 Team Roster & Sizes ({order.roster?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'materials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            🧵 Fabric Yield & Ink
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`py-3 px-3 border-b-2 transition-all ${
              activeTab === 'invoice'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            📄 Invoice & Payment
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              {/* Current Status Box */}
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Current Stage
                  </span>
                  <h3 className="text-base font-black text-gray-900 dark:text-white capitalize">
                    {order.stage.replace(/_/g, ' ')}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mt-1">
                    <span>
                      Location:{' '}
                      <strong className="uppercase text-indigo-700 dark:text-indigo-300">
                        {order.currentLocation.replace('_', ' ')}
                      </strong>
                    </span>
                    {order.collarType && (
                      <span>
                        • Collar:{' '}
                        <strong className="uppercase text-emerald-600 dark:text-emerald-400">
                          {order.collarType.replace('_', ' ')}
                        </strong>
                      </span>
                    )}
                    {order.shorts?.enabled && (
                      <span>
                        • Shorts:{' '}
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          {order.shorts.quantity} pcs ({order.shorts.hasPockets ? 'With Pockets' : 'No Pockets'},{' '}
                          {order.shorts.hasInnerLiner ? 'With Liner' : 'No Liner'})
                        </strong>
                      </span>
                    )}
                    {order.assignedToEmployeeName && (
                      <span>
                        • Dedicated Staff:{' '}
                        <strong className="text-amber-600 dark:text-amber-400">
                          {order.assignedToEmployeeName}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Shortage Button for Sewing Factory */}
                <button
                  onClick={() => onOpenRaiseShortage(order)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-xs transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Raise Shortage Ticket</span>
                </button>
              </div>

              {/* STEP 1: PAYMENT VERIFICATION (HEAD OFFICE) */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Step 1: Payment Verification (Owner Approval)
                    </h4>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    order.paymentStatus === 'paid_in_full' || order.paymentStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 dark:bg-gray-850 p-3 rounded-lg">
                  <div>
                    <span className="text-gray-400 block">Total Billed:</span>
                    <span className="font-bold text-gray-900 dark:text-white">${order.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Advance Received:</span>
                    <span className="font-bold text-emerald-600">${order.advanceAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Due Balance:</span>
                    <span className="font-bold text-amber-600">${order.dueAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Reference:</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                      {order.paymentReference || 'Cash/None'}
                    </span>
                  </div>
                </div>

                {order.paymentProofUrl && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Payment Screenshot / Receipt:</span>
                    <a
                      href={order.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      View Receipt Link <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {order.stage === 'payment_pending' && (
                  <div className="pt-2">
                    {currentRole === 'owner' ? (
                      <button
                        disabled={isSaving}
                        onClick={() => handleStageChange('payment_verified')}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Verify Payment & Unlock For Design Team
                      </button>
                    ) : (
                      <p className="text-xs text-amber-600 font-medium italic">
                        Only Owner/Manager can verify payments. Please switch role to "Owner" to approve.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: DESIGN & PRE-PRESS (HEAD OFFICE) */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Step 2: Designing & Pre-Press Files (Head Office)
                    </h4>
                  </div>
                </div>

                {/* Team 1: Mockup */}
                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                    Design Team 1 (Concept & Mockup Approval)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Mockup Image URL
                      </label>
                      <input
                        type="text"
                        value={mockupInput}
                        onChange={(e) => setMockupInput(e.target.value)}
                        placeholder="https://... image link"
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Client Mockup Notes
                      </label>
                      <input
                        type="text"
                        value={mockupNotesInput}
                        onChange={(e) => setMockupNotesInput(e.target.value)}
                        placeholder="Collar ribbing color, sponsor font, etc."
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  {mockupInput && (
                    <div className="pt-2 flex items-center gap-3">
                      <img
                        src={mockupInput}
                        alt="Jersey Mockup"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-xs"
                      />
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-gray-800 dark:text-gray-200">Mockup Preview</span>
                        <p className="text-gray-500">{mockupNotesInput || 'Ready for client review'}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleSaveDesignFiles}
                      className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Save Mockup Info
                    </button>
                    {(currentRole === 'design_mockup' || currentRole === 'marketing' || currentRole === 'owner') && (
                      <button
                        onClick={() => handleStageChange('mockup_approved', { mockupUrl: mockupInput, mockupNotes: mockupNotesInput })}
                        className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Client Approved Mockup
                      </button>
                    )}
                  </div>
                </div>

                {/* Team 2: Production Pattern & Print-Ready Links */}
                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Design Team 2 (Pattern & Print-Ready File Handoff)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Print-Ready Drive / Cloud Link (Google Drive / WeTransfer)
                      </label>
                      <input
                        type="text"
                        value={printReadyInput}
                        onChange={(e) => setPrintReadyInput(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                        Pattern Spec Sheet / Cut Margin Notes
                      </label>
                      <input
                        type="text"
                        value={patternSpecInput}
                        onChange={(e) => setPatternSpecInput(e.target.value)}
                        placeholder="E.g. Seam allowance 1.2cm, 1.52m nesting roll..."
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  {printReadyInput && (
                    <div className="pt-1">
                      <a
                        href={printReadyInput}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        🔗 Open Print-Ready Vector Files in Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleSaveDesignFiles}
                      className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Save Pattern Links
                    </button>
                    {(currentRole === 'design_pattern' || currentRole === 'owner') && (
                      <button
                        onClick={() => handleStageChange('pattern_spec_ready', { printReadyLink: printReadyInput, patternSpecSheet: patternSpecInput })}
                        className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Ready for Print (Send to Print Factory)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 3: PRINT FACTORY ACTIONS */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Step 3: Printing & Heat Press (Print Factory)
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    Fabric: {order.fabricType} ({materials.fabricMeters}m needed)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    disabled={isSaving}
                    onClick={() => handleStageChange('paper_printed')}
                    className={`p-3 rounded-xl border text-left transition ${
                      order.stage === 'paper_printed'
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sub-Stage A</span>
                    <span className="text-xs font-bold block">1. Paper Printed</span>
                    <span className="text-[11px] text-gray-500">Sublimation paper roll completed</span>
                  </button>

                  <button
                    disabled={isSaving}
                    onClick={() => handleStageChange('heat_press_done')}
                    className={`p-3 rounded-xl border text-left transition ${
                      order.stage === 'heat_press_done'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sub-Stage B</span>
                    <span className="text-xs font-bold block">2. Heat Press Done</span>
                    <span className="text-[11px] text-gray-500">Transferred onto white polyester roll</span>
                  </button>

                  <button
                    disabled={isSaving}
                    onClick={() =>
                      handleStageChange('fabric_dispatched', {
                        deliveryChallanNumber: `CHAL-PF-${Math.floor(1000 + Math.random() * 9000)}`,
                        fabricDispatchedAt: new Date().toISOString(),
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition ${
                      order.stage === 'fabric_dispatched'
                        ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sub-Stage C</span>
                    <span className="text-xs font-bold block">3. Dispatch to Sewing</span>
                    <span className="text-[11px] text-gray-500">Issue Delivery Challan & Pack Roll</span>
                  </button>
                </div>

                {order.deliveryChallanNumber && (
                  <div className="text-xs p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200 flex items-center justify-between">
                    <span>
                      Delivery Challan: <strong className="font-mono">{order.deliveryChallanNumber}</strong>
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Dispatched on shuttle van
                    </span>
                  </div>
                )}
              </div>

              {/* STEP 4: SEWING FACTORY ACTIONS */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">
                      4
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Step 4: Cutting, Sewing, Finishing & Dispatch (Sewing Factory)
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    disabled={isSaving}
                    onClick={() => handleStageChange('fabric_received', { fabricReceivedAt: new Date().toISOString() })}
                    className={`p-2.5 rounded-xl border text-left transition text-xs ${
                      order.stage === 'fabric_received'
                        ? 'border-indigo-500 bg-indigo-50 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">1. Fabric Received</span>
                    <span className="text-[10px] text-gray-500">Verify roll arrival</span>
                  </button>

                  <button
                    disabled={isSaving}
                    onClick={() => handleStageChange('cutting_sewing')}
                    className={`p-2.5 rounded-xl border text-left transition text-xs ${
                      order.stage === 'cutting_sewing'
                        ? 'border-indigo-500 bg-indigo-50 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">2. Cutting & Sewing</span>
                    <span className="text-[10px] text-gray-500">On assembly lines</span>
                  </button>

                  <button
                    disabled={isSaving}
                    onClick={() => handleStageChange('quality_finishing')}
                    className={`p-2.5 rounded-xl border text-left transition text-xs ${
                      order.stage === 'quality_finishing'
                        ? 'border-indigo-500 bg-indigo-50 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">3. QC & Packing</span>
                    <span className="text-[10px] text-gray-500">Ironing & polybag</span>
                  </button>

                  <button
                    disabled={isSaving}
                    onClick={() =>
                      handleStageChange('shipped', {
                        courierName: courierInput,
                        trackingNumber: trackingInput,
                        deliveryAddress: deliveryAddressInput,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition text-xs ${
                      order.stage === 'shipped'
                        ? 'border-blue-500 bg-blue-50 font-bold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-bold">4. Handover Courier</span>
                    <span className="text-[10px] text-gray-500">Courier Tracking</span>
                  </button>
                </div>

                {/* Delivery details form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 bg-gray-50 dark:bg-gray-850 p-3 rounded-lg text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-0.5">Courier Name</label>
                    <input
                      type="text"
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value)}
                      placeholder="E.g. Pathao / SA Paribahan"
                      className="w-full p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-0.5">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="Tracking ID"
                      className="w-full p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 block mb-0.5">Delivery Address</label>
                    <input
                      type="text"
                      value={deliveryAddressInput}
                      onChange={(e) => setDeliveryAddressInput(e.target.value)}
                      placeholder="Client shipping address"
                      className="w-full p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>

                {order.stage === 'shipped' && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleStageChange('delivered')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Client Confirmed Delivery (Order Complete)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    Team Player Roster & Custom Names/Numbers
                  </h3>
                  <p className="text-xs text-gray-500">
                    Total Jerseys: {order.totalQuantity} units
                  </p>
                </div>
                <div className="flex gap-2">
                  {Object.entries(order.sizeBreakdown || {}).map(([size, count]) => (
                    <span
                      key={size}
                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-bold border"
                    >
                      {size}: {count}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 border-b border-gray-200 dark:border-gray-800 font-bold">
                    <tr>
                      <th className="p-3"># No.</th>
                      <th className="p-3">Player Name</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(order.roster || []).map((player, idx) => (
                      <tr key={player.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                        <td className="p-3 font-mono font-bold text-indigo-600">{player.number}</td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">{player.name}</td>
                        <td className="p-3 font-bold">{player.size}</td>
                        <td className="p-3 text-emerald-600 font-medium">Ready</td>
                      </tr>
                    ))}
                    {(!order.roster || order.roster.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                          No individualized player names uploaded. Production based on standard size breakdown.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MATERIALS & FABRIC YIELD */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Sublimation & Fabric Consumption Specification
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase">Fabric Needed</span>
                  <span className="text-xl font-black text-indigo-600">{materials.fabricMeters}m</span>
                  <span className="text-[10px] text-gray-500 block mt-1">+6% cutting margin</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase">Sublimation Paper</span>
                  <span className="text-xl font-black text-teal-600">{materials.transferPaperMeters}m</span>
                  <span className="text-[10px] text-gray-500 block mt-1">1.6m roll width</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase">Ink Required</span>
                  <span className="text-xl font-black text-amber-600">{materials.inkEstimatedMl} ml</span>
                  <span className="text-[10px] text-gray-500 block mt-1">CMYK UltraChrome</span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase">Roll Allocation</span>
                  <span className="text-xl font-black text-gray-900 dark:text-white">{materials.suggestedRollCount} Roll(s)</span>
                  <span className="text-[10px] text-gray-500 block mt-1">50m standard rolls</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 dark:text-white">Pattern & Printing Technical Notes:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {order.patternSpecSheet || 'Standard jersey sublimation spec: 200°C heat press @ 35 seconds dwell time. Pre-shrink fabric before calendar press.'}
                </p>
                {order.printReadyLink && (
                  <p className="pt-1">
                    Download link:{' '}
                    <a href={order.printReadyLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">
                      {order.printReadyLink}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVOICE & FINANCIALS */}
          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <div className="p-6 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4 font-sans text-xs">
                {/* Invoice Letterhead */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h2 className="text-base font-black text-indigo-600">SPORTSWEAR MANUFACTURING ERP</h2>
                    <p className="text-gray-500 text-[11px]">Head Office & Export Factory Hub</p>
                    <p className="text-gray-400 text-[10px]">Email: orders@sportswearbd.com</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-gray-800 dark:text-gray-200 block">
                      INVOICE #{order.orderNumber}
                    </span>
                    <span className="text-gray-400 text-[10px]">Date: {order.createdAt.substring(0, 10)}</span>
                  </div>
                </div>

                {/* Billed To */}
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase block font-semibold">Billed To:</span>
                    <strong className="text-gray-900 dark:text-white">{order.clientName}</strong>
                    <p className="text-gray-500">{order.teamOrClub}</p>
                    <p className="text-gray-500">{order.clientPhone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-[10px] uppercase block font-semibold">Payment Status:</span>
                    <span className="font-bold text-emerald-600 capitalize">{order.paymentStatus.replace('_', ' ')}</span>
                    <p className="text-gray-400 text-[10px]">Ref: {order.paymentReference || 'N/A'}</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="w-full text-left border-y border-gray-200 dark:border-gray-700 my-2">
                  <thead>
                    <tr className="text-gray-400 text-[10px] uppercase border-b">
                      <th className="py-2">Description</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Unit Price</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2.5 font-medium">
                        Custom Sublimated Jersey ({order.fabricType}) - {order.teamOrClub}
                      </td>
                      <td className="py-2.5">{order.totalQuantity} pcs</td>
                      <td className="py-2.5">${order.unitPrice || 15}</td>
                      <td className="py-2.5 text-right font-bold">${order.totalAmount}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="space-y-1.5 text-right pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-end gap-6 text-gray-600 dark:text-gray-300">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${order.totalAmount}</span>
                  </div>
                  <div className="flex justify-end gap-6 text-emerald-600">
                    <span>Advance Payment Received:</span>
                    <span className="font-bold">-${order.advanceAmount}</span>
                  </div>
                  <div className="flex justify-end gap-6 text-base font-black text-gray-900 dark:text-white pt-2 border-t">
                    <span>Balance Due Upon Delivery:</span>
                    <span className="text-indigo-600">${order.dueAmount}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Export Invoice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
