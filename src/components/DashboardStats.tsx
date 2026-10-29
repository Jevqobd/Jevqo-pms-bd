/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, ShortageTicket, FactoryLocation } from '../types/erp';
import { Building2, Printer, Scissors, Truck, AlertOctagon, DollarSign, Clock } from 'lucide-react';

interface DashboardStatsProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  onSelectLocation: (loc: FactoryLocation | 'all') => void;
  selectedLocation: FactoryLocation | 'all';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  orders,
  shortageTickets,
  onSelectLocation,
  selectedLocation,
}) => {
  const activeOrders = orders.filter((o) => o.stage !== 'delivered');
  const headOfficeOrders = orders.filter((o) => o.currentLocation === 'head_office');
  const printFactoryOrders = orders.filter((o) => o.currentLocation === 'print_factory');
  const sewingFactoryOrders = orders.filter((o) => o.currentLocation === 'sewing_factory');
  const dispatchedOrders = orders.filter((o) => o.currentLocation === 'dispatched');
  const openShortages = shortageTickets.filter((t) => t.status !== 'resolved');

  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalAdvances = orders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0);
  const totalDue = orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

  return (
    <div className="space-y-4">
      {/* 3 Physical Locations KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Head Office Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'head_office' ? 'all' : 'head_office')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedLocation === 'head_office'
              ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm'
              : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">Head Office</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {headOfficeOrders.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">orders</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            CRM, Payments & Pre-Press Patterns
          </p>
        </div>

        {/* Print Factory Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'print_factory' ? 'all' : 'print_factory')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedLocation === 'print_factory'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-sm'
              : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Print Factory</span>
            <Printer className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {printFactoryOrders.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">in production</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Paper Sublimation & Heat Press
          </p>
        </div>

        {/* In-Transit Shuttle Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'dispatched' ? 'all' : 'dispatched')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedLocation === 'dispatched'
              ? 'ring-2 ring-amber-500 bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Inter-Factory Transit</span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {dispatchedOrders.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">rolls on van</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Printed Rolls en route to Sewing
          </p>
        </div>

        {/* Sewing Factory Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'sewing_factory' ? 'all' : 'sewing_factory')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedLocation === 'sewing_factory'
              ? 'ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-sm'
              : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sewing Factory</span>
            <Scissors className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {sewingFactoryOrders.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">at lines</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Cutting, Assembly, Finishing & Dispatch
          </p>
        </div>
      </div>

      {/* Secondary Metrics Bar: Financials & Re-print Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Total Pipeline Sales
              </div>
              <div className="text-base font-black text-gray-900 dark:text-white">
                ${totalSales.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-emerald-600 font-bold">${totalAdvances.toLocaleString()}</span>
            <span className="text-gray-400 block text-[10px]">collected</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Due Before Delivery
              </div>
              <div className="text-base font-black text-gray-900 dark:text-white">
                ${totalDue.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-amber-600 font-bold">
              {Math.round((totalAdvances / (totalSales || 1)) * 100)}%
            </span>
            <span className="text-gray-400 block text-[10px]">paid ratio</span>
          </div>
        </div>

        <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
          openShortages.length > 0
            ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200'
            : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              openShortages.length > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
            }`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase">
                Active Re-print Loop
              </div>
              <div className="text-base font-black">
                {openShortages.length} Shortage Ticket{openShortages.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/70 dark:bg-gray-800 border">
            {openShortages.length > 0 ? 'Priority Alert' : 'No defects'}
          </span>
        </div>
      </div>
    </div>
  );
};
