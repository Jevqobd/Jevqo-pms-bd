/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Invoice,
  Estimate,
  Vendor,
  LedgerEntry,
  PaymentRecord,
  Expense,
  Order,
  UserRole,
} from '../types/erp';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Building2,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  Filter,
  Check,
  Eye,
  X,
  Layers,
} from 'lucide-react';

interface AccountingModuleProps {
  invoices: Invoice[];
  estimates: Estimate[];
  vendors: Vendor[];
  ledgerEntries: LedgerEntry[];
  payments: PaymentRecord[];
  expenses: Expense[];
  orders: Order[];
  currentRole: UserRole;
  onRecordPayment: (payment: PaymentRecord) => Promise<void>;
  onAddExpense: (expense: Expense) => Promise<void>;
  onCreateEstimate: (estimate: Estimate) => Promise<void>;
  onConvertEstimate: (estimate: Estimate) => Promise<void>;
  onUpdateInvoice: (id: string, partial: Partial<Invoice>) => Promise<void>;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  invoices,
  estimates,
  vendors,
  ledgerEntries,
  payments,
  expenses,
  orders,
  currentRole,
  onRecordPayment,
  onAddExpense,
  onCreateEstimate,
  onConvertEstimate,
  onUpdateInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<
    'invoices' | 'estimates' | 'ledger' | 'payments' | 'expenses' | 'pnl'
  >('invoices');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isNewEstimateOpen, setIsNewEstimateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // New Payment Form State
  const [payPartyType, setPayPartyType] = useState<'client' | 'vendor'>('client');
  const [payPartyName, setPayPartyName] = useState('');
  const [payAmount, setPayAmount] = useState<number>(200);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'bkash_nagad' | 'cash' | 'cheque'>('bkash_nagad');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // New Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Utilities');
  const [expLocation, setExpLocation] = useState<'head_office' | 'print_factory' | 'sewing_factory'>('print_factory');
  const [expAmount, setExpAmount] = useState<number>(100);

