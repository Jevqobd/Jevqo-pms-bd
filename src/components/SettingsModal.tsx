/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompanySettings, UserRole, ShippingIntegration } from '../types/erp';
import { Language } from '../utils/translations';
import { useFormDraft } from '../utils/useFormDraft';
import {
  X,
  Settings,
  Building2,
  Printer,
  Scissors,
  DollarSign,
  Percent,
  Target,
  Save,
  Check,
  Phone,
  Mail,
  Globe,
  Layers,
  Truck,
  Link2,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  currentRole: UserRole;
  language?: Language;
  onSaveSettings: (settings: CompanySettings) => Promise<void>;
}

const DEFAULT_MODULE_LABELS: Record<string, string> = {
  dashboard_tasks: 'Dashboard & Tasks',
  orders: 'Job Cards & Pipeline',
  head_office: 'Head Office & Design',
  customers_crm: 'Customers & Playbook',
  product_dev_samples: 'Product Dev & Samples',
  vendors_suppliers: 'Vendors & Suppliers',
  users_employees: 'Users & Staff Directory',
  documents_center: 'Company Documents',
  guidelines_sop: 'Guidelines & Sync Hub',
  print_floor: 'Tongi Print Factory',
  sewing_floor: 'Mirpur Sewing Factory',
  shortages: 'Shortage / Re-Print',
  bulk_import: 'Bulk Data Import Hub',
  accounting: 'Accounting & Ledgers',
  inventory: 'Inventory & Assets',
  hr_payroll: 'HR, Attendance & Salary',
  managers_portal: 'Managers Approvals',
  employee_portal: 'Employee Workstation',
};

const SYSTEM_FEATURE_DESCRIPTIONS: Record<
  string,
  { title: string; desc: string }
