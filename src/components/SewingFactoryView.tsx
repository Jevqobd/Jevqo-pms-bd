/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, ShortageTicket, UserRole } from '../types/erp';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Box,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface SewingFactoryViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onOpenRaiseShortage: (order?: Order) => void;
}

export const SewingFactoryView: React.FC<SewingFactoryViewProps> = ({
  orders,
  shortageTickets,
  currentRole,
  onUpdateOrder,
  onSelectOrder,
  onOpenRaiseShortage,
}) => {
  // Sewing factory stages: fabric_dispatched (in transit), fabric_received, cutting_sewing, quality_finishing, shipped, delivered
  const sewingOrders = orders.filter((o) =>
    ['fabric_dispatched', 'fabric_received', 'cutting_sewing', 'quality_finishing', 'shipped', 'delivered'].includes(o.stage)
  );

  const incomingFabric = orders.filter((o) => o.stage === 'fabric_dispatched');
  const activeLines = orders.filter((o) => o.stage === 'cutting_sewing' || o.stage === 'fabric_received');
  const packingLine = orders.filter((o) => o.stage === 'quality_finishing');

  const handleStageChange = async (orderId: string, nextStage: any, extra: any = {}) => {
    await onUpdateOrder(orderId, { stage: nextStage, ...extra });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Sewing Factory Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">
                Sewing & Assembly Factory (Mirpur Hub)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                Cutting, Stitching, QC & Courier Dispatch
              </span>
            </div>
            <p className="text-xs text-indigo-100 max-w-2xl">
              Confirms printed fabric roll receipt from Print Factory, oversees laser/manual cutting, 4-thread overlock assembly lines, QC inspection, and raises urgent Shortage Tickets for damaged pieces.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenRaiseShortage()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition whitespace-nowrap"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Raise Shortage Ticket</span>
        </button>
      </div>

      {/* Incoming Rolls Alert if any rolls in transit */}
      {incomingFabric.length > 0 && (
        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-orange-900 dark:text-orange-200 text-xs">
              <Truck className="w-4 h-4 text-orange-600" />
              <span>Incoming Printed Fabric Rolls In Transit ({incomingFabric.length} batches):</span>
            </div>
            <span className="text-[10px] text-orange-600 font-bold uppercase">Shuttle Van Arriving</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomingFabric.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-850 p-3 rounded-lg border border-orange-200 dark:border-orange-800/60 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-indigo-600">{order.orderNumber}</strong>
                    <span className="font-bold text-gray-900 dark:text-white">{order.teamOrClub}</span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Challan: {order.deliveryChallanNumber || 'PF-CHAL'} &bull; {order.totalQuantity} pcs
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleStageChange(order.id, 'fabric_received', { fabricReceivedAt: new Date().toISOString() })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Received</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factory Line KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Cutting & Assembly Lines</span>
              <div className="text-base font-black text-gray-900 dark:text-white">
                {activeLines.length} Orders In Stitch
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600">Lines 1 - 4</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">QC & Polybag Packing</span>
              <div className="text-base font-black text-gray-900 dark:text-white">
                {packingLine.length} Finishing
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-600">Final QC</span>
        </div>

        <div className="p-4 bg-white dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Courier Dispatched</span>
              <div className="text-base font-black text-emerald-600">
                {orders.filter((o) => o.stage === 'delivered' || o.stage === 'shipped').length} Complete
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600">Tracking Logged</span>
        </div>
      </div>

      {/* Sewing Production Orders List */}
      <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Active Sewing Floor Line Queue
            </h3>
            <p className="text-[11px] text-gray-500">
              Progress cuts through Overlock assembly, QC inspection, and courier handover
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-3">
          {sewingOrders.map((order) => (
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold uppercase">
                    {order.stage.replace(/_/g, ' ')}
                  </span>
                  {order.hasShortage === 'yes' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-black">
                      SHORTAGE TICKET ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-gray-500 text-[11px] flex items-center gap-4 flex-wrap">
                  <span>Client: {order.clientName} ({order.clientPhone || 'No phone'})</span>
                  <span>Quantity: <strong className="text-gray-800 dark:text-gray-200">{order.totalQuantity} pcs</strong></span>
                  <span>Fabric: {order.fabricType}</span>
                  <span>Destination: {order.deliveryAddress || 'Standard delivery'}</span>
                </div>
              </div>

              {/* Direct Stage Advance Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {order.stage === 'fabric_received' && (
                  <button
                    onClick={() => handleStageChange(order.id, 'cutting_sewing')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Move to Assembly Lines</span>
                  </button>
                )}

                {order.stage === 'cutting_sewing' && (
                  <>
                    <button
                      onClick={() => onOpenRaiseShortage(order)}
                      className="px-2.5 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Defect Shortage</span>
                    </button>
                    <button
                      onClick={() => handleStageChange(order.id, 'quality_finishing')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>QC & Packing</span>
                    </button>
                  </>
                )}

                {order.stage === 'quality_finishing' && (
                  <button
                    onClick={() =>
                      handleStageChange(order.id, 'shipped', {
                        courierName: 'Pathao Courier',
                        trackingNumber: `PTH-${Math.floor(1000000 + Math.random() * 9000000)}`,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Handover to Courier</span>
                  </button>
                )}

                {order.stage === 'shipped' && (
                  <button
                    onClick={() => handleStageChange(order.id, 'delivered')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Delivered</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectOrder(order)}
                  className="px-2.5 py-1.5 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
