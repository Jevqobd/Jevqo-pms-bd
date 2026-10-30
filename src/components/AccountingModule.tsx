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
  BankAccount,
  Employee,
  Customer,
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
  TrendingUp,
  Check,
  X,
  Layers,
  Lock,
  Printer,
  Upload,
  Landmark,
  Image as ImageIcon,
  Star,
  Award,
  Key,
  QrCode,
  ExternalLink,
  MessageSquare,
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
  bankAccounts?: BankAccount[];
  employees?: Employee[];
  customers?: Customer[];
  onRecordPayment: (payment: PaymentRecord) => Promise<void>;
  onAddExpense: (expense: Expense) => Promise<void>;
  onCreateEstimate: (estimate: Estimate) => Promise<void>;
  onConvertEstimate: (estimate: Estimate) => Promise<void>;
  onUpdateInvoice: (id: string, partial: Partial<Invoice>) => Promise<void>;
  onCreateBankAccount?: (acc: BankAccount) => Promise<void>;
  onOpenClientPortal?: () => void;
  onOpenPrivateInvoiceChat?: (invoiceNumber: string, targetEmployeeId?: string) => void;
  onNotifyAction?: (
    tag: 'DONE' | 'APPROVED' | 'DELEGATED' | 'VERIFIED',
    title: string,
    message: string
  ) => void;
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
  bankAccounts = [],
  employees = [],
  customers = [],
  onRecordPayment,
  onAddExpense,
  onCreateEstimate,
  onConvertEstimate,
  onUpdateInvoice,
  onCreateBankAccount,
  onOpenClientPortal,
  onOpenPrivateInvoiceChat,
  onNotifyAction,
}) => {
  const [activeTab, setActiveTab] = useState<
    'invoices' | 'estimates' | 'ledger' | 'payments' | 'expenses' | 'banks' | 'pnl'
  >('invoices');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [selectedClientNameFilter, setSelectedClientNameFilter] = useState<string>('all');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isNewEstimateOpen, setIsNewEstimateOpen] = useState(false);
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // New Payment Form State
  const [payPartyType, setPayPartyType] = useState<'client' | 'vendor'>('client');
  const [payPartyName, setPayPartyName] = useState('');
  const [payAmount, setPayAmount] = useState<number>(200);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'bkash_nagad' | 'cash' | 'cheque'>(
    'bkash_nagad'
  );
  const [payBankAccountId, setPayBankAccountId] = useState<string>('');
  const [payProofImageUrl, setPayProofImageUrl] = useState<string>('');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // New Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Utilities');
  const [expLocation, setExpLocation] = useState<
    'head_office' | 'print_factory' | 'sewing_factory'
  >('print_factory');
  const [expAmount, setExpAmount] = useState<number>(100);
  const [expBankAccountId, setExpBankAccountId] = useState<string>('');
  const [expProofImageUrl, setExpProofImageUrl] = useState<string>('');

  // New Bank Account State
  const [newBankName, setNewBankName] = useState('');
  const [newAccountTitle, setNewAccountTitle] = useState('Ridwear Sportswear Mfg. Ltd.');
  const [newAccountNum, setNewAccountNum] = useState('');
  const [newBranchName, setNewBranchName] = useState('Banani Corporate Branch');
  const [newBankType, setNewBankType] = useState<'bank' | 'mobile_banking' | 'cash'>('bank');
  const [newBankBalance, setNewBankBalance] = useState<number>(25000);

  // Totals
  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaidInvoices = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDueInvoices = invoices.reduce((s, i) => s + i.dueAmount, 0);
  const totalVendorPayables = vendors.reduce((s, v) => s + v.balanceDue, 0);
  const totalExpenseAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalInvoiced - totalExpenseAmount - (totalVendorPayables * 0.4);

  const handleProofFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPartyName.trim() || payAmount <= 0) return;

    const linkedBank = bankAccounts.find((b) => b.id === payBankAccountId);

    await onRecordPayment({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: payPartyType === 'client' ? 'received_from_client' : 'paid_to_vendor',
      partyType: payPartyType,
      partyId: `party-${Date.now()}`,
      partyName: payPartyName,
      amount: Number(payAmount),
      method: payMethod,
      bankAccountId: linkedBank?.id,
      bankAccountName: linkedBank?.bankName,
      proofImageUrl: payProofImageUrl || undefined,
      transactionRef: payRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceOrBillRef: 'MANUAL-ENTRY',
      notes: payNotes,
      verifiedBy: 'Accounts Lead',
    });

    setIsRecordPaymentOpen(false);
    setPayPartyName('');
    setPayRef('');
    setPayNotes('');
    setPayProofImageUrl('');
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;

    const linkedBank = bankAccounts.find((b) => b.id === expBankAccountId);

    await onAddExpense({
      id: `exp-${Date.now()}`,
      title: expTitle,
      category: expCategory,
      location: expLocation,
      amount: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Accounts Manager',
      bankAccountId: linkedBank?.id,
      bankAccountName: linkedBank?.bankName,
      proofImageUrl: expProofImageUrl || undefined,
    });

    setIsAddExpenseOpen(false);
    setExpTitle('');
    setExpProofImageUrl('');
  };

  const handleCreateBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !onCreateBankAccount) return;
    await onCreateBankAccount({
      id: `bnk-${Date.now()}`,
      bankName: newBankName,
      accountName: newAccountTitle,
      accountNumber: newAccountNum || '140299384100',
      branch: newBranchName,
      accountType: newBankType,
      balance: Number(newBankBalance) || 0,
      status: 'active',
      isDefault: false,
    });
    setIsAddBankOpen(false);
    setNewBankName('');
    setNewAccountNum('');
  };

  // Permission flag: Owner and Accountant have full access; Marketing can access Invoices/Estimates and Record Client Payments
  const isSensitiveAllowed = currentRole === 'owner' || currentRole === 'accountant';

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
            onClick={() => {
              setPayPartyType('client');
              setIsRecordPaymentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{currentRole === 'marketing' ? '+ Record Client Payment' : '+ Record Payment'}</span>
          </button>
          {isSensitiveAllowed && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>+ Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Invoiced</span>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
            ৳{totalInvoiced.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">From {invoices.length} active invoices</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cash Collected</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            ৳{totalPaidInvoices.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">
            {Math.round((totalPaidInvoices / (totalInvoiced || 1)) * 100)}% realization rate
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Accounts Receivable (Due)</span>
          <div className="text-xl font-black text-amber-600 mt-1">
            ৳{totalDueInvoices.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">To collect prior to dispatch</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Vendor Payables</span>
          <div className="text-xl font-black text-red-500 mt-1">
            ৳{totalVendorPayables.toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-500">Fabrics, Inks, Paper mills</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Operating Expenses</span>
          <div className="text-xl font-black text-purple-600 mt-1">
            ৳{totalExpenseAmount.toLocaleString()}
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
          {!isSensitiveAllowed && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
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
          {!isSensitiveAllowed && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'banks'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Bank Accounts ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
            activeTab === 'pnl'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>P&L Financial Audit</span>
          {!isSensitiveAllowed && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
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
                        <td className="p-3 font-bold text-gray-900 dark:text-white">৳{inv.totalAmount}</td>
                        <td className="p-3 font-bold text-emerald-600">৳{inv.paidAmount}</td>
                        <td className="p-3 font-bold text-amber-600">৳{inv.dueAmount}</td>
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
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== 'paid' && (
                              <button
                                onClick={async () => {
                                  await onUpdateInvoice(inv.id, {
                                    status: 'paid',
                                    paidAmount: inv.totalAmount,
                                    dueAmount: 0,
                                  });
                                  onNotifyAction?.(
                                    'APPROVED',
                                    `Invoice Cleared & Approved: ${inv.invoiceNumber}`,
                                    `Full settlement of ৳${inv.totalAmount.toLocaleString()} BDT approved for ${inv.customerName}.`
                                  );
                                }}
                                data-testid={`approve-invoice-btn-${inv.invoiceNumber}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                                title="Approve & Mark Invoice Paid"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}
                            {onOpenPrivateInvoiceChat && (
                              <button
                                onClick={() =>
                                  onOpenPrivateInvoiceChat(
                                    inv.invoiceNumber,
                                    inv.assignedEmployeeId
                                  )
                                }
                                data-testid={`private-chat-invoice-btn-${inv.invoiceNumber}`}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
                                title="Send Private Personal Message Related to this Invoice"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Private DM</span>
                              </button>
                            )}
                            <button
                              onClick={() => setViewInvoice(inv)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 font-bold text-[11px] text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              View & Print
                            </button>
                          </div>
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
                      <span className="font-mono font-bold">৳{it.total}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Total Quotation</span>
                    <span className="font-black text-gray-900 dark:text-white text-sm">৳{est.totalAmount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Quote PDF</span>
                    </button>

                    {est.status !== 'converted' ? (
                      <button
                        onClick={() => onConvertEstimate(est)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
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

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedClientNameFilter}
                onChange={(e) => setSelectedClientNameFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
              >
                <option value="all">-- Filter Individual B2B Client / Vendor --</option>
                {Array.from(new Set(ledgerEntries.map((l) => l.entityName))).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-bold"
              >
                <option value="all">All Accounts (Consolidated)</option>
                <option value="client">All Clients Only</option>
                <option value="vendor">All Vendors Only</option>
              </select>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Client Statement</span>
              </button>
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
                    .filter(
                      (l) =>
                        (selectedEntityId === 'all' || l.entityType === selectedEntityId) &&
                        (selectedClientNameFilter === 'all' ||
                          l.entityName === selectedClientNameFilter)
                    )
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
                        <td className="p-3 font-bold text-red-600">{led.debit > 0 ? `৳${led.debit}` : '-'}</td>
                        <td className="p-3 font-bold text-emerald-600">{led.credit > 0 ? `৳${led.credit}` : '-'}</td>
                        <td className="p-3 text-right font-black text-gray-900 dark:text-white">৳{led.runningBalance}</td>
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
                      <td className="p-3 font-black text-sm text-gray-900 dark:text-white">৳{p.amount}</td>
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
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">
                      {exp.location.replace('_', ' ')}
                    </span>
                    {exp.bankAccountName && (
                      <span className="text-[10px] text-indigo-400 font-mono">
                        Paid via: {exp.bankAccountName}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-purple-600 block">৳{exp.amount}</span>
                    {exp.proofImageUrl && (
                      <a
                        href={exp.proofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 underline"
                      >
                        Receipt Proof
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: BANK ACCOUNTS & TREASURY VAULTS */}
      {activeTab === 'banks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Corporate Bank Accounts, Mobile Wallets & Cash Vaults
              </h3>
              <p className="text-gray-500 text-[11px]">
                Link customer payments, factory expenses, and vendor settlements directly to bank accounts.
              </p>
            </div>
            <button
              onClick={() => setIsAddBankOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bank Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((bnk) => (
              <div
                key={bnk.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm">{bnk.bankName}</h4>
                      <span className="text-[11px] text-slate-400">{bnk.branch || 'Corporate Branch'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                    {bnk.accountType.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-500 font-sans">
                    Account Name: <strong className="text-slate-300">{bnk.accountName}</strong>
                  </div>
                  <div className="text-indigo-400 font-bold">A/C: {bnk.accountNumber}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Current Balance
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ৳{bnk.balance.toLocaleString()}
                  </span>
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
              <span className="text-emerald-600 font-black font-mono">৳{totalInvoiced.toLocaleString()}</span>
            </div>

            <div className="pl-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>&bull; Direct Sublimation Fabrics (Micro-Eyelet, Poly Interlock)</span>
                <span className="font-mono">-৳{(totalInvoiced * 0.28).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Sublimation Inks & 90 GSM Transfer Paper</span>
                <span className="font-mono">-৳{(totalInvoiced * 0.09).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Sewing Accessories (Threads, Neck Ribbing, Labels)</span>
                <span className="font-mono">-৳{(totalInvoiced * 0.05).toFixed(0)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 border-b font-bold text-xs bg-gray-50 dark:bg-gray-800 px-3 rounded-lg">
              <span>Gross Production Margin</span>
              <span className="font-mono">৳{(totalInvoiced * 0.58).toFixed(0)}</span>
            </div>

            <div className="pl-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-400 pt-2">
              <div className="flex justify-between">
                <span>&bull; Factory Electric Power (Calender 202°C Run)</span>
                <span className="font-mono">-৳{expenses.filter(e => e.category === 'Utilities').reduce((s,e) => s + e.amount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Shuttle Logistics & Fuel (Tongi - Mirpur - Banani)</span>
                <span className="font-mono">-৳{expenses.filter(e => e.category === 'Logistics').reduce((s,e) => s + e.amount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>&bull; Machine Repairs & Line Maintenance</span>
                <span className="font-mono">-৳{expenses.filter(e => e.category === 'Maintenance').reduce((s,e) => s + e.amount, 0)}</span>
              </div>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-gray-900 dark:border-white font-black text-base pt-4">
              <span className="text-gray-900 dark:text-white">Estimated Operating Net Profit</span>
              <span className="text-emerald-600 font-mono">৳{netProfit.toLocaleString()}</span>
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
                {isSensitiveAllowed ? (
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
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mt-1 flex items-center justify-between">
                    <span>Client Payment (Accounts Receivable Inflow)</span>
                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Marketing Authorized</span>
                  </div>
                )}
              </div>

              {/* Quick Invoice Link Selector for Marketing or Accountant */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Select Associated Customer Invoice (Optional)
                </label>
                <select
                  onChange={(e) => {
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) {
                      setPayPartyName(inv.customerName);
                      setPayAmount(inv.dueAmount > 0 ? inv.dueAmount : inv.totalAmount);
                      setPayRef(`INV-${inv.invoiceNumber}`);
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                >
                  <option value="">-- Choose an open invoice or enter manually --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} • {inv.customerName} (Due: ৳{inv.dueAmount})
                    </option>
                  ))}
                </select>
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Amount (BDT ৳)</label>
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
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Link Corporate Bank Account / Wallet
                </label>
                <select
                  value={payBankAccountId}
                  onChange={(e) => setPayBankAccountId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                >
                  <option value="">-- Select Bank Account / Wallet --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber}) - Bal: ৳{b.balance}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Transaction / Cheque Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-BKASH-88192 or CHQ #4091"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Upload Payment Receipt / Slip Proof Image
                  </label>
                  <label className="text-[10px] font-bold text-emerald-500 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProofFileUpload(e, setPayProofImageUrl)}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="https://... or upload screenshot proof"
                  value={payProofImageUrl}
                  onChange={(e) => setPayProofImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition mt-2 cursor-pointer"
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
              <h3 className="font-black text-sm text-gray-900 dark:text-white">
                Record Operating Expense
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">
                  Expense Title
                </label>
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Factory Location
                  </label>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Amount (BDT ৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Paid From Bank / Vault
                  </label>
                  <select
                    value={expBankAccountId}
                    onChange={(e) => setExpBankAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                  >
                    <option value="">-- Select Account --</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    Upload Voucher / Receipt Proof Image
                  </label>
                  <label className="text-[10px] font-bold text-purple-400 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload Proof
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProofFileUpload(e, setExpProofImageUrl)}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="https://... voucher or bill photo"
                  value={expProofImageUrl}
                  onChange={(e) => setExpProofImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition mt-2 cursor-pointer"
              >
                Save Factory Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Corporate Bank Account */}
      {isAddBankOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm">Add Corporate Bank Account / Wallet</h3>
              <button onClick={() => setIsAddBankOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateBankSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Bank or Wallet Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eastern Bank PLC (EBL) / Nagad Corporate"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="104299..."
                    value={newAccountNum}
                    onChange={(e) => setNewAccountNum(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Opening Balance (BDT ৳)
                  </label>
                  <input
                    type="number"
                    value={newBankBalance}
                    onChange={(e) => setNewBankBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-bold mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Account Type
                  </label>
                  <select
                    value={newBankType}
                    onChange={(e) => setNewBankType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mt-1"
                  >
                    <option value="bank">Commercial Bank</option>
                    <option value="mobile_banking">Mobile Wallet (bKash/Nagad)</option>
                    <option value="cash">Factory Cash Vault</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Link Bank Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Executive Printable Tax Invoice with Customer Portal Access & Privilege Stars */}
      {viewInvoice && (() => {
        const matchedCustomer = customers.find(
          (c) =>
            c.id === viewInvoice.customerId ||
            c.name.toLowerCase() === viewInvoice.customerName.toLowerCase() ||
            c.companyOrClub.toLowerCase() === viewInvoice.customerName.toLowerCase()
        );
        const matchedOrder = orders.find(
          (o) => o.id === viewInvoice.orderId || o.orderNumber === viewInvoice.orderNumber
        );
        const returningRatio = matchedCustomer?.returningRatio ?? 92;
        const starRating = matchedCustomer?.starRating ?? 5;
        const privilegeTier = matchedCustomer?.privilegeTier ?? 'platinum_vip';
        const discountPct = matchedCustomer?.discountPrivilegePercent ?? 10;
        const portalCode = matchedCustomer?.portalAccessCode ?? `PORTAL-${viewInvoice.invoiceNumber.slice(-4)}-VIP`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white text-slate-900 rounded-3xl p-8 w-full max-w-3xl border border-slate-300 shadow-2xl space-y-6 my-auto max-h-[94vh] overflow-y-auto">
              {/* Top Action Bar (Hidden in Print) */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-200">
                    EXECUTIVE TAX INVOICE & PORTAL PASS
                  </span>
                  <span className="text-xs text-slate-500">
                    Includes Customer Returning Ratio, Star Rating & Portal Credentials
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenClientPortal && (
                    <button
                      onClick={() => {
                        setViewInvoice(null);
                        onOpenClientPortal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Client Portal</span>
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    onClick={() => setViewInvoice(null)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Letterhead Header */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                      <Layers className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        RIDWEAR SPORTSWEAR MFG. LTD.
                      </h2>
                      <p className="text-[11px] font-bold text-emerald-700">
                        3-Facility Custom Sublimation & Athletic Apparel Enterprise
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2">
                    <strong>HQ:</strong> House 42, Road 11, Banani, Dhaka &bull; <strong>Print Mill:</strong> Tongi BSCIC &bull; <strong>Sewing Factory:</strong> Mirpur-10
                  </p>
                  <p className="text-[11px] text-slate-500">
                    VAT Reg: BD-99120-SPORT &bull; Hotline: +880 1711-009988 &bull; Web: portal.ridwear.erp
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    COMMERCIAL TAX INVOICE
                  </span>
                  <span className="font-mono text-lg font-black text-indigo-700 block mt-0.5">
                    {viewInvoice.invoiceNumber}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Issue Date: <strong>{viewInvoice.createdAt.substring(0, 10)}</strong>
                  </span>
                  <span className="text-[11px] text-rose-600 font-bold block">
                    Due Date: {viewInvoice.dueDate}
                  </span>
                </div>
              </div>

              {/* Billed To + Customer Loyalty & Privilege Tier Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Billed To Customer / Club:
                  </span>
                  <strong className="text-base font-black text-slate-900 block">
                    {viewInvoice.customerName}
                  </strong>
                  {matchedCustomer?.companyOrClub && (
                    <span className="text-xs font-bold text-slate-700 block">
                      Org: {matchedCustomer.companyOrClub}
                    </span>
                  )}
                  <span className="text-slate-600 block font-mono">
                    Job Card Ref: <strong>{viewInvoice.orderNumber}</strong>
                  </span>
                  {matchedCustomer?.phone && (
                    <span className="text-slate-600 block">Phone: {matchedCustomer.phone}</span>
                  )}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase">
                      {viewInvoice.type} Account
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                      {viewInvoice.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Premium Privilege & Returning Ratio Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-indigo-50 border-2 border-amber-300/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" /> Customer Privilege & Loyalty Status
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                      {privilegeTier.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">
                        Returning Ratio
                      </span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {returningRatio}%
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">
                        Loyalty Stars
                      </span>
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3 h-3 ${
                              idx < starRating
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-amber-200 text-center">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">
                        VIP Privilege
                      </span>
                      <span className="text-sm font-black text-indigo-700 font-mono">
                        {discountPct}% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Garment Specification Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3">Item & Technical Specification</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3.5">
                        <strong className="text-slate-900 text-xs block">
                          Custom Sublimated Team Sportswear — {matchedOrder?.teamOrClub || viewInvoice.customerName}
                        </strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Fabric: <strong>{matchedOrder?.fabricType || 'Micro-Eyelet 160 GSM'}</strong> &bull; Collar:{' '}
                          <strong>{matchedOrder?.collarType || 'Athletic V-Neck'}</strong> &bull; Print: Full HD Calendar Sublimation (205°C)
                        </p>
                        {matchedOrder?.sizeBreakdown && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(matchedOrder.sizeBreakdown).map(
                              ([sz, q]) =>
                                Number(q) > 0 && (
                                  <span
                                    key={sz}
                                    className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-[10px] text-slate-800"
                                  >
                                    {sz}: {q}
                                  </span>
                                )
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                        {matchedOrder?.totalQuantity || 30} Sets
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        ৳{matchedOrder?.unitPrice || (viewInvoice.totalAmount / 30).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900">
                        ৳{viewInvoice.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Customer Portal Access Box + Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                {/* Customer Portal Access Card */}
                <div className="sm:col-span-7 p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-400" />
                      <span className="font-black text-xs uppercase tracking-wider text-emerald-400">
                        24/7 B2B Customer Portal Access Pass
                      </span>
                    </div>
                    <QrCode className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Use your dedicated Portal Access Key below to track live factory stages (Design, Print, Sewing), download ledger statements, chat directly with Marketing, and claim your <strong>{discountPct}% {privilegeTier.replace('_', ' ').toUpperCase()}</strong> repeat-order privilege.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono text-xs font-black text-emerald-300">
                      ACCESS KEY: {portalCode}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Assigned Handler: {viewInvoice.assignedEmployeeName || 'Tanvir Ahmed'}
                    </span>
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="sm:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-sans">Gross Invoice Total:</span>
                    <span className="font-bold text-slate-900">৳{viewInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700 font-bold">
                    <span className="font-sans">Advance / Paid Amount:</span>
                    <span>-৳{viewInvoice.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm font-black border-t-2 border-slate-900 text-amber-700">
                    <span className="font-sans">Net Balance Due:</span>
                    <span>৳{viewInvoice.dueAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] font-sans text-slate-500 pt-1">
                    Terms: {viewInvoice.paymentTerms}
                  </p>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-[11px] text-slate-500">
                <div className="pt-6 border-t border-slate-300">Customer / Club Representative</div>
                <div className="pt-6 border-t border-slate-300">Marketing & CRM Executive</div>
                <div className="pt-6 border-t border-slate-300 font-bold text-slate-800">
                  Authorized Accounts Signatory
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
