/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee, EmployeePermissions, UserRole, Order, Invoice } from '../types/erp';
import { Language } from '../utils/translations';
import {
  X,
  ShieldCheck,
  Check,
  Building2,
  Clock,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  AlertTriangle,
  UserCheck,
  BellRing,
  Send,
  Lock,
  Layers,
  FileText,
  Save,
} from 'lucide-react';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  language?: Language;
  onUpdatePermissions: (employeeId: string, permissions: EmployeePermissions) => Promise<void>;
  onSendPhoneNotification?: (phone: string, message: string) => void;
  assignedOrders?: Order[];
  assignedInvoices?: Invoice[];
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
  currentRole,
  language = 'en',
  onUpdatePermissions,
  onSendPhoneNotification,
  assignedOrders = [],
  assignedInvoices = [],
}) => {
  if (!isOpen || !employee) return null;

  const defaultPermissions: EmployeePermissions = {
    canApprovePayments: employee.role === 'owner' || employee.role === 'accountant',
    canAdvancePrint: employee.role === 'owner' || employee.role === 'print_factory',
    canAdvanceSewing: employee.role === 'owner' || employee.role === 'sewing_factory',
    canRaiseShortages: true,
    canAccessFinancials: employee.role === 'owner' || employee.role === 'accountant',
    canCreateInvoices: employee.role === 'owner' || employee.role === 'marketing' || employee.role === 'accountant',
    canDisburseSalary: employee.role === 'owner' || employee.role === 'hr_manager',
    canManageSettings: employee.role === 'owner',
  };

  const [permissions, setPermissions] = useState<EmployeePermissions>(
    employee.permissions || defaultPermissions
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const canEditPermissions = currentRole === 'owner' || currentRole === 'hr_manager';

  const togglePermission = (key: keyof EmployeePermissions) => {
    if (!canEditPermissions) return;
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdatePermissions(employee.id, permissions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSms = () => {
    if (!phoneMessage.trim()) return;
    setIsSendingSms(true);
    setTimeout(() => {
      onSendPhoneNotification?.(employee.phone, phoneMessage);
      setIsSendingSms(false);
      setSmsSent(true);
      setPhoneMessage('');
      setTimeout(() => setSmsSent(false), 3000);
    }, 600);
  };

  const permissionLabels: { key: keyof EmployeePermissions; label: string; desc: string }[] = [
    {
      key: 'canApprovePayments',
      label: language === 'bn' ? 'পেমেন্ট অনুমোদন' : 'Payment Approvals',
      desc: language === 'bn' ? 'অগ্রিম ও বিল পেমেন্ট অনুমোদন করতে পারবেন' : 'Verify customer advance and balance bank payments',
    },
    {
      key: 'canCreateInvoices',
      label: language === 'bn' ? 'ইনভয়েস ও কোটেশন তৈরি' : 'Invoices & Quotations',
      desc: language === 'bn' ? 'ক্লায়েন্ট ইনভয়েস তৈরি ও ডিসকাউন্ট নির্ধারণ' : 'Issue sales invoices, estimates, and pricing terms',
    },
    {
      key: 'canAdvancePrint',
      label: language === 'bn' ? 'টঙ্গী প্রিন্ট ফ্লোর অ্যাকশন' : 'Print Factory Control',
      desc: language === 'bn' ? 'সাবলিমেশন পেপার প্রিন্ট ও হিট প্রেস স্ট্যাটাস আপডেট' : 'Queue print rolls, advance heat press, and dispatch to sewing',
    },
    {
      key: 'canAdvanceSewing',
      label: language === 'bn' ? 'মিরপুর সুইং লাইন কন্ট্রোল' : 'Sewing Floor Control',
      desc: language === 'bn' ? 'ফ্যাব্রিক রিসিভ, কাটিং, সেলাই ও ফিনিশিং সম্পন্ন' : 'Acknowledge bundles, cutting, assembly, and dispatch',
    },
    {
      key: 'canRaiseShortages',
      label: language === 'bn' ? 'জরুরি রি-প্রিন্ট রিকুয়েস্ট' : 'Raise Shortage Tickets',
      desc: language === 'bn' ? 'নষ্ট বা ছেঁড়া পার্টসের রি-প্রিন্ট টিকিট তুলতে পারবেন' : 'Raise urgent replacement tickets for ruined jersey panels',
    },
    {
      key: 'canAccessFinancials',
      label: language === 'bn' ? 'হিসাব ও লেজার অ্যাক্সেস' : 'Financials & Ledgers',
      desc: language === 'bn' ? 'ব্যবসায়িক লেজার, খরচ এবং পিঅ্যান্ডএল দেখতে পারবেন' : 'View customer ledgers, vendor balances, and expenses',
    },
    {
      key: 'canDisburseSalary',
      label: language === 'bn' ? 'বেতন বিতরণ ও এইচআর' : 'Salary Disbursement',
      desc: language === 'bn' ? 'কর্মীদের বেতন ব্যাংক বা বিকাশে ছাড় করতে পারবেন' : 'Process monthly staff payroll and expense posting',
    },
    {
      key: 'canManageSettings',
      label: language === 'bn' ? 'সিস্টেম সেটিংস পরিবর্তন' : 'Enterprise Settings',
      desc: language === 'bn' ? 'কোম্পানি তথ্য, ফ্যাক্টরি ঠিকানা এবং টার্গেট পরিবর্তন' : 'Edit factory locations, VAT rates, and production targets',
    },
  ];

  const activeStatus = employee.activeStatus || 'online';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-lg">
                {employee.name.slice(0, 2).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  activeStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : activeStatus === 'idle'
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
                }`}
                title={`Status: ${activeStatus}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">{employee.name}</h3>
                <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  {employee.employeeId}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    activeStatus === 'online'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {activeStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {employee.designation} • {employee.department} •{' '}
                <span className="font-mono text-slate-300">
                  {employee.location.replace('_', ' ').toUpperCase()}
                </span>
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

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 font-sans uppercase block">Phone Contact</span>
              <span className="text-slate-200 font-bold">{employee.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans uppercase block">Work Shift</span>
              <span className="text-teal-400 font-bold uppercase">{employee.shift}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans uppercase block">Base Wage</span>
              <span className="text-emerald-400 font-bold">৳{employee.baseSalary.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans uppercase block">OT Rate</span>
              <span className="text-purple-400 font-bold">৳{employee.hourlyOvertimeRate}/hr</span>
            </div>
          </div>

          {/* ACCESS CONTROL & PERMISSION MANAGEMENT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="font-black text-sm text-white">
                  {language === 'bn' ? 'ভূমিকা ও পারমিশন কন্ট্রোল' : 'Role-Based Access & Permissions'}
                </h4>
              </div>
              {!canEditPermissions && (
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Read-Only (Admin/HR Only)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {permissionLabels.map(({ key, label, desc }) => {
                const isEnabled = Boolean(permissions[key]);
                return (
                  <div
                    key={key}
                    onClick={() => togglePermission(key)}
                    className={`p-3 rounded-xl border transition-all select-none ${
                      canEditPermissions ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      isEnabled
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isEnabled ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-600'
                          }`}
                        />
                        {label}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          isEnabled
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isEnabled ? 'ALLOWED' : 'LOCKED'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{desc}</p>
                  </div>
                );
              })}
            </div>

            {canEditPermissions && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  {saveSuccess && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Permissions saved to Employee Profile!
                    </span>
                  )}
                </span>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            )}
          </div>

          {/* DEDICATED ASSIGNED TASKS & INVOICES */}
          <div className="space-y-3 pt-2">
            <h4 className="font-black text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{language === 'bn' ? 'নিয়োজিত দায়িত্ব ও চালান' : 'Dedicated Assigned Job Cards & Invoices'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Assigned Orders */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Assigned Job Cards ({assignedOrders.length})</span>
                </div>
                {assignedOrders.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-2">No active job cards assigned</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {assignedOrders.slice(0, 4).map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-mono text-emerald-400 font-bold">{ord.orderNumber}</span>
                        <span className="text-slate-300 truncate max-w-[120px]">{ord.teamOrClub || ord.clientName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Invoices */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Dedicated Invoices ({assignedInvoices.length})</span>
                </div>
                {assignedInvoices.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-2">No invoices currently assigned</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {assignedInvoices.slice(0, 4).map((inv) => (
                      <div
                        key={inv.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-mono text-indigo-400 font-bold">{inv.invoiceNumber}</span>
                        <span className="text-slate-300">৳{inv.totalAmount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OFFLINE PHONE ALERT / SMS DISPATCH */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {language === 'bn' ? 'ফোনে জরুরি এসএমএস বা পুশ নোটিফিকেশন' : 'Direct Phone Notification (SMS / Push)'}
                </span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{employee.phone}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'bn'
                ? 'কর্মী অফলাইন বা ফ্লোরে থাকলে জরুরি অর্ডার শিফট বা রি-প্রিন্ট টাস্ক সংক্রান্ত সরাসরি মেসেজ পাঠান।'
                : 'Send instant SMS alert if worker is offline or on the factory floor for urgent production assignments.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={phoneMessage}
                onChange={(e) => setPhoneMessage(e.target.value)}
                placeholder="e.g. Urgent reprint needed for Titans FC Collar Panel at Tongi..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSendSms}
                disabled={isSendingSms || !phoneMessage.trim()}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingSms ? 'Sending...' : 'Send SMS'}</span>
              </button>
            </div>
            {smsSent && (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Dispatched SMS gateway alert to {employee.phone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
