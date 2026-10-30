/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Order,
  SizeBreakdown,
  PlayerRosterItem,
  OrderShortsSpec,
  OrderDesignImages,
  Employee,
  Customer,
  DelegatedTask,
} from '../types/erp';
import {
  X,
  Plus,
  Sparkles,
  DollarSign,
  Users,
  Layers,
  ShieldCheck,
  Printer,
  Image as ImageIcon,
  FileCheck,
  Sliders,
  Upload,
  UserCheck,
  ClipboardPaste,
  Trash2,
  CheckCircle2,
  BellRing,
  TrendingUp,
} from 'lucide-react';
import { calculateOrderTotals, calculateFabricConsumption, parseRosterInput } from '../utils/erpLogic';
import { askGeminiProductionCopilot } from '../services/geminiService';
import { useFormDraft } from '../utils/useFormDraft';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: Order) => Promise<void>;
  onDelegateTask?: (task: Omit<DelegatedTask, 'id' | 'createdAt' | 'status'>) => void;
  employees?: Employee[];
  customers?: Customer[];
  currentUserName?: string;
  currentUserPosition?: string;
}

type DesignTargetSlot = 'front' | 'back' | 'sleeve' | 'collar' | 'paymentProof';

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
  onDelegateTask,
  employees = [],
  customers = [],
  currentUserName = 'Management Desk',
  currentUserPosition = 'Operations Lead',
}) => {
  // All hooks MUST run unconditionally before `if (!isOpen) return null;`
  const {
    draft: formDraft,
    updateField: updateDraftField,
    clearDraft: clearOrderDraft,
    lastSavedAt,
  } = useFormDraft('create_sportswear_order_form', {
    clientName: '',
    orderType: 'b2b' as 'b2b' | 'b2c',
    clientPhone: '',
    teamOrClub: '',
    sportType: 'Football / Soccer',
    fabricType: 'Micro-Eyelet 160 GSM',
    gsm: 160,
    collarType: 'V-Neck',
    customCollarNote: '',
    assignedEmployeeId: '',
    taskPriority: 'high' as 'normal' | 'high' | 'urgent',
    taskInstructions: 'Prepare full jersey layout & collar specifications for immediate pre-press.',
    taskDueTime: 'Today 5:00 PM',
    unitPrice: 450,
    advanceAmount: 5000,
    paymentReference: '',
    paymentProofUrl: '',
    deliveryAddress: '',
    frontUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
    backUrl:
      'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80',
    sleeveUrl: '',
    collarUrl: '',
    includeShorts: false,
    shortsLiner: true,
    shortsPocketType: 'side_open' as 'none' | 'side_open' | 'zipper',
    shortsFabric: 'Micro-Stretch 140 GSM Poly',
    shortsSizes: { S: 4, M: 10, L: 8, XL: 2, '2XL': 0 } as SizeBreakdown,
    sizeBreakdown: { S: 4, M: 10, L: 8, XL: 2, '2XL': 0 } as SizeBreakdown,
    roster: [] as PlayerRosterItem[],
    rawRosterInput: '',
  });

  const {
    clientName,
    orderType,
    clientPhone,
    teamOrClub,
    sportType,
    fabricType,
    gsm,
    collarType,
    customCollarNote,
    assignedEmployeeId,
    taskPriority,
    taskInstructions,
    taskDueTime,
    unitPrice,
    advanceAmount,
    paymentReference,
    paymentProofUrl,
    deliveryAddress,
    frontUrl,
    backUrl,
    sleeveUrl,
    collarUrl,
    includeShorts,
    shortsLiner,
    shortsPocketType,
    shortsFabric,
    shortsSizes,
    sizeBreakdown,
    roster,
    rawRosterInput,
  } = formDraft;

  const setClientName = (v: string) => updateDraftField('clientName', v);
  const setOrderType = (v: 'b2b' | 'b2c') => updateDraftField('orderType', v);
  const setClientPhone = (v: string) => updateDraftField('clientPhone', v);
  const setTeamOrClub = (v: string) => updateDraftField('teamOrClub', v);
  const setSportType = (v: string) => updateDraftField('sportType', v);
  const setFabricType = (v: string) => updateDraftField('fabricType', v);
  const setGsm = (v: number) => updateDraftField('gsm', v);
  const setCollarType = (v: string) => updateDraftField('collarType', v);
  const setCustomCollarNote = (v: string) => updateDraftField('customCollarNote', v);
  const setAssignedEmployeeId = (v: string) => updateDraftField('assignedEmployeeId', v);
  const setTaskPriority = (v: 'normal' | 'high' | 'urgent') => updateDraftField('taskPriority', v);
  const setTaskInstructions = (v: string) => updateDraftField('taskInstructions', v);
  const setTaskDueTime = (v: string) => updateDraftField('taskDueTime', v);
  const setUnitPrice = (v: number) => updateDraftField('unitPrice', v);
  const setAdvanceAmount = (v: number) => updateDraftField('advanceAmount', v);
  const setPaymentReference = (v: string) => updateDraftField('paymentReference', v);
  const setPaymentProofUrl = (v: string) => updateDraftField('paymentProofUrl', v);
  const setDeliveryAddress = (v: string) => updateDraftField('deliveryAddress', v);
  const setFrontUrl = (v: string) => updateDraftField('frontUrl', v);
  const setBackUrl = (v: string) => updateDraftField('backUrl', v);
  const setSleeveUrl = (v: string) => updateDraftField('sleeveUrl', v);
  const setCollarUrl = (v: string) => updateDraftField('collarUrl', v);
  const setIncludeShorts = (v: boolean) => updateDraftField('includeShorts', v);
  const setShortsLiner = (v: boolean) => updateDraftField('shortsLiner', v);
  const setShortsPocketType = (v: 'none' | 'side_open' | 'zipper') =>
    updateDraftField('shortsPocketType', v);
  const setShortsFabric = (v: string) => updateDraftField('shortsFabric', v);
  const setRoster = (v: PlayerRosterItem[]) => updateDraftField('roster', v);
  const setRawRosterInput = (v: string) => updateDraftField('rawRosterInput', v);
  const setSizeBreakdown = (
    updater: SizeBreakdown | ((prev: SizeBreakdown) => SizeBreakdown)
  ) => {
    const next = typeof updater === 'function' ? updater(sizeBreakdown) : updater;
    updateDraftField('sizeBreakdown', next);
  };
  const setShortsSizes = (
    updater: SizeBreakdown | ((prev: SizeBreakdown) => SizeBreakdown)
  ) => {
    const next = typeof updater === 'function' ? updater(shortsSizes) : updater;
    updateDraftField('shortsSizes', next);
  };

  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalSheet, setShowApprovalSheet] = useState(false);
  const [activePasteSlot, setActivePasteSlot] = useState<DesignTargetSlot>('front');
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  const applyImageToSlot = (slot: DesignTargetSlot, dataUrl: string) => {
    if (slot === 'front') setFrontUrl(dataUrl);
    else if (slot === 'back') setBackUrl(dataUrl);
    else if (slot === 'sleeve') setSleeveUrl(dataUrl);
    else if (slot === 'collar') setCollarUrl(dataUrl);
    else if (slot === 'paymentProof') setPaymentProofUrl(dataUrl);

    const slotLabel =
      slot === 'front'
        ? 'Front Design Panel'
        : slot === 'back'
        ? 'Back Design Panel'
        : slot === 'sleeve'
        ? 'Sleeve Artwork'
        : slot === 'collar'
        ? 'Collar Detail'
        : 'Payment Proof';

    setPasteFeedback(`DONE: Design image / screenshot attached to ${slotLabel}!`);
    setTimeout(() => setPasteFeedback(null), 4000);
  };

  const readBlobAsDataUrl = (blob: Blob, targetSlot: DesignTargetSlot) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        applyImageToSlot(targetSlot, reader.result);
      }
    };
    reader.readAsDataURL(blob);
  };

  // Global & local Ctrl+V screenshot paste handler when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            readBlobAsDataUrl(file, activePasteSlot);
          }
          return;
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isOpen, activePasteSlot]);

  const handleClipboardButtonPaste = async (targetSlot: DesignTargetSlot = activePasteSlot) => {
    setActivePasteSlot(targetSlot);
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            readBlobAsDataUrl(blob, targetSlot);
            return;
          }
        }
      }
      setPasteFeedback('Press Ctrl+V (or Cmd+V) on your keyboard to paste screenshot directly!');
      setTimeout(() => setPasteFeedback(null), 4000);
    } catch {
      setPasteFeedback('Ready! Press Ctrl+V (or Cmd+V) on your keyboard to paste screenshot.');
      setTimeout(() => setPasteFeedback(null), 4000);
    }
  };

  if (!isOpen) return null;

  // Compute total qty from size breakdown
  const totalQuantity = Object.values(sizeBreakdown).reduce((a, b) => a + (b || 0), 0);
  const shortsTotalQty = includeShorts
    ? Object.values(shortsSizes).reduce((a, b) => a + (b || 0), 0)
    : 0;

  const totals = calculateOrderTotals(totalQuantity, unitPrice, advanceAmount);
  const bomEstimate = calculateFabricConsumption(sizeBreakdown, fabricType);
  const estimatedRawCostPerPc = Math.round(unitPrice * 0.44);
  const estimatedGrossProfit = Math.max(0, totals.totalAmount - totalQuantity * estimatedRawCostPerPc);
  const estimatedMarginPct =
    totals.totalAmount > 0 ? Math.round((estimatedGrossProfit / totals.totalAmount) * 100) : 0;

  const handleSizeChange = (sizeKey: string, val: number) => {
    setSizeBreakdown((prev) => ({
      ...prev,
      [sizeKey]: Math.max(0, val || 0),
    }));
  };

  const handleShortsSizeChange = (sizeKey: string, val: number) => {
    setShortsSizes((prev) => ({
      ...prev,
      [sizeKey]: Math.max(0, val || 0),
    }));
  };

  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: DesignTargetSlot
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readBlobAsDataUrl(file, slot);
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
    } catch {
      const parsed = parseRosterInput(rawRosterInput);
      setRoster(parsed.roster);
      setSizeBreakdown(parsed.sizeBreakdown);
    } finally {
      setIsAiParsing(false);
    }
  };

  const selectedEmployee = employees.find((emp) => emp.id === assignedEmployeeId);

  const buildOrderObject = (): Order => {
    const orderNumber = `SW-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const designImages: OrderDesignImages = {
      front: frontUrl.trim() || undefined,
      back: backUrl.trim() || undefined,
      leftSleeve: sleeveUrl.trim() || undefined,
      collarMockup: collarUrl.trim() || undefined,
    };

    const shortsSpec: OrderShortsSpec | undefined = includeShorts
      ? {
          enabled: true,
          quantity: shortsTotalQty,
          sizeBreakdown: shortsSizes,
          hasInnerLiner: shortsLiner,
          hasPockets: shortsPocketType !== 'none',
          notes: `${shortsFabric} • Pockets: ${shortsPocketType}`,
        }
      : undefined;

    return {
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
      collarType,
      shorts: shortsSpec,
      designImages,
      mockupUrl: frontUrl || undefined,
      mockupNotes: customCollarNote ? `Collar Note: ${customCollarNote}` : undefined,
      assignedToEmployeeId: selectedEmployee?.id,
      assignedToEmployeeName: selectedEmployee?.name,
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
      createdBy: currentUserName,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || totalQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      const newOrder = buildOrderObject();
      await onCreateOrder(newOrder);

      if (selectedEmployee && onDelegateTask) {
        onDelegateTask({
          title: `New Job Card Assigned: ${newOrder.orderNumber} (${newOrder.teamOrClub})`,
          description:
            taskInstructions ||
            `Execute ${newOrder.totalQuantity} pcs (${newOrder.fabricType}, ${newOrder.collarType}) for ${newOrder.clientName}.`,
          orderNumber: newOrder.orderNumber,
          assignedToEmployeeId: selectedEmployee.id,
          assignedToEmployeeName: selectedEmployee.name,
          assignedToPosition: selectedEmployee.designation,
          assignedToRole: selectedEmployee.role,
          delegatedByEmployeeName: currentUserName,
          delegatedByPosition: currentUserPosition,
          priority: taskPriority,
          dueTime: taskDueTime || 'Today 5:00 PM',
        });
      }

      clearOrderDraft();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        data-testid="create-order-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:hidden"
      >
        <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 text-slate-200">
          {/* Upgraded Industrial Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                    NEW JOB CARD STUDIO v2.5
                  </span>
                  <h2 className="text-lg font-black text-white">
                    Create Sportswear Job Order Sheet & Spec (৳ BDT)
                  </h2>
                  {lastSavedAt && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                      Draft Auto-Saved ({lastSavedAt})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Upload Design Images or Paste Screenshot (Ctrl+V) • Instant Task Delegation & Sound • Print Approval PDF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowApprovalSheet(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Preview & Print Customer Approval Sign-off Sheet"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Print / PDF Sheet</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {/* Section 1: Customer Details & Dedicated Employee Delegation */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400">
                  <Users className="w-3.5 h-3.5" /> 1. Client Profile & Instant Task Delegation
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {customers.length > 0 && (
                    <select
                      onChange={(e) => {
                        const cust = customers.find((c) => c.id === e.target.value);
                        if (cust) {
                          setClientName(cust.name);
                          setClientPhone(cust.phone);
                          setTeamOrClub(cust.companyOrClub);
                          setOrderType(cust.type);
                          const discountPct = cust.discountPrivilegePercent || 0;
                          if (discountPct > 0) {
                            setUnitPrice(Math.round(450 * (1 - discountPct / 100)));
                          }
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-[11px] font-bold cursor-pointer"
                    >
                      <option value="">⭐ Quick-Fill from Returning CRM Customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.companyOrClub}) • {c.returningRatio ?? 85}% Returning •{' '}
                          {c.discountPrivilegePercent ?? 0}% VIP Off
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setOrderType('b2b')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        orderType === 'b2b'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      B2B Corporate / Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('b2c')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        orderType === 'b2c'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      B2C Direct / Retail
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Client / Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangladesh Football Academy"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    placeholder="+880 1712-345678"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Team / Club / Tournament *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thunder FC Kit"
                    value={teamOrClub}
                    onChange={(e) => setTeamOrClub(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Instant Task Delegation Sub-bar inside Job Card */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-amber-300 block mb-1 flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5 text-amber-400" /> Delegate To Employee (Instant Alert)
                  </label>
                  <select
                    data-testid="jobcard-delegate-select"
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-amber-500/40 bg-slate-900 text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- Select Staff for Instant Delegation --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Task Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-bold"
                  >
                    <option value="urgent">🚨 URGENT PRIORITY</option>
                    <option value="high">⚡ HIGH PRIORITY</option>
                    <option value="normal">NORMAL PRIORITY</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Target Due Time</label>
                  <input
                    type="text"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    placeholder="e.g. Today 5:00 PM"
                    className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Delegation Instructions
                  </label>
                  <input
                    type="text"
                    value={taskInstructions}
                    onChange={(e) => setTaskInstructions(e.target.value)}
                    placeholder="Specific instructions for assignee..."
                    className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Garment Specs, Collar Type & Fabric */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-black flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400">
                <Layers className="w-3.5 h-3.5" /> 2. Sport, Collar Type & Fabric Sublimation Spec
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Sport Type</label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-medium focus:border-emerald-500 focus:outline-none"
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
                  <label className="font-semibold text-slate-300 block mb-1">Collar Type *</label>
                  <select
                    value={collarType}
                    onChange={(e) => setCollarType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Round Neck">Round Neck (Crew Neck)</option>
                    <option value="V-Neck">V-Neck (Athletic Cut)</option>
                    <option value="Mandarin Collar">Mandarin / Chinese Zipper Collar</option>
                    <option value="Polo Ribbed">Polo Ribbed Collar with Placket</option>
                    <option value="Overlap V-Collar">Overlap Pro V-Collar</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Custom Collar / Ribbing Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Black gold-striped flat-knit collar"
                    value={customCollarNote}
                    onChange={(e) => setCustomCollarNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Fabric Type *</label>
                  <select
                    value={fabricType}
                    onChange={(e) => {
                      setFabricType(e.target.value);
                      if (e.target.value.includes('180')) setGsm(180);
                      else if (e.target.value.includes('170')) setGsm(170);
                      else if (e.target.value.includes('130')) setGsm(130);
                      else setGsm(160);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-medium focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Micro-Eyelet 160 GSM">Micro-Eyelet 160 GSM (Popular)</option>
                    <option value="Poly Interlock 180 GSM">Poly Interlock 180 GSM (Durable)</option>
                    <option value="Dot Mesh Poly 170 GSM">Dot Mesh Poly 170 GSM (Breathable)</option>
                    <option value="FeatherPoly 130 GSM">FeatherPoly 130 GSM (Ultra Light)</option>
                    <option value="Spandex Poly Blend 200 GSM">
                      Spandex Poly Blend 200 GSM (Compression)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Design Mockup Images Upload OR Paste Screenshot */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-black flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400">
                    <ImageIcon className="w-4 h-4" /> 3. Add Design Images by File Upload OR Paste Screenshot (Ctrl+V)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select target panel below and press Ctrl+V anywhere, or click "Paste Screenshot" / "Upload"
                  </p>
                </div>

                {/* Quick Screenshot Paste Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={activePasteSlot}
                    onChange={(e) => setActivePasteSlot(e.target.value as DesignTargetSlot)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-[11px] cursor-pointer"
                    title="Target slot for Ctrl+V screenshot paste"
                  >
                    <option value="front">Paste Target: Front Panel</option>
                    <option value="back">Paste Target: Back Panel</option>
                    <option value="sleeve">Paste Target: Sleeve Artwork</option>
                    <option value="collar">Paste Target: Collar Detail</option>
                    <option value="paymentProof">Paste Target: Payment Receipt</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleClipboardButtonPaste(activePasteSlot)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer transition"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste Screenshot (Ctrl+V)</span>
                  </button>
                </div>
              </div>

              {pasteFeedback && (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pasteFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Front Panel */}
                <div
                  onClick={() => setActivePasteSlot('front')}
                  className={`p-2.5 rounded-xl border transition cursor-pointer space-y-2 ${
                    activePasteSlot === 'front'
                      ? 'border-emerald-500 bg-emerald-950/15'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 text-[11px]">Front Panel</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClipboardButtonPaste('front');
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Paste Screenshot into Front Panel"
                      >
                        <ClipboardPaste className="w-2.5 h-2.5" />
                        <span>Paste</span>
                      </button>
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'front')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={frontUrl}
                    onChange={(e) => setFrontUrl(e.target.value)}
                    placeholder="Image URL or press Ctrl+V here..."
                    className="w-full p-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px]"
                  />
                  {frontUrl ? (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
                      <img src={frontUrl} alt="Front preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFrontUrl('');
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400 p-2 text-center">
                      <ClipboardPaste className="w-4 h-4 text-emerald-400 mb-1" />
                      <span>Click & press Ctrl+V to paste screenshot</span>
                    </div>
                  )}
                </div>

                {/* Back Panel */}
                <div
                  onClick={() => setActivePasteSlot('back')}
                  className={`p-2.5 rounded-xl border transition cursor-pointer space-y-2 ${
                    activePasteSlot === 'back'
                      ? 'border-emerald-500 bg-emerald-950/15'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 text-[11px]">Back Panel</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClipboardButtonPaste('back');
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <ClipboardPaste className="w-2.5 h-2.5" />
                        <span>Paste</span>
                      </button>
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'back')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={backUrl}
                    onChange={(e) => setBackUrl(e.target.value)}
                    placeholder="Image URL or press Ctrl+V here..."
                    className="w-full p-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px]"
                  />
                  {backUrl ? (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
                      <img src={backUrl} alt="Back preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBackUrl('');
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400 p-2 text-center">
                      <ClipboardPaste className="w-4 h-4 text-emerald-400 mb-1" />
                      <span>Click & press Ctrl+V to paste screenshot</span>
                    </div>
                  )}
                </div>

                {/* Sleeve Artwork */}
                <div
                  onClick={() => setActivePasteSlot('sleeve')}
                  className={`p-2.5 rounded-xl border transition cursor-pointer space-y-2 ${
                    activePasteSlot === 'sleeve'
                      ? 'border-emerald-500 bg-emerald-950/15'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 text-[11px]">Sleeve Artwork</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClipboardButtonPaste('sleeve');
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <ClipboardPaste className="w-2.5 h-2.5" />
                        <span>Paste</span>
                      </button>
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'sleeve')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={sleeveUrl}
                    onChange={(e) => setSleeveUrl(e.target.value)}
                    placeholder="Image URL or press Ctrl+V here..."
                    className="w-full p-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px]"
                  />
                  {sleeveUrl ? (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
                      <img src={sleeveUrl} alt="Sleeve preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSleeveUrl('');
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400 p-2 text-center">
                      <ClipboardPaste className="w-4 h-4 text-emerald-400 mb-1" />
                      <span>Paste (Ctrl+V) or upload Sleeve Artwork</span>
                    </div>
                  )}
                </div>

                {/* Collar Detail */}
                <div
                  onClick={() => setActivePasteSlot('collar')}
                  className={`p-2.5 rounded-xl border transition cursor-pointer space-y-2 ${
                    activePasteSlot === 'collar'
                      ? 'border-emerald-500 bg-emerald-950/15'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 text-[11px]">Collar Detail</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClipboardButtonPaste('collar');
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <ClipboardPaste className="w-2.5 h-2.5" />
                        <span>Paste</span>
                      </button>
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'collar')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={collarUrl}
                    onChange={(e) => setCollarUrl(e.target.value)}
                    placeholder="Image URL or press Ctrl+V here..."
                    className="w-full p-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px]"
                  />
                  {collarUrl ? (
                    <div className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center group">
                      <img src={collarUrl} alt="Collar preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollarUrl('');
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-400 p-2 text-center">
                      <ClipboardPaste className="w-4 h-4 text-emerald-400 mb-1" />
                      <span>Paste (Ctrl+V) or upload Collar Detail</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Matching Shorts Option */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeShortsCheck"
                    checked={includeShorts}
                    onChange={(e) => setIncludeShorts(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label
                    htmlFor="includeShortsCheck"
                    className="font-bold text-white text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    4. Include Matching Shorts Set ({shortsTotalQty} pcs)
                  </label>
                </div>
                {includeShorts && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
                    Shorts Linked to Job Card
                  </span>
                )}
              </div>

              {includeShorts && (
                <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-400 block mb-1">Shorts Fabric</label>
                      <input
                        type="text"
                        value={shortsFabric}
                        onChange={(e) => setShortsFabric(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-400 block mb-1">
                        Pockets Specification
                      </label>
                      <select
                        value={shortsPocketType}
                        onChange={(e) => setShortsPocketType(e.target.value as any)}
                        className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white"
                      >
                        <option value="side_open">Standard Side Pockets</option>
                        <option value="zipper">Concealed Zipper Pockets</option>
                        <option value="none">No Pockets (Match Kit)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-400 block mb-1">Inner Liner</label>
                      <select
                        value={shortsLiner ? 'yes' : 'no'}
                        onChange={(e) => setShortsLiner(e.target.value === 'yes')}
                        className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white"
                      >
                        <option value="yes">With Breathable Inner Mesh Liner</option>
                        <option value="no">Without Liner (Shell Only)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-400 block mb-1">
                      Shorts Size Breakdown
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['S', 'M', 'L', 'XL', '2XL'] as const).map((sz) => (
                        <div
                          key={sz}
                          className="text-center bg-slate-900 p-2 rounded-lg border border-slate-800"
                        >
                          <span className="block font-bold text-slate-400 mb-1">{sz}</span>
                          <input
                            type="number"
                            min="0"
                            value={shortsSizes[sz] || 0}
                            onChange={(e) =>
                              handleShortsSizeChange(sz, parseInt(e.target.value) || 0)
                            }
                            className="w-full text-center bg-slate-800 border border-slate-700 rounded p-1 font-bold text-white text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Jersey Roster & Size Breakdown */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="font-black flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400">
                  <Users className="w-3.5 h-3.5" /> 5. Jersey Sizes & Team Roster
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-400">
                    Est. Fabric: <strong className="text-white">{bomEstimate.fabricMeters}m</strong> • Paper: <strong className="text-white">{bomEstimate.transferPaperMeters}m</strong>
                  </span>
                  <span className="font-extrabold text-emerald-400 text-xs">
                    Jersey Total: {totalQuantity} pcs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {(['S', 'M', 'L', 'XL', '2XL'] as const).map((sz) => (
                  <div
                    key={sz}
                    className="text-center bg-slate-900 p-2 rounded-xl border border-slate-800"
                  >
                    <span className="block font-bold text-slate-400 mb-1">{sz}</span>
                    <input
                      type="number"
                      min="0"
                      value={sizeBreakdown[sz] || 0}
                      onChange={(e) => handleSizeChange(sz, parseInt(e.target.value) || 0)}
                      className="w-full text-center bg-slate-800 border border-slate-700 rounded-lg p-1 font-extrabold text-white text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    Paste Raw Player Roster (AI Smart Parser)
                  </label>
                  <button
                    type="button"
                    onClick={handleParseRosterWithAi}
                    disabled={isAiParsing || !rawRosterInput.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>{isAiParsing ? 'Analyzing...' : 'Parse Roster & Quantities'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Paste WhatsApp text e.g.: 10 - Shakib (L), 7 - Ronaldo (M), 9 - Messi (M)..."
                  value={rawRosterInput}
                  onChange={(e) => setRawRosterInput(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-[11px]"
                />
                {roster.length > 0 && (
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {roster.length} player roster entries generated and linked to this Job Card.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 6: Pricing (BDT ৳), Live Profit Margin Estimator & Advance Payment */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" /> 6. Pricing (BDT ৳), Live Margin Estimator & Payment Proof
                </h3>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-mono">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">
                    Est. Gross Profit: <strong className="text-emerald-400">৳{estimatedGrossProfit.toLocaleString()} BDT</strong> ({estimatedMarginPct}% Margin)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Unit Price (৳ BDT)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 font-bold text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Total Bill (৳ BDT)
                  </label>
                  <div className="p-2 rounded-lg bg-slate-800 font-extrabold text-sm text-white">
                    ৳{totals.totalAmount.toLocaleString()} BDT
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Advance Received (৳ BDT)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-950 font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Due Amount (৳ BDT)
                  </label>
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 font-extrabold text-sm text-amber-300">
                    ৳{totals.dueAmount.toLocaleString()} BDT
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Delivery Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Dhaka / Banani / Chittagong Courier"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Payment Reference / Txn ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. City Bank Slip / bKash Txn ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Payment Proof Image</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleClipboardButtonPaste('paymentProof')}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Paste</span>
                      </button>
                      <label className="text-[10px] text-indigo-400 font-bold cursor-pointer flex items-center gap-0.5">
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileUpload(e, 'paymentProof')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="https://... receipt or paste screenshot"
                    value={paymentProofUrl}
                    onChange={(e) => setPaymentProofUrl(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowApprovalSheet(true)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print / Save PDF Customer Approval</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearOrderDraft();
                    onClose();
                  }}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel (Discard Draft)
                </button>
                <button
                  type="submit"
                  data-testid="submit-create-order-btn"
                  disabled={isSubmitting || totalQuantity <= 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {selectedEmployee
                      ? `Create Job Card & Delegate to ${selectedEmployee.name}`
                      : 'Create Order & Generate Job Card'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Printable Customer Approval Sheet Modal */}
      {showApprovalSheet && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-300 my-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">
                  Customer Garment Design & Spec Approval Sheet
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowApprovalSheet(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-950 uppercase tracking-wide">
                    RIDWEAR SPORTSWEAR MFG.
                  </h1>
                  <p className="text-slate-600 text-[11px]">
                    Head Office: House 42, Road 11, Block D, Banani, Dhaka 1213
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Print Factory: Tongi Industrial Zone • Sewing Factory: Mirpur-10
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                    <span className="font-mono font-bold text-emerald-800 text-sm">
                      CUSTOMER APPROVAL SHEET
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Date: {new Date().toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Customer / Organization
                  </h4>
                  <p className="text-sm font-black text-slate-900">
                    {clientName || 'Valued Customer'}
                  </p>
                  <p className="text-slate-600 font-medium">Team: {teamOrClub || 'N/A'}</p>
                  <p className="text-slate-600">Contact: {clientPhone || 'N/A'}</p>
                  <p className="text-slate-600">Delivery: {deliveryAddress || 'Factory Pickup'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Garment Technical Specs
                  </h4>
                  <p className="text-slate-800">
                    <span className="font-bold">Sport:</span> {sportType}
                  </p>
                  <p className="text-slate-800">
                    <span className="font-bold">Fabric:</span> {fabricType} ({gsm} GSM)
                  </p>
                  <p className="text-slate-800">
                    <span className="font-bold">Collar Type:</span>{' '}
                    <span className="font-black text-emerald-700 uppercase">
                      {collarType.replace('_', ' ')} {customCollarNote ? `(${customCollarNote})` : ''}
                    </span>
                  </p>
                  <p className="text-slate-800">
                    <span className="font-bold">Total Jersey Units:</span>{' '}
                    <span className="font-black text-emerald-700">{totalQuantity} pcs</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 border-b border-slate-200 pb-1">
                  Approved Mockup Artwork Views
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border border-slate-200 rounded-lg p-2 text-center bg-slate-50">
                    <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                      Front Panel
                    </span>
                    {frontUrl ? (
                      <img src={frontUrl} alt="Front" className="h-32 w-full object-cover rounded" />
                    ) : (
                      <div className="h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                        Front Artwork
                      </div>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 text-center bg-slate-50">
                    <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                      Back Panel
                    </span>
                    {backUrl ? (
                      <img src={backUrl} alt="Back" className="h-32 w-full object-cover rounded" />
                    ) : (
                      <div className="h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                        Back Artwork
                      </div>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 text-center bg-slate-50">
                    <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                      Sleeve Detail
                    </span>
                    {sleeveUrl ? (
                      <img src={sleeveUrl} alt="Sleeve" className="h-32 w-full object-cover rounded" />
                    ) : (
                      <div className="h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                        Sleeve Detail
                      </div>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 text-center bg-slate-50">
                    <span className="font-bold text-[10px] text-slate-500 uppercase block mb-1">
                      Collar Ribbing
                    </span>
                    {collarUrl ? (
                      <img src={collarUrl} alt="Collar" className="h-32 w-full object-cover rounded" />
                    ) : (
                      <div className="h-32 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                        {collarType.replace('_', ' ').toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 border-b border-slate-200 pb-1">
                  Jersey Size Breakdown
                </h4>
                <table className="w-full text-center border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-1.5 border border-slate-300">Size S</th>
                      <th className="p-1.5 border border-slate-300">Size M</th>
                      <th className="p-1.5 border border-slate-300">Size L</th>
                      <th className="p-1.5 border border-slate-300">Size XL</th>
                      <th className="p-1.5 border border-slate-300">Size 2XL</th>
                      <th className="p-1.5 border border-slate-300 bg-emerald-50 font-black">
                        Total Jersey
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold">
                      <td className="p-1.5 border border-slate-300">{sizeBreakdown.S || 0}</td>
                      <td className="p-1.5 border border-slate-300">{sizeBreakdown.M || 0}</td>
                      <td className="p-1.5 border border-slate-300">{sizeBreakdown.L || 0}</td>
                      <td className="p-1.5 border border-slate-300">{sizeBreakdown.XL || 0}</td>
                      <td className="p-1.5 border border-slate-300">{sizeBreakdown['2XL'] || 0}</td>
                      <td className="p-1.5 border border-slate-300 bg-emerald-50 font-black text-emerald-700">
                        {totalQuantity} pcs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[11px] text-slate-600">
                    Terms: 50% advance required upon design confirmation. Balance due prior to dispatch.
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-slate-700">
                    Total Order Value:{' '}
                    <span className="font-black text-slate-900">
                      ৳{totals.totalAmount.toLocaleString()} BDT
                    </span>
                  </p>
                  <p className="text-emerald-700 font-bold">
                    Advance Paid: ৳{totals.advanceAmount.toLocaleString()} BDT
                  </p>
                  <p className="text-amber-700 font-black text-sm">
                    Balance Due: ৳{totals.dueAmount.toLocaleString()} BDT
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 pt-8">
                <div className="border-t-2 border-slate-400 pt-2 text-center">
                  <p className="font-bold text-slate-800">Customer Approval Signature & Date</p>
                  <p className="text-[10px] text-slate-500">
                    I confirm that artwork, collar type, sizes, and player names/numbers are accurate.
                  </p>
                </div>
                <div className="border-t-2 border-slate-400 pt-2 text-center">
                  <p className="font-bold text-slate-800">
                    Authorized Signatory ({selectedEmployee?.name || 'Marketing Lead'})
                  </p>
                  <p className="text-[10px] text-slate-500">Ridwear Sportswear Mfg. • Banani HQ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
