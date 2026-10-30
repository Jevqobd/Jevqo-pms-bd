/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShortageTicket, UserRole, Order, Employee, DelegatedTask } from '../types/erp';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  ExternalLink,
  Plus,
  BellRing,
  Check,
  Send,
  Printer,
  Scissors,
  Truck,
} from 'lucide-react';

interface ShortageTicketsViewProps {
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  orders: Order[];
  employees?: Employee[];
  currentUserName?: string;
  currentUserPosition?: string;
  onUpdateTicket: (ticketId: string, partial: Partial<ShortageTicket>) => Promise<void>;
  onOpenRaiseModal: () => void;
  onDelegateTask?: (task: Omit<DelegatedTask, 'id' | 'createdAt' | 'status'>) => void;
  onNotifyAction?: (
    tag: 'DONE' | 'APPROVED' | 'DELEGATED' | 'VERIFIED' | 'ALERT',
    title: string,
    message: string
  ) => void;
}

export const ShortageTicketsView: React.FC<ShortageTicketsViewProps> = ({
  shortageTickets,
  currentRole,
  employees = [],
  currentUserName = 'Production Lead',
  currentUserPosition = 'Quality & Reprint Desk',
  onUpdateTicket,
  onOpenRaiseModal,
  onDelegateTask,
  onNotifyAction,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [urgentFileLink, setUrgentFileLink] = useState('');
  const [activeTicketIdForLink, setActiveTicketIdForLink] = useState<string | null>(null);
  const [selectedOperatorByTicket, setSelectedOperatorByTicket] = useState<Record<string, string>>(
    {}
  );
  const [approvedTickets, setApprovedTickets] = useState<Record<string, boolean>>({});

  const filteredTickets = shortageTickets.filter((t) => {
    if (filterStatus === 'open') return t.status !== 'resolved';
    if (filterStatus === 'resolved') return t.status === 'resolved';
    return true;
  });

  const openTicketsCount = shortageTickets.filter((t) => t.status !== 'resolved').length;
  const totalDamagedPieces = shortageTickets.reduce((s, t) => s + (t.quantity || 0), 0);
  const estimatedReprintCostBdt = totalDamagedPieces * 185; // Avg ৳185 BDT fabric + sublimation per replacement panel

  const handleUpdateStatus = async (
    ticket: ShortageTicket,
    newStatus: ShortageTicket['status']
  ) => {
    await onUpdateTicket(ticket.id, { status: newStatus });
    onNotifyAction?.(
      newStatus === 'resolved' ? 'DONE' : 'APPROVED',
      `Shortage Ticket ${ticket.orderNumber}: ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
      `${ticket.quantity} pcs (${ticket.size} - ${ticket.partDamaged}) updated to ${newStatus.replace(
        /_/g,
        ' '
      )}.`
    );
  };

  const handleApproveReprint = (ticket: ShortageTicket) => {
    setApprovedTickets((prev) => ({ ...prev, [ticket.id]: true }));
    onNotifyAction?.(
      'APPROVED',
      `Reprint Approved: ${ticket.orderNumber}`,
      `Approved urgent replacement run for ${ticket.quantity} pcs (${ticket.partDamaged}, Size ${ticket.size}).`
    );
  };

  const handleDelegateTicketToOperator = (ticket: ShortageTicket) => {
    const empId =
      selectedOperatorByTicket[ticket.id] ||
      employees.find((e) => e.role === 'print_factory' || e.role === 'design_pattern')?.id ||
      employees[0]?.id;
    const targetEmp = employees.find((e) => e.id === empId) || employees[0];
    if (!targetEmp) return;

    onDelegateTask?.({
      title: `URGENT REPRINT: ${ticket.orderNumber} (${ticket.quantity} pcs ${ticket.partDamaged})`,
      description: `Replace ${ticket.quantity} ruined pc(s) of Size ${ticket.size} (${ticket.playerDetails || 'Team Kit'}) — Defect: ${ticket.reason}. Prioritize on sublimation calender.`,
      orderNumber: ticket.orderNumber,
      assignedToEmployeeId: targetEmp.id,
      assignedToEmployeeName: targetEmp.name,
      assignedToPosition: targetEmp.designation,
      assignedToRole: targetEmp.role,
      delegatedByEmployeeName: currentUserName,
      delegatedByPosition: currentUserPosition,
      priority: 'urgent',
      dueTime: 'Within 2 Hours (Express Pass)',
    });
  };

  const handleSaveUrgentLink = async (ticket: ShortageTicket) => {
    if (!urgentFileLink) return;
    await onUpdateTicket(ticket.id, {
      urgentPrintLink: urgentFileLink,
      status: 'reprint_file_ready',
    });
    onNotifyAction?.(
      'DONE',
      `Isolated Reprint File Linked: ${ticket.orderNumber}`,
      `Design Team 2 attached isolated piece print link for ${ticket.partDamaged}.`
    );
    setActiveTicketIdForLink(null);
    setUrgentFileLink('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Alert Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 border border-rose-500/40 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30">
            <Flame className="w-6 h-6 text-rose-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                Shortage & Urgent Factory Re-Print Command Center
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/40 text-[10px] font-black uppercase">
                PRIORITY RE-PRINT LOOP
              </span>
            </div>
            <p className="text-xs text-rose-100/90 max-w-2xl leading-relaxed mt-0.5">
              Isolate heat-press scorches, print bleeds, or cutting defects without halting main batch production. Approve reprints in 1 click and delegate directly to Print or Design operators with instant sound alerts.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenRaiseModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-black shadow-lg transition whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Raise Shortage Ticket
        </button>
      </div>

      {/* Upgraded KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Open Priority Tickets
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {openTicketsCount} Active
          </div>
          <span className="text-[10px] text-rose-300">Requires immediate reprint pass</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Ruined Panels
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalDamagedPieces} pcs
          </div>
          <span className="text-[10px] text-slate-400">Across {shortageTickets.length} logged tickets</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Est. Reprint Material Cost
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            ৳{estimatedReprintCostBdt.toLocaleString()} BDT
          </div>
          <span className="text-[10px] text-slate-400">Sublimation paper, ink & fabric</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Resolution Rate
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {shortageTickets.length > 0
              ? Math.round(
                  (shortageTickets.filter((t) => t.status === 'resolved').length /
                    shortageTickets.length) *
                    100
                )
              : 100}
            %
          </div>
          <span className="text-[10px] text-emerald-400">Synced with Mirpur Sewing Line</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            All Tickets ({shortageTickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('open')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'open'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Open & In-Flight ({openTicketsCount})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'resolved'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Resolved ({shortageTickets.filter((t) => t.status === 'resolved').length})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Active Role: <strong className="text-emerald-400 uppercase">{currentRole.replace('_', ' ')}</strong>
        </span>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="font-bold text-white">No Shortage Tickets Found</p>
            <p className="text-slate-400">All factory floor pieces are accounted for.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'resolved';
            const isApproved = approvedTickets[ticket.id] || ticket.status !== 'open';

            return (
              <div
                key={ticket.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-slate-900/60 border-slate-800 opacity-85'
                    : 'bg-slate-900 border-rose-500/40 shadow-lg'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-black text-sm">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-rose-400">
                          {ticket.orderNumber}
                        </span>
                        <h3 className="font-black text-sm text-white">{ticket.teamOrClub}</h3>
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                            ✓ REPRINT APPROVED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Raised by {ticket.createdBy} • {ticket.createdAt.substring(0, 16)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Approval & Instant Operator Delegation Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isApproved && (
                      <button
                        onClick={() => handleApproveReprint(ticket)}
                        data-testid={`approve-reprint-btn-${ticket.id}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Reprint</span>
                      </button>
                    )}

                    {employees.length > 0 && !isResolved && (
                      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-amber-500/30">
                        <select
                          value={
                            selectedOperatorByTicket[ticket.id] ||
                            employees.find((e) => e.role === 'print_factory')?.id ||
                            employees[0]?.id
                          }
                          onChange={(e) =>
                            setSelectedOperatorByTicket((prev) => ({
                              ...prev,
                              [ticket.id]: e.target.value,
                            }))
                          }
                          className="px-2 py-1 rounded-lg bg-slate-900 text-amber-300 font-bold text-[11px] border border-slate-800"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.designation})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDelegateTicketToOperator(ticket)}
                          data-testid={`delegate-shortage-btn-${ticket.id}`}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer transition"
                          title="Delegate Reprint Task with Instant Sound & Popup Alert"
                        >
                          <BellRing className="w-3 h-3" />
                          <span>Delegate</span>
                        </button>
                      </div>
                    )}

                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase ${
                        ticket.status === 'open'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : ticket.status === 'reprint_file_ready'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : ticket.status === 'reprinted'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : ticket.status === 'dispatched_to_sewing'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Damaged Spec Details */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Damaged Piece
                    </span>
                    <strong className="text-white font-bold">{ticket.partDamaged}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Size & Quantity
                    </span>
                    <strong className="text-amber-400 font-extrabold font-mono">
                      {ticket.quantity} pc • Size {ticket.size}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Player Details
                    </span>
                    <strong className="text-slate-200 font-bold">
                      {ticket.playerDetails || 'Plain / No Name'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Reason / Defect Root Cause
                    </span>
                    <span className="text-rose-400 font-bold">{ticket.reason}</span>
                  </div>
                </div>

                {/* 4-Step Reprint Pipeline */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* Step 1: Design Team 2 Print File */}
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-amber-400" /> Step 1: Design 2
                      </span>
                      <strong className="block text-white mt-0.5">Isolate Piece File</strong>
                      {ticket.urgentPrintLink ? (
                        <a
                          href={ticket.urgentPrintLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 underline text-[11px] flex items-center gap-1 mt-1 font-semibold"
                        >
                          Print File Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">File not linked yet</span>
                      )}
                    </div>

                    {ticket.status === 'open' && (
                      <div className="pt-1">
                        {activeTicketIdForLink === ticket.id ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              placeholder="Paste isolated file link..."
                              value={urgentFileLink}
                              onChange={(e) => setUrgentFileLink(e.target.value)}
                              className="w-full text-xs p-1.5 border border-slate-700 bg-slate-900 text-white rounded-lg"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveUrgentLink(ticket)}
                                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                              >
                                Submit Link
                              </button>
                              <button
                                onClick={() => setActiveTicketIdForLink(null)}
                                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveTicketIdForLink(ticket.id);
                              setUrgentFileLink(ticket.urgentPrintLink || '');
                            }}
                            className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                          >
                            Attach Reprint Link
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Print Factory Print & Heat Press */}
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Printer className="w-3 h-3 text-emerald-400" /> Step 2: Print Dept
                      </span>
                      <strong className="block text-white mt-0.5">Print & Heat Press</strong>
                      <span className="text-[11px] text-slate-400">Urgent mini sublimation pass</span>
                    </div>

                    {ticket.status === 'reprint_file_ready' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket, 'reprinted')}
                        className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Mark Reprinted (DONE)
                      </button>
                    )}
                  </div>

                  {/* Step 3: Print Factory Dispatch to Sewing */}
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-purple-400" /> Step 3: Transfer
                      </span>
                      <strong className="block text-white mt-0.5">Dispatch to Sewing</strong>
                      <span className="text-[11px] text-slate-400">Shuttle van handoff</span>
                    </div>

                    {ticket.status === 'reprinted' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket, 'dispatched_to_sewing')}
                        className="w-full py-1.5 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Dispatched on Van
                      </button>
                    )}
                  </div>

                  {/* Step 4: Sewing Factory Confirm & Resolve */}
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Step 4: Sewing
                      </span>
                      <strong className="block text-white mt-0.5">Receive & Resolve</strong>
                      <span className="text-[11px] text-slate-400">Stitch into complete kit</span>
                    </div>

                    {ticket.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket, 'resolved')}
                        className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Resolve & Clear (DONE)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
