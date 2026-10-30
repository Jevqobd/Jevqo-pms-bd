/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Order,
  SizeBreakdown,
  PlayerRosterItem,
  OrderShortsSpec,
  OrderDesignImages,
  Employee,
  Customer,
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
  Star,
} from 'lucide-react';
import { calculateOrderTotals, parseRosterInput } from '../utils/erpLogic';
import { askGeminiProductionCopilot } from '../services/geminiService';
import { useFormDraft } from '../utils/useFormDraft';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: Order) => Promise<void>;
  employees?: Employee[];
  customers?: Customer[];
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder,
  employees = [],
  customers = [],
}) => {
  if (!isOpen) return null;

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
    unitPrice: 16.0,
    advanceAmount: 150.0,
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

  // Compute total qty from size breakdown
  const totalQuantity = Object.values(sizeBreakdown).reduce((a, b) => a + (b || 0), 0);
  const shortsTotalQty = includeShorts
    ? Object.values(shortsSizes).reduce((a, b) => a + (b || 0), 0)
    : 0;

  const totals = calculateOrderTotals(totalQuantity, unitPrice, advanceAmount);

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
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
      createdBy: 'marketing@sportswear.erp',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || totalQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      const newOrder = buildOrderObject();
      await onCreateOrder(newOrder);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:hidden">
        <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    Create Sportswear Job Card & Spec Sheet
                  </h2>
                  {lastSavedAt && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                      Draft Auto-Saved ({lastSavedAt})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Marketing Desk &bull; Auto-saves draft until Cancelled or Saved &bull; Upload Mockups & PDF Approval
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
                <span>Print / PDF Approval Sheet</span>
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
            {/* Section 1: Customer Details & Dedicated Employee */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-400">
                  <Users className="w-3.5 h-3.5" /> 1. Client Profile & Dedicated Account Handler
                </h3>
                <div className="flex items-center gap-2">
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
                            setUnitPrice(Number((16 * (1 - discountPct / 100)).toFixed(2)));
                          }
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 text-[11px] font-bold cursor-pointer"
                    >
                      <option value="">⭐ Quick-Fill from Returning CRM Customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.companyOrClub}) • {c.returningRatio ?? 85}% Returning • {c.discountPrivilegePercent ?? 0}% VIP Off
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setOrderType('b2b')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        orderType === 'b2b'
                          ? 'bg-indigo-600 text-white shadow-sm'
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
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      B2C Direct / Retail
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium focus:border-indigo-500 focus:outline-none"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium focus:border-indigo-500 focus:outline-none"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Dedicated Employee
                  </label>
                  <select
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Auto-Assign Department Lead</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Garment Specs, Collar Type & Fabric */}
            <div className="space-y-3">
              <h3 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-400">
                <Layers className="w-3.5 h-3.5" /> 2. Sport, Collar Type & Fabric Sublimation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Sport Type</label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium focus:border-indigo-500 focus:outline-none"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white focus:border-indigo-500 focus:outline-none"
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
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-medium focus:border-indigo-500 focus:outline-none"
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

            {/* Section 3: Design Mockup Images Upload / Links */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-400">
                  <ImageIcon className="w-3.5 h-3.5" /> 3. Upload Design Mockup Images (Front, Back, Sleeves, Collar)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Upload local image file or paste URL
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Front */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-400">Front Panel</label>
                    <label className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, setFrontUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={frontUrl}
                    onChange={(e) => setFrontUrl(e.target.value)}
                    placeholder="https://... front image"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-[11px]"
                  />
                  {frontUrl && (
                    <div className="h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                      <img src={frontUrl} alt="Front preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Back */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-400">Back Panel</label>
                    <label className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, setBackUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={backUrl}
                    onChange={(e) => setBackUrl(e.target.value)}
                    placeholder="https://... back image"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-[11px]"
                  />
                  {backUrl && (
                    <div className="h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                      <img src={backUrl} alt="Back preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Sleeve */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-400">Sleeve Artwork</label>
                    <label className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, setSleeveUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={sleeveUrl}
                    onChange={(e) => setSleeveUrl(e.target.value)}
                    placeholder="https://... sleeve detail"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-[11px]"
                  />
                  {sleeveUrl ? (
                    <div className="h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                      <img src={sleeveUrl} alt="Sleeve preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                      Left & Right Sleeve Logos
                    </div>
                  )}
                </div>

                {/* Collar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-400">Collar Detail</label>
                    <label className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, setCollarUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={collarUrl}
                    onChange={(e) => setCollarUrl(e.target.value)}
                    placeholder="https://... collar detail"
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 text-white text-[11px]"
                  />
                  {collarUrl ? (
                    <div className="h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                      <img src={collarUrl} alt="Collar preview" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                      Collar & Neck Tape Detail
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
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <label
                    htmlFor="includeShortsCheck"
                    className="font-bold text-white text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Include Matching Shorts Set ({shortsTotalQty} pcs)
                  </label>
                </div>
                {includeShorts && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300">
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
                <h3 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-400">
                  <Users className="w-3.5 h-3.5" /> 5. Jersey Sizes & Team Roster
                </h3>
                <span className="font-extrabold text-indigo-400 font-mono text-xs">
                  Jersey Total: {totalQuantity} pcs
                </span>
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
                    Paste Raw Player Roster (Gemini AI Smart Parser)
                  </label>
                  <button
                    type="button"
                    onClick={handleParseRosterWithAi}
                    disabled={isAiParsing || !rawRosterInput.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
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

            {/* Section 6: Pricing & Advance Payment */}
            <div>
              <h3 className="font-bold text-white mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-indigo-400">
                <DollarSign className="w-3.5 h-3.5" /> 6. Pricing, Delivery & Advance Payment Proof
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 font-bold text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Total Bill ($)</label>
                  <div className="p-2 rounded-lg bg-slate-800 font-extrabold text-sm text-white">
                    ${totals.totalAmount}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Advance Received ($)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-900 font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Due Amount ($)</label>
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 font-extrabold text-sm text-amber-300">
                    ${totals.dueAmount}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Delivery Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Dhaka / Banani / Chittagong Courier"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white"
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
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Payment Proof Image</label>
                    <label className="text-[10px] text-emerald-400 font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Upload Slip
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, setPaymentProofUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="https://... receipt image"
                    value={paymentProofUrl}
                    onChange={(e) => setPaymentProofUrl(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-700 bg-slate-800/80 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowApprovalSheet(true)}
                className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
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
                  disabled={isSubmitting || totalQuantity <= 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Order & Generate Job Card</span>
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
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900">
                  Customer Garment Design & Spec Approval Sheet
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
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
              <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-4">
                <div>
                  <h1 className="text-xl font-black text-indigo-950 uppercase tracking-wide">
                    RIDWEAR SPORTSWEAR MFG.
                  </h1>
                  <p className="text-slate-600 text-[11px]">
                    Head Office: House 42, Road 11, Block D, Banani, Dhaka 1213
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Print Factory: Tongi Industrial Zone &bull; Sewing Factory: Mirpur-10
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                    <span className="font-mono font-bold text-indigo-800 text-sm">
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
                    <span className="font-black text-indigo-700 uppercase">
                      {collarType.replace('_', ' ')} {customCollarNote ? `(${customCollarNote})` : ''}
                    </span>
                  </p>
                  <p className="text-slate-800">
                    <span className="font-bold">Total Jersey Units:</span>{' '}
                    <span className="font-black text-indigo-700">{totalQuantity} pcs</span>
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
                      <th className="p-1.5 border border-slate-300 bg-indigo-50 font-black">
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
                      <td className="p-1.5 border border-slate-300 bg-indigo-50 font-black text-indigo-700">
                        {totalQuantity} pcs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {includeShorts && (
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 border-b border-slate-200 pb-1">
                    Matching Shorts Specification ({shortsTotalQty} pcs)
                  </h4>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-2">
                    <p>
                      <span className="font-bold">Fabric:</span> {shortsFabric}
                    </p>
                    <p>
                      <span className="font-bold">Pockets:</span>{' '}
                      {shortsPocketType.replace('_', ' ')}
                    </p>
                    <p>
                      <span className="font-bold">Inner Liner:</span>{' '}
                      {shortsLiner ? 'With Mesh Liner' : 'No Liner'}
                    </p>
                  </div>
                  <table className="w-full text-center border border-slate-300">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-1.5 border border-slate-300">Shorts S</th>
                        <th className="p-1.5 border border-slate-300">Shorts M</th>
                        <th className="p-1.5 border border-slate-300">Shorts L</th>
                        <th className="p-1.5 border border-slate-300">Shorts XL</th>
                        <th className="p-1.5 border border-slate-300">Shorts 2XL</th>
                        <th className="p-1.5 border border-slate-300 bg-emerald-50 font-black">
                          Total Shorts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold">
                        <td className="p-1.5 border border-slate-300">{shortsSizes.S || 0}</td>
                        <td className="p-1.5 border border-slate-300">{shortsSizes.M || 0}</td>
                        <td className="p-1.5 border border-slate-300">{shortsSizes.L || 0}</td>
                        <td className="p-1.5 border border-slate-300">{shortsSizes.XL || 0}</td>
                        <td className="p-1.5 border border-slate-300">
                          {shortsSizes['2XL'] || 0}
                        </td>
                        <td className="p-1.5 border border-slate-300 bg-emerald-50 font-black text-emerald-700">
                          {shortsTotalQty} pcs
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[11px] text-slate-600">
                    Terms: 50% advance on design sign-off, remaining 50% upon delivery dispatch.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-semibold mr-4">
                    Total: ${totals.totalAmount}
                  </span>
                  <span className="text-emerald-700 font-bold mr-4">
                    Advance: ${totals.advanceAmount}
                  </span>
                  <span className="text-amber-800 font-black">Balance Due: ${totals.dueAmount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t-2 border-slate-300">
                <div className="text-center">
                  <div className="h-14 border-b border-dashed border-slate-400"></div>
                  <p className="font-bold text-slate-800 mt-1">Authorized Customer Signature</p>
                  <p className="text-[10px] text-slate-500">
                    I confirm design, spelling, collar, shorts & sizes
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-14 border-b border-dashed border-slate-400"></div>
                  <p className="font-bold text-slate-800 mt-1">For Ridwear Sportswear Factory</p>
                  <p className="text-[10px] text-slate-500">
                    {selectedEmployee?.name || 'Production & Quality Control Lead'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
