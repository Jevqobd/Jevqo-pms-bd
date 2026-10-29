/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, ShortageTicket, UserRole } from '../types/erp';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Palette,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check,
  Eye,
} from 'lucide-react';
import { calculateOrderTotals, calculateFabricConsumption } from '../utils/erpLogic';

interface HeadOfficeViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onOpenCreateOrder: () => void;
  onOpenAiMockup: () => void;
  onOpen3DStudio: () => void;
}

export const HeadOfficeView: React.FC<HeadOfficeViewProps> = ({
  orders,
  shortageTickets,
  currentRole,
  onUpdateOrder,
  onSelectOrder,
  onOpenCreateOrder,
  onOpenAiMockup,
  onOpen3DStudio,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'marketing_crm' | 'owner_approvals' | 'design_1' | 'design_2'>('marketing_crm');
  const [searchTerm, setSearchTerm] = useState('');
  const [driveLinkInputs, setDriveLinkInputs] = useState<Record<string, string>>({});
  const [mockupNotesInputs, setMockupNotesInputs] = useState<Record<string, string>>({});

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
  const clientMap = new Map<string, { clientName: string; teamOrClub: string; phone: string; totalOrders: number; totalSpend: number; lastOrder: string }>();
  orders.forEach((o) => {
    const key = o.clientName.toLowerCase().trim();
    const existing = clientMap.get(key) || {
      clientName: o.clientName,
      teamOrClub: o.teamOrClub || 'Independent',
      phone: o.clientPhone || '+880 1700-000000',
      totalOrders: 0,
      totalSpend: 0,
      lastOrder: o.orderNumber,
    };
    existing.totalOrders += 1;
    existing.totalSpend += o.totalAmount;
    existing.lastOrder = o.orderNumber;
    clientMap.set(key, existing);
  });
  const clientList = Array.from(clientMap.values());

  const handleVerifyPayment = async (order: Order) => {
    await onUpdateOrder(order.id, {
      paymentStatus: 'verified',
      stage: 'payment_verified',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApproveMockup = async (order: Order) => {
    await onUpdateOrder(order.id, {
      stage: 'mockup_approved',
      mockupNotes: mockupNotesInputs[order.id] || order.mockupNotes || 'Client approved mockup via WhatsApp sign-off.',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSavePrintFiles = async (order: Order) => {
    const link = driveLinkInputs[order.id] || order.printReadyLink;
    if (!link) {
      alert('Please enter a valid Google Drive or WeTransfer download link for print-ready files.');
      return;
    }
    await onUpdateOrder(order.id, {
      printReadyLink: link,
      stage: 'pattern_spec_ready',
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Head Office Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white shadow-lg shadow-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                Head Office Operations Hub (Banani HQ)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                Marketing CRM &bull; Design Teams &bull; Owner Approvals
              </span>
            </div>
            <p className="text-xs text-blue-100 max-w-2xl">
              Command center for customer lead intake, invoice generation, owner payment clearances, 2D/3D concept mockups, pattern sizing specs, and print-ready cloud file releases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition"
          >
            <span>+ Create Job Card</span>
          </button>
        </div>
      </div>

      {/* Urgent Shortage Notice for Design Team 2 if any open tickets */}
      {urgentShortages.length > 0 && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center justify-between text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="font-bold">
              Action Required for Design Team 2: {urgentShortages.length} urgent shortage ticket(s) raised by Sewing Factory!
            </span>
          </div>
          <span className="text-[11px] underline font-bold cursor-pointer" onClick={() => setActiveSubTab('design_2')}>
            Jump to Pattern & Print Re-nesting &rarr;
          </span>
        </div>
      )}

      {/* Sub-Department Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('marketing_crm')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            activeSubTab === 'marketing_crm'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Marketing CRM & Invoices</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">{clientList.length} Clients</span>
        </button>

        <button
          onClick={() => setActiveSubTab('owner_approvals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            activeSubTab === 'owner_approvals'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            activeSubTab === 'design_1'
              ? 'bg-pink-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
            activeSubTab === 'design_2'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Customer Database & Lead Management
              </h3>
              <p className="text-gray-500 text-[11px]">
                Track team roster sizes, repeat club orders, advance deposits, and dispatch invoices.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search client, club, or phone..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
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
              .map((client, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-sm">{client.clientName}</h4>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">{client.teamOrClub}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                        {client.totalOrders} Order(s)
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 space-y-1 pt-1">
                      <div>📞 {client.phone}</div>
                      <div>🏷️ Recent Order: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{client.lastOrder}</span></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Total Volume</span>
                      <span className="font-black text-gray-900 dark:text-white text-xs">${client.totalSpend.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={onOpenCreateOrder}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 font-bold text-[11px] text-gray-700 dark:text-gray-300"
                    >
                      + Re-Order
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 2: Owner Payment Approvals */}
      {activeSubTab === 'owner_approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Owner Payment Verification Desk
              </h3>
              <p className="text-gray-500 text-[11px]">
                Orders cannot proceed to Design Team 1 until the Owner / Super Admin verifies client payment proof.
              </p>
            </div>
            <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-bold">
              {pendingPaymentOrders.length} Awaiting Verification
            </span>
          </div>

          {pendingPaymentOrders.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">All customer payments verified!</p>
              <p className="text-gray-400 text-xs">No pending invoices awaiting clearance.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPaymentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                        {ord.orderNumber}
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">
                        {ord.teamOrClub} &bull; {ord.clientName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Payment Pending
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 text-[11px] text-gray-500">
                      <span>Total: <strong className="text-gray-900 dark:text-white">${ord.totalAmount}</strong></span>
                      <span>Advance Received: <strong className="text-emerald-600">${ord.advanceAmount}</strong></span>
                      <span>Due: <strong className="text-amber-600">${ord.dueAmount}</strong></span>
                      <span>Ref: <strong className="font-mono text-gray-700 dark:text-gray-300">{ord.paymentReference || 'Bank Transfer #TX-9821'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold"
                    >
                      View Invoice
                    </button>
                    {(currentRole === 'owner' || currentRole === 'marketing') && (
                      <button
                        onClick={() => handleVerifyPayment(ord)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Unlock for Design</span>
                      </button>
                    )}
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
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Design Team 1 Workbench (Concept Mockups)
              </h3>
              <p className="text-gray-500 text-[11px]">
                Create visual jersey mockups using AI Mockup Studio or Three.js 3D Studio, then log client approvals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAiMockup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Mockup Studio</span>
              </button>
              <button
                onClick={onOpen3DStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Sportswear Studio</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders
              .filter((o) => ['payment_verified', 'design_in_progress', 'mockup_approved'].includes(o.stage))
              .map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                          {ord.orderNumber}
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {ord.teamOrClub}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[11px]">
                        {ord.totalQuantity} pcs &bull; {ord.fabricType} ({ord.gsm} GSM)
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.stage === 'mockup_approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                      }`}
                    >
                      {ord.stage === 'mockup_approved' ? 'Mockup Approved' : 'Awaiting Concept Art'}
                    </span>
                  </div>

                  {/* Mockup Preview or Placeholder */}
                  <div className="relative aspect-video rounded-lg bg-gray-100 dark:bg-gray-900 overflow-hidden border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                    {ord.mockupUrl ? (
                      <img src={ord.mockupUrl} alt="Mockup" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 p-4">
                        <Palette className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span>No mockup attached yet</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Notes Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Client Design Notes / Approvals:</label>
                    <input
                      type="text"
                      placeholder="e.g. Navy blue with gold sash, client confirmed on WhatsApp"
                      defaultValue={ord.mockupNotes || ''}
                      onChange={(e) =>
                        setMockupNotesInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectOrder(ord)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Open Full Job Card &rarr;
                    </button>

                    {ord.stage !== 'mockup_approved' && (
                      <button
                        onClick={() => handleApproveMockup(ord)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold transition shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Client Approved Mockup</span>
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
            <h3 className="font-black text-sm text-gray-900 dark:text-white">
              Design Team 2 Workbench (Production Pre-Press & Nesting)
            </h3>
            <p className="text-gray-500 text-[11px]">
              Nest player sizes into 1.6m wide sublimation print layouts, generate pattern spec sheets, and upload heavy cloud print files for the Tongi Print Factory.
            </p>
          </div>

          <div className="space-y-3">
            {orders
              .filter((o) => ['mockup_approved', 'pattern_spec_ready'].includes(o.stage))
              .map((ord) => {
                const consumption = calculateFabricConsumption(ord.sizeBreakdown || {}, ord.fabricType);
                return (
                  <div
                    key={ord.id}
                    className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                          {ord.orderNumber}
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {ord.teamOrClub} &bull; {ord.totalQuantity} Sets
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {ord.stage === 'pattern_spec_ready' ? 'Ready for Print' : 'Awaiting Pattern Layout'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-gray-500">
                        Est. Fabric: <strong>{consumption.fabricMeters}m</strong> &bull; Paper: <strong>{consumption.transferPaperMeters}m</strong> &bull; Ink: <strong>{(consumption.inkEstimatedMl / 1000).toFixed(2)}L</strong>
                      </div>
                    </div>

                    {/* Sizing Breakdown Chips */}
                    <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-[11px]">
                      <span className="font-bold text-gray-400 mr-1 self-center">Sizes:</span>
                      {Object.entries(ord.sizeBreakdown || {}).map(
                        ([sz, qty]) =>
                          qty > 0 && (
                            <span
                              key={sz}
                              className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono font-bold"
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
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono"
                        />
                      </div>

                      <button
                        onClick={() => handleSavePrintFiles(ord)}
                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Send to Print Factory Queue</span>
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
