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
  FactoryLocation,
  ROLE_CONFIGS,
} from '../types/erp';
import {
  Printer,
  Flame,
  Truck,
  CheckCircle2,
  ExternalLink,
  Thermometer,
  Gauge,
  Clock,
  Users,
  UserCheck,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { calculateFabricConsumption } from '../utils/erpLogic';

interface PrintFactoryViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  employees?: Employee[];
  onOpenEmployeeProfile?: (emp: Employee) => void;
  onUpdateEmployee?: (employeeId: string, partial: Partial<Employee>) => Promise<void>;
}

export const PrintFactoryView: React.FC<PrintFactoryViewProps> = ({
  orders,
  shortageTickets,
  currentRole,
  onUpdateOrder,
  onSelectOrder,
  employees = [],
  onOpenEmployeeProfile,
  onUpdateEmployee,
}) => {
  const [selectedStaffToTransfer, setSelectedStaffToTransfer] = useState('');

  const printQueue = orders.filter((o) =>
    ['pattern_spec_ready', 'paper_printed', 'heat_press_done', 'fabric_dispatched'].includes(o.stage)
  );

  const urgentShortages = shortageTickets.filter(
    (t) => t.status === 'open' || t.status === 'reprint_file_ready' || t.status === 'reprinted'
  );

  const printFactoryStaff = employees.filter((e) => e.location === 'print_factory');
  const otherFactoryStaff = employees.filter((e) => e.location !== 'print_factory');

  const handleStageChange = async (orderId: string, nextStage: any, extra: any = {}) => {
    await onUpdateOrder(orderId, { stage: nextStage, ...extra });
  };

  const handleAssignStaffToPrint = async () => {
    if (!selectedStaffToTransfer || !onUpdateEmployee) return;
    await onUpdateEmployee(selectedStaffToTransfer, {
      location: 'print_factory',
      role: 'print_factory',
    });
    setSelectedStaffToTransfer('');
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
              Handles wide-format sublimation paper printing (1.6m roll width), rotary calendar heat
              press transfer onto polyester rolls, and dispatch challans to Mirpur Sewing Factory.
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
            <span className="text-[10px] text-emerald-100 block">Assigned Staff</span>
            <span className="text-xl font-black text-white">{printFactoryStaff.length}</span>
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
        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-950/60 text-orange-400 border border-orange-800/40">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Rotary Calendar Press #1
              </span>
              <div className="text-base font-black text-white">202°C &bull; Active</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[10px]">
            Optimal
          </span>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Wide Ink Tanks (CMYK)
              </span>
              <div className="text-base font-black text-white">16.5 Liters In-Tank</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-bold text-[10px]">
            Good
          </span>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Dwell Time Parameter
              </span>
              <div className="text-base font-black text-white">35s @ 1.5m/min</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold text-[10px]">
            Calibrated
          </span>
        </div>
      </div>

      {/* Print Factory Assigned Employees, Designations & Posts */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Tongi Print Factory Personnel, Designations & Posts ({printFactoryStaff.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any operator or supervisor to view/edit NID, contract, post, and permissions
            </p>
          </div>

          {onUpdateEmployee && otherFactoryStaff.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedStaffToTransfer}
                onChange={(e) => setSelectedStaffToTransfer(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs"
              >
                <option value="">+ Assign Staff to Print Factory...</option>
                {otherFactoryStaff.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.designation} - {emp.location.replace('_', ' ')})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignStaffToPrint}
                disabled={!selectedStaffToTransfer}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Here
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {printFactoryStaff.map((emp) => (
            <div
              key={emp.id}
              onClick={() => onOpenEmployeeProfile?.(emp)}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 transition flex items-start justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                {emp.pictureUrl ? (
                  <img
                    src={emp.pictureUrl}
                    alt={emp.name}
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black flex items-center justify-center text-xs">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white group-hover:text-emerald-300 transition">
                      {emp.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {emp.employeeId}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400">
                    {emp.designation}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-950/80 text-teal-300 border border-teal-800/50 font-bold">
                      Post: {emp.post || 'Sublimation Specialist'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-bold">
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

      {/* Main Print Queue Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Live Factory Print & Heat Press Queue
            </h3>
            <p className="text-[11px] text-slate-400">
              Assign dedicated operator to each Job Card or advance physical production stage
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80 space-y-3">
          {printQueue.map((order) => {
            const materials = calculateFabricConsumption(
              order.sizeBreakdown || {},
              order.fabricType
            );

            return (
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                      {order.stage.replace(/_/g, ' ')}
                    </span>
                    {order.collarType && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">
                        Collar: {order.collarType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="text-slate-400 text-[11px] flex items-center gap-4 flex-wrap">
                    <span>Client: {order.clientName}</span>
                    <span>
                      Quantity:{' '}
                      <strong className="text-slate-200">{order.totalQuantity} pcs</strong>
                    </span>
                    <span>
                      Fabric: <strong className="text-slate-200">{order.fabricType}</strong>
                    </span>
                    <span>
                      Linear Meters:{' '}
                      <strong className="text-indigo-400">{materials.fabricMeters}m</strong>
                    </span>
                    <span>
                      Est. Ink:{' '}
                      <strong className="text-amber-400">~{materials.inkEstimatedMl}ml</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-slate-400">Assigned Operator:</span>
                      <select
                        value={order.assignedToEmployeeName || ''}
                        onChange={(e) =>
                          onUpdateOrder(order.id, { assignedToEmployeeName: e.target.value })
                        }
                        className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-bold text-[11px]"
                      >
                        <option value="">Select Operator...</option>
                        {printFactoryStaff.map((emp) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name} ({emp.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    {order.printReadyLink && (
                      <a
                        href={order.printReadyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        🔗 Open High-Res Print File <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Direct Stage Advance Buttons for Factory Floor Workers */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {order.stage === 'pattern_spec_ready' && (
                    <button
                      onClick={() => handleStageChange(order.id, 'paper_printed')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Paper Printed</span>
                    </button>
                  )}

                  {order.stage === 'paper_printed' && (
                    <button
                      onClick={() => handleStageChange(order.id, 'heat_press_done')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Heat Press Completed</span>
                    </button>
                  )}

                  {order.stage === 'heat_press_done' && (
                    <button
                      onClick={() =>
                        handleStageChange(order.id, 'fabric_dispatched', {
                          deliveryChallanNumber: `CHAL-PF-${Math.floor(
                            1000 + Math.random() * 9000
                          )}`,
                          fabricDispatchedAt: new Date().toISOString(),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Fabric Roll to Sewing</span>
                    </button>
                  )}

                  {order.stage === 'fabric_dispatched' && (
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-400 block text-xs">
                        {order.deliveryChallanNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">On Shuttle Van</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectOrder(order)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
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
