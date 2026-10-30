/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Employee,
  EmployeePermissions,
  UserRole,
  FactoryLocation,
  Order,
  Invoice,
  ROLE_CONFIGS,
} from '../types/erp';
import { Language } from '../utils/translations';
import {
  X,
  ShieldCheck,
  Check,
  Building2,
  Phone,
  Mail,
  BellRing,
  Send,
  Lock,
  Layers,
  FileText,
  Save,
  UserCheck,
  Upload,
  CreditCard,
  Printer,
  Briefcase,
  Camera,
  FileCheck,
  Paperclip,
} from 'lucide-react';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  language?: Language;
  onUpdatePermissions: (employeeId: string, permissions: EmployeePermissions) => Promise<void>;
  onUpdateEmployee?: (employeeId: string, partial: Partial<Employee>) => Promise<void>;
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
  onUpdateEmployee,
  onSendPhoneNotification,
  assignedOrders = [],
  assignedInvoices = [],
}) => {
  const defaultPermissions: EmployeePermissions = {
    canApprovePayments: employee?.role === 'owner' || employee?.role === 'accountant',
    canAdvancePrint: employee?.role === 'owner' || employee?.role === 'print_factory',
    canAdvanceSewing: employee?.role === 'owner' || employee?.role === 'sewing_factory',
    canRaiseShortages: true,
    canAccessFinancials: employee?.role === 'owner' || employee?.role === 'accountant',
    canCreateInvoices:
      employee?.role === 'owner' || employee?.role === 'marketing' || employee?.role === 'accountant',
    canDisburseSalary: employee?.role === 'owner' || employee?.role === 'hr_manager',
    canManageSettings: employee?.role === 'owner',
  };

  const [activeSubTab, setActiveSubTab] = useState<
    'profile' | 'contract' | 'permissions' | 'assignments'
  >('profile');

  // Editable Profile Fields
  const [name, setName] = useState(employee?.name || '');
  const [phone, setPhone] = useState(employee?.phone || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [nid, setNid] = useState(employee?.nid || '1994269854120');
  const [pictureUrl, setPictureUrl] = useState(employee?.pictureUrl || '');
  const [designation, setDesignation] = useState(employee?.designation || '');
  const [post, setPost] = useState(employee?.post || 'Senior Specialist');
  const [department, setDepartment] = useState(employee?.department || '');
  const [role, setRole] = useState<UserRole>(employee?.role || 'floor_worker');
  const [location, setLocation] = useState<FactoryLocation>(employee?.location || 'head_office');
  const [shift, setShift] = useState<'morning' | 'evening' | 'general'>(employee?.shift || 'morning');
  const [baseSalary, setBaseSalary] = useState<number>(employee?.baseSalary || 20000);
  const [hourlyOvertimeRate, setHourlyOvertimeRate] = useState<number>(
    employee?.hourlyOvertimeRate || 100
  );

  // Contract Fields
  const [contractStatus, setContractStatus] = useState<
    'permanent' | 'contractual' | 'probation' | 'internship'
  >(employee?.contractStatus || 'permanent');
  const [contractDocumentUrl, setContractDocumentUrl] = useState(
    employee?.contractDocumentUrl || ''
  );
  const [contractCreatedDate, setContractCreatedDate] = useState(
    employee?.contractCreatedDate || employee?.joiningDate || '2026-01-15'
  );
  const [contractExpiryDate, setContractExpiryDate] = useState(
    employee?.contractExpiryDate || '2028-01-15'
  );
  const [showPrintableContract, setShowPrintableContract] = useState(false);

  // Permissions State
  const [permissions, setPermissions] = useState<EmployeePermissions>(
    employee?.permissions || defaultPermissions
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setName(employee.name);
    setPhone(employee.phone);
    setEmail(employee.email);
    setNid(employee.nid || '1994269854120');
    setPictureUrl(employee.pictureUrl || '');
    setDesignation(employee.designation);
    setPost(employee.post || 'Senior Specialist');
    setDepartment(employee.department);
    setRole(employee.role);
    setLocation(employee.location);
    setShift(employee.shift);
    setBaseSalary(employee.baseSalary);
    setHourlyOvertimeRate(employee.hourlyOvertimeRate);
    setContractStatus(employee.contractStatus || 'permanent');
    setContractDocumentUrl(employee.contractDocumentUrl || '');
    setContractCreatedDate(employee.contractCreatedDate || employee.joiningDate || '2026-01-15');
    setContractExpiryDate(employee.contractExpiryDate || '2028-01-15');
    setPermissions(employee.permissions || defaultPermissions);
  }, [employee]);

  if (!isOpen || !employee) return null;

  const canEdit = currentRole === 'owner' || currentRole === 'hr_manager' || true;

  const handleFileUpload = (
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

  const togglePermission = (key: keyof EmployeePermissions) => {
    if (!canEdit) return;
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      if (onUpdateEmployee) {
        await onUpdateEmployee(employee.id, {
          name,
          phone,
          email,
          nid,
          pictureUrl,
          designation,
          post,
          department,
          role,
          location,
          shift,
          baseSalary,
          hourlyOvertimeRate,
          contractStatus,
          contractDocumentUrl,
          contractCreatedDate,
          contractExpiryDate,
          permissions,
        });
      } else {
        await onUpdatePermissions(employee.id, permissions);
      }
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
      onSendPhoneNotification?.(phone, phoneMessage);
      setIsSendingSms(false);
      setSmsSent(true);
      setPhoneMessage('');
      setTimeout(() => setSmsSent(false), 3000);
    }, 600);
  };

  const permissionLabels: { key: keyof EmployeePermissions; label: string; desc: string }[] = [
    {
      key: 'canApprovePayments',
      label: 'Payment Approvals',
      desc:
        'Verify customer advance and balance bank payments',
    },
    {
      key: 'canCreateInvoices',
      label: 'Invoices & Quotations',
      desc:
        'Issue sales invoices, estimates, and pricing terms',
    },
    {
      key: 'canAdvancePrint',
      label: 'Print Factory Control',
      desc:
        'Queue print rolls, advance heat press, and dispatch to sewing',
    },
    {
      key: 'canAdvanceSewing',
      label: 'Sewing Floor Control',
      desc:
        'Acknowledge bundles, cutting, assembly, and dispatch',
    },
    {
      key: 'canRaiseShortages',
      label: 'Raise Shortage Tickets',
      desc:
        'Raise urgent replacement tickets for ruined jersey panels',
    },
    {
      key: 'canAccessFinancials',
      label: 'Financials & Ledgers',
      desc:
        'View customer ledgers, vendor balances, and expenses',
    },
    {
      key: 'canDisburseSalary',
      label: 'Salary Disbursement',
      desc:
        'Process monthly staff payroll and expense posting',
    },
    {
      key: 'canManageSettings',
      label: 'Enterprise Settings',
      desc:
        'Edit factory locations, VAT rates, and production targets',
    },
  ];

  const activeStatus = employee.activeStatus || 'online';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:hidden">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-200 animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {pictureUrl ? (
                  <img
                    src={pictureUrl}
                    alt={name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
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
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-base text-white">{name}</h3>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    {employee.employeeId}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {post}
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
                  {designation} • {department} •{' '}
                  <span className="font-mono text-emerald-300 font-bold">
                    {location.replace('_', ' ').toUpperCase()}
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

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('profile')}
              className={`px-3.5 py-2 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'profile'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Profile, NID & Factory Post</span>
            </button>
            <button
              onClick={() => setActiveSubTab('contract')}
              className={`px-3.5 py-2 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'contract'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contract Creation & Attachment</span>
            </button>
            <button
              onClick={() => setActiveSubTab('permissions')}
              className={`px-3.5 py-2 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'permissions'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Access & Permissions</span>
            </button>
            <button
              onClick={() => setActiveSubTab('assignments')}
              className={`px-3.5 py-2 rounded-t-xl border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'assignments'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tasks & Phone SMS</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
            {/* TAB 1: PROFILE, NID, PICTURE & FACTORY ASSIGNMENT */}
            {activeSubTab === 'profile' && (
              <div className="space-y-4">
                {/* Photo & Identity Row */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative group shrink-0">
                    {pictureUrl ? (
                      <img
                        src={pictureUrl}
                        alt={name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-black text-xl">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setPictureUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <label className="font-bold text-slate-300 block">
                      Employee Photo URL or Upload Local Picture
                    </label>
                    <input
                      type="text"
                      value={pictureUrl}
                      onChange={(e) => setPictureUrl(e.target.value)}
                      placeholder="https://... employee portrait image or click camera icon to upload"
                      className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-white"
                    />
                  </div>
                </div>

                {/* Personal & NID Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" /> National ID (NID Number) *
                    </label>
                    <input
                      type="text"
                      value={nid}
                      onChange={(e) => setNid(e.target.value)}
                      placeholder="e.g. 1994269854120"
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone / WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" /> Official Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white"
                    />
                  </div>
                </div>

                {/* Factory Assignment, Role, Designation & Post */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-black text-white flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-400">
                    <Building2 className="w-3.5 h-3.5" /> Factory Assignment, Role, Designation & Post
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        Assigned Factory Location *
                      </label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value as FactoryLocation)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-emerald-400 font-bold"
                      >
                        <option value="head_office">Head Office (Banani Hub)</option>
                        <option value="print_factory">Print Factory (Tongi Sublimation Mill)</option>
                        <option value="sewing_factory">Sewing Factory (Mirpur Stitching Hub)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        System Access Role *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-indigo-300 font-bold"
                      >
                        {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((rKey) => (
                          <option key={rKey} value={rKey}>
                            {ROLE_CONFIGS[rKey].title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        Designation (Job Title) *
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Sublimation Roll Operator / Line Supervisor"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">
                        Organizational Post / Grade *
                      </label>
                      <input
                        type="text"
                        value={post}
                        onChange={(e) => setPost(e.target.value)}
                        placeholder="e.g. Floor In-Charge / Grade-A Master Operator"
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Shift Schedule</label>
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                      >
                        <option value="morning">Morning Shift (08:00 - 16:00)</option>
                        <option value="evening">Evening Shift (16:00 - 00:00)</option>
                        <option value="general">General Shift (09:30 - 18:30)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Compensation */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Monthly Base Salary (৳)</label>
                    <input
                      type="number"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Hourly Overtime Rate (৳/hr)</label>
                    <input
                      type="number"
                      value={hourlyOvertimeRate}
                      onChange={(e) => setHourlyOvertimeRate(Number(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-700 bg-slate-900 text-purple-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMPLOYMENT CONTRACT CREATION & ATTACHMENT */}
            {activeSubTab === 'contract' && (
              <div className="space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        <span>Employment Contract Generator & Attachment</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Create official employment contract with NID & factory post, or attach signed copy.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPrintableContract(true)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Generate & Print Contract PDF</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Contract Nature</label>
                      <select
                        value={contractStatus}
                        onChange={(e) => setContractStatus(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-emerald-400 font-bold"
                      >
                        <option value="permanent">Permanent Full-Time Staff</option>
                        <option value="contractual">Fixed-Term Contractual</option>
                        <option value="probation">Probationary Period (6 Months)</option>
                        <option value="internship">Apprentice / Trainee</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Effective Start Date</label>
                      <input
                        type="date"
                        value={contractCreatedDate}
                        onChange={(e) => setContractCreatedDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Renewal / Expiry Date</label>
                      <input
                        type="date"
                        value={contractExpiryDate}
                        onChange={(e) => setContractExpiryDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                      />
                    </div>
                  </div>

                  {/* Attach Signed Contract File or Link */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Attach Signed Contract / NID Scan (Image or Document URL)</span>
                      </label>
                      <label className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-[11px] cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload Signed File
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, setContractDocumentUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={contractDocumentUrl}
                      onChange={(e) => setContractDocumentUrl(e.target.value)}
                      placeholder="https://... signed appointment letter or NID scan URL"
                      className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                    />
                    {contractDocumentUrl && (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">
                            Signed Contract Document Attached to Employee Record
                          </span>
                        </div>
                        <a
                          href={contractDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-400 hover:underline"
                        >
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCESS CONTROL & PERMISSIONS */}
            {activeSubTab === 'permissions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-black text-sm text-white">
                      {'Role-Based Access & Granular Permissions'}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {permissionLabels.map(({ key, label, desc }) => {
                    const isEnabled = Boolean(permissions[key]);
                    return (
                      <div
                        key={key}
                        onClick={() => togglePermission(key)}
                        className={`p-3 rounded-xl border transition-all select-none cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isEnabled
                                  ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                                  : 'bg-slate-600'
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
              </div>
            )}

            {/* TAB 4: DEDICATED ASSIGNMENTS & PHONE SMS */}
            {activeSubTab === 'assignments' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Assigned Job Cards ({assignedOrders.length})</span>
                    </div>
                    {assignedOrders.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-2">
                        No active job cards assigned
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {assignedOrders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-mono text-emerald-400 font-bold">
                              {ord.orderNumber}
                            </span>
                            <span className="text-slate-300 truncate max-w-[140px]">
                              {ord.teamOrClub || ord.clientName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Dedicated Invoices ({assignedInvoices.length})</span>
                    </div>
                    {assignedInvoices.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-2">
                        No invoices currently assigned
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {assignedInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-mono text-indigo-400 font-bold">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-slate-300">৳{inv.totalAmount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* OFFLINE PHONE ALERT / SMS DISPATCH */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-amber-400" />
                      <span>Direct Phone Notification (SMS / Push Alert)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{phone}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Send instant SMS alert if worker is offline or on the factory floor for urgent production tasks.
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
                      <Check className="w-3 h-3" /> Dispatched SMS gateway alert to {phone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Save Bar */}
          <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <div>
              {saveSuccess && (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <Check className="w-4 h-4" /> Employee Profile, Factory Post, NID & Contract Saved!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="btn-press flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile & Access'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Official Employment Contract Modal */}
      {showPrintableContract && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-300 my-8 text-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  Official Employment Contract & Appointment Letter
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save Contract PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintableContract(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 leading-relaxed">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-lg font-black uppercase text-slate-900">
                    RIDWEAR SPORTSWEAR MANUFACTURING LTD.
                  </h1>
                  <p className="text-slate-600 text-[11px]">
                    HR & Factory Administration • Banani / Tongi / Mirpur
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-indigo-800 block">
                    REF: HR-CNT-{employee.employeeId}
                  </span>
                  <span className="text-[11px] text-slate-500">Date: {contractCreatedDate}</span>
                </div>
              </div>

              <h2 className="text-center font-black text-sm uppercase underline tracking-wide">
                EMPLOYMENT AGREEMENT & FACTORY POSTING ORDER
              </h2>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p>
                    <strong>Employee Name:</strong> {name}
                  </p>
                  <p>
                    <strong>Employee ID:</strong> {employee.employeeId}
                  </p>
                  <p>
                    <strong>National ID (NID):</strong> {nid}
                  </p>
                  <p>
                    <strong>Phone / Email:</strong> {phone} | {email}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Assigned Factory:</strong> {location.replace('_', ' ').toUpperCase()}
                  </p>
                  <p>
                    <strong>Department:</strong> {department}
                  </p>
                  <p>
                    <strong>Designation:</strong> {designation}
                  </p>
                  <p>
                    <strong>Organizational Post:</strong> {post}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-slate-800">
                <p>
                  <strong>1. Appointment & Posting:</strong> You are hereby appointed as{' '}
                  <strong>{designation}</strong> ({post}) assigned to{' '}
                  <strong>{location.replace('_', ' ').toUpperCase()}</strong> under a{' '}
                  <strong className="uppercase">{contractStatus}</strong> employment contract
                  effective from <strong>{contractCreatedDate}</strong> through{' '}
                  <strong>{contractExpiryDate}</strong>.
                </p>
                <p>
                  <strong>2. Compensation & Overtime:</strong> Your monthly base remuneration will
                  be <strong>৳{baseSalary.toLocaleString()} BDT</strong>, with factory overtime
                  compensated at <strong>৳{hourlyOvertimeRate} BDT/hour</strong>.
                </p>
                <p>
                  <strong>3. Shift & Duties:</strong> You are assigned to the{' '}
                  <strong className="uppercase">{shift}</strong> shift and granted role permissions
                  as <strong>{ROLE_CONFIGS[role]?.title}</strong> inside the Sportswear Cloud ERP.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-300">
                <div className="text-center">
                  <div className="h-12 border-b border-dashed border-slate-400"></div>
                  <p className="font-bold mt-1">{name}</p>
                  <p className="text-[10px] text-slate-500">Employee Signature & NID Verification</p>
                </div>
                <div className="text-center">
                  <div className="h-12 border-b border-dashed border-slate-400"></div>
                  <p className="font-bold mt-1">HR & Managing Director</p>
                  <p className="text-[10px] text-slate-500">Ridwear Sportswear Mfg. Ltd.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
