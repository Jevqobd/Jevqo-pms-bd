/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, Expense, UserRole } from '../types/erp';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Plus,
  Building2,
  Printer,
  Scissors,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';

interface FinancialViewProps {
  orders: Order[];
  expenses: Expense[];
  currentRole: UserRole;
  onAddExpense: (expense: Expense) => Promise<void>;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  orders,
  expenses,
  currentRole,
  onAddExpense,
}) => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseLocation, setExpenseLocation] = useState<'head_office' | 'print_factory' | 'sewing_factory'>('print_factory');
  const [expenseCategory, setExpenseCategory] = useState('Utilities');
  const [expenseAmount, setExpenseAmount] = useState(120);
  const [expenseNotes, setExpenseNotes] = useState('');

  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalAdvances = orders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  const totalDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netCashFlow = totalAdvances - totalExpenses;

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    await onAddExpense({
      id: `exp-${Date.now().toString(36)}`,
      title: expenseTitle,
      category: expenseCategory,
      location: expenseLocation,
      amount: Number(expenseAmount),
      date: new Date().toISOString().substring(0, 10),
      notes: expenseNotes,
      recordedBy: 'Accounting & Floor Lead',
    });

    setIsAddExpenseOpen(false);
    setExpenseTitle('');
    setExpenseNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Sales</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            ৳{totalSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{orders.length} Total orders</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cash Collected</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ৳{totalAdvances.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {Math.round((totalAdvances / (totalSales || 1)) * 100)}% payment collected
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Due Before Delivery</span>
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            ৳{totalDue.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Receivables upon dispatch</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Factory Expenses</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            ৳{totalExpenses.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Across 3 locations</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Cash Position</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className={`text-2xl font-black ${netCashFlow >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            ৳{netCashFlow.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Collections minus expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Payment Register (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Orders Invoicing & Receivables Register
              </h3>
              <p className="text-xs text-gray-500">Live payment verification status per Job Card</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 border-b border-gray-200 dark:border-gray-800 font-bold">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Client / Team</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Advance</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50 dark:hover:bg-gray-850">
                    <td className="p-3 font-mono font-bold text-indigo-600">{ord.orderNumber}</td>
                    <td className="p-3">
                      <strong className="block text-gray-900 dark:text-white">{ord.clientName}</strong>
                      <span className="text-[11px] text-gray-500">{ord.teamOrClub}</span>
                    </td>
                    <td className="p-3 font-bold">৳{ord.totalAmount}</td>
                    <td className="p-3 text-emerald-600 font-semibold">৳{ord.advanceAmount}</td>
                    <td className="p-3 font-bold">
                      {ord.dueAmount > 0 ? (
                        <span className="text-amber-600">৳{ord.dueAmount}</span>
                      ) : (
                        <span className="text-gray-400">৳0</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.paymentStatus === 'paid_in_full'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.paymentStatus === 'verified'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Daily Factory Expenses Logger */}
        <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Factory Operating Expenses
              </h3>
              <p className="text-xs text-gray-500">Utilities, machinery & transit</p>
            </div>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          </div>

          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">{exp.title}</span>
                  <span className="font-black text-rose-600">-৳{exp.amount}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="capitalize">{exp.location.replace('_', ' ')} &bull; {exp.category}</span>
                  <span>{exp.date}</span>
                </div>
                {exp.notes && <p className="text-[10px] text-gray-400 italic">{exp.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Log Factory Operating Expense
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heat press electricity bill / Van fuel"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Location *</label>
                  <select
                    value={expenseLocation}
                    onChange={(e) => setExpenseLocation(e.target.value as any)}
                    className="w-full p-2 border rounded-lg text-xs"
                  >
                    <option value="print_factory">Print Factory</option>
                    <option value="sewing_factory">Sewing Factory</option>
                    <option value="head_office">Head Office</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  >
                    <option value="Utilities">Utilities & Power</option>
                    <option value="Logistics">Inter-Factory Logistics</option>
                    <option value="Maintenance">Machinery Maintenance</option>
                    <option value="Packaging">Packaging Supplies</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Amount (BDT ৳) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Details"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