  // Totals
  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaidInvoices = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDueInvoices = invoices.reduce((s, i) => s + i.dueAmount, 0);
  const totalVendorPayables = vendors.reduce((s, v) => s + v.balanceDue, 0);
  const totalExpenseAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalInvoiced - totalExpenseAmount - (totalVendorPayables * 0.4);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPartyName.trim() || payAmount <= 0) return;

    await onRecordPayment({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: payPartyType === 'client' ? 'received_from_client' : 'paid_to_vendor',
      partyType: payPartyType,
      partyId: `party-${Date.now()}`,
      partyName: payPartyName,
      amount: Number(payAmount),
      method: payMethod,
      transactionRef: payRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceOrBillRef: 'MANUAL-ENTRY',
      notes: payNotes,
      verifiedBy: 'Accounts Lead',
    });

    setIsRecordPaymentOpen(false);
    setPayPartyName('');
    setPayRef('');
    setPayNotes('');
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;

    await onAddExpense({
      id: `exp-${Date.now()}`,
      title: expTitle,
      category: expCategory,
      location: expLocation,
      amount: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Accounts Manager',
    });

    setIsAddExpenseOpen(false);
    setExpTitle('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                Enterprise Accounting & Financial Management
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                Invoices &bull; Ledgers &bull; Vendor Bills &bull; Cash Flow
              </span>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl">
              Complete financial control for custom sportswear operations: automated B2B/B2C tax invoicing, client receivables, vendor payables, transaction ledgers, and P&L audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Record Payment</span>
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Invoiced</span>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
            ${totalInvoiced.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">From {invoices.length} active invoices</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cash Collected</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            ${totalPaidInvoices.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">
            {Math.round((totalPaidInvoices / (totalInvoiced || 1)) * 100)}% realization rate
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Accounts Receivable (Due)</span>
          <div className="text-xl font-black text-amber-600 mt-1">
            ${totalDueInvoices.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">To collect prior to dispatch</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Vendor Payables</span>
          <div className="text-xl font-black text-red-500 mt-1">
            ${totalVendorPayables.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">Fabrics, Inks, Paper mills</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Operating Expenses</span>
          <div className="text-xl font-black text-purple-600 mt-1">
            ${totalExpenseAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-purple-600 font-medium">Power, van, maintenance</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('estimates')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'estimates'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Estimates & Quotes ({estimates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Client & Vendor Ledgers</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Records ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Factory Expenses ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'pnl'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>P&L Financial Audit</span>
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Customer Invoices Register</h3>
              <p className="text-gray-500 text-[11px]">Track invoice clearances, due balances, and print tax receipts.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice #, customer..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Client & Order</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Due</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {invoices
                    .filter(
                      (i) =>
                        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-900 dark:text-white block">{inv.customerName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">Job: {inv.orderNumber}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.type === 'b2b' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {inv.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-gray-900 dark:text-white">${inv.totalAmount}</td>
                        <td className="p-3 font-bold text-emerald-600">${inv.paidAmount}</td>
                        <td className="p-3 font-bold text-amber-600">${inv.dueAmount}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {inv.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 font-mono text-[11px]">{inv.dueDate}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 font-bold text-[11px] text-gray-700 dark:text-gray-300"
                          >
                            View & Print
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTIMATES & QUOTES */}
      {activeTab === 'estimates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Quotations & Price Estimates</h3>
              <p className="text-gray-500 text-[11px]">Convert agreed quotations into active factory Job Cards with 1-click.</p>
            </div>
            <button
              onClick={() => setIsNewEstimateOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              + Create New Estimate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estimates.map((est) => (
              <div
                key={est.id}
                className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-600">{est.estimateNumber}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{est.customerName}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Valid until: {est.validUntil}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    est.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : est.status === 'converted'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {est.status.toUpperCase()}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800 text-[11px]">
                  {est.items.map((it) => (
                    <div key={it.id} className="py-1.5 flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        {it.description} &times; <strong>{it.quantity}</strong>
                      </span>
                      <span className="font-mono font-bold">${it.total}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Total Quotation</span>
                    <span className="font-black text-gray-900 dark:text-white text-sm">${est.totalAmount}</span>
                  </div>

                  {est.status !== 'converted' ? (
                    <button
                      onClick={() => onConvertEstimate(est)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Convert to Job Card</span>
                    </button>
                  ) : (
                    <span className="text-xs text-purple-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active Job Card Created
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLIENT & VENDOR LEDGERS */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Double-Entry Account Ledgers</h3>
              <p className="text-gray-500 text-[11px]">Complete statement of account: Debits (Invoices/Bills) & Credits (Payments).</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
              >
                <option value="all">All Accounts (Consolidated)</option>
                <option value="client">All Clients Only</option>
                <option value="vendor">All Vendors Only</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Account Entity</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Ref #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Debit (Billed)</th>
                    <th className="p-3">Credit (Paid)</th>
                    <th className="p-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-mono">
                  {ledgerEntries
                    .filter((l) => selectedEntityId === 'all' || l.entityType === selectedEntityId)
                    .map((led) => (
                      <tr key={led.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="p-3 text-gray-500">{led.date}</td>
                        <td className="p-3 font-sans font-bold text-gray-900 dark:text-white">{led.entityName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                            led.entityType === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {led.entityType.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-indigo-600">{led.referenceId}</td>
                        <td className="p-3 font-sans text-gray-600 dark:text-gray-300">{led.description}</td>
                        <td className="p-3 font-bold text-red-600">{led.debit > 0 ? `$${led.debit}` : '-'}</td>
                        <td className="p-3 font-bold text-emerald-600">{led.credit > 0 ? `$${led.credit}` : '-'}</td>
                        <td className="p-3 text-right font-black text-gray-900 dark:text-white">${led.runningBalance}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT RECORDS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Transaction & Payment Register</h3>
              <p className="text-gray-500 text-[11px]">Real-time log of cash, wire, cheque, and mobile wallet inflows & outflows.</p>
            </div>
            <button
              onClick={() => setIsRecordPaymentOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              + Log New Payment
            </button>
          </div>

          <div className="bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3">Party Name</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Transaction Ref</th>
                    <th className="p-3">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <td className="p-3 font-mono text-gray-500 text-[11px]">{p.date}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.type === 'received_from_client' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.type === 'received_from_client' ? 'INFLOW (CLIENT)' : 'OUTFLOW (VENDOR)'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-900 dark:text-white">{p.partyName}</td>
                      <td className="p-3 font-black text-sm text-gray-900 dark:text-white">${p.amount}</td>
                      <td className="p-3 font-bold uppercase text-[10px] text-gray-500">{p.method.replace('_', ' ')}</td>
                      <td className="p-3 font-mono text-indigo-600">{p.transactionRef}</td>
                      <td className="p-3 text-gray-500 text-[11px]">{p.verifiedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Factory & Operations Expenses</h3>
              <p className="text-gray-500 text-[11px]">Utilities, maintenance, inter-factory shuttle van logistics, and supplies.</p>
            </div>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
            >
              + Record Expense
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {exp.category}
                    </span>
                    <span className="font-mono text-gray-400 text-[10px]">{exp.date}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs pt-1">{exp.title}</h4>
                  {exp.notes && <p className="text-[11px] text-gray-500">{exp.notes}</p>}
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{exp.location.replace('_', ' ')}</span>
                  <span className="text-base font-black text-purple-600">${exp.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PNL STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white">
                Executive Profit & Loss Statement (P&L)
              </h3>
              <p className="text-gray-500 text-xs">Multi-Factory consolidated financial performance & margin analysis.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
              Net Margin: {Math.round((netProfit / (totalInvoiced || 1)) * 100)}%
            </span>
          </div>

          <div className="space-y-3 font-sans">
            <div className="flex justify-between py-2 border-b font-bold text-sm">
              <span className="text-gray-900 dark:text-white">Gross Revenue (Invoiced Sales)</span>
              <span className="text-emerald-600 font-black font-mono">${totalInvoiced.toLocaleString()}</span>
            </div>

            <div className="pl-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>&bull; Direct Sublimation Fabrics (Micro-Eyelet, Poly Interlock)</span>
                <span className="font-mono">-${(totalInvoiced * 0.28).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Sublimation Inks & 90 GSM Transfer Paper</span>
                <span className="font-mono">-${(totalInvoiced * 0.09).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Sewing Accessories (Threads, Neck Ribbing, Labels)</span>
                <span className="font-mono">-${(totalInvoiced * 0.05).toFixed(0)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 border-b font-bold text-xs bg-gray-50 dark:bg-gray-800 px-3 rounded-lg">
              <span>Gross Production Margin</span>
              <span className="font-mono">${(totalInvoiced * 0.58).toFixed(0)}</span>
            </div>

            <div className="pl-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-400 pt-2">
              <div className="flex justify-between">
                <span>&bull; Factory Electric Power (Calender 202°C Run)</span>
                <span className="font-mono">-${expenses.filter(e => e.category === 'Utilities').reduce((s,e) => s + e.amount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Shuttle Logistics & Fuel (Tongi - Mirpur - Banani)</span>
                <span className="font-mono">-${expenses.filter(e => e.category === 'Logistics').reduce((s,e) => s + e.amount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Machine Repairs & Line Maintenance</span>
                <span className="font-mono">-${expenses.filter(e => e.category === 'Maintenance').reduce((s,e) => s + e.amount, 0)}</span>
              </div>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-gray-900 dark:border-white font-black text-base pt-4">
              <span className="text-gray-900 dark:text-white">Estimated Operating Net Profit</span>
              <span className="text-emerald-600 font-mono">${netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Record Transaction Payment</h3>
              <button onClick={() => setIsRecordPaymentOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Payment Direction</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPayPartyType('client')}
                    className={`py-1.5 rounded-lg font-bold text-xs ${payPartyType === 'client' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    Client Payment (Inflow)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayPartyType('vendor')}
                    className={`py-1.5 rounded-lg font-bold text-xs ${payPartyType === 'vendor' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    Vendor Bill (Outflow)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Party Name</label>
                <input
                  type="text"
                  required
                  placeholder={payPartyType === 'client' ? 'e.g. Rahim Sports Academy' : 'e.g. Bengal Synthetic Mills'}
                  value={payPartyName}
                  onChange={(e) => setPayPartyName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e: any) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  >
                    <option value="bkash_nagad">bKash / Nagad</option>
                    <option value="bank_transfer">Bank Wire</option>
                    <option value="cash">Cash Counter</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Transaction / Cheque Ref</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-BKASH-88192 or CHQ #4091"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition mt-2"
              >
                Confirm & Record in Ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-gray-900 dark:text-white">Record Operating Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rotary Press Heating Element Replacement"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  >
                    <option value="Utilities">Electricity & Gas</option>
                    <option value="Logistics">Van Fuel & Tolls</option>
                    <option value="Maintenance">Machine Repairs</option>
                    <option value="Packaging">Bags & Labels</option>
                    <option value="Office">Office & Refreshment</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Factory Location</label>
                  <select
                    value={expLocation}
                    onChange={(e: any) => setExpLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  >
                    <option value="head_office">Head Office (Banani)</option>
                    <option value="print_factory">Print Factory (Tongi)</option>
                    <option value="sewing_factory">Sewing Factory (Mirpur)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition mt-2"
              >
                Save Factory Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable Tax Invoice */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white text-gray-900 rounded-2xl p-8 w-full max-w-2xl border border-gray-300 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">
                    Sportswear Cloud Enterprises Ltd.
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Plot 14, Sector 4, Banani HQ &bull; Tongi Sublimation Mill &bull; Mirpur Sewing Hub
                </p>
                <p className="text-[11px] text-gray-400">VAT Reg: BD-99120-SPORT &bull; accounts@sportswear.erp</p>
              </div>

              <div className="text-right">
                <span className="font-mono text-base font-black text-indigo-600 block">{viewInvoice.invoiceNumber}</span>
                <span className="text-xs text-gray-500">Date: {viewInvoice.createdAt.substring(0, 10)}</span>
                <span className="block text-xs font-bold text-gray-600">Due: {viewInvoice.dueDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Billed To Customer:</span>
                <strong className="text-sm text-gray-900 block">{viewInvoice.customerName}</strong>
                <span className="text-gray-600">Job Reference: {viewInvoice.orderNumber}</span>
                <span className="block text-[11px] text-blue-600 font-bold uppercase mt-0.5">{viewInvoice.type} Account</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Payment Status:</span>
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {viewInvoice.status.replace('_', ' ')}
                </span>
                <p className="text-[11px] text-gray-500 mt-1">{viewInvoice.paymentTerms}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 text-[11px]">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3">
                      <strong>Custom Sublimated Team Kits & Jerseys</strong>
                      <p className="text-[11px] text-gray-500">High-density sublimation print, customized player numbering, moisture-wicking fabric</p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">${viewInvoice.totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5 font-mono">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-500 font-sans">Total Billed:</span>
                  <span className="font-bold">${viewInvoice.totalAmount}</span>
                </div>
                <div className="flex justify-between py-1 border-b text-emerald-600 font-bold">
                  <span className="font-sans">Advance Received:</span>
                  <span>-${viewInvoice.paidAmount}</span>
                </div>
                <div className="flex justify-between py-1 text-sm font-black border-t-2 border-gray-900 text-amber-600">
                  <span className="font-sans">Balance Due:</span>
                  <span>${viewInvoice.dueAmount}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Authorized by Accounts & Finance Dept.</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition"
                >
                  Print / Download PDF
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
