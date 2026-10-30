/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Employee,
  CompanyAsset,
  Order,
  UserRole,
  FactoryLocation,
  ROLE_CONFIGS,
} from '../types/erp';
import { useFormDraft } from '../utils/useFormDraft';
import { Language } from '../utils/translations';
import {
  Users,
  ShieldCheck,
  Building2,
  Printer,
  Scissors,
  Monitor,
  Plus,
  Search,
  Phone,
  Mail,
  FileCheck,
  IdCard,
  UserCheck,
  X,
  Sliders,
  Layers,
} from 'lucide-react';

interface UsersEmployeesModuleProps {
  employees: Employee[];
  assets: CompanyAsset[];
  orders: Order[];
  currentRole: UserRole;
  language?: Language;
  onCreateEmployee: (emp: Employee) => Promise<void>;
  onUpdateEmployee: (id: string, partial: Partial<Employee>) => Promise<void>;
  onOpenEmployeeProfile: (emp: Employee) => void;
}

export const UsersEmployeesModule: React.FC<UsersEmployeesModuleProps> = ({
  employees,
  assets,
  orders,
  currentRole,
  language = 'en',
  onCreateEmployee,
  onUpdateEmployee,
  onOpenEmployeeProfile,
}) => {
  const [locationFilter, setLocationFilter] = useState<'all' | FactoryLocation>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const {
    draft: empDraft,
    updateField: updateEmpField,
    clearDraft: clearEmpDraft,
    lastSavedAt: empDraftSavedAt,
  } = useFormDraft('users_employees_create_form', {
    name: '',
    email: '',
    phone: '+880 17',
    role: 'floor_worker' as UserRole,
    department: 'Sewing Assembly Line',
    designation: 'Senior Line Operator',
    post: 'Line-2 Master Operator',
    location: 'sewing_factory' as FactoryLocation,
    nid: '',
    contractStatus: 'permanent' as Employee['contractStatus'],
    baseSalary: 26000,
    hourlyOvertimeRate: 160,
    shift: 'morning' as Employee['shift'],
  });

  const filteredEmployees = employees.filter((emp) => {
    if (locationFilter !== 'all' && emp.location !== locationFilter) return false;
    if (roleFilter !== 'all' && emp.role !== roleFilter) return false;
    if (
      searchTerm &&
      !emp.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(emp.post || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empDraft.name.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: `EMP-0${employees.length + 11}`,
      name: empDraft.name.trim(),
      email: empDraft.email || `${empDraft.name.toLowerCase().replace(/\s+/g, '.')}@sportswear.erp`,
      phone: empDraft.phone,
      role: empDraft.role,
      department: empDraft.department,
      designation: empDraft.designation,
      post: empDraft.post,
      location: empDraft.location,
      nid: empDraft.nid || '4910283746',
      contractStatus: empDraft.contractStatus,
      baseSalary: Number(empDraft.baseSalary) || 24000,
      hourlyOvertimeRate: Number(empDraft.hourlyOvertimeRate) || 150,
      joiningDate: new Date().toISOString().split('T')[0],
      shift: empDraft.shift,
      status: 'active',
      activeStatus: 'online',
    };

    await onCreateEmployee(newEmp);
    clearEmpDraft();
    setIsAddUserOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white border border-teal-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-400/30 backdrop-blur-md">
            <UserCheck className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                {'Dedicated Users, Roles & Employees Directory'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 font-bold text-[10px]">
                RBAC Access &bull; Factory Rosters &bull; Linked Hardware
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Central command for all ERP users and factory personnel across Banani Head Office, Tongi Print Factory, and Mirpur Sewing Hub — complete with designations, posts, NID, contracts, and assigned machines/PCs.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add User / Employee</span>
        </button>
      </div>

      {/* Facility Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setLocationFilter('all')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            locationFilter === 'all'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-slate-400">All System Users</span>
          <div className="text-xl font-black text-white mt-1">{employees.length} Personnel</div>
          <span className="text-[11px] text-emerald-400 font-semibold">9 RBAC Roles Active</span>
        </button>

        <button
          onClick={() => setLocationFilter('head_office')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            locationFilter === 'head_office'
              ? 'bg-blue-950/30 border-blue-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-blue-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Head Office (Banani)
          </span>
          <div className="text-xl font-black text-white mt-1">
            {employees.filter((e) => e.location === 'head_office').length} Staff
          </div>
          <span className="text-[11px] text-slate-400">Exec, CRM, Accounts & Design</span>
        </button>

        <button
          onClick={() => setLocationFilter('print_factory')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            locationFilter === 'print_factory'
              ? 'bg-teal-950/30 border-teal-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-teal-400 flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" /> Print Factory (Tongi)
          </span>
          <div className="text-xl font-black text-white mt-1">
            {employees.filter((e) => e.location === 'print_factory').length} Staff
          </div>
          <span className="text-[11px] text-slate-400">Sublimation & Heat Press</span>
        </button>

        <button
          onClick={() => setLocationFilter('sewing_factory')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            locationFilter === 'sewing_factory'
              ? 'bg-indigo-950/30 border-indigo-500/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-bold uppercase text-indigo-400 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5" /> Sewing Factory (Mirpur)
          </span>
          <div className="text-xl font-black text-white mt-1">
            {employees.filter((e) => e.location === 'sewing_factory').length} Staff
          </div>
          <span className="text-[11px] text-slate-400">Cutting, Stitching & QC</span>
        </button>
      </div>

      {/* Role Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs"
          >
            <option value="all">All System Roles ({employees.length})</option>
            {Object.values(ROLE_CONFIGS).map((rc) => (
              <option key={rc.id} value={rc.id}>
                {rc.shortLabel} — {rc.department}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee name, ID, designation, post..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Users & Employees Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const roleConf = ROLE_CONFIGS[emp.role];
          const empAssets = assets.filter(
            (a) => a.assignedEmployeeId === emp.id || a.assignedEmployeeName === emp.name
          );
          const empOrders = orders.filter(
            (o) => o.assignedToEmployeeId === emp.id || o.assignedToEmployeeName === emp.name
          );

          return (
            <div
              key={emp.id}
              className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-3">
                {/* Avatar + Identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {emp.pictureUrl ? (
                      <img
                        src={emp.pictureUrl}
                        alt={emp.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-black text-base">
                        {emp.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[10px] text-teal-400">
                          {emp.employeeId}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active User" />
                      </div>
                      <h3 className="font-black text-base text-white leading-tight">{emp.name}</h3>
                      <p className="text-xs font-bold text-slate-300">{emp.designation}</p>
                      {emp.post && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-300">
                          Post: {emp.post}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                      roleConf?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {roleConf?.shortLabel || emp.role}
                  </span>
                </div>

                {/* Quick Factory & Role Re-assignment */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      Assigned Facility
                    </span>
                    <select
                      value={emp.location}
                      onChange={(e) =>
                        onUpdateEmployee(emp.id, { location: e.target.value as FactoryLocation })
                      }
                      className="w-full mt-0.5 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-bold text-emerald-400"
                    >
                      <option value="head_office">Head Office (Banani)</option>
                      <option value="print_factory">Print Factory (Tongi)</option>
                      <option value="sewing_factory">Sewing Factory (Mirpur)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      System Role (RBAC)
                    </span>
                    <select
                      value={emp.role}
                      onChange={(e) =>
                        onUpdateEmployee(emp.id, { role: e.target.value as UserRole })
                      }
                      className="w-full mt-0.5 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-bold text-indigo-300"
                    >
                      {Object.values(ROLE_CONFIGS).map((rc) => (
                        <option key={rc.id} value={rc.id}>
                          {rc.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Linked Company Assets (PCs / Sewing Machines / Printers) */}
                <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/25 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5" /> Assigned Company Assets ({empAssets.length})
                    </span>
                    <span>{empOrders.length} Active Orders</span>
                  </div>
                  {empAssets.length > 0 ? (
                    <div className="space-y-1">
                      {empAssets.map((ast) => (
                        <div
                          key={ast.id}
                          className="flex items-center justify-between text-[10px] bg-slate-950/80 px-2 py-1 rounded border border-slate-800"
                        >
                          <span className="font-bold text-white truncate">{ast.name}</span>
                          <span className="font-mono text-indigo-400 shrink-0 ml-1">
                            {ast.assetCode}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">
                      No dedicated PC or machine linked yet.
                    </p>
                  )}
                </div>

                {/* Contact, NID & Contract */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="font-mono">{emp.phone}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                    NID: {emp.nid || 'Verified'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase">
                    {emp.contractStatus || 'Permanent'}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Base Salary</span>
                  <span className="font-mono font-black text-white">
                    ৳{emp.baseSalary.toLocaleString()}/mo
                  </span>
                </div>

                <button
                  onClick={() => onOpenEmployeeProfile(emp)}
                  className="btn-press px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Profile, Contract & Access</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New User / Employee (With Auto-Draft) */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">Add System User & Employee</h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-mono">
                    Draft Saved {empDraftSavedAt ? `@ ${empDraftSavedAt}` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Assign system RBAC role, factory floor, designation, post, and NID.
                </p>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={empDraft.name}
                    onChange={(e) => updateEmpField('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={empDraft.phone}
                    onChange={(e) => updateEmpField('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">System Role (RBAC)</label>
                  <select
                    value={empDraft.role}
                    onChange={(e) => updateEmpField('role', e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    {Object.values(ROLE_CONFIGS).map((rc) => (
                      <option key={rc.id} value={rc.id}>
                        {rc.shortLabel} ({rc.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Factory Location</label>
                  <select
                    value={empDraft.location}
                    onChange={(e) => updateEmpField('location', e.target.value as FactoryLocation)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-bold mt-1"
                  >
                    <option value="head_office">Head Office (Banani)</option>
                    <option value="print_factory">Print Factory (Tongi)</option>
                    <option value="sewing_factory">Sewing Factory (Mirpur)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Designation</label>
                  <input
                    type="text"
                    value={empDraft.designation}
                    onChange={(e) => updateEmpField('designation', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Factory Post / Line</label>
                  <input
                    type="text"
                    value={empDraft.post}
                    onChange={(e) => updateEmpField('post', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">National ID (NID)</label>
                  <input
                    type="text"
                    value={empDraft.nid}
                    onChange={(e) => updateEmpField('nid', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Monthly Salary (৳)</label>
                  <input
                    type="number"
                    value={empDraft.baseSalary}
                    onChange={(e) => updateEmpField('baseSalary', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Contract Type</label>
                  <select
                    value={empDraft.contractStatus}
                    onChange={(e) => updateEmpField('contractStatus', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contractual">Contractual</option>
                    <option value="probation">Probation</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearEmpDraft();
                    setIsAddUserOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/50 text-rose-300 font-bold cursor-pointer"
                >
                  Cancel & Discard Draft
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                  >
                    Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                  >
                    Save User & Employee
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
