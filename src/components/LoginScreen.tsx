/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee, UserRole, ROLE_CONFIGS } from '../types/erp';
import { canUserSwitchRole } from '../utils/erpLogic';
import { SoftwareAuthorizedInfoCard } from './SoftwareAuthorizedInfoCard';
import {
  Shirt,
  Lock,
  ShieldCheck,
  LogIn,
  KeyRound,
  UserCheck,
  Building2,
  Printer,
  Scissors,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  onLoginSuccess: (staff: Employee) => void;
  onGoogleLogin: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  employees,
  onLoginSuccess,
  onGoogleLogin,
}) => {
  const [identifier, setIdentifier] = useState('EMP-001');
  const [pinCode, setPinCode] = useState('1234');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('emp-001');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (emp: Employee) => {
    setSelectedStaffId(emp.id);
    setIdentifier(emp.employeeId || emp.email);
    setPinCode('1234');
    setErrorMsg(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !pinCode.trim()) {
      setErrorMsg('Please enter your Employee ID / Email and Security PIN.');
      return;
    }

    const matched =
      employees.find(
        (emp) =>
          emp.employeeId.toLowerCase() === cleanId ||
          emp.email.toLowerCase() === cleanId ||
          emp.name.toLowerCase() === cleanId ||
          emp.id.toLowerCase() === cleanId
      ) || employees.find((emp) => emp.id === selectedStaffId);

    if (!matched) {
      setErrorMsg('Employee account not found. Please select a valid staff profile or enter a registered ID.');
      return;
    }

    onLoginSuccess(matched);
  };

  return (
    <div
      data-testid="mandatory-login-gate"
      className="min-h-screen w-screen bg-[#060911] text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none"
    >
      {/* Top Security Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider uppercase text-white">
                SPORTSWEAR OS • ENTERPRISE ERP
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                ৳ BDT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Banani Head Office • Tongi Sublimation Print Mill • Mirpur Sewing Factory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Mandatory Authentication Gate — Login Required to Access System</span>
        </div>
      </div>

      {/* Main Login Grid */}
      <div className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: Credential Login Card */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Personnel Access</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Sign In to Workstation Terminal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every user must authenticate before viewing or performing any task. Active role switching is strictly restricted to Owner & Manager accounts.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Employee ID or Corporate Email
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                <input
                  type="text"
                  data-testid="login-identifier-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. EMP-001 or ridwearbd@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Security PIN / Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                <input
                  type="password"
                  data-testid="login-pin-input"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter PIN (Default: 1234)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="login-submit-btn"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Authenticate & Enter ERP System</span>
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Or Corporate SSO
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Sign In with Google Workspace</span>
          </button>

          {/* Role Switching Policy Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Role-Based Access Control (RBAC)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              • <strong>Owner & Manager</strong> accounts can switch active department roles to audit any facility.<br />
              • <strong>All other staff</strong> are locked to their assigned department role and position.
            </p>
          </div>
        </div>

        {/* Right 7 Columns: Quick Staff Directory Login Cards */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Select Staff Terminal Account (1-Click Login)
              </h2>
              <p className="text-xs text-slate-400">
                Click any employee card below to populate credentials or sign in directly with their Name & Position in the Header Panel.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold">
              {employees.length} Registered Staff
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {employees.map((emp) => {
              const isSelected = selectedStaffId === emp.id;
              const roleCfg = ROLE_CONFIGS[emp.role];
              const canSwitch = canUserSwitchRole(emp.role);

              return (
                <div
                  key={emp.id}
                  onClick={() => handleSelectPreset(emp)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-xs">{emp.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-bold">
                            {emp.employeeId}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-amber-300 mt-0.5">
                          {emp.designation}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                        {emp.department}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          canSwitch
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {canSwitch ? 'Can Switch Role' : 'Role Locked'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      {emp.location === 'head_office' ? (
                        <Building2 className="w-3 h-3 text-sky-400" />
                      ) : emp.location === 'print_factory' ? (
                        <Printer className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Scissors className="w-3 h-3 text-indigo-400" />
                      )}
                      {roleCfg?.shortLabel || emp.role}
                    </span>

                    <button
                      type="button"
                      data-testid={`quick-login-${emp.employeeId}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoginSuccess(emp);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer"
                    >
                      Login as {emp.name.split(' ')[0]} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Authorized Developer Info */}
      <div className="max-w-6xl w-full mx-auto">
        <SoftwareAuthorizedInfoCard variant="footer" />
      </div>
    </div>
  );
};
