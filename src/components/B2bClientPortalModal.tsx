/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Order, Invoice, Estimate, LedgerEntry, UserRole } from '../types/erp';
import { Language } from '../utils/translations';
import {
  X,
  Building2,
  Printer,
  FileText,
  DollarSign,
  Download,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Shirt,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  ClipboardPaste,
  Upload,
} from 'lucide-react';

interface B2bClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: Order[];
  invoices: Invoice[];
  estimates: Estimate[];
  ledgerEntries: LedgerEntry[];
  currentRole: UserRole;
  language?: Language;
  onSendMessageToMarketing?: (customerId: string, message: string) => void;
}

export const B2bClientPortalModal: React.FC<B2bClientPortalModalProps> = ({
  isOpen,
  onClose,
  customers,
  orders,
  invoices,
  estimates,
  ledgerEntries,
  currentRole,
  language = 'en',
  onSendMessageToMarketing,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'orders' | 'estimates' | 'ledger' | 'chat'>('orders');
  const [printableEstimate, setPrintableEstimate] = useState<Estimate | null>(null);
  const [printableLedger, setPrintableLedger] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');
  const [stagedChatImage, setStagedChatImage] = useState<string | null>(null);
  const [clientMessages, setClientMessages] = useState<
    { id: string; sender: 'client' | 'marketing'; text: string; time: string; imageUrl?: string }[]
  >([
    {
      id: 'm1',
      sender: 'marketing',
      text: 'Hello! I am Tanvir Ahmed from Sportswear OS Marketing. How can we assist with your team kit today?',
      time: '10:15 AM',
    },
    {
      id: 'm2',
      sender: 'client',
      text: 'Hi Tanvir, please check our updated jersey collar request and let us know once cutting starts.',
      time: '10:22 AM',
    },
    {
      id: 'm3',
      sender: 'marketing',
      text: 'Noted! Your order SW-2026-0891 has arrived at Mirpur Sewing Line. Cutting started today.',
      time: '11:05 AM',
    },
  ]);

  if (!isOpen) return null;

  const activeCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const clientOrders = orders.filter(
    (o) =>
      o.clientName.toLowerCase() === activeCustomer?.name.toLowerCase() ||
      o.clientEmail?.toLowerCase() === activeCustomer?.email.toLowerCase()
  );

  const clientInvoices = invoices.filter(
    (i) => i.customerId === activeCustomer?.id || i.customerName === activeCustomer?.name
  );

  const clientEstimates = estimates.filter(
    (e) => e.customerId === activeCustomer?.id || e.customerName === activeCustomer?.name
  );

  const clientLedger = ledgerEntries.filter(
    (l) => l.entityId === activeCustomer?.id || l.entityName === activeCustomer?.name
  );

  const handleClientChatPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') setStagedChatImage(reader.result);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  const handleSendClientChat = () => {
    if (!chatInput.trim() && !stagedChatImage) return;
    const newMsg = {
      id: `cmsg-${Date.now()}`,
      sender: 'client' as const,
      text: chatInput || '📷 Sent design screenshot',
      imageUrl: stagedChatImage || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setClientMessages((prev) => [...prev, newMsg]);
    onSendMessageToMarketing?.(
      activeCustomer?.id || 'cust-1',
      chatInput || '📷 Client pasted screenshot in portal chat'
    );
    setChatInput('');
    setStagedChatImage(null);

    // Marketing simulated auto-reply
    setTimeout(() => {
      setClientMessages((prev) => [
        ...prev,
        {
          id: `cmsg-rep-${Date.now()}`,
          sender: 'marketing',
          text: 'Thanks for reaching out! Your designated account manager will follow up with you directly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-950/50">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  {'B2B Client Enterprise Portal'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Client View
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {'Client dashboard to track order stage, view invoices, print estimate/ledger, and chat with Marketing.'}
              </p>
            </div>
          </div>

          {/* Client Selector (for demo/manager inspection) */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.companyOrClub || 'B2B'})
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="btn-press p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Client Sub-Navigation Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-bold overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('orders')}
              className={`btn-press px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>{'My Orders'} ({clientOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('estimates')}
              className={`btn-press px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'estimates' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{'Estimates & Quotes'} ({clientEstimates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`btn-press px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{'Client Ledger'}</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`btn-press px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{'Chat with Marketing'}</span>
            </button>
          </div>

          <div className="text-right text-[11px] font-mono shrink-0 hidden sm:block">
            <span className="text-slate-400 font-sans">Outstanding Balance: </span>
            <span className="text-amber-400 font-black">
              ৳{(activeCustomer?.outstandingBalance || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {clientOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No orders registered for {activeCustomer?.name} yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-black text-emerald-400">
                          {ord.orderNumber}
                        </span>
                        <h4 className="font-black text-sm text-white mt-0.5">
                          {ord.teamOrClub || ord.clientName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {ord.sportType} • {ord.totalQuantity} pcs
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700 uppercase">
                        {ord.stage.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Collar Style:</span>
                        <span className="text-teal-300">{ord.collarType || 'Round Neck'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Fabric Spec:</span>
                        <span className="text-slate-200">{ord.fabricType}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-800 text-white">
                        <span className="font-sans">Total Billed:</span>
                        <span>৳{ord.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {ord.mockupUrl && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">Approved Mockup Artwork Ready</span>
                        <a
                          href={ord.mockupUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Mockup</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Estimates & Print Quotation */}
        {activeTab === 'estimates' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-white">Quotations & Pricing Estimates</h4>
              <span className="text-xs text-slate-400">Click any estimate to Print / Save PDF</span>
            </div>

            <div className="space-y-3">
              {clientEstimates.map((est) => (
                <div
                  key={est.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 shadow-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-400">
                        {est.estimateNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {est.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white font-bold">{est.customerName}</p>
                    <span className="text-[11px] text-slate-400">Valid until: {est.validUntil}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-emerald-400 block">
                        ৳{est.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">Inc. VAT & Discount</span>
                    </div>

                    <button
                      onClick={() => setPrintableEstimate(est)}
                      className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Print Estimate PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Printable Client Ledger Statement */}
        {activeTab === 'ledger' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-white">
                  Client Statement of Account: {activeCustomer?.name}
                </h4>
                <p className="text-xs text-slate-400">
                  Comprehensive debit/credit transaction history and running balance
                </p>
              </div>

              <button
                onClick={() => setPrintableLedger(true)}
                className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Ledger</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3 text-right">Debit (৳)</th>
                    <th className="p-3 text-right">Credit (৳)</th>
                    <th className="p-3 text-right">Balance (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px] font-mono">
                  {clientLedger.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50">
                      <td className="p-3 text-slate-300">{item.date}</td>
                      <td className="p-3 text-white font-sans font-semibold">{item.description}</td>
                      <td className="p-3 text-indigo-400">{item.referenceId}</td>
                      <td className="p-3 text-right text-rose-400">
                        {item.debit > 0 ? `৳${item.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right text-emerald-400">
                        {item.credit > 0 ? `৳${item.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-white">
                        ৳{item.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Live Client Chat with Marketing */}
        {activeTab === 'chat' && (
          <div className="p-5 flex flex-col flex-1 h-[450px]">
            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between text-xs mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Assigned Representative: Tanvir Ahmed</span>
                <span className="text-[10px] text-slate-400">(Marketing & Key Accounts Lead)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">Direct Chat Active</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80">
              {clientMessages.map((m) => {
                const isMe = m.sender === 'client';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      <span className="text-[10px] font-bold block mb-1 opacity-70">
                        {isMe ? 'You (Client Representative)' : 'Tanvir (Marketing)'}
                      </span>
                      <p>{m.text}</p>
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt="Chat attachment"
                          className="mt-2 max-h-40 rounded-lg border border-white/20 object-contain"
                        />
                      )}
                      <span className="text-[9px] block text-right mt-1 opacity-60 font-mono">
                        {m.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {stagedChatImage && (
              <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={stagedChatImage}
                    alt="Staged screenshot"
                    className="w-10 h-10 rounded object-cover border border-emerald-500/40"
                  />
                  <span className="text-emerald-300 font-bold">
                    Screenshot attached (Ready to send)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStagedChatImage(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Chat Input with Upload & Paste Screenshot */}
            <div className="mt-3 flex gap-2 items-center">
              <label
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer"
                title="Upload image"
              >
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') setStagedChatImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.clipboard?.read) {
                      const items = await navigator.clipboard.read();
                      for (const item of items) {
                        const imgType = item.types.find((t) => t.startsWith('image/'));
                        if (imgType) {
                          const blob = await item.getType(imgType);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string')
                              setStagedChatImage(reader.result);
                          };
                          reader.readAsDataURL(blob);
                          return;
                        }
                      }
                    }
                  } catch {
                    // Fallback to Ctrl+V
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Paste Screenshot (or press Ctrl+V)"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPaste={handleClientChatPaste}
                onKeyDown={(e) => e.key === 'Enter' && handleSendClientChat()}
                placeholder="Ask marketing or press Ctrl+V to paste screenshot..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSendClientChat}
                className="btn-press px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* PRINTABLE ESTIMATE MODAL */}
        {printableEstimate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white text-gray-900 rounded-3xl p-8 w-full max-w-2xl border border-gray-300 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    SPORTSWEAR OS BANGLADESH
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">Official B2B Price Quotation & Estimate</p>
                  <p className="text-[11px] text-gray-500">Banani HQ &bull; Tongi Sublimation Mill &bull; Mirpur Hub</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-black text-indigo-600 block">
                    {printableEstimate.estimateNumber}
                  </span>
                  <span className="text-xs text-gray-500">Valid Until: {printableEstimate.validUntil}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Prepared For:</span>
                  <strong className="text-sm block">{printableEstimate.customerName}</strong>
                  <span className="text-gray-600">Account Type: B2B Organization</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Status:</span>
                  <span className="font-bold text-emerald-700 uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {printableEstimate.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold text-[11px]">
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {printableEstimate.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-3 font-sans font-semibold">{it.description}</td>
                        <td className="p-3 text-center">{it.quantity}</td>
                        <td className="p-3 text-right">৳{it.unitPrice}</td>
                        <td className="p-3 text-right font-bold">৳{it.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-end text-xs font-mono">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-gray-500 font-sans">Subtotal:</span>
                    <span>৳{printableEstimate.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-rose-600">
                    <span className="font-sans">Discount:</span>
                    <span>-৳{printableEstimate.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-indigo-600">
                    <span className="font-sans">Tax / VAT (7.5%):</span>
                    <span>+৳{printableEstimate.taxVat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm font-black border-t-2 border-gray-900 text-gray-900">
                    <span className="font-sans">Grand Total:</span>
                    <span className="text-emerald-700">৳{printableEstimate.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Authorized by Marketing Lead: Tanvir Ahmed</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="btn-press px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800"
                  >
                    Print / Download PDF
                  </button>
                  <button
                    onClick={() => setPrintableEstimate(null)}
                    className="btn-press px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINTABLE INDIVIDUAL CLIENT LEDGER MODAL */}
        {printableLedger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white text-gray-900 rounded-3xl p-8 w-full max-w-3xl border border-gray-300 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    SPORTSWEAR OS BANGLADESH
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">B2B Individual Client Statement of Account</p>
                  <p className="text-[11px] text-gray-500">Accounts & Ledger Department &bull; Plot 14, Banani HQ</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Date Generated: {new Date().toLocaleDateString()}</span>
                  <span className="block text-sm font-bold text-indigo-600">Client ID: {activeCustomer?.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Account Holder:</span>
                  <strong className="text-base text-gray-900 block">{activeCustomer?.name}</strong>
                  <span className="text-gray-600">{activeCustomer?.companyOrClub} &bull; {activeCustomer?.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Net Balance Due:</span>
                  <span className="text-lg font-black text-rose-700 font-mono">
                    ৳{(activeCustomer?.outstandingBalance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Ledger Statement Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-[11px]">
                      <th className="p-3">Posting Date</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Debit (Billed)</th>
                      <th className="p-3 text-right">Credit (Paid)</th>
                      <th className="p-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {clientLedger.map((row) => (
                      <tr key={row.id}>
                        <td className="p-3 text-gray-600">{row.date}</td>
                        <td className="p-3 font-bold text-indigo-700">{row.referenceId}</td>
                        <td className="p-3 font-sans font-medium text-gray-900">{row.description}</td>
                        <td className="p-3 text-right text-rose-700">
                          {row.debit > 0 ? `৳${row.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right text-emerald-700">
                          {row.credit > 0 ? `৳${row.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-gray-900">
                          ৳{row.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Certified by Chief Financial Officer: Rafiqul Islam</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="btn-press px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800"
                  >
                    Print Statement PDF
                  </button>
                  <button
                    onClick={() => setPrintableLedger(false)}
                    className="btn-press px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