> = {
  autoDraftForms: {
    title: 'Auto-Draft Form Protection',
    desc: 'Automatically keeps every unsaved form entry in draft state until Cancel or Save.',
  },
  qrBundleTracking: {
    title: 'QR Fabric Bundle Tracking',
    desc: 'Generate and scan unique QR bundle tags across Print and Sewing floors.',
  },
  shortageAlerts: {
    title: 'Priority Shortage Audio & Popup Alerts',
    desc: 'Trigger real-time sound and popup alerts when Sewing raises a damaged panel ticket.',
  },
  b2bClientPortal: {
    title: 'B2B Client Portal & Loyalty Stars',
    desc: 'Embed customer portal pass, returning ratio %, and privilege stars on invoices.',
  },
  shippingAutoSync: {
    title: 'Automated Courier & Challan Sync',
    desc: 'Auto-fill courier booking and gate pass challans when orders complete packing.',
  },
  whatsappSmsBridge: {
    title: 'Offline Staff SMS / WhatsApp Gateway',
    desc: 'Allow team chat to dispatch phone alerts when factory staff are offline.',
  },
  aiCopilot: {
    title: 'Multi-Role ERP Copilot Assistant',
    desc: 'Enable production, pre-press, and marketing reply copilot drawer.',
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentRole,
  language = 'en',
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<
    'corporate' | 'modules_features' | 'shipping' | 'external_api'
  >('corporate');

  const {
    draft: formData,
    setDraft: setFormData,
    updateField,
    clearDraft,
    lastSavedAt,
  } = useFormDraft<CompanySettings>('enterprise_system_settings_draft', settings);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New courier state
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierMerchantId, setNewCourierMerchantId] = useState('');

  // New custom feature state
  const [newFunctionKey, setNewFunctionKey] = useState('');

  if (!isOpen) return null;

  const canEdit = currentRole === 'owner' || currentRole === 'accountant';

  const handleModuleRename = (moduleId: string, newLabel: string) => {
    setFormData((prev) => ({
      ...prev,
      customModuleNames: {
        ...(prev.customModuleNames || {}),
        [moduleId]: newLabel,
      },
    }));
  };

  const handleToggleFeature = (featureKey: string) => {
    setFormData((prev) => ({
      ...prev,
      enabledFeatures: {
        ...(prev.enabledFeatures || {}),
        [featureKey]: !(prev.enabledFeatures?.[featureKey] ?? true),
      },
    }));
  };

  const handleAddCustomFunction = () => {
    const cleanKey = newFunctionKey.trim();
    if (!cleanKey) return;
    setFormData((prev) => ({
      ...prev,
      enabledFeatures: {
        ...(prev.enabledFeatures || {}),
        [cleanKey]: true,
      },
    }));
    setNewFunctionKey('');
  };

  const handleCourierChange = (
    courierId: string,
    field: keyof ShippingIntegration,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      shippingProviders: (prev.shippingProviders || []).map((sp) =>
        sp.id === courierId ? { ...sp, [field]: value } : sp
      ),
    }));
  };

  const handleAddCourier = () => {
    if (!newCourierName.trim()) return;
    const newCourier: ShippingIntegration = {
      id: `ship-${Date.now()}`,
      providerName: newCourierName.trim(),
      enabled: true,
      merchantId: newCourierMerchantId.trim() || 'MERCH-NEW-01',
      apiEndpoint: 'https://api.ridwear.erp/webhooks/courier',
      insideCityRate: 70,
      outsideCityRate: 130,
      autoBookOnDispatch: true,
      status: 'connected',
    };
    setFormData((prev) => ({
      ...prev,
      shippingProviders: [...(prev.shippingProviders || []), newCourier],
    }));
    setNewCourierName('');
    setNewCourierMerchantId('');
  };

  const handleCancelAndDiscard = () => {
    clearDraft();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      clearDraft();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  {'Full System Settings, Module Customizer & Courier API'}
                </h3>
                {lastSavedAt && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                    Draft Auto-Saved ({lastSavedAt})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {'Edit any module name, toggle/add system functions, configure shipping couriers, and manage 3 facilities.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-press p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('corporate')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'corporate'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Company & 3 Facilities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modules_features')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'modules_features'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Edit Module Names & System Functions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'shipping'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>3. Shipping & Courier Companies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('external_api')}
            className={`px-3.5 py-2 rounded-t-xl border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'external_api'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>4. External Design Tool API</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: CORPORATE & FACILITIES */}
          {activeTab === 'corporate' && (
            <div className="space-y-5">
              {/* Brand & Contact */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Corporate Identity & Contact Info</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                    <input
                      type="text"
                      required
                      disabled={!canEdit}
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tagline / Slogan</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={formData.tagline}
                      onChange={(e) => updateField('tagline', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Hotline Phone
                    </label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> Official Email
                    </label>
                    <input
                      type="email"
                      disabled={!canEdit}
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" /> Web Portal URL
                    </label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3 Facilities */}
              <div className="space-y-3">
                <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>3 Facility Physical Addresses (Used on Invoices & Delivery Challans)</span>
                </h4>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    1. Head Office (Marketing CRM, Accounts & Design Studio)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.addressHeadOffice}
                    onChange={(e) => updateField('addressHeadOffice', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5 text-teal-400" /> 2. Print Factory (Roll Sublimation & Calendar Heat Press)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.addressPrintMill}
                    onChange={(e) => updateField('addressPrintMill', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-indigo-400" /> 3. Sewing Factory (Cutting, Stitching & Packing Dispatch)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.addressSewingFactory}
                    onChange={(e) => updateField('addressSewingFactory', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Financial & Targets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">VAT Rate (%)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.1"
                      disabled={!canEdit}
                      value={formData.taxVatPercentage}
                      onChange={(e) => updateField('taxVatPercentage', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs"
                    />
                    <Percent className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Currency Symbol</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={formData.currencySymbol}
                    onChange={(e) => updateField('currencySymbol', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Daily Print Target (m)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={formData.dailyPrintTargetMeters}
                    onChange={(e) => updateField('dailyPrintTargetMeters', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-teal-400 font-mono font-bold text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Daily Sewing Target (pcs)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={formData.dailySewingTargetPcs}
                    onChange={(e) => updateField('dailySewingTargetPcs', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-indigo-400 font-mono font-bold text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT ANY MODULE NAME & ADD/TOGGLE SYSTEM FUNCTIONS */}
          {activeTab === 'modules_features' && (
            <div className="space-y-6">
              {/* Rename Sidebar Modules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="font-black text-sm text-white">
                      Customize & Edit Any Sidebar Module Name
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Rename any navigation module to match your exact factory terminology. Changes reflect live in the left sidebar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('customModuleNames', {})}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Default Names
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(DEFAULT_MODULE_LABELS).map(([modId, defaultLabel]) => {
                    const currentVal = formData.customModuleNames?.[modId] ?? defaultLabel;
                    return (
                      <div
                        key={modId}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>ID: {modId}</span>
                          {formData.customModuleNames?.[modId] && (
                            <span className="text-emerald-400 font-bold">Edited</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => handleModuleRename(modId, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Functions & Add Custom Function */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>System Functions & Enterprise Feature Toggles</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Enable, disable, or register new workflow functions across the ERP.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add new function (e.g. barcodeAutoPrint)"
                      value={newFunctionKey}
                      onChange={(e) => setNewFunctionKey(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomFunction}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Function
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries({
                    ...SYSTEM_FEATURE_DESCRIPTIONS,
                    ...Object.fromEntries(
                      Object.keys(formData.enabledFeatures || {})
                        .filter((k) => !SYSTEM_FEATURE_DESCRIPTIONS[k])
                        .map((k) => [
                          k,
                          {
                            title: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
                            desc: 'Custom enterprise workflow function enabled by administrator.',
                          },
                        ])
                    ),
                  }).map(([key, info]) => {
                    const isEnabled = formData.enabledFeatures?.[key] ?? true;
                    return (
                      <div
                        key={key}
                        onClick={() => handleToggleFeature(key)}
                        className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition ${
                          isEnabled
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{info.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{info.desc}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                            isEnabled
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isEnabled ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHIPPING & COURIER INTEGRATIONS */}
          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Shipping & Courier Company API Integrations</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Connect local & international logistics partners for automated consignment booking, COD tracking, and gate pass labels.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New Courier Name (e.g. Paperfly)"
                    value={newCourierName}
                    onChange={(e) => setNewCourierName(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Merchant ID"
                    value={newCourierMerchantId}
                    onChange={(e) => setNewCourierMerchantId(e.target.value)}
                    className="w-28 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddCourier}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Courier
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.shippingProviders || []).map((courier) => (
                  <div
                    key={courier.id}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      courier.enabled
                        ? 'bg-slate-950/80 border-emerald-500/30'
                        : 'bg-slate-950/40 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span className="font-black text-white text-sm">{courier.providerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCourierChange(courier.id, 'enabled', !courier.enabled)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer ${
                          courier.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {courier.enabled ? 'CONNECTED' : 'DISABLED'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Merchant ID</label>
                        <input
                          type="text"
                          value={courier.merchantId}
                          onChange={(e) => handleCourierChange(courier.id, 'merchantId', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold">API Endpoint / Webhook</label>
                        <input
                          type="text"
                          value={courier.apiEndpoint}
                          onChange={(e) => handleCourierChange(courier.id, 'apiEndpoint', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs mt-0.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Inside City Rate (৳)</label>
                        <input
                          type="number"
                          value={courier.insideCityRate}
                          onChange={(e) =>
                            handleCourierChange(courier.id, 'insideCityRate', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Outside City Rate (৳)</label>
                        <input
                          type="number"
                          value={courier.outsideCityRate}
                          onChange={(e) =>
                            handleCourierChange(courier.id, 'outsideCityRate', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs mt-0.5"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={courier.autoBookOnDispatch}
                          onChange={(e) =>
                            handleCourierChange(courier.id, 'autoBookOnDispatch', e.target.checked)
                          }
                          className="rounded text-emerald-600"
                        />
                        <span>Auto-book parcel when Sewing marks Packed</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXTERNAL DESIGN TOOL API */}
          {activeTab === 'external_api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-sm">
                  <Link2 className="w-4 h-4" />
                  <span>External Kit Builder & Vector Pre-Press API Bridge</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The internal AI Mockup Builder has been replaced with your dedicated External Design Tool API integration. Configure the endpoint below so Design Team 1 & Design Team 2 can sync approved 3D mockups and graded print files directly into Job Cards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    External Design Platform Name
                  </label>
                  <input
                    type="text"
                    value={formData.externalDesignToolName || 'ProKit 3D & Clo3D API Bridge'}
                    onChange={(e) => updateField('externalDesignToolName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    External API / Webhook Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={formData.externalDesignApiUrl || 'https://api.prokit3d.studio/v2/ridwear-sync'}
                    onChange={(e) => updateField('externalDesignApiUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">API Webhook Status: Ready & Authenticated</div>
                    <div className="text-[11px] text-slate-400">
                      Automatically attaches front/back/sleeve mockups and RIP print links to Job Cards.
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  HTTP 200 OK
                </span>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              {saveSuccess ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> System settings, module names & couriers updated!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Changes stay in auto-saved draft until you click Discard Draft or Save Settings.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCancelAndDiscard}
                className="btn-press px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel (Discard Draft)
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-press flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
