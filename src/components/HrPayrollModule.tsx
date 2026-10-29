/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Employee,
  AttendanceRecord,
  Payslip,
  UserRole,
  FactoryLocation,
} from '../types/erp';
import { Language } from '../utils/translations';
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Check,
  Building2,
  Printer,
  Scissors,
  FileText,
  Download,
  X,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HrPayrollModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  currentRole: UserRole;
  language?: Language;
  onPunchAttendance: (record: AttendanceRecord) => Promise<void>;
  onDisburseSalary: (slipId: string, paymentMethod: string) => Promise<void>;
  onCreateEmployee: (employee: Employee) => Promise<void>;
}

export const HrPayrollModule: React.FC<HrPayrollModuleProps> = ({
  employees,
  attendance,
  payslips,
  currentRole,
  language = 'en',
  onPunchAttendance,
  onDisburseSalary,
  onCreateEmployee,
}) => {
  // If user is a factory manager, default to department attendance entry!
  const defaultTab =
    currentRole === 'print_factory' || currentRole === 'sewing_factory'
      ? 'dept_manager_entry'
      : 'directory';

  const [activeTab, setActiveTab] = useState<'directory' | 'dept_manager_entry' | 'attendance' | 'payroll'>(
    defaultTab
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [disburseMethod, setDisburseMethod] = useState('Bank Wire (City Bank Corporate)');
  const [isDisbursing, setIsDisbursing] = useState(false);

  // Department Manager Terminal State
  const defaultDeptLocation =
    currentRole === 'print_factory'
      ? 'print_factory'
      : currentRole === 'sewing_factory'
      ? 'sewing_factory'
      : 'all';
  const [managerLocation, setManagerLocation] = useState<string>(defaultDeptLocation);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<'morning' | 'evening' | 'general'>('morning');
  const [isBatchPunching, setIsBatchPunching] = useState(false);

  // New Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Shop Floor Production');
  const [newEmpDesignation, setNewEmpDesignation] = useState('Sewing Machine Operator');
  const [newEmpLocation, setNewEmpLocation] = useState<FactoryLocation>('sewing_factory');
  const [newEmpSalary, setNewEmpSalary] = useState(25000);
  const [newEmpOtRate, setNewEmpOtRate] = useState(160);
  const [newEmpShift, setNewEmpShift] = useState<'morning' | 'evening' | 'general'>('morning');

  const todayStr = selectedDate;
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const totalPayrollBudget = employees.reduce((sum, e) => sum + e.baseSalary, 0);

  // Filter employees for department manager
  const deptEmployees = employees.filter((emp) => {
    if (managerLocation === 'all') return true;
    return emp.location === managerLocation;
  });

  // Department Manager: Mark single worker
  const handleManagerPunch = async (
    emp: Employee,
    status: 'present' | 'absent' | 'late',
    overtimeHours = 0,
    note?: string
  ) => {
    const existing = todayAttendance.find((a) => a.employeeId === emp.employeeId);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record: AttendanceRecord = {
      id: existing ? existing.id : `att-${emp.employeeId}-${Date.now()}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      date: todayStr,
      checkInTime: existing ? existing.checkInTime : status === 'absent' ? '-' : timeStr,
      checkOutTime: status === 'present' && existing ? timeStr : existing?.checkOutTime,
      status,
      overtimeHours,
      location: emp.location,
      notes: note || `Verified by ${currentRole.replace('_', ' ')} Manager`,
    };

    await onPunchAttendance(record);
  };

  // Department Manager: 1-Click Mark All Present
  const handleMarkAllPresent = async () => {
    setIsBatchPunching(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const emp of deptEmployees) {
        const existing = todayAttendance.find((a) => a.employeeId === emp.employeeId);
        if (!existing) {
          await onPunchAttendance({
            id: `att-${emp.employeeId}-${Date.now()}`,
            employeeId: emp.employeeId,
            employeeName: emp.name,
            date: todayStr,
            checkInTime: timeStr,
            status: 'present',
            overtimeHours: 0,
            location: emp.location,
            notes: `Batch Attendance verified by ${currentRole.replace('_', ' ')} Manager`,
          });
        }
      }
    } finally {
      setIsBatchPunching(false);
    }
  };

  const handleDisburse = async () => {
    if (!selectedPayslip) return;
    setIsDisbursing(true);
    try {
      await onDisburseSalary(selectedPayslip.id, disburseMethod);
      setSelectedPayslip(null);
    } finally {
      setIsDisbursing(false);
    }
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    await onCreateEmployee({
      id: `emp-${Date.now()}`,
      employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: newEmpName,
      email: newEmpEmail || `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@sportswear.erp`,
      phone: newEmpPhone || '+880 1700-000000',
      role: 'floor_worker',
      department: newEmpDept,
      designation: newEmpDesignation,
      location: newEmpLocation,
      baseSalary: Number(newEmpSalary),
      hourlyOvertimeRate: Number(newEmpOtRate),
      joiningDate: todayStr,
      shift: newEmpShift,
      status: 'active',
    });

    setIsAddEmployeeOpen(false);
    setNewEmpName('');
  };

  return (
    <div className="space-y-6 text-xs text-slate-200">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                {language === 'bn' ? 'এইচআর, বায়োমেট্রিক হাজিরা ও পেরোল' : 'Human Resources, Biometrics & Payroll'}
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {language === 'bn' ? 'সকল কারখানা ওয়ার্কফোর্স' : '3 Facilities Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              {language === 'bn'
                ? 'বনানী হেড অফিস, টঙ্গী প্রিন্ট মিল এবং মিরপুর সুইং কারখানার কর্মীদের দৈনিক হাজিরা, ওভারটাইম হিসাব ও সরাসরি বেতন বিতরণ।'
                : 'Centralized staff records across Banani HQ, Tongi Sublimation Mill, and Mirpur Sewing Factory with role-based manager attendance punching.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(currentRole === 'owner' || currentRole === 'hr_manager') && (
            <button
              onClick={() => setIsAddEmployeeOpen(true)}
              className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন কর্মী যুক্ত করুন' : 'Add Employee'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card-hover p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'আজকের হাজিরা উপস্থিতি' : "Today's Attendance Rate"}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {presentCount} / {employees.length}
          </div>
          <span className="text-[11px] text-slate-400">
            {Math.round((presentCount / (employees.length || 1)) * 100)}% {language === 'bn' ? 'উপস্থিতি হার' : 'active workforce'}
          </span>
        </div>

        <div className="card-hover p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'মাসিক বেতন বাজেট' : 'Monthly Payroll Budget'}
          </span>
          <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">
            ৳{totalPayrollBudget.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">
            {language === 'bn' ? 'বেসিক বেতন প্রতিশ্রুতি' : 'Base wage commitment'}
          </span>
        </div>

        <div className="card-hover p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'সক্রিয় শিফট রোটেশন' : 'Active Shift Rotations'}
          </span>
          <div className="text-2xl font-black text-teal-400 mt-1 font-mono">
            {language === 'bn' ? 'সকাল ও জেনারেল শিফট' : 'Morning & General'}
          </div>
          <span className="text-[11px] text-teal-400/80">
            8-Hour Standard + Overtime Tier
          </span>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        {/* Department Manager Attendance Entry Tab (PROMINENT) */}
        <button
          onClick={() => setActiveTab('dept_manager_entry')}
          className={`btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 'dept_manager_entry'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-300" />
          <span>
            {language === 'bn' ? 'বিভাগীয় ম্যানেজার হাজিরা টার্মিনাল' : 'Dept Manager Attendance Terminal'}
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
            Manager Entry
          </span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'কর্মী তালিকা' : 'Staff Directory'} ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'লাইভ হাজিরা লগ' : 'Daily Punch Log'}</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'পেরোল ও স্যালারি স্লিপ' : 'Payroll & Salary Slips'} ({payslips.length})</span>
        </button>
      </div>

      {/* TAB: DEPARTMENT MANAGER ATTENDANCE ENTRY (NEW) */}
      {activeTab === 'dept_manager_entry' && (
        <div className="space-y-4">
          {/* Controls Bar for Department Managers */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-black text-sm text-white">
                  {language === 'bn' ? 'বিভাগীয় ম্যানেজার হাজিরা কন্ট্রোল' : 'Department Manager Punch Portal'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {currentRole.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'bn'
                  ? 'আপনার কারখানার বা বিভাগের কর্মীদের প্রতিদিনের উপস্থিতি, ওভারটাইম ও বিলম্ব তাৎক্ষণিকভাবে রেকর্ড করুন।'
                  : 'Punch and log daily attendance, shifts, and overtime hours for factory workers in your specific location.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Location / Department Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {language === 'bn' ? 'কারখানা বা বিভাগ' : 'Facility / Department'}
                </label>
                <select
                  value={managerLocation}
                  onChange={(e) => setManagerLocation(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="all">{language === 'bn' ? 'সকল কারখানা' : 'All Facilities'}</option>
                  <option value="print_factory">{language === 'bn' ? 'টঙ্গী প্রিন্ট মিল (Tongi)' : 'Tongi Print Mill'}</option>
                  <option value="sewing_factory">{language === 'bn' ? 'মিরপুর সুইং কারখানা (Mirpur)' : 'Mirpur Sewing Factory'}</option>
                  <option value="head_office">{language === 'bn' ? 'বনানী হেড অফিস (Banani HQ)' : 'Banani Head Office'}</option>
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {language === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                >
                </input>
              </div>

              {/* 1-Click Mark All Present Button */}
              <div className="pt-4">
                <button
                  onClick={handleMarkAllPresent}
                  disabled={isBatchPunching}
                  className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950/50 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-teal-200" />
                  <span>
                    {isBatchPunching
                      ? (language === 'bn' ? 'রেকর্ড হচ্ছে...' : 'Marking...')
                      : (language === 'bn' ? 'এক ক্লিকে সবাইকে উপস্থিত করুন' : '1-Click: Mark All Present')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Department Staff Punch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {deptEmployees.map((emp) => {
              const punch = todayAttendance.find((a) => a.employeeId === emp.employeeId);
              const isPresent = punch?.status === 'present';
              const isLate = punch?.status === 'late';
              const isAbsent = punch?.status === 'absent';

              return (
                <div
                  key={emp.id}
                  className="card-hover bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-white text-sm">{emp.name}</h4>
                          <span className="font-mono text-[10px] text-slate-400">({emp.employeeId})</span>
                        </div>
                        <span className="text-teal-400 font-semibold text-xs block">
                          {emp.designation}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {emp.location.replace('_', ' ').toUpperCase()} • {emp.department}
                        </span>
                      </div>

                      {/* Current Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPresent
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isLate
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isAbsent
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {punch ? punch.status.toUpperCase() : (language === 'bn' ? 'অপেক্ষমাণ' : 'UNPUNCHED')}
                      </span>
                    </div>

                    {/* Punch details */}
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-300">
                      <span>In: <strong className="text-teal-400">{punch?.checkInTime || '--:--'}</strong></span>
                      <span>OT: <strong className="text-purple-400">{punch?.overtimeHours || 0} hrs</strong></span>
                      <span>Rate: ৳{emp.hourlyOvertimeRate}/h</span>
                    </div>
                  </div>

                  {/* Manager Quick Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => handleManagerPunch(emp, 'present', punch?.overtimeHours || 0)}
                        className={`btn-press py-1.5 px-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{language === 'bn' ? 'উপস্থিত' : 'Present'}</span>
                      </button>

                      <button
                        onClick={() => handleManagerPunch(emp, 'late', punch?.overtimeHours || 0, 'Late entry logged by manager')}
                        className={`btn-press py-1.5 px-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                          isLate
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-700'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{language === 'bn' ? 'বিলম্বে' : 'Late'}</span>
                      </button>

                      <button
                        onClick={() => handleManagerPunch(emp, 'absent', 0, 'Reported absent')}
                        className={`btn-press py-1.5 px-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 ${
                          isAbsent
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>{language === 'bn' ? 'অনুপস্থিত' : 'Absent'}</span>
                      </button>
                    </div>

                    {/* Overtime Steppers */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">
                        {language === 'bn' ? 'ওভারটাইম যুক্ত করুন:' : 'Add Overtime:'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleManagerPunch(emp, 'present', (punch?.overtimeHours || 0) + 1, '1h OT verified by manager')}
                          className="btn-press px-2 py-0.5 rounded-md bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 font-mono text-[10px] font-bold cursor-pointer"
                        >
                          +1h OT
                        </button>
                        <button
                          onClick={() => handleManagerPunch(emp, 'present', (punch?.overtimeHours || 0) + 2, '2h OT verified by manager')}
                          className="btn-press px-2 py-0.5 rounded-md bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 font-mono text-[10px] font-bold cursor-pointer"
                        >
                          +2h OT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-white"
              >
                <option value="all">All Locations (Banani, Tongi, Mirpur)</option>
                <option value="head_office">Head Office (Banani)</option>
                <option value="print_factory">Print Factory (Tongi)</option>
                <option value="sewing_factory">Sewing Factory (Mirpur)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee name, role..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {employees
              .filter(
                (emp) =>
                  (locationFilter === 'all' || emp.location === locationFilter) &&
                  (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((emp) => {
                const punched = todayAttendance.find((a) => a.employeeId === emp.employeeId);
                return (
                  <div
                    key={emp.id}
                    className="card-hover bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-white text-sm">{emp.name}</h4>
                            <span className="font-mono text-[10px] text-slate-400">({emp.employeeId})</span>
                          </div>
                          <span className="text-teal-400 font-bold text-xs block">
                            {emp.designation}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.location === 'head_office'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                            : emp.location === 'print_factory'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                        }`}>
                          {emp.location.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div>📧 {emp.email}</div>
                        <div>📞 {emp.phone}</div>
                        <div className="flex justify-between pt-1 font-mono text-[10px]">
                          <span>Salary: <strong className="text-white">BDT {emp.baseSalary.toLocaleString()}</strong></span>
                          <span>OT: <strong className="text-purple-400">BDT {emp.hourlyOvertimeRate}/hr</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${punched ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {punched ? `In: ${punched.checkInTime} (${punched.status})` : 'Not Clocked In'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleManagerPunch(emp, punched ? 'absent' : 'present')}
                        className={`btn-press px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                          punched
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            : 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs'
                        }`}
                      >
                        {punched ? 'Toggle' : 'Clock In'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: TODAY'S ATTENDANCE LOG */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-white">
                Live Attendance & Biometric Shift Log ({todayStr})
              </h3>
              <p className="text-slate-400 text-xs">Real-time punch records from Banani HQ, Tongi Mill, and Mirpur Sewing.</p>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              {presentCount} Clocked In Today
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Check-In</th>
                    <th className="p-3.5">Check-Out</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Overtime</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {todayAttendance.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white">
                        {att.employeeName}
                        <span className="text-[10px] text-slate-400 font-mono block">({att.employeeId})</span>
                      </td>
                      <td className="p-3.5 uppercase text-[10px] text-slate-400 font-bold">
                        {att.location.replace('_', ' ')}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-teal-400">{att.checkInTime}</td>
                      <td className="p-3.5 font-mono text-slate-400">{att.checkOutTime || 'Active Shift'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-purple-400">{att.overtimeHours} hrs</td>
                      <td className="p-3.5 text-slate-400 text-[11px]">{att.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & PAYSLIPS */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-white">Monthly Payroll & Salary Disbursement</h3>
              <p className="text-slate-400 text-xs">Calculate base wages, overtime premiums, and trigger payouts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payslips.map((slip) => (
              <div
                key={slip.id}
                className="card-hover bg-slate-900/90 p-4.5 rounded-2xl border border-slate-800 shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400">{slip.slipNumber}</span>
                    <h4 className="font-black text-sm text-white">{slip.employeeName}</h4>
                    <span className="text-xs text-teal-400 font-bold">{slip.month}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    slip.status === 'disbursed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {slip.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Base Salary:</span>
                    <span>BDT {slip.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-400">
                    <span className="font-sans">Overtime ({slip.overtimeHours} hrs):</span>
                    <span>+BDT {slip.overtimeAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span className="font-sans">Performance Bonus:</span>
                    <span>+BDT {slip.bonuses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-black text-xs text-white">
                    <span className="font-sans">Net Payout:</span>
                    <span className="text-emerald-400">BDT {slip.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {slip.paymentDate && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Paid on: {slip.paymentDate} via {slip.paymentMethod}
                    </span>
                  )}

                  {slip.status !== 'disbursed' ? (
                    <button
                      onClick={() => setSelectedPayslip(slip)}
                      className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer ml-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Disburse Salary</span>
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 ml-auto">
                      <Check className="w-3.5 h-3.5" /> Cleared & Logged in Expenses
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Disburse Salary */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white">Confirm Salary Payout</h3>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>Employee: <strong className="text-white">{selectedPayslip.employeeName}</strong></p>
              <p>Month: <strong>{selectedPayslip.month}</strong></p>
              <p className="text-base font-black text-emerald-400 font-mono">
                Net Amount: BDT {selectedPayslip.netSalary.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Payout Channel</label>
              <select
                value={disburseMethod}
                onChange={(e) => setDisburseMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
              >
                <option value="Bank Wire (City Bank Payroll)">Bank Wire (City Bank Payroll)</option>
                <option value="bKash Corporate Salary Account">bKash Corporate Salary Account</option>
                <option value="Cash Factory Counter">Cash Factory Counter</option>
              </select>
            </div>

            <button
              onClick={handleDisburse}
              disabled={isDisbursing}
              className="btn-press w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isDisbursing ? 'Processing Payout...' : 'Confirm Disbursal & Post to Expenses'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Add Employee */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-lg border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white">Onboard New Team Member</h3>
              <button onClick={() => setIsAddEmployeeOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="e.g. Shakil Hossain"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Designation</label>
                  <input
                    type="text"
                    required
                    value={newEmpDesignation}
                    onChange={(e) => setNewEmpDesignation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                  <input
                    type="text"
                    required
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Facility Location</label>
                  <select
                    value={newEmpLocation}
                    onChange={(e) => setNewEmpLocation(e.target.value as FactoryLocation)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                  >
                    <option value="head_office">Head Office (Banani)</option>
                    <option value="print_factory">Print Mill (Tongi)</option>
                    <option value="sewing_factory">Sewing Line (Mirpur)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Shift</label>
                  <select
                    value={newEmpShift}
                    onChange={(e) => setNewEmpShift(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                  >
                    <option value="morning">Morning (8am - 5pm)</option>
                    <option value="evening">Evening (4pm - 12am)</option>
                    <option value="general">General (9am - 6pm)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Base Monthly Salary (BDT)</label>
                  <input
                    type="number"
                    required
                    value={newEmpSalary}
                    onChange={(e) => setNewEmpSalary(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hourly OT Rate (BDT)</label>
                  <input
                    type="number"
                    required
                    value={newEmpOtRate}
                    onChange={(e) => setNewEmpOtRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white mt-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-press w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md mt-2 cursor-pointer"
              >
                Register Employee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
