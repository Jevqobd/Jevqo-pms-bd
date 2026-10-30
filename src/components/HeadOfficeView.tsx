/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, ShortageTicket, UserRole, Employee, Invoice, DelegatedTask } from '../types/erp';
import {
  Building2,
  Users,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Palette,
  Layers,
  Search,
  Check,
  BellRing,
  Lock,
  TrendingUp,
  Send,
  PhoneCall,
} from 'lucide-react';
import { calculateFabricConsumption } from '../utils/erpLogic';

interface HeadOfficeViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  employees?: Employee[];
  invoices?: Invoice[];
  currentUserName?: string;
  currentUserPosition?: string;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onOpenCreateOrder: () => void;
  onOpenCustomersCrm?: () => void;
  onDelegateTask?: (task: Omit<DelegatedTask, 'id' | 'createdAt' | 'status'>) => void;
  onOpenPrivateInvoiceChat?: (invoiceNumber: string, targetEmployeeId?: string) => void;
  onNotifyAction?: (tag: 'DONE' | 'APPROVED' | 'DELEGATED' | 'VERIFIED', title: string, message: string) => void;
  externalDesignToolName?: string;
}

export const HeadOfficeView: React.FC<HeadOfficeViewProps> = ({
  orders,
  shortageTickets,
  currentRole,
  employees = [],
  invoices = [],
  currentUserName = 'Management Desk',
  currentUserPosition = 'Operations Head',
  onUpdateOrder,
  onSelectOrder,
  onOpenCreateOrder,
  onOpenCustomersCrm,
  onDelegateTask,
  onOpenPrivateInvoiceChat,
  onNotifyAction,
  externalDesignToolName = 'CLO3D / Adobe Illustrator API',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'marketing_crm' | 'owner_approvals' | 'design_1' | 'design_2'
  >('marketing_crm');
  const [searchTerm, setSearchTerm] = useState('');
  const [driveLinkInputs, setDriveLinkInputs] = useState<Record<string, string>>({});
  const [mockupNotesInputs, setMockupNotesInputs] = useState<Record<string, string>>({});
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  // Instant Task Delegation Bar state
  const [delegateEmpId, setDelegateEmpId] = useState<string>(employees[1]?.id || employees[0]?.id || '');
  const [delegateOrderRef, setDelegateOrderRef] = useState<string>(orders[0]?.orderNumber || '');
  const [delegatePriority, setDelegatePriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [delegateTaskTitle, setDelegateTaskTitle] = useState<string>(
    'Verify client advance deposit & release jersey artwork to Pre-Press'
  );

  const showNotice = (msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 3500);
  };

  // Sub-queues
  const pendingPaymentOrders = orders.filter(
    (o) => o.stage === 'draft' || o.stage === 'payment_pending' || o.paymentStatus === 'pending'
  );
  const design1Queue = orders.filter(
    (o) => o.stage === 'payment_verified' || o.stage === 'mockup_in_progress'
  );
  const design2Queue = orders.filter((o) => o.stage === 'mockup_approved');
  const urgentShortages = shortageTickets.filter((t) => t.status === 'open');

  // CRM Client list derived from orders
  const clientMap = new Map<
    string,
    {
      clientName: string;
      teamOrClub: string;
      phone: string;
      totalOrders: number;
      totalSpend: number;
      lastOrder: string;
      assignedEmployeeId?: string;
      assignedEmployeeName?: string;
    }
  >();
  orders.forEach((o) => {
    const key = o.clientName.toLowerCase().trim();
    const existing = clientMap.get(key) || {
      clientName: o.clientName,
      teamOrClub: o.teamOrClub || 'Independent',
      phone: o.clientPhone || '+880 1700-000000',
      totalOrders: 0,
      totalSpend: 0,
      lastOrder: o.orderNumber,
      assignedEmployeeId: o.assignedToEmployeeId,
      assignedEmployeeName: o.assignedToEmployeeName,
    };
    existing.totalOrders += 1;
    existing.totalSpend += o.totalAmount;
    existing.lastOrder = o.orderNumber;
    clientMap.set(key, existing);
  });
  const clientList = Array.from(clientMap.values());
  const totalPipelineValue = orders.reduce((s, o) => s + o.totalAmount, 0);

  const handleQuickDelegateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find((emp) => emp.id === delegateEmpId) || employees[0];
    if (!targetEmp || !delegateTaskTitle.trim()) return;

    const matchedInv = invoices.find((inv) => inv.orderNumber === delegateOrderRef);

    onDelegateTask?.({
      title: delegateTaskTitle.trim(),
      description: `Delegated from Sales & CRM Command Hub regarding Job Card ${delegateOrderRef}.`,
      orderNumber: delegateOrderRef || undefined,
      invoiceNumber: matchedInv?.invoiceNumber,
      assignedToEmployeeId: targetEmp.id,
      assignedToEmployeeName: targetEmp.name,
      assignedToPosition: targetEmp.designation,
      assignedToRole: targetEmp.role,
      delegatedByEmployeeName: currentUserName,
      delegatedByPosition: currentUserPosition,
      priority: delegatePriority,
      dueTime: 'Today 4:30 PM',
    });

    showNotice(`DELEGATED: Task assigned to ${targetEmp.name} (${targetEmp.designation})`);
  };

  const handleVerifyPayment = async (order: Order) => {
    await onUpdateOrder(order.id, {
      paymentStatus: 'verified',
      stage: 'payment_verified',
      updatedAt: new Date().toISOString(),
    });
    onNotifyAction?.(
      'APPROVED',
      `Payment Approved: ${order.orderNumber}`,
      `Verified advance deposit of ৳${order.advanceAmount.toLocaleString()} BDT for ${order.clientName}. Unlocked for Design Team 1.`
    );
    showNotice(`APPROVED: Payment verified for ${order.orderNumber}. Forwarded to Design Team 1.`);
  };

  const handleApproveMockup = async (order: Order) => {
    await onUpdateOrder(order.id, {
      stage: 'mockup_approved',
      mockupNotes:
        mockupNotesInputs[order.id] ||
        order.mockupNotes ||
        'Client approved mockup via WhatsApp sign-off.',
      updatedAt: new Date().toISOString(),
    });
    onNotifyAction?.(
      'APPROVED',
      `Mockup Approved: ${order.orderNumber}`,
      `Client artwork for ${order.teamOrClub} approved and routed to Design Team 2.`
    );
    showNotice(`APPROVED: Mockup approved for ${order.orderNumber}. Sent to Design Team 2.`);
  };

  const handleSavePrintFiles = async (order: Order) => {
    const link = driveLinkInputs[order.id] || order.printReadyLink;
    if (!link) {
      showNotice(
        'Please enter a valid Google Drive or WeTransfer download link for print-ready files.'
      );
      return;
    }
    await onUpdateOrder(order.id, {
      printReadyLink: link,
      stage: 'pattern_spec_ready',
      updatedAt: new Date().toISOString(),
    });
    onNotifyAction?.(
      'DONE',
      `Print Files Released: ${order.orderNumber}`,
      `1.6m sublimation layout linked and sent to Tongi Print Factory queue.`
    );
    showNotice(`DONE: Print-ready cloud package linked for ${order.orderNumber}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {inlineNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-950/95 border border-indigo-500/40 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{inlineNotice}</span>
        </div>
      )}

      {/* Upgraded Sales & CRM Command Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
            <Building2 className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                Sales, CRM & Head Office Command Hub (Banani HQ)
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CRM Pipeline • Task Delegation • Design & Approvals
              </span>
            </div>
            <p className="text-xs text-indigo-200 max-w-2xl mt-0.5">
              Central command for B2B/B2C sportswear sales, instant staff task delegation, owner payment approvals, external design API sync ({externalDesignToolName}), and pre-press release.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenCustomersCrm && (
            <button
              onClick={onOpenCustomersCrm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Customers & Marketing Q&A</span>
            </button>
          )}
          <button
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <span>+ Create Job Card</span>
          </button>
        </div>
      </div>

      {/* Sales & CRM KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Sales Pipeline
          </span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ৳{totalPipelineValue.toLocaleString()} BDT
          </div>
          <span className="text-[10px] text-slate-400">{orders.length} active sportswear orders</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            CRM Club & Corporate Accounts
          </span>
          <div className="text-xl font-black text-white font-mono mt-1">
            {clientList.length} Accounts
          </div>
          <span className="text-[10px] text-indigo-400 font-semibold">B2B & Retail Repeat Roster</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Pending Payment Clearances
          </span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            {pendingPaymentOrders.length} Orders
          </div>
          <span className="text-[10px] text-amber-300/80">Awaiting Owner / Accounts verification</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Design & Nesting Queue
          </span>
          <div className="text-xl font-black text-pink-400 font-mono mt-1">
            {design1Queue.length + design2Queue.length} Batches
          </div>
          <span className="text-[10px] text-slate-400">
            {design1Queue.length} Mockup • {design2Queue.length} Pre-Press
          </span>
        </div>
      </div>

      {/* Instant Task Delegation Command Bar (Triggers Instant Popup & Sound) */}
      {employees.length > 0 && (
        <form
          onSubmit={handleQuickDelegateSubmit}
          data-testid="crm-instant-delegate-bar"
          className="p-4 rounded-2xl bg-slate-900/95 border border-amber-500/40 shadow-lg space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-white text-xs uppercase tracking-wider">
                  Instant Task Delegation Desk (Triggers Live Popup & Sound Alert)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Assign an urgent sales, design, or factory follow-up task to any employee with real-time audio notification.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
              INSTANT SOUND + POPUP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Delegate To Employee
              </label>
              <select
                data-testid="crm-delegate-employee-select"
                value={delegateEmpId}
                onChange={(e) => setDelegateEmpId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Related Job Card
              </label>
              <select
                value={delegateOrderRef}
                onChange={(e) => setDelegateOrderRef(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.orderNumber}>
                    {o.orderNumber} ({o.teamOrClub})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Priority Level
              </label>
              <select
                value={delegatePriority}
                onChange={(e) => setDelegatePriority(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
              >
                <option value="urgent">🚨 URGENT</option>
                <option value="high">⚡ HIGH</option>
                <option value="normal">NORMAL</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Task Action & Instructions
              </label>
              <input
                type="text"
                value={delegateTaskTitle}
                onChange={(e) => setDelegateTaskTitle(e.target.value)}
                placeholder="Enter task instructions..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                data-testid="crm-delegate-submit-btn"
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/50 cursor-pointer transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Delegate Now</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Urgent Shortage Notice for Design Team 2 if any open tickets */}
      {urgentShortages.length > 0 && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-800 rounded-xl flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-bold">
              Action Required for Design Team 2: {urgentShortages.length} urgent shortage ticket(s) raised by Sewing Factory!
            </span>
          </div>
          <span
            className="text-[11px] underline font-bold cursor-pointer text-rose-300"
            onClick={() => setActiveSubTab('design_2')}
          >
            Jump to Pattern & Print Re-nesting &rarr;
          </span>
        </div>
      )}

      {/* Sub-Department Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('marketing_crm')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'marketing_crm'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Marketing CRM & Deal Pipeline</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {clientList.length} Clients
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('owner_approvals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'owner_approvals'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Owner Payment Approvals</span>
          {pendingPaymentOrders.length > 0 && (
            <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded-full text-[10px] font-black">
              {pendingPaymentOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('design_1')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'design_1'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Design Team 1 (Concept & Mockups)</span>
          {design1Queue.length > 0 && (
            <span className="px-1.5 py-0.2 bg-pink-200 text-pink-900 rounded-full text-[10px] font-black">
              {design1Queue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('design_2')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'design_2'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Design Team 2 (Patterns & Print-Ready)</span>
          {design2Queue.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black">
              {design2Queue.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Marketing CRM & Invoicing */}
      {activeSubTab === 'marketing_crm' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-white">
                Customer Database, Repeat Deals & Private Invoice Comms
              </h3>
              <p className="text-slate-400 text-[11px]">
                Track team roster sizes, repeat club orders, advance deposits, and message staff privately on any client invoice.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search client, club, or phone..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {clientList
              .filter(
                (c) =>
                  c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.teamOrClub.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((client, idx) => {
                const relatedInvoice = invoices.find((inv) => inv.orderNumber === client.lastOrder);
                return (
                  <div
                    key={idx}
                    className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-black text-white text-sm">{client.clientName}</h4>
                          <span className="text-[11px] text-indigo-400 font-bold">
                            {client.teamOrClub}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold text-[10px]">
                          {client.totalOrders} Order(s)
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <PhoneCall className="w-3 h-3 text-emerald-400" />
                          <span>{client.phone}</span>
                        </div>
                        <div>
                          Recent Job:{' '}
                          <span className="font-mono font-bold text-slate-200">
                            {client.lastOrder}
                          </span>
                          {relatedInvoice && (
                            <span className="ml-2 font-mono text-amber-400">
                              ({relatedInvoice.invoiceNumber})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Volume</span>
                        <span className="font-black text-emerald-400 font-mono text-xs">
                          ৳{client.totalSpend.toLocaleString()} BDT
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {relatedInvoice && onOpenPrivateInvoiceChat && (
                          <button
                            onClick={() =>
                              onOpenPrivateInvoiceChat(
                                relatedInvoice.invoiceNumber,
                                relatedInvoice.assignedEmployeeId || client.assignedEmployeeId
                              )
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            title="Send Private Invoice Message in Live Chat"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Invoice DM</span>
                          </button>
                        )}
                        <button
                          onClick={onOpenCreateOrder}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-[11px] text-white cursor-pointer"
                        >
                          + Re-Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 2: Owner Payment Approvals */}
      {activeSubTab === 'owner_approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-white">Owner Payment Verification Desk</h3>
              <p className="text-slate-400 text-[11px]">
                Orders cannot proceed to Design Team 1 until the Owner or Authorized Lead verifies client payment proof.
              </p>
            </div>
            <span className="font-mono text-[11px] text-purple-400 font-bold">
              {pendingPaymentOrders.length} Awaiting Verification
            </span>
          </div>

          {pendingPaymentOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-white text-sm">All customer payments verified!</p>
              <p className="text-slate-400 text-xs">No pending invoices awaiting clearance.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPaymentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-900 p-4 rounded-2xl border border-purple-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-white">
                        {ord.orderNumber}
                      </span>
                      <span className="font-bold text-slate-300">
                        {ord.teamOrClub} • {ord.clientName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        Payment Pending
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 text-[11px] text-slate-400">
                      <span>
                        Total:{' '}
                        <strong className="text-white">
                          ৳{ord.totalAmount.toLocaleString()} BDT
                        </strong>
                      </span>
                      <span>
                        Advance Received:{' '}
                        <strong className="text-emerald-400">
                          ৳{ord.advanceAmount.toLocaleString()} BDT
                        </strong>
                      </span>
                      <span>
                        Due:{' '}
                        <strong className="text-amber-400">
                          ৳{ord.dueAmount.toLocaleString()} BDT
                        </strong>
                      </span>
                      <span>
                        Ref:{' '}
                        <strong className="font-mono text-slate-300">
                          {ord.paymentReference || 'Bank Transfer #TX-9821'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      View Job Card
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(ord)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Unlock Design</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Design Team 1 (Concept & Mockups) */}
      {activeSubTab === 'design_1' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-white">
                Design Team 1 Workbench (External Design API & Kit Mockups)
              </h3>
              <p className="text-slate-400 text-[11px]">
                Sync visual jersey mockups from {externalDesignToolName}, then log client approvals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onNotifyAction?.(
                    'DONE',
                    'External Design API Synced',
                    `Latest renders from ${externalDesignToolName} attached to active Job Cards.`
                  );
                  showNotice(
                    `DONE: Connected to ${externalDesignToolName}: Latest renders & vector art synced!`
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Sync External Design API</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders
              .filter((o) =>
                ['payment_verified', 'mockup_in_progress', 'mockup_approved'].includes(o.stage)
              )
              .map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-white">
                          {ord.orderNumber}
                        </span>
                        <span className="font-bold text-slate-300">{ord.teamOrClub}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        {ord.totalQuantity} pcs • {ord.fabricType} ({ord.gsm} GSM)
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.stage === 'mockup_approved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-pink-950 text-pink-300 border border-pink-700'
                      }`}
                    >
                      {ord.stage === 'mockup_approved' ? 'Mockup Approved' : 'Awaiting Concept Art'}
                    </span>
                  </div>

                  {/* Mockup Preview or Placeholder */}
                  <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                    {ord.mockupUrl ? (
                      <img src={ord.mockupUrl} alt="Mockup" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-500 p-4">
                        <Palette className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span>No mockup attached yet</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Notes Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">
                      Client Design Notes / Approvals:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Navy blue with gold sash, client confirmed on WhatsApp"
                      defaultValue={ord.mockupNotes || ''}
                      onChange={(e) =>
                        setMockupNotesInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className="text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Open Full Job Card &rarr;
                    </button>

                    {ord.stage !== 'mockup_approved' && (
                      <button
                        onClick={() => handleApproveMockup(ord)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Client Mockup</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 4: Design Team 2 (Patterns & Print-Ready) */}
      {activeSubTab === 'design_2' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-black text-sm text-white">
              Design Team 2 Workbench (Production Pre-Press & Nesting)
            </h3>
            <p className="text-slate-400 text-[11px]">
              Nest player sizes into 1.6m wide sublimation print layouts, generate pattern spec sheets, and upload heavy cloud print files for the Tongi Print Factory.
            </p>
          </div>

          <div className="space-y-3">
            {orders
              .filter((o) => ['mockup_approved', 'pattern_spec_ready'].includes(o.stage))
              .map((ord) => {
                const consumption = calculateFabricConsumption(
                  ord.sizeBreakdown || {},
                  ord.fabricType
                );
                return (
                  <div
                    key={ord.id}
                    className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-white">
                          {ord.orderNumber}
                        </span>
                        <span className="font-bold text-slate-300">
                          {ord.teamOrClub} • {ord.totalQuantity} Sets
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                          {ord.stage === 'pattern_spec_ready'
                            ? 'Ready for Print'
                            : 'Awaiting Pattern Layout'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400">
                        Est. Fabric: <strong className="text-white">{consumption.fabricMeters}m</strong> • Paper:{' '}
                        <strong className="text-white">{consumption.transferPaperMeters}m</strong> • Ink:{' '}
                        <strong className="text-white">
                          {(consumption.inkEstimatedMl / 1000).toFixed(2)}L
                        </strong>
                      </div>
                    </div>

                    {/* Sizing Breakdown Chips */}
                    <div className="flex flex-wrap gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                      <span className="font-bold text-slate-400 mr-1 self-center">Sizes:</span>
                      {Object.entries(ord.sizeBreakdown || {}).map(
                        ([sz, qty]) =>
                          qty > 0 && (
                            <span
                              key={sz}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono font-bold text-white"
                            >
                              {sz.toUpperCase()}: {qty}
                            </span>
                          )
                      )}
                    </div>

                    {/* Cloud Link Input */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          placeholder="Paste Google Drive / WeTransfer print file link (e.g. https://drive.google.com/...)"
                          defaultValue={ord.printReadyLink || ''}
                          onChange={(e) =>
                            setDriveLinkInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono"
                        />
                      </div>

                      <button
                        onClick={() => handleSavePrintFiles(ord)}
                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Send to Print Queue</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
