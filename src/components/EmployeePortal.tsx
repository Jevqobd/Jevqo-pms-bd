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
  DelegatedTask,
  TeamMessage,
} from '../types/erp';
import {
  UserCheck,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Check,
  BellRing,
  Lock,
  MessageSquare,
  AtSign,
  Award,
  TrendingUp,
} from 'lucide-react';
import { canUserViewChatMessage } from '../utils/erpLogic';

interface EmployeePortalProps {
  employees: Employee[];
  loggedInEmployee?: Employee | null;
  canSwitchEmployee?: boolean;
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  delegatedTasks?: DelegatedTask[];
  messages?: TeamMessage[];
  onPunchAttendance: (record: AttendanceRecord) => Promise<void>;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onOpenRaiseShortage: (order?: Order) => void;
  onAcceptDelegatedTask?: (taskId: string) => void;
  onCompleteDelegatedTask?: (taskId: string) => void;
  onOpenChat?: () => void;
  onNotifyAction?: (
    tag: 'DONE' | 'APPROVED' | 'DELEGATED' | 'VERIFIED',
    title: string,
    message: string
  ) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  employees,
  loggedInEmployee,
  canSwitchEmployee = false,
  attendance,
  payslips,
  orders,
  currentRole,
  delegatedTasks = [],
  messages = [],
  onPunchAttendance,
  onSelectOrder,
  onOpenRaiseShortage,
  onAcceptDelegatedTask,
  onCompleteDelegatedTask,
  onOpenChat,
  onNotifyAction,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    loggedInEmployee?.employeeId || employees[0]?.employeeId || 'EMP-001'
  );
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [dailyOutputPcs, setDailyOutputPcs] = useState<number>(65);
  const [dailyOutputNote, setDailyOutputNote] = useState<string>(
    'Completed batch quality check & collar stitching without defect.'
  );

  useEffect(() => {
    if (loggedInEmployee?.employeeId) {
      setSelectedEmpId(loggedInEmployee.employeeId);
    }
  }, [loggedInEmployee?.employeeId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentEmployee =
    employees.find((e) => e.employeeId === selectedEmpId || e.id === selectedEmpId) ||
    loggedInEmployee ||
    employees[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPunch = attendance.find(
    (a) => a.employeeId === currentEmployee?.employeeId && a.date === todayStr
  );
  const employeePayslips = payslips.filter((p) => p.employeeId === currentEmployee?.employeeId);

  // Tasks delegated to this employee (or all delegated tasks if Owner/Manager is inspecting)
  const myDelegatedTasks = delegatedTasks.filter(
    (t) =>
      t.assignedToEmployeeId === currentEmployee?.id ||
      t.assignedToEmployeeName.toLowerCase() === currentEmployee?.name?.toLowerCase() ||
      currentRole === 'owner'
  );

  // Private Invoice Messages & @Mentions visible to this employee
  const myPersonalAndMentionMessages = messages.filter((msg) => {
    if (!currentEmployee) return false;
    const canView = canUserViewChatMessage(msg, {
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      role: currentEmployee.role,
    });
    if (!canView) return false;
    const isDirectRecipient =
      msg.recipientEmployeeIds?.includes(currentEmployee.id) ||
      msg.recipientEmployeeNames?.some(
        (n) => n.toLowerCase() === currentEmployee.name.toLowerCase()
      );
    const isMentioned =
      msg.taggedEmployees?.some(
        (n) =>
          n.replace(/^@/, '').toLowerCase() === currentEmployee.name.toLowerCase() ||
          n.replace(/^@/, '').toLowerCase() === currentEmployee.id.toLowerCase()
      );
    return Boolean(msg.isPrivate || isDirectRecipient || isMentioned);
  });

  // Relevant work tasks for this employee based on location & department
  const myTasks = orders.filter((o) => {
    if (
      o.assignedToEmployeeId === currentEmployee?.id ||
      o.assignedToEmployeeName === currentEmployee?.name
    ) {
      return true;
    }
    if (currentEmployee?.location === 'print_factory') {
      return ['pattern_spec_ready', 'paper_printed', 'heat_press_done'].includes(o.stage);
    }
    if (currentEmployee?.location === 'sewing_factory') {
      return [
        'fabric_dispatched',
        'fabric_received',
        'cutting_sewing',
        'quality_finishing',
      ].includes(o.stage);
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
      notes: 'Punched via My Workstation Self-Service Terminal',
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

  const handleLogDailyOutput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || dailyOutputPcs <= 0) return;
    onNotifyAction?.(
      'DONE',
      `Daily Output Logged: ${dailyOutputPcs} pcs (${currentEmployee.name})`,
      `${currentEmployee.designation} logged ${dailyOutputPcs} completed units — "${dailyOutputNote}"`
    );
  };

  return (
    <div data-testid="employee-workstation-view" className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Upgraded Employee Workstation Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 border border-teal-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-black text-lg text-emerald-300">
            {currentEmployee?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[10px] font-black uppercase tracking-wider">
                MY PERSONAL WORKSTATION
              </span>
              <h2 className="text-lg font-black tracking-tight">{currentEmployee?.name}</h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/15 font-bold">
                {currentEmployee?.employeeId}
              </span>
            </div>
            <p className="text-xs text-cyan-100 mt-0.5">
              <strong>{currentEmployee?.designation}</strong> • {currentEmployee?.department} (
              {currentEmployee?.location?.replace('_', ' ').toUpperCase()})
            </p>
          </div>
        </div>

        {/* Profile Selector (Unlocked for Owner/Manager, Locked for other staff) */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
          {canSwitchEmployee ? (
            <>
              <span className="text-[10px] text-emerald-300 font-bold pl-1">
                Inspect Staff Workstation:
              </span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              >
                {employees.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} ({e.designation})
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Authenticated Personal Station ({currentEmployee?.employeeId})</span>
            </div>
          )}
        </div>
      </div>

      {/* Workstation KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Delegated Tasks Inbox
          </span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            {myDelegatedTasks.filter((t) => t.status !== 'completed').length} Active
          </div>
          <span className="text-[10px] text-slate-400">
            {myDelegatedTasks.filter((t) => t.status === 'completed').length} completed today
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Assigned Job Cards
          </span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {myTasks.length} Batches
          </div>
          <span className="text-[10px] text-slate-400">Active in your department queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Private Invoice DMs & @Mentions
          </span>
          <div className="text-xl font-black text-indigo-400 font-mono mt-1">
            {myPersonalAndMentionMessages.length} Messages
          </div>
          <span className="text-[10px] text-slate-400">Confidential team & invoice alerts</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Monthly Base Compensation
          </span>
          <div className="text-xl font-black text-white font-mono mt-1">
            ৳{(currentEmployee?.baseSalary || 24000).toLocaleString()} BDT
          </div>
          <span className="text-[10px] text-emerald-400">Shift: {currentEmployee?.shift?.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Shift Attendance + Daily Output Logger + Shortage Escalation */}
        <div className="space-y-5">
          {/* Shift Attendance Card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-black text-white">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Shift Attendance Station</span>
              </div>
              <span className="font-mono text-xs font-bold text-teal-400">{currentTime}</span>
            </div>

            <div className="text-center p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shift: {currentEmployee?.shift?.toUpperCase()} (8 Hours)
              </span>
              <div className="text-xl font-black font-mono text-white">
                {todayPunch
                  ? todayPunch.checkOutTime
                    ? 'Shift Completed'
                    : 'Clocked In'
                  : 'Not Clocked In'}
              </div>

              {todayPunch ? (
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>
                    Punch In: <strong className="text-emerald-400">{todayPunch.checkInTime}</strong>
                  </div>
                  {todayPunch.checkOutTime && (
                    <div>
                      Punch Out:{' '}
                      <strong className="text-indigo-400">{todayPunch.checkOutTime}</strong>
                    </div>
                  )}
                  {todayPunch.overtimeHours > 0 && (
                    <div className="text-purple-400 font-bold">
                      Overtime: +{todayPunch.overtimeHours} hrs
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Punch in to log attendance and initiate shift work orders.
                </p>
              )}

              <div className="pt-2 flex items-center justify-center gap-2">
                {!todayPunch ? (
                  <button
                    onClick={handleClockIn}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Clock In for Shift</span>
                  </button>
                ) : !todayPunch.checkOutTime ? (
                  <button
                    onClick={handleClockOut}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Clock Out & Log Shift Overtime</span>
                  </button>
                ) : (
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Today's Shift Logged
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Daily Output & Performance Logger */}
          <form
            onSubmit={handleLogDailyOutput}
            className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 font-black text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Log Daily Workstation Output</span>
              </div>
              <Award className="w-4 h-4 text-amber-400" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Completed Units / Pieces Today
              </label>
              <input
                type="number"
                min="1"
                value={dailyOutputPcs}
                onChange={(e) => setDailyOutputPcs(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-black text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Shift Quality / Handover Note
              </label>
              <input
                type="text"
                value={dailyOutputNote}
                onChange={(e) => setDailyOutputNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              data-testid="log-daily-output-btn"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Daily Output (DONE)</span>
            </button>
          </form>

          {/* Quick Issue / Shortage Ticket Reporter */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Fabric Scorch or Cutting Defect?</span>
            </div>
            <p className="text-[11px] text-rose-200/80">
              Instantly escalate a ruined jersey panel to Design 2 & Tongi Print Factory.
            </p>
            <button
              onClick={() => onOpenRaiseShortage()}
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              + Raise Urgent Shortage Ticket
            </button>
          </div>
        </div>

        {/* Center & Right Columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. My Delegated Tasks Inbox (Instant Delegation System) */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-amber-500/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <span>My Delegated Tasks Inbox ({myDelegatedTasks.length})</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Tasks delegated directly to you with instant popup & sound alerts
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
                LIVE TASK QUEUE
              </span>
            </div>

            {myDelegatedTasks.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                No delegated tasks pending right now.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myDelegatedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      task.status === 'completed'
                        ? 'bg-slate-950/50 border-slate-800 opacity-75'
                        : 'bg-slate-950 border-amber-500/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : task.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <strong className="text-white text-xs">{task.title}</strong>
                        {task.orderNumber && (
                          <span className="font-mono text-[10px] text-emerald-400 font-bold">
                            [{task.orderNumber}]
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300">{task.description}</p>
                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-3">
                        <span>
                          Assigned To: <strong className="text-amber-300">{task.assignedToEmployeeName}</strong>
                        </span>
                        <span>
                          From: <strong>{task.delegatedByEmployeeName}</strong> ({task.delegatedByPosition})
                        </span>
                        {task.dueTime && <span>Due: {task.dueTime}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.status === 'pending' && onAcceptDelegatedTask && (
                        <button
                          onClick={() => onAcceptDelegatedTask(task.id)}
                          data-testid={`workstation-accept-task-${task.id}`}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept (APPROVED)</span>
                        </button>
                      )}
                      {task.status !== 'completed' && onCompleteDelegatedTask && (
                        <button
                          onClick={() => onCompleteDelegatedTask(task.id)}
                          data-testid={`workstation-complete-task-${task.id}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 cursor-pointer transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done (DONE)</span>
                        </button>
                      )}
                      {task.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[10px] uppercase">
                          ✓ COMPLETED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Confidential Invoice Messages & @Mentions Feed */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>My Private Invoice Messages & @Mentions ({myPersonalAndMentionMessages.length})</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Personal invoice DMs from Owner/Managers and @Mentions visible only to authorized recipients
                </p>
              </div>
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <AtSign className="w-3.5 h-3.5" />
                  <span>Open Live Chat</span>
                </button>
              )}
            </div>

            {myPersonalAndMentionMessages.length === 0 ? (
              <div className="p-5 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                No private invoice messages or @mentions for {currentEmployee?.name} yet.
              </div>
            ) : (
              <div className="space-y-2">
                {myPersonalAndMentionMessages.slice(0, 5).map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.isPrivate && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> PRIVATE DM
                          </span>
                        )}
                        <strong className="text-white text-xs">{msg.senderName}</strong>
                        {msg.relatedInvoiceNumber && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 font-bold">
                            Invoice: {msg.relatedInvoiceNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{msg.content}</p>
                    </div>
                    {onOpenChat && (
                      <button
                        onClick={onOpenChat}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-[10px] shrink-0 cursor-pointer"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Active Department Work Queue */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>My Department Job Card Queue ({myTasks.length} Batches)</span>
                </h3>
                <p className="text-slate-400 text-[11px]">Assigned Job Cards in your factory line</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {myTasks.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-indigo-400">
                        {order.orderNumber}
                      </span>
                      <strong className="text-white text-xs">{order.teamOrClub}</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                        {order.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-3">
                      <span>
                        Quantity: <strong className="text-white">{order.totalQuantity} pcs</strong>
                      </span>
                      <span>Fabric: {order.fabricType}</span>
                      <span>Client: {order.clientName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      Open Job Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. My Payslips & Earnings */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>My Monthly Payslips & Earnings (৳ BDT)</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Monthly wage breakdown, overtime hours and disbursement status
                </p>
              </div>
            </div>

            {employeePayslips.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No payslips issued for this profile yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employeePayslips.map((slip) => (
                  <div
                    key={slip.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{slip.month}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                        {slip.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono space-y-0.5 text-slate-400">
                      <div className="flex justify-between">
                        <span>Base Wage:</span>
                        <span className="text-white">৳{slip.baseSalary.toLocaleString()} BDT</span>
                      </div>
                      <div className="flex justify-between text-purple-400">
                        <span>Overtime ({slip.overtimeHours}h):</span>
                        <span>+৳{slip.overtimeAmount.toLocaleString()} BDT</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-black text-xs text-emerald-400">
                        <span>Net Take-Home:</span>
                        <span>৳{slip.netSalary.toLocaleString()} BDT</span>
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
