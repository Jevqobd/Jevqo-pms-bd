/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, UserRole, FactoryLocation, OrderStage } from '../types/erp';
import {
  Building2,
  Printer,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { canTransitionStage } from '../utils/erpLogic';

interface KanbanBoardProps {
  orders: Order[];
  currentRole: UserRole;
  selectedLocation: FactoryLocation | 'all';
  onSelectOrder: (order: Order) => void;
  onAdvanceStage: (order: Order, nextStage: OrderStage) => void;
  onOpenCreateOrder: () => void;
  onOpenAiAssistant: () => void;
}

interface ColumnDef {
  id: string;
  title: string;
  location: FactoryLocation;
  stages: OrderStage[];
  color: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'col-crm',
    title: '1. Order & Invoicing',
    location: 'head_office',
    stages: ['draft', 'payment_pending', 'payment_verified'],
    color: 'border-t-blue-500',
    icon: <Building2 className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'col-design',
    title: '2. Design & Pre-Press',
    location: 'head_office',
    stages: ['mockup_in_progress', 'mockup_approved', 'pattern_spec_ready'],
    color: 'border-t-purple-500',
    icon: <Sparkles className="w-4 h-4 text-purple-600" />,
  },
  {
    id: 'col-print',
    title: '3. Print & Heat Press',
    location: 'print_factory',
    stages: ['paper_printed', 'heat_press_done', 'fabric_dispatched'],
    color: 'border-t-emerald-500',
    icon: <Printer className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'col-sewing',
    title: '4. Sewing & Finishing',
    location: 'sewing_factory',
    stages: ['fabric_received', 'cutting_sewing', 'quality_finishing', 'shipped', 'delivered'],
    color: 'border-t-indigo-500',
    icon: <Scissors className="w-4 h-4 text-indigo-600" />,
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders,
  currentRole,
  selectedLocation,
  onSelectOrder,
  onAdvanceStage,
  onOpenCreateOrder,
  onOpenAiAssistant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('all');

  // Filter orders by location selection, search, sport
  const filteredOrders = orders.filter((order) => {
    if (selectedLocation !== 'all') {
      if (order.currentLocation !== selectedLocation) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchClient = order.clientName.toLowerCase().includes(q);
      const matchTeam = (order.teamOrClub || '').toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchTeam) return false;
    }
    if (filterSport !== 'all' && order.sportType !== filterSport) {
      return false;
    }
    return true;
  });

  const getStageBadge = (stage: OrderStage) => {
    switch (stage) {
      case 'payment_pending':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Awaiting Payment Approval</span>;
      case 'payment_verified':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">Payment Verified</span>;
      case 'mockup_in_progress':
        return <span className="bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 px-2 py-0.5 rounded text-[10px] font-bold">Design 1: Mockup In Progress</span>;
      case 'mockup_approved':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">Client Approved Mockup</span>;
      case 'pattern_spec_ready':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">Ready for Print (Files Linked)</span>;
      case 'paper_printed':
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 px-2 py-0.5 rounded text-[10px] font-bold">Paper Printed</span>;
      case 'heat_press_done':
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Heat Press Done</span>;
      case 'fabric_dispatched':
        return <span className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 px-2 py-0.5 rounded text-[10px] font-bold">Dispatched to Sewing</span>;
      case 'fabric_received':
        return <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold">Fabric Received at Sewing</span>;
      case 'cutting_sewing':
        return <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">Cutting & Sewing Lines</span>;
      case 'quality_finishing':
        return <span className="bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300 px-2 py-0.5 rounded text-[10px] font-bold">QC & Polybag Packing</span>;
      case 'shipped':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">Shipped with Courier</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">Delivered & Complete</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold">{stage}</span>;
    }
  };

  const getNextStageAction = (order: Order) => {
    switch (order.stage) {
      case 'payment_pending':
        if (currentRole === 'owner') {
          return { label: 'Verify Payment', target: 'payment_verified' as OrderStage };
        }
        break;
      case 'payment_verified':
        if (currentRole === 'design_mockup' || currentRole === 'owner') {
          return { label: 'Start Mockup', target: 'mockup_in_progress' as OrderStage };
        }
        break;
      case 'mockup_in_progress':
        if (currentRole === 'design_mockup' || currentRole === 'marketing' || currentRole === 'owner') {
          return { label: 'Client Approved', target: 'mockup_approved' as OrderStage };
        }
        break;
      case 'mockup_approved':
        if (currentRole === 'design_pattern' || currentRole === 'owner') {
          return { label: 'Prepare Print Files', target: 'pattern_spec_ready' as OrderStage };
        }
        break;
      case 'pattern_spec_ready':
        if (currentRole === 'print_factory' || currentRole === 'owner') {
          return { label: 'Mark Paper Printed', target: 'paper_printed' as OrderStage };
        }
        break;
      case 'paper_printed':
        if (currentRole === 'print_factory' || currentRole === 'owner') {
          return { label: 'Complete Heat Press', target: 'heat_press_done' as OrderStage };
        }
        break;
      case 'heat_press_done':
        if (currentRole === 'print_factory' || currentRole === 'owner') {
          return { label: 'Dispatch to Sewing', target: 'fabric_dispatched' as OrderStage };
        }
        break;
      case 'fabric_dispatched':
        if (currentRole === 'sewing_factory' || currentRole === 'owner') {
          return { label: 'Fabric Received', target: 'fabric_received' as OrderStage };
        }
        break;
      case 'fabric_received':
        if (currentRole === 'sewing_factory' || currentRole === 'owner') {
          return { label: 'Move to Cutting/Sewing', target: 'cutting_sewing' as OrderStage };
        }
        break;
      case 'cutting_sewing':
        if (currentRole === 'sewing_factory' || currentRole === 'owner') {
          return { label: 'Quality & Packing', target: 'quality_finishing' as OrderStage };
        }
        break;
      case 'quality_finishing':
        if (currentRole === 'sewing_factory' || currentRole === 'owner') {
          return { label: 'Ship to Customer', target: 'shipped' as OrderStage };
        }
        break;
      case 'shipped':
        if (currentRole === 'sewing_factory' || currentRole === 'marketing' || currentRole === 'owner') {
          return { label: 'Mark Delivered', target: 'delivered' as OrderStage };
        }
        break;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-850 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, Team, Client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Sport:</span>
          </div>
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-hidden"
          >
            <option value="all">All Sports</option>
            <option value="Football / Soccer">Football</option>
            <option value="Cricket">Cricket</option>
            <option value="Basketball">Basketball</option>
            <option value="Athletics / Running">Athletics</option>
            <option value="Volleyball">Volleyball</option>
            <option value="Esports">Esports</option>
          </select>
        </div>
      </div>

      {/* 4 Multi-Factory Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => col.stages.includes(o.stage));

          return (
            <div
              key={col.id}
              className={`bg-gray-100/70 dark:bg-gray-900/60 rounded-2xl border-t-4 ${col.color} border-x border-b border-gray-200 dark:border-gray-800 flex flex-col min-h-[580px] shadow-xs`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-gray-200/80 dark:border-gray-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-gray-850 shadow-xs">
                    {col.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                      {col.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 capitalize">
                      {col.location.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-2xs">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-2.5 space-y-3 flex-1 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    No orders at this stage
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const action = getNextStageAction(order);

                    return (
                      <div
                        key={order.id}
                        onClick={() => onSelectOrder(order)}
                        className={`group bg-white dark:bg-gray-850 rounded-xl p-3.5 border transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-indigo-400 ${
                          order.hasShortage === 'yes'
                            ? 'border-red-400 dark:border-red-600 ring-2 ring-red-400/30'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {/* Top: Order number & Shortage badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {order.orderNumber}
                          </span>
                          <div className="flex items-center gap-1">
                            {order.hasShortage === 'yes' && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-extrabold animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                SHORTAGE
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-medium">
                              {order.totalQuantity} pcs
                            </span>
                          </div>
                        </div>

                        {/* Team & Client */}
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug group-hover:text-indigo-600 transition">
                          {order.teamOrClub || 'Custom Team Jersey'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                          {order.clientName} &bull; {order.sportType || 'Sportswear'}
                        </p>

                        {/* Fabric & Specs Pill */}
                        <div className="text-[11px] bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-750 mb-2.5">
                          <div className="flex items-center justify-between font-semibold text-gray-700 dark:text-gray-300">
                            <span>{order.fabricType}</span>
                            <span>{order.gsm ? `${order.gsm} GSM` : ''}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                            Sizes:{' '}
                            {Object.entries(order.sizeBreakdown || {})
                              .filter(([_, count]) => count > 0)
                              .map(([size, count]) => `${size}:${count}`)
                              .join(' | ') || 'Pending sheet'}
                          </div>
                        </div>

                        {/* Stage badge */}
                        <div className="mb-2.5">
                          {getStageBadge(order.stage)}
                        </div>

                        {/* Card Footer: Financial status & Stage Action */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                          <div className="text-[11px]">
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                              ${order.totalAmount}
                            </span>
                            {order.dueAmount > 0 ? (
                              <span className="text-amber-600 block text-[9px] font-semibold">
                                Due: ${order.dueAmount}
                              </span>
                            ) : (
                              <span className="text-emerald-600 block text-[9px] font-semibold">
                                Paid in Full
                              </span>
                            )}
                          </div>

                          {/* Quick Advance Button if authorized */}
                          {action ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdvanceStage(order, action.target);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
                              title={`Advance to ${action.target}`}
                            >
                              <span>{action.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOrder(order);
                              }}
                              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Details &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
