/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShortageTicket, UserRole, Order } from '../types/erp';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Printer,
  Sparkles,
  Scissors,
  ArrowRight,
  ExternalLink,
  Plus,
  Clock,
} from 'lucide-react';

interface ShortageTicketsViewProps {
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  orders: Order[];
  onUpdateTicket: (ticketId: string, partial: Partial<ShortageTicket>) => Promise<void>;
  onOpenRaiseModal: () => void;
}

export const ShortageTicketsView: React.FC<ShortageTicketsViewProps> = ({
  shortageTickets,
  currentRole,
  orders,
  onUpdateTicket,
  onOpenRaiseModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [urgentFileLink, setUrgentFileLink] = useState('');
  const [activeTicketIdForLink, setActiveTicketIdForLink] = useState<string | null>(null);

  const filteredTickets = shortageTickets.filter((t) => {
    if (filterStatus === 'open') return t.status !== 'resolved';
    if (filterStatus === 'resolved') return t.status === 'resolved';
    return true;
  });

  const handleUpdateStatus = async (ticketId: string, newStatus: ShortageTicket['status']) => {
    await onUpdateTicket(ticketId, { status: newStatus });
  };

  const handleSaveUrgentLink = async (ticketId: string) => {
    if (!urgentFileLink) return;
    await onUpdateTicket(ticketId, {
      urgentPrintLink: urgentFileLink,
      status: 'reprint_file_ready',
    });
    setActiveTicketIdForLink(null);
    setUrgentFileLink('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Alert Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-red-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">
              Urgent Factory Re-print Loop (Shortages & Rejections)
            </h2>
            <p className="text-xs text-red-100 max-w-2xl leading-relaxed">
              When garments burn in the heat press, suffer cutting defects, or have print bleeds, the Sewing Factory raises priority tickets here. Design Team 2 nests only the damaged pieces, and Print Factory fulfills them on high-priority without disrupting primary order batches.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenRaiseModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-md transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Raise Shortage Ticket
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All Tickets ({shortageTickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'open'
                ? 'bg-red-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Open & In-Flight ({shortageTickets.filter((t) => t.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStatus === 'resolved'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Resolved ({shortageTickets.filter((t) => t.status === 'resolved').length})
          </button>
        </div>

        <span className="text-xs text-gray-400 font-medium hidden sm:inline">
          Active Role: <strong className="text-gray-700 dark:text-gray-300 capitalize">{currentRole.replace('_', ' ')}</strong>
        </span>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 text-gray-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="font-bold text-gray-700 dark:text-gray-300">No Shortage Tickets</p>
            <p className="text-gray-400">All factory floor pieces are accounted for.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isResolved = ticket.status === 'resolved';

            return (
              <div
                key={ticket.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-gray-50/80 dark:bg-gray-850/60 border-gray-200 dark:border-gray-800 opacity-80'
                    : 'bg-white dark:bg-gray-850 border-red-200 dark:border-red-900 shadow-sm ring-1 ring-red-300/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center font-bold text-xs">
                      🚨
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-red-600">
                          {ticket.orderNumber}
                        </span>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          {ticket.teamOrClub}
                        </h3>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Raised by {ticket.createdBy} &bull; {ticket.createdAt.substring(0, 16)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      ticket.status === 'open'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : ticket.status === 'reprint_file_ready'
                        ? 'bg-amber-100 text-amber-800'
                        : ticket.status === 'reprinted'
                        ? 'bg-blue-100 text-blue-800'
                        : ticket.status === 'dispatched_to_sewing'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Damaged Spec Details */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-red-50/50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/40 text-xs mb-4">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Damaged Piece</span>
                    <strong className="text-gray-900 dark:text-white font-bold">{ticket.partDamaged}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Size & Quantity</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                      {ticket.quantity} pc &bull; Size {ticket.size}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Player Details</span>
                    <strong className="text-gray-800 dark:text-gray-200 font-bold">
                      {ticket.playerDetails || 'Plain / No Name'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Reason / Defect</span>
                    <span className="text-red-700 dark:text-red-300 font-medium">{ticket.reason}</span>
                  </div>
                </div>

                {/* Workflow Actions Across Teams */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span>Re-print Sequence Progress:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    {/* Step 1: Design Team 2 Print File */}
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Step 1: Design 2</span>
                        <strong className="block text-gray-900 dark:text-white">Isolate Piece File</strong>
                        {ticket.urgentPrintLink ? (
                          <a
                            href={ticket.urgentPrintLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 underline text-[11px] flex items-center gap-1 mt-1 font-semibold"
                          >
                            Print File Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">File not linked yet</span>
                        )}
                      </div>

                      {(currentRole === 'design_pattern' || currentRole === 'owner') && ticket.status === 'open' && (
                        <div className="pt-1">
                          {activeTicketIdForLink === ticket.id ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="Paste mini-drive link"
                                value={urgentFileLink}
                                onChange={(e) => setUrgentFileLink(e.target.value)}
                                className="w-full text-xs p-1.5 border rounded"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSaveUrgentLink(ticket.id)}
                                  className="px-2 py-1 bg-amber-600 text-white rounded font-bold text-[10px]"
                                >
                                  Submit File
                                </button>
                                <button
                                  onClick={() => setActiveTicketIdForLink(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px]"
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
                              className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition"
                            >
                              Attach Reprint Link
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step 2: Print Factory Print & Heat Press */}
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Step 2: Print Dept</span>
                        <strong className="block text-gray-900 dark:text-white">Print & Heat Press</strong>
                        <span className="text-[11px] text-gray-500">Urgent mini sublimation pass</span>
                      </div>

                      {(currentRole === 'print_factory' || currentRole === 'owner') && ticket.status === 'reprint_file_ready' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'reprinted')}
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                        >
                          Mark Reprinted
                        </button>
                      )}
                    </div>

                    {/* Step 3: Print Factory Dispatch to Sewing */}
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Step 3: Transfer</span>
                        <strong className="block text-gray-900 dark:text-white">Dispatch to Sewing</strong>
                        <span className="text-[11px] text-gray-500">Shuttle van handoff</span>
                      </div>

                      {(currentRole === 'print_factory' || currentRole === 'owner') && ticket.status === 'reprinted' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, 'dispatched_to_sewing')}
                          className="w-full py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs transition"
                        >
                          Dispatched on Van
                        </button>
                      )}
                    </div>

                    {/* Step 4: Sewing Factory Confirm & Resolve */}
                    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Step 4: Sewing</span>
                        <strong className="block text-gray-900 dark:text-white">Receive & Resolve</strong>
                        <span className="text-[11px] text-gray-500">Stitch into complete kit</span>
                      </div>

                      {(currentRole === 'sewing_factory' || currentRole === 'owner') &&
                        ticket.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                            className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition"
                          >
                            Resolve & Clear
                          </button>
                        )}
                    </div>
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
