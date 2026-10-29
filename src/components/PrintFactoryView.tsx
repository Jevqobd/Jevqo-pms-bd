/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, ShortageTicket, UserRole } from '../types/erp';
import {
  Printer,
  Flame,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Thermometer,
  Gauge,
  Clock,
  Download,
} from 'lucide-react';
import { calculateFabricConsumption } from '../utils/erpLogic';

interface PrintFactoryViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
}

export const PrintFactoryView: React.FC<PrintFactoryViewProps> = ({
  orders,
  shortageTickets,
  currentRole,
  onUpdateOrder,
  onSelectOrder,
}) => {
  // Orders relevant to Print Factory: pattern_spec_ready, paper_printed, heat_press_done, fabric_dispatched
  const printQueue = orders.filter((o) =>
    ['pattern_spec_ready', 'paper_printed', 'heat_press_done', 'fabric_dispatched'].includes(o.stage)
  );

  const urgentShortages = shortageTickets.filter(
    (t) => t.status === 'open' || t.status === 'reprint_file_ready' || t.status === 'reprinted'
  );

  const handleStageChange = async (orderId: string, nextStage: any, extra: any = {}) => {
    await onUpdateOrder(orderId, { stage: nextStage, ...extra });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Factory Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Printer className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                Print Factory Floor Operations (Tongi Hub)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                Sublimation & Heat Press
              </span>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl">
              Handles wide-format sublimation paper printing (1.6m roll width), rotary calendar heat press sublimation transfer onto white polyester rolls, and dispatch delivery challans to Sewing Factory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/20">
          <div className="text-center px-2">
            <span className="text-[10px] text-emerald-100 block">Queue Jobs</span>
            <span className="text-xl font-black">{printQueue.length}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-2">
            <span className="text-[10px] text-emerald-100 block">Active Shortages</span>
            <span className="text-xl font-black text-amber-300">{urgentShortages.length}</span>
          </div>
        </div>
      </div>

      {/* Machine Telemetry & Heat Press Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Rotary Calendar Press #1</span>
              <div className="text-base font-black text-gray-900 dark:text-white">202°C &bull; Active</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Optimal</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Wide Ink Tanks (CMYK)</span>
              <div className="text-base font-black text-gray-900 dark:text-white">16.5 Liters In-Tank</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">Good</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Dwell Time Parameter</span>
              <div className="text-base font-black text-gray-900 dark:text-white">35s @ 1.5m/min</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-bold text-[10px]">Calibrated</span>
        </div>
      </div>

      {/* Main Print Queue Table */}
      <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Live Factory Print & Heat Press Queue
            </h3>
            <p className="text-[11px] text-gray-500">
              Click any Job Card to view print-ready files or advance physical production stage
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-3">
          {printQueue.map((order) => {
            const materials = calculateFabricConsumption(order.sizeBreakdown || {}, order.fabricType);

            return (
              <div
                key={order.id}
                className="pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition border border-gray-100 dark:border-gray-800"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                      {order.orderNumber}
                    </span>
                    <strong className="text-sm text-gray-900 dark:text-white font-extrabold">
                      {order.teamOrClub}
                    </strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {order.stage.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-gray-500 text-[11px] flex items-center gap-4 flex-wrap">
                    <span>Client: {order.clientName}</span>
                    <span>Quantity: <strong className="text-gray-800 dark:text-gray-200">{order.totalQuantity} pcs</strong></span>
                    <span>Fabric: <strong className="text-gray-800 dark:text-gray-200">{order.fabricType}</strong></span>
                    <span>Linear Meters: <strong className="text-indigo-600">{materials.fabricMeters}m</strong></span>
                    <span>Est. Ink: <strong className="text-amber-600">~{materials.inkEstimatedMl}ml</strong></span>
                  </div>

                  {order.printReadyLink && (
                    <div className="pt-0.5">
                      <a
                        href={order.printReadyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        🔗 Open High-Res Print File <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Direct Stage Advance Buttons for Factory Floor Workers */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {order.stage === 'pattern_spec_ready' && (
                    <button
                      onClick={() => handleStageChange(order.id, 'paper_printed')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Paper Printed</span>
                    </button>
                  )}

                  {order.stage === 'paper_printed' && (
                    <button
                      onClick={() => handleStageChange(order.id, 'heat_press_done')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Heat Press Completed</span>
                    </button>
                  )}

                  {order.stage === 'heat_press_done' && (
                    <button
                      onClick={() =>
                        handleStageChange(order.id, 'fabric_dispatched', {
                          deliveryChallanNumber: `CHAL-PF-${Math.floor(1000 + Math.random() * 9000)}`,
                          fabricDispatchedAt: new Date().toISOString(),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Fabric Roll to Sewing</span>
                    </button>
                  )}

                  {order.stage === 'fabric_dispatched' && (
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-600 block text-xs">
                        {order.deliveryChallanNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">On Shuttle Van</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectOrder(order)}
                    className="px-2.5 py-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
                  >
                    Job Specs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
