/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Order,
  ShortageTicket,
  UserRole,
  Employee,
  ROLE_CONFIGS,
} from '../types/erp';
import {
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Box,
  Users,
  UserCheck,
  Plus,
} from 'lucide-react';

interface SewingFactoryViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  onOpenRaiseShortage: (order?: Order) => void;
  employees?: Employee[];
  onOpenEmployeeProfile?: (emp: Employee) => void;
  onUpdateEmployee?: (employeeId: string, partial: Partial<Employee>) => Promise<void>;
}

export const SewingFactoryView: React.FC<SewingFactoryViewProps> = ({
  orders,
  shortageTickets,
  currentRole,
  onUpdateOrder,
  onSelectOrder,
  onOpenRaiseShortage,
  employees = [],
  onOpenEmployeeProfile,
  onUpdateEmployee,
}) => {
  const [selectedStaffToTransfer, setSelectedStaffToTransfer] = useState('');

  const sewingOrders = orders.filter((o) =>
    [
      'fabric_dispatched',
      'fabric_received',
      'cutting_sewing',
      'quality_finishing',
      'shipped',
      'delivered',
    ].includes(o.stage)
  );

  const incomingFabric = orders.filter((o) => o.stage === 'fabric_dispatched');
  const activeLines = orders.filter(
    (o) => o.stage === 'cutting_sewing' || o.stage === 'fabric_received'
  );
  const packingLine = orders.filter((o) => o.stage === 'quality_finishing');

  const sewingFactoryStaff = employees.filter((e) => e.location === 'sewing_factory');
  const otherFactoryStaff = employees.filter((e) => e.location !== 'sewing_factory');

  const handleStageChange = async (orderId: string, nextStage: any, extra: any = {}) => {
    await onUpdateOrder(orderId, { stage: nextStage, ...extra });
  };

  const handleAssignStaffToSewing = async () => {
    if (!selectedStaffToTransfer || !onUpdateEmployee) return;
    await onUpdateEmployee(selectedStaffToTransfer, {
      location: 'sewing_factory',
      role: 'sewing_factory',
    });
    setSelectedStaffToTransfer('');
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
              Confirms printed fabric roll receipt from Tongi Print Factory, oversees laser/manual
              cutting, 4-thread overlock assembly lines, QC inspection, and raises urgent Shortage
              Tickets for damaged pieces.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenRaiseShortage()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition whitespace-nowrap cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Raise Shortage Ticket</span>
        </button>
      </div>

      {/* Incoming Rolls Alert if any rolls in transit */}
      {incomingFabric.length > 0 && (
        <div className="p-4 rounded-xl bg-orange-950/40 border border-orange-800/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-orange-200 text-xs">
              <Truck className="w-4 h-4 text-orange-400" />
              <span>
                Incoming Printed Fabric Rolls In Transit ({incomingFabric.length} batches):
              </span>
            </div>
            <span className="text-[10px] text-orange-400 font-bold uppercase">
              Shuttle Van Arriving
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomingFabric.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 p-3 rounded-lg border border-orange-800/60 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-indigo-400">{order.orderNumber}</strong>
                    <span className="font-bold text-white">{order.teamOrClub}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Challan: {order.deliveryChallanNumber || 'PF-CHAL'} &bull;{' '}
                    {order.totalQuantity} pcs
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleStageChange(order.id, 'fabric_received', {
                      fabricReceivedAt: new Date().toISOString(),
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
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
        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/40">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Cutting & Assembly Lines
              </span>
              <div className="text-base font-black text-white">
                {activeLines.length} Orders In Stitch
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-400">Lines 1 - 4</span>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/40">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                QC & Polybag Packing
              </span>
              <div className="text-base font-black text-white">{packingLine.length} Finishing</div>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-400">Final QC</span>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Courier Dispatched
              </span>
              <div className="text-base font-black text-emerald-400">
                {orders.filter((o) => o.stage === 'delivered' || o.stage === 'shipped').length}{' '}
                Complete
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400">Tracking Logged</span>
        </div>
      </div>

      {/* Mirpur Sewing Factory Assigned Employees, Designations & Posts */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>
                Mirpur Sewing Factory Personnel, Designations & Posts ({sewingFactoryStaff.length})
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any operator, master tailor, or line chief to manage NID, contract, post, and permissions
            </p>
          </div>

          {onUpdateEmployee && otherFactoryStaff.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedStaffToTransfer}
                onChange={(e) => setSelectedStaffToTransfer(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
              >
                <option value="">+ Assign Staff to Sewing Factory...</option>
                {otherFactoryStaff.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation} - {emp.location.replace('_', ' ')})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignStaffToSewing}
                disabled={!selectedStaffToTransfer}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Here
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sewingFactoryStaff.map((emp) => (
            <div
              key={emp.id}
              onClick={() => onOpenEmployeeProfile?.(emp)}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition flex items-start justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {emp.pictureUrl ? (
                  <img
                    src={emp.pictureUrl}
                    alt={emp.name}
                    className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-black flex items-center justify-center text-xs">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white group-hover:text-indigo-300 transition">
                      {emp.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {emp.employeeId}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-indigo-400">
                    {emp.designation}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/50 font-bold">
                      Post: {emp.post || 'Line Specialist'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                      Role: {ROLE_CONFIGS[emp.role]?.shortLabel || emp.role}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  emp.activeStatus === 'offline' ? 'bg-slate-600' : 'bg-emerald-400 animate-pulse'
                }`}
                title={emp.activeStatus || 'online'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sewing Production Orders List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Active Sewing Floor Line Queue
            </h3>
            <p className="text-[11px] text-slate-400">
              Assign line chief/tailor, progress cuts through Overlock assembly, QC inspection, and courier handover
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 space-y-3">
          {sewingOrders.map((order) => (
            <div
              key={order.id}
              className="pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition border border-slate-800/80"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-xs text-indigo-400">
                    {order.orderNumber}
                  </span>
                  <strong className="text-sm text-white font-extrabold">
                    {order.teamOrClub}
                  </strong>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                    {order.stage.replace(/_/g, ' ')}
                  </span>
                  {order.collarType && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">
                      Collar: {order.collarType.replace('_', ' ')}
                    </span>
                  )}
                  {order.shorts?.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      + Shorts ({order.shorts.quantity} pcs)
                    </span>
                  )}
                  {order.hasShortage === 'yes' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-black">
                      SHORTAGE TICKET ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-slate-400 text-[11px] flex items-center gap-4 flex-wrap">
                  <span>
                    Client: {order.clientName} ({order.clientPhone || 'No phone'})
                  </span>
                  <span>
                    Quantity:{' '}
                    <strong className="text-slate-200">{order.totalQuantity} pcs</strong>
                  </span>
                  <span>Fabric: {order.fabricType}</span>
                  <span>Destination: {order.deliveryAddress || 'Standard delivery'}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] text-slate-400">Line Supervisor / Tailor:</span>
                  <select
                    value={order.assignedToEmployeeName || ''}
                    onChange={(e) =>
                      onUpdateOrder(order.id, { assignedToEmployeeName: e.target.value })
                    }
                    className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-indigo-300 font-bold text-[11px]"
                  >
                    <option value="">Assign Line Lead...</option>
                    {sewingFactoryStaff.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct Stage Advance Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {order.stage === 'fabric_received' && (
                  <button
                    onClick={() => handleStageChange(order.id, 'cutting_sewing')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Move to Assembly Lines</span>
                  </button>
                )}

                {order.stage === 'cutting_sewing' && (
                  <>
                    <button
                      onClick={() => onOpenRaiseShortage(order)}
                      className="px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/40 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Defect Shortage</span>
                    </button>
                    <button
                      onClick={() => handleStageChange(order.id, 'quality_finishing')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
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
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Handover to Courier</span>
                  </button>
                )}

                {order.stage === 'shipped' && (
                  <button
                    onClick={() => handleStageChange(order.id, 'delivered')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Delivered</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectOrder(order)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
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
