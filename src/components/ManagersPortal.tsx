/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Order,
  ShortageTicket,
  Invoice,
  Estimate,
  Employee,
  AttendanceRecord,
  Payslip,
  Vendor,
  UserRole,
} from '../types/erp';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  Printer,
  Scissors,
  Building2,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  FileCheck,
  Eye,
} from 'lucide-react';

interface ManagersPortalProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  invoices: Invoice[];
  estimates: Estimate[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  payslips: Payslip[];
  vendors: Vendor[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onDisburseSalary: (slipId: string, paymentMethod: string) => Promise<void>;
}

export const ManagersPortal: React.FC<ManagersPortalProps> = ({
  orders,
  shortageTickets,
  invoices,
  estimates,
  employees,
  attendance,
  payslips,
  vendors,
  currentRole,
  onUpdateOrder,
  onSelectOrder,
  onDisburseSalary,
}) => {
  const [managerView, setManagerView] = useState<'gm_approvals' | 'marketing_mgr' | 'print_mgr' | 'sewing_mgr' | 'hr_mgr'>('gm_approvals');

  // Pending Approvals for GM / Owner
  const pendingPaymentOrders = orders.filter((o) => o.paymentStatus === 'pending' || o.stage === 'payment_pending');
  const pendingPayslips = payslips.filter((p) => p.status === 'draft' || p.status === 'approved');
  const openShortages = shortageTickets.filter((t) => t.status === 'open');
  const pendingEstimates = estimates.filter((e) => e.status === 'sent');

  // Multi-Factory throughput metrics
  const activePrintOrders = orders.filter((o) => ['pattern_spec_ready', 'paper_printed', 'heat_press_done'].includes(o.stage));
  const activeSewingOrders = orders.filter((o) => ['fabric_dispatched', 'fabric_received', 'cutting_sewing', 'quality_finishing'].includes(o.stage));

  const handleApprovePayment = async (order: Order) => {
    await onUpdateOrder(order.id, {
      paymentStatus: 'verified',
      stage: 'payment_verified',
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Portal Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 backdrop-blur-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                Enterprise Managers & Leadership Portal
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Executive Desk
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Cross-department management cockpit: approve client payment verifications, sign off payroll runs, audit factory line bottlenecks, and review supplier payable liabilities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {pendingPaymentOrders.length + pendingPayslips.length + openShortages.length} Action Items Pending
          </span>
        </div>
      </div>

      {/* Sub-Manager Navigation */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setManagerView('gm_approvals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            managerView === 'gm_approvals'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>GM Approval Center</span>
          {(pendingPaymentOrders.length + pendingPayslips.length) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-500 text-white">
              {pendingPaymentOrders.length + pendingPayslips.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setManagerView('marketing_mgr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            managerView === 'marketing_mgr'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Marketing & Sales Cockpit</span>
        </button>

        <button
          onClick={() => setManagerView('print_mgr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            managerView === 'print_mgr'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Factory Manager Desk</span>
        </button>

        <button
          onClick={() => setManagerView('sewing_mgr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            managerView === 'sewing_mgr'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Sewing Floor Manager Desk</span>
        </button>

        <button
          onClick={() => setManagerView('hr_mgr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            managerView === 'hr_mgr'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>HR & Personnel Oversight</span>
        </button>
      </div>

      {/* VIEW 1: GM APPROVAL CENTER */}
      {managerView === 'gm_approvals' && (
        <div className="space-y-6">
          {/* Section A: Customer Payment Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <span>1. Customer Inward Payment Verifications</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {pendingPaymentOrders.length} Awaiting Release
                </span>
              </h3>
              <span className="text-[11px] text-gray-400">Verifies client deposits prior to pre-press nesting</span>
            </div>

            {pendingPaymentOrders.length === 0 ? (
              <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 text-center text-gray-500">
                All client payments verified. No orders blocked.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingPaymentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-indigo-600">{ord.orderNumber}</span>
                        <strong className="text-gray-900 dark:text-white">{ord.clientName} &bull; {ord.teamOrClub}</strong>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">{ord.orderType}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex gap-4 mt-1">
                        <span>Total: <strong>৳{ord.totalAmount.toLocaleString()}</strong></span>
                        <span>Advance: <strong className="text-emerald-600">৳{ord.advanceAmount.toLocaleString()}</strong></span>
                        <span>Due: <strong className="text-amber-600">৳{ord.dueAmount.toLocaleString()}</strong></span>
                        <span>Ref: <strong className="font-mono text-gray-700 dark:text-gray-300">{ord.paymentReference || 'N/A'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectOrder(ord)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold"
                      >
                        Inspect Job Card
                      </button>
                      <button
                        onClick={() => handleApprovePayment(ord)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Unlock Production</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Urgent Factory Shortages */}
          {openShortages.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-black text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>2. Emergency Shortage Reprint Loop Alerts ({openShortages.length})</span>
              </h3>

              <div className="space-y-2">
                {openShortages.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-red-700 dark:text-red-300">{t.orderNumber}</span>
                        <strong className="text-gray-900 dark:text-white">{t.partDamaged} ({t.size})</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-200 text-red-900 font-bold">Qty: {t.quantity}</span>
                      </div>
                      <p className="text-[11px] text-red-800 dark:text-red-200 mt-0.5">{t.reason}</p>
                    </div>
                    <span className="text-xs font-bold text-red-700 underline">High Priority Pre-Press</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section C: Pending Salary Approvals */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-gray-900 dark:text-white">
              3. Monthly Factory Payroll Approvals ({pendingPayslips.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingPayslips.map((slip) => (
                <div
                  key={slip.id}
                  className="p-3.5 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{slip.employeeName}</h4>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {slip.month} &bull; Net: BDT {slip.netSalary.toLocaleString()}
                    </span>
                  </div>
                  {slip.status !== 'disbursed' ? (
                    <button
                      onClick={() => onDisburseSalary(slip.id, 'Bank Wire (Corporate Payroll)')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
                    >
                      Authorize Disbursal
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs">Disbursed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MARKETING & SALES COCKPIT */}
      {managerView === 'marketing_mgr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">B2B Institutional Volume</span>
              <div className="text-xl font-black text-blue-600 mt-1">
                ৳{orders.filter(o => o.orderType === 'b2b').reduce((s,o) => s + o.totalAmount, 0).toLocaleString()} BDT
              </div>
              <span className="text-[10px] text-gray-500">Clubs, Corporate, Schools</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">B2C Retail & Fan Volume</span>
              <div className="text-xl font-black text-pink-600 mt-1">
                ৳{orders.filter(o => o.orderType === 'b2c').reduce((s,o) => s + o.totalAmount, 0).toLocaleString()} BDT
              </div>
              <span className="text-[10px] text-gray-500">Single kits, custom gamertags</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Active Quotations Pending</span>
              <div className="text-xl font-black text-amber-500 mt-1">
                {pendingEstimates.length} Proposals
              </div>
              <span className="text-[10px] text-gray-500">Awaiting client sign-off</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs">Customer Credit Limits & Balances (BDT)</h4>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-[11px]">
              {orders.map((ord) => (
                <div key={ord.id} className="py-2 flex items-center justify-between">
                  <div>
                    <strong className="text-gray-900 dark:text-white block">{ord.clientName}</strong>
                    <span className="text-gray-400 font-mono text-[10px]">{ord.teamOrClub}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-600 block">Due: ৳{ord.dueAmount.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400">Total: ৳{ord.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PRINT FACTORY MANAGER DESK */}
      {managerView === 'print_mgr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Rotary Calendar Press #1</span>
              <div className="text-xl font-black text-emerald-600 mt-1">202°C &bull; Calibrated</div>
              <span className="text-[10px] text-gray-500">Optimal sublimation thermal transfer</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Queue In Production</span>
              <div className="text-xl font-black text-teal-600 mt-1">{activePrintOrders.length} Orders</div>
              <span className="text-[10px] text-gray-500">Wide-format paper printing & calendar</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">CMYK Ink Tank Volume</span>
              <div className="text-xl font-black text-blue-600 mt-1">16.5 Liters In-Tank</div>
              <span className="text-[10px] text-gray-500">Above minimum threshold</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: SEWING FLOOR MANAGER DESK */}
      {managerView === 'sewing_mgr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Lines 1 - 4 Stitching</span>
              <div className="text-xl font-black text-indigo-600 mt-1">{activeSewingOrders.length} Active Orders</div>
              <span className="text-[10px] text-gray-500">Overlock & flatlock assembly lines</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Open Shortage Tickets</span>
              <div className="text-xl font-black text-red-500 mt-1">{openShortages.length} Damaged Parts</div>
              <span className="text-[10px] text-red-500 font-medium">Re-print loop priority</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Courier Handover Ready</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {orders.filter(o => o.stage === 'quality_finishing' || o.stage === 'shipped').length} Batches
              </div>
              <span className="text-[10px] text-gray-500">QC pass & polybag packed</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: HR & PERSONNEL OVERSIGHT */}
      {managerView === 'hr_mgr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Factory Attendance Rate</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {Math.round((attendance.length / (employees.length || 1)) * 100)}%
              </div>
              <span className="text-[10px] text-gray-500">{attendance.length} Clocked in today</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Cumulative Overtime</span>
              <div className="text-xl font-black text-purple-600 mt-1">
                {attendance.reduce((s, a) => s + (a.overtimeHours || 0), 0)} Hours
              </div>
              <span className="text-[10px] text-gray-500">Across print and sewing shifts</span>
            </div>

            <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Monthly Payroll Commitments</span>
              <div className="text-xl font-black text-teal-600 mt-1">
                BDT {employees.reduce((s, e) => s + e.baseSalary, 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-gray-500">{employees.length} Active personnel</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
