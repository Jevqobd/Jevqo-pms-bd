/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompanySettings, UserRole } from '../types/erp';
import { Language } from '../utils/translations';
import {
  X,
  Settings,
  Building2,
  Printer,
  Scissors,
  DollarSign,
  Percent,
  Hash,
  Target,
  Save,
  Check,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  currentRole: UserRole;
  language?: Language;
  onSaveSettings: (settings: CompanySettings) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentRole,
  language = 'en',
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = currentRole === 'owner' || currentRole === 'accountant';

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                {language === 'bn' ? 'সিস্টেম ও ফ্যাক্টরি সেটিংস' : 'Enterprise & Factory Settings'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'bn'
                  ? 'কোম্পানির নাম, ঠিকানা, করের হার এবং উৎপাদনের দৈনিক টার্গেট কনফিগার করুন।'
                  : 'Manage headquarters info, facility locations, VAT rates, and engineering targets.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-press p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Brand & Contact Information */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'bn' ? 'কোম্পানি ও ব্র্যান্ডের সাধারণ তথ্য' : 'Corporate Identity & Contact'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tagline / Slogan</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs focus:outline-none focus:border-emerald-500"
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
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs font-mono"
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
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
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
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 3 Factory Facilities Physical Addresses */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>{language === 'bn' ? '৩টি কারখানার অবস্থান ও ঠিকানা' : '3 Facility Locations & Challan Addresses'}</span>
            </h4>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                1. Head Office (Banani CRM, Accounts & Design Studio)
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.addressHeadOffice}
                onChange={(e) => handleChange('addressHeadOffice', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-teal-400" /> 2. Tongi Print Factory (Paper Sublimation & Calendar Heat Press)
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.addressPrintMill}
                onChange={(e) => handleChange('addressPrintMill', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-indigo-400" /> 3. Mirpur Sewing Factory (Laser Cutting, Assembly & Packaging)
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.addressSewingFactory}
                onChange={(e) => handleChange('addressSewingFactory', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1 text-xs"
              />
            </div>
          </div>

          {/* Section 3: Financial & Numbering Prefixes */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>{language === 'bn' ? 'ট্যাক্স, মুদ্রা ও সিরিয়াল নম্বর প্রিফিক্স' : 'Tax, Currency & Numbering Sequences'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">VAT Rate (%)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.1"
                    disabled={!canEdit}
                    value={formData.taxVatPercentage}
                    onChange={(e) => handleChange('taxVatPercentage', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs"
                  />
                  <Percent className="w-3.5 h-3.5 absolute right-3 top-2 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Currency Symbol</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Job Card Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.jobCardPrefix}
                  onChange={(e) => handleChange('jobCardPrefix', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Daily Productivity Targets */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>{language === 'bn' ? 'কারখানা দৈনিক উৎপাদন লক্ষ্যমাত্রা' : 'Factory Daily Engineering Targets'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] font-bold text-teal-400 uppercase">
                  Tongi Print Target (Meters / Day)
                </label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={formData.dailyPrintTargetMeters}
                  onChange={(e) => handleChange('dailyPrintTargetMeters', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold"
                />
                <span className="text-[10px] text-slate-500">Benchmark across 3 roll sublimation plotters</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] font-bold text-indigo-400 uppercase">
                  Mirpur Sewing Target (Pcs / Day)
                </label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={formData.dailySewingTargetPcs}
                  onChange={(e) => handleChange('dailySewingTargetPcs', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold"
                />
                <span className="text-[10px] text-slate-500">Standard for 4 assembly lines + collar finishing</span>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              {saveSuccess && (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> System settings updated across cloud!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-press px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-press flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
