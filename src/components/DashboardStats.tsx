/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Order, ShortageTicket, FactoryLocation } from '../types/erp';
import { Language } from '../utils/translations';
import { Building2, Printer, Scissors, Truck, AlertOctagon, DollarSign, Clock } from 'lucide-react';

interface DashboardStatsProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  onSelectLocation: (loc: FactoryLocation | 'all') => void;
  selectedLocation: FactoryLocation | 'all';
  language?: Language;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  orders,
  shortageTickets,
  onSelectLocation,
  selectedLocation,
  language = 'en',
}) => {
  // Memoize computationally heavy filter and reduce operations to avoid unnecessary
  // recalculations on every render, especially when just switching location tabs or languages.
  // Impact: Reduces CPU time during location/language toggling by caching array traversals.
  const {
    headOfficeOrders,
    printFactoryOrders,
    sewingFactoryOrders,
    dispatchedOrders,
    totalSales,
    totalAdvances,
    totalDue
  } = useMemo(() => {
    return {
      headOfficeOrders: orders.filter((o) => o.currentLocation === 'head_office'),
      printFactoryOrders: orders.filter((o) => o.currentLocation === 'print_factory'),
      sewingFactoryOrders: orders.filter((o) => o.currentLocation === 'sewing_factory'),
      dispatchedOrders: orders.filter((o) => o.currentLocation === 'dispatched'),
      totalSales: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalAdvances: orders.reduce((sum, o) => sum + (o.advanceAmount || 0), 0),
      totalDue: orders.reduce((sum, o) => sum + (o.dueAmount || 0), 0)
    };
  }, [orders]);

  const openShortages = useMemo(
    () => shortageTickets.filter((t) => t.status !== 'resolved'),
    [shortageTickets]
  );

  return (
    <div className="space-y-4">
      {/* 3 Physical Locations KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Head Office Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'head_office' ? 'all' : 'head_office')}
          className={`card-hover p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedLocation === 'head_office'
              ? 'ring-2 ring-blue-500 bg-blue-950/40 border-blue-600 shadow-lg'
              : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {'Head Office'}
            </span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {headOfficeOrders.length}
            </span>
            <span className="text-xs text-slate-400">{'orders'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {'CRM, Payments & Mockups'}
          </p>
        </div>

        {/* Print Factory Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'print_factory' ? 'all' : 'print_factory')}
          className={`card-hover p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedLocation === 'print_factory'
              ? 'ring-2 ring-emerald-500 bg-emerald-950/40 border-emerald-600 shadow-lg'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {'Print Factory'}
            </span>
            <Printer className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {printFactoryOrders.length}
            </span>
            <span className="text-xs text-slate-400">{'in production'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {'Paper Sublimation & Heat Press'}
          </p>
        </div>

        {/* In-Transit Shuttle Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'dispatched' ? 'all' : 'dispatched')}
          className={`card-hover p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedLocation === 'dispatched'
              ? 'ring-2 ring-amber-500 bg-amber-950/40 border-amber-600 shadow-lg'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {'Inter-Factory Van'}
            </span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {dispatchedOrders.length}
            </span>
            <span className="text-xs text-slate-400">{'rolls on van'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {'Printed Rolls en route to Sewing'}
          </p>
        </div>

        {/* Sewing Factory Card */}
        <div
          onClick={() => onSelectLocation(selectedLocation === 'sewing_factory' ? 'all' : 'sewing_factory')}
          className={`card-hover p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedLocation === 'sewing_factory'
              ? 'ring-2 ring-indigo-500 bg-indigo-950/40 border-indigo-600 shadow-lg'
              : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {'Sewing Factory'}
            </span>
            <Scissors className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {sewingFactoryOrders.length}
            </span>
            <span className="text-xs text-slate-400">{'at lines'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {'Cutting, Assembly, Packing & Dispatch'}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Bar: Financials & Re-print Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-hover flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                {'Total Pipeline Sales'}
              </div>
              <div className="text-base font-black text-white font-mono">
                ৳{totalSales.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-emerald-400 font-bold font-mono">৳{totalAdvances.toLocaleString()}</span>
            <span className="text-slate-400 block text-[10px]">{'collected'}</span>
          </div>
        </div>

        <div className="card-hover flex items-center justify-between p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                {'Due Before Delivery'}
              </div>
              <div className="text-base font-black text-white font-mono">
                ৳{totalDue.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-amber-400 font-bold font-mono">
              {Math.round((totalAdvances / (totalSales || 1)) * 100)}%
            </span>
            <span className="text-slate-400 block text-[10px]">{'paid ratio'}</span>
          </div>
        </div>

        <div className={`card-hover flex items-center justify-between p-3.5 rounded-2xl border shadow-lg transition-all ${
          openShortages.length > 0
            ? 'bg-rose-950/30 border-rose-800 text-rose-200'
            : 'bg-slate-900/90 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              openShortages.length > 0 ? 'bg-rose-900/60 text-rose-400 border border-rose-700' : 'bg-slate-800 text-slate-400'
            }`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase">
                {'Active Re-print Loop'}
              </div>
              <div className="text-base font-black font-mono">
                {openShortages.length} {`Shortage Ticket${openShortages.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
            openShortages.length > 0 ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {openShortages.length > 0 ? ('Priority Alert') : ('No defects')}
          </span>
        </div>
      </div>
    </div>
  );
};
