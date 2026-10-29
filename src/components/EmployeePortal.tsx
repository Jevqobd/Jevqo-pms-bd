/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Employee,
  AttendanceRecord,
  Payslip,
  Order,
  ShortageTicket,
  UserRole,
} from '../types/erp';
import {
  UserCheck,
  Clock,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Scissors,
  Printer,
  Layers,
  Check,
  ArrowRight,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface EmployeePortalProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onPunchAttendance: (record: AttendanceRecord) => Promise<void>;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onOpenRaiseShortage: (order?: Order) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  employees,
  attendance,
  payslips,
  orders,
  shortageTickets,
  currentRole,
  onPunchAttendance,
  onUpdateOrder,
  onSelectOrder,
  onOpenRaiseShortage,
}) => {
  // Default to first employee or let user switch employee persona
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.employeeId || 'EMP-008');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentEmployee = employees.find((e) => e.employeeId === selectedEmpId) || employees[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPunch = attendance.find(
    (a) => a.employeeId === currentEmployee?.employeeId && a.date === todayStr
  );
  const employeePayslips = payslips.filter((p) => p.employeeId === currentEmployee?.employeeId);

  // Relevant work tasks for this employee based on location & department
  const myTasks = orders.filter((o) => {
    if (currentEmployee.location === 'print_factory') {
      return ['pattern_spec_ready', 'paper_printed', 'heat_press_done'].includes(o.stage);
    }
    if (currentEmployee.location === 'sewing_factory') {
      return ['fabric_dispatched', 'fabric_received', 'cutting_sewing', 'quality_finishing'].includes(o.stage);
    }
    return ['draft', 'payment_pending', 'payment_verified', 'mockup_approved'].includes(o.stage);
  });

  const handleClockIn = async () => {
    if (!currentEmployee) return;
    const now = new Date();
    await onPunchAttendance({
      id: `att-${currentEmployee.employeeId}-${Date.now()}`,
      employeeId: currentEmployee.employeeId,
      employeeName: currentEmployee.name,
      date: todayStr,
      checkInTime: now.toTimeString().split(' ')[0],
      status: now.getHours() > 9 ? 'late' : 'present',
      overtimeHours: 0,
      location: currentEmployee.location,
      notes: 'Punched via Employee Self-Service Station',
    });
  };

  const handleClockOut = async () => {
    if (!currentEmployee || !todayPunch) return;
    const now = new Date();
    await onPunchAttendance({
      ...todayPunch,
      checkOutTime: now.toTimeString().split(' ')[0],
      overtimeHours: 2.5,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Employee Header & Persona Switcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-800 via-teal-800 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
            {currentEmployee?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">{currentEmployee?.name}</h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {currentEmployee?.employeeId}
              </span>
            </div>
            <p className="text-xs text-cyan-100">
              {currentEmployee?.designation} &bull; {currentEmployee?.department} ({currentEmployee?.location?.replace('_', ' ').toUpperCase()})
            </p>
          </div>
        </div>

        {/* Persona Switcher for Quick Workstation Testing */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20">
          <span className="text-[10px] text-cyan-200 font-bold pl-2">Switch Employee Profile:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white text-gray-900 font-bold text-xs"
          >
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name} ({e.designation})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Live Attendance Punching Card */}
        <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 font-black text-gray-900 dark:text-white">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Shift Attendance Punch Station</span>
            </div>
            <span className="font-mono text-xs font-bold text-teal-600">{currentTime}</span>
          </div>

          <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Shift: {currentEmployee?.shift?.toUpperCase()} (8 Hours)
            </span>
            <div className="text-2xl font-black font-mono text-gray-900 dark:text-white">
              {todayPunch ? (todayPunch.checkOutTime ? 'Shift Completed' : 'Clocked In') : 'Not Clocked In'}
            </div>

            {todayPunch ? (
              <div className="text-xs text-gray-500 space-y-1 font-mono">
                <div>Punch In: <strong className="text-emerald-600">{todayPunch.checkInTime}</strong></div>
                {todayPunch.checkOutTime && (
                  <div>Punch Out: <strong className="text-indigo-600">{todayPunch.checkOutTime}</strong></div>
                )}
                {todayPunch.overtimeHours > 0 && (
                  <div className="text-purple-600 font-bold">Overtime: +{todayPunch.overtimeHours} hrs</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Punch in to log attendance and initiate shift work orders.</p>
            )}

            <div className="pt-2 flex items-center justify-center gap-2">
              {!todayPunch ? (
                <button
                  onClick={handleClockIn}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Clock In for Shift</span>
                </button>
              ) : !todayPunch.checkOutTime ? (
                <button
                  onClick={handleClockOut}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Clock Out & Log Shift Overtime</span>
                </button>
              ) : (
                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Today's Shift Logged
                </span>
              )}
            </div>
          </div>

          {/* Quick Issue / Shortage Ticket Reporter */}
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Fabric Scorch or Cutting Defect?</span>
            </div>
            <p className="text-[11px] text-red-700 dark:text-red-300">
              Instantly escalate a ruined jersey panel to Design 2 & Tongi Print Factory.
            </p>
            <button
              onClick={() => onOpenRaiseShortage()}
              className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs"
            >
              + Raise Urgent Shortage Ticket
            </button>
          </div>
        </div>

        {/* Center & Right: My Work Queue & Payslip Records */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active Assigned Tasks */}
          <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>My Active Work Queue ({myTasks.length} Batches)</span>
                </h3>
                <p className="text-gray-500 text-[11px]">Assigned Job Cards in your department</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-2.5">
              {myTasks.map((order) => (
                <div
                  key={order.id}
                  className="pt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-indigo-300 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-indigo-600">{order.orderNumber}</span>
                      <strong className="text-gray-900 dark:text-white text-xs">{order.teamOrClub}</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                        {order.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 flex gap-3">
                      <span>Quantity: <strong>{order.totalQuantity} pcs</strong></span>
                      <span>Fabric: {order.fabricType}</span>
                      <span>Client: {order.clientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                    >
                      Open Job Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Payslips & Earnings */}
          <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>My Monthly Payslips & Earnings</span>
                </h3>
                <p className="text-gray-500 text-[11px]">Monthly wage breakdown, overtime hours and disbursement status</p>
              </div>
            </div>

            {employeePayslips.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No payslips issued for this profile yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employeePayslips.map((slip) => (
                  <div
                    key={slip.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white text-xs">{slip.month}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {slip.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono space-y-0.5 text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Base Wage:</span>
                        <span>BDT {slip.baseSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-purple-600">
                        <span>Overtime ({slip.overtimeHours}h):</span>
                        <span>+BDT {slip.overtimeAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t font-black text-xs text-gray-900 dark:text-white">
                        <span>Net Take-Home:</span>
                        <span>BDT {slip.netSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
