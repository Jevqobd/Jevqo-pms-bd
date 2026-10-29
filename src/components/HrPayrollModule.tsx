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
} from 'lucide-react';

interface HrPayrollModuleProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  currentRole: UserRole;
  onPunchAttendance: (record: AttendanceRecord) => Promise<void>;
  onDisburseSalary: (slipId: string, paymentMethod: string) => Promise<void>;
  onCreateEmployee: (employee: Employee) => Promise<void>;
}

export const HrPayrollModule: React.FC<HrPayrollModuleProps> = ({
  employees,
  attendance,
  payslips,
  currentRole,
  onPunchAttendance,
  onDisburseSalary,
  onCreateEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [disburseMethod, setDisburseMethod] = useState('Bank Wire (Corporate Payroll)');
  const [isDisbursing, setIsDisbursing] = useState(false);

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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const totalPayrollBudget = employees.reduce((sum, e) => sum + e.baseSalary, 0);

  const handleQuickPunch = async (emp: Employee) => {
    const existing = todayAttendance.find((a) => a.employeeId === emp.employeeId);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    if (!existing) {
      await onPunchAttendance({
        id: `att-${emp.employeeId}-${Date.now()}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        date: todayStr,
        checkInTime: timeStr,
        status: now.getHours() > 9 ? 'late' : 'present',
        overtimeHours: 0,
        location: emp.location,
        notes: 'Manual punch via HR Terminal',
      });
    } else {
      await onPunchAttendance({
        ...existing,
        checkOutTime: timeStr,
        overtimeHours: 2.0,
      });
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
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* HR Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-700 via-cyan-700 to-indigo-800 text-white shadow-lg shadow-teal-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                Human Resources & Payroll Department
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                HQ & Factory Workforces
              </span>
            </div>
            <p className="text-xs text-teal-100 max-w-2xl">
              Centralized staff records across Banani HQ, Tongi Sublimation Mill, and Mirpur Sewing Factory: live biometric attendance punches, overtime hours, monthly payroll calculations, and instant salary disbursal.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddEmployeeOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-teal-900 font-bold text-xs shadow-md hover:bg-teal-50 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Employee</span>
        </button>
      </div>

      {/* HR KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Headcount</span>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
            {employees.length} Staff Members
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Across all 3 locations</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Today's Attendance</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {presentCount} / {employees.length} Present
          </div>
          <span className="text-[10px] text-gray-500">
            {Math.round((presentCount / (employees.length || 1)) * 100)}% attendance rate
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Monthly Payroll Budget</span>
          <div className="text-xl font-black text-indigo-600 mt-1">
            ${(totalPayrollBudget / 115).toFixed(0)} <span className="text-xs text-gray-400 font-normal">({totalPayrollBudget.toLocaleString()} BDT)</span>
          </div>
          <span className="text-[10px] text-gray-500">Base salary commitments</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Shift Rotations</span>
          <div className="text-xl font-black text-purple-600 mt-1">
            Morning & General
          </div>
          <span className="text-[10px] text-purple-600 font-medium">8-Hour Standard + Overtime</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Directory ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Today's Attendance & Overtime</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Payroll & Salary Slips ({payslips.length})</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
              >
                <option value="all">All Locations (Banani, Tongi, Mirpur)</option>
                <option value="head_office">Head Office (Banani)</option>
                <option value="print_factory">Print Factory (Tongi)</option>
                <option value="sewing_factory">Sewing Factory (Mirpur)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee name, role..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
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
                    className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-gray-900 dark:text-white text-sm">{emp.name}</h4>
                            <span className="font-mono text-[10px] text-gray-400">({emp.employeeId})</span>
                          </div>
                          <span className="text-teal-600 dark:text-teal-400 font-bold text-[11px] block">
                            {emp.designation}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.location === 'head_office'
                            ? 'bg-blue-100 text-blue-800'
                            : emp.location === 'print_factory'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {emp.location.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 space-y-1">
                        <div>📧 {emp.email}</div>
                        <div>📞 {emp.phone}</div>
                        <div className="flex justify-between pt-1 font-mono text-[10px]">
                          <span>Salary: <strong>BDT {emp.baseSalary.toLocaleString()}</strong></span>
                          <span>OT: <strong>BDT {emp.hourlyOvertimeRate}/hr</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${punched ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <span className="text-[10px] text-gray-500">
                          {punched ? `In: ${punched.checkInTime}` : 'Not Punched Today'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleQuickPunch(emp)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                          punched
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                        }`}
                      >
                        {punched ? 'Clock Out' : 'Clock In'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: TODAY'S ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Live Attendance & Biometric Shift Log ({todayStr})
              </h3>
              <p className="text-gray-500 text-[11px]">Real-time punch records from Banani HQ, Tongi Mill, and Mirpur Sewing.</p>
            </div>
            <span className="font-mono text-[11px] text-emerald-600 font-bold">
              {presentCount} Clocked In Today
            </span>
          </div>

          <div className="bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Check-In Time</th>
                    <th className="p-3">Check-Out Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Overtime</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {todayAttendance.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <td className="p-3 font-bold text-gray-900 dark:text-white">
                        {att.employeeName}
                        <span className="text-[10px] text-gray-400 font-mono block">({att.employeeId})</span>
                      </td>
                      <td className="p-3 uppercase text-[10px] text-gray-500 font-bold">
                        {att.location.replace('_', ' ')}
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-600">{att.checkInTime}</td>
                      <td className="p-3 font-mono text-gray-500">{att.checkOutTime || 'Active Shift'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {att.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-600">{att.overtimeHours} hrs</td>
                      <td className="p-3 text-gray-500 text-[11px]">{att.notes || '-'}</td>
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
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Monthly Payroll & Salary Disbursement</h3>
              <p className="text-gray-500 text-[11px]">Calculate base wages, overtime premiums, and trigger payouts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payslips.map((slip) => (
              <div
                key={slip.id}
                className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-gray-400">{slip.slipNumber}</span>
                    <h4 className="font-black text-sm text-gray-900 dark:text-white">{slip.employeeName}</h4>
                    <span className="text-[11px] text-teal-600 font-bold">{slip.month}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    slip.status === 'disbursed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {slip.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-sans">Base Salary:</span>
                    <span>BDT {slip.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-600">
                    <span className="font-sans">Overtime ({slip.overtimeHours} hrs):</span>
                    <span>+BDT {slip.overtimeAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-sans">Performance Bonus:</span>
                    <span>+BDT {slip.bonuses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-black text-xs text-gray-900 dark:text-white">
                    <span className="font-sans">Net Payout:</span>
                    <span>BDT {slip.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {slip.paymentDate && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      Paid on: {slip.paymentDate} via {slip.paymentMethod}
                    </span>
                  )}

                  {slip.status !== 'disbursed' ? (
                    <button
                      onClick={() => setSelectedPayslip(slip)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition ml-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Disburse Salary</span>
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 ml-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Confirm Salary Payout</h3>
              <button onClick={() => setSelectedPayslip(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <div className="space-y-2 text-xs">
              <p>Employee: <strong className="text-gray-900 dark:text-white">{selectedPayslip.employeeName}</strong></p>
              <p>Month: <strong>{selectedPayslip.month}</strong></p>
              <p className="text-base font-black text-emerald-600 font-mono">
                Net Amount: BDT {selectedPayslip.netSalary.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Payout Channel</label>
              <select
                value={disburseMethod}
                onChange={(e) => setDisburseMethod(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
              >
                <option value="Bank Wire (City Bank Payroll)">Bank Wire (City Bank Payroll)</option>
                <option value="bKash Corporate Salary Account">bKash Corporate Salary Account</option>
                <option value="Cash Factory Counter">Cash Factory Counter</option>
              </select>
            </div>

            <button
              onClick={handleDisburse}
              disabled={isDisbursing}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {isDisbursing ? 'Processing Payout...' : 'Confirm Disbursal & Post to Expenses'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Add Employee */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Register New Employee</h3>
              <button onClick={() => setIsAddEmployeeOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahfuzur Rahman"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Department</label>
                  <input
                    type="text"
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Designation</label>
                  <input
                    type="text"
                    value={newEmpDesignation}
                    onChange={(e) => setNewEmpDesignation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Location</label>
                  <select
                    value={newEmpLocation}
                    onChange={(e: any) => setNewEmpLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  >
                    <option value="head_office">Head Office (Banani)</option>
                    <option value="print_factory">Print Factory (Tongi)</option>
                    <option value="sewing_factory">Sewing Factory (Mirpur)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Shift</label>
                  <select
                    value={newEmpShift}
                    onChange={(e: any) => setNewEmpShift(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  >
                    <option value="morning">Morning Shift (8AM - 5PM)</option>
                    <option value="general">General Office (9AM - 6PM)</option>
                    <option value="evening">Evening Overtime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Base Salary (BDT)</label>
                  <input
                    type="number"
                    value={newEmpSalary}
                    onChange={(e) => setNewEmpSalary(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Overtime Rate (BDT/hr)</label>
                  <input
                    type="number"
                    value={newEmpOtRate}
                    onChange={(e) => setNewEmpOtRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition mt-2"
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
