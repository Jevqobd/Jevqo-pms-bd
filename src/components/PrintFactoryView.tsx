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
  InventoryItem,
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
  Plus,
  Layers,
  Shirt,
  Ribbon,
  Save,
  Sparkles,
  Check,
  Sliders,
} from 'lucide-react';
import {
  calculateFabricConsumption,
  calculatePrintConsumptionDefaults,
} from '../utils/erpLogic';

interface PrintFactoryViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  currentRole: UserRole;
  onUpdateOrder: (orderId: string, partial: Partial<Order>) => Promise<void>;
  onSelectOrder: (order: Order) => void;
  employees?: Employee[];
  inventory?: InventoryItem[];
  onOpenEmployeeProfile?: (emp: Employee) => void;
  onUpdateEmployee?: (employeeId: string, partial: Partial<Employee>) => Promise<void>;
}

interface PrintLogDraft {
  printedMeters: number;
  fabricUsedName: string;
  fabricUsedKg: number;
  fabricUsedMeters: number;
  heatPressJerseyCount: number;
  ribbonUsedMeters: number;
  ribbonUsedKg: number;
  collarUsedPcs: number;
  collarTypeUsed: string;
  printLogNotes: string;
}

export const PrintFactoryView: React.FC<PrintFactoryViewProps> = ({
  orders,
  shortageTickets,
  onUpdateOrder,
  onSelectOrder,
  employees = [],
  inventory = [],
  onOpenEmployeeProfile,
  onUpdateEmployee,
}) => {
  const [selectedStaffToTransfer, setSelectedStaffToTransfer] = useState('');
  const [expandedLogOrderId, setExpandedLogOrderId] = useState<string | null>(
    orders[0]?.id || null
  );
  const [logDrafts, setLogDrafts] = useState<Record<string, PrintLogDraft>>({});
  const [savedNoticeOrderId, setSavedNoticeOrderId] = useState<string | null>(null);

  const printQueue = orders.filter((o) =>
    [
      'pattern_spec_ready',
      'paper_printed',
      'heat_press_done',
      'fabric_dispatched',
      'cutting_sewing',
    ].includes(o.stage)
  );

  const urgentShortages = shortageTickets.filter(
    (t) => t.status === 'open' || t.status === 'reprint_file_ready' || t.status === 'reprinted'
  );

  const printFactoryStaff = employees.filter((e) => e.location === 'print_factory');
  const otherFactoryStaff = employees.filter((e) => e.location !== 'print_factory');
  const fabricInventoryOptions = inventory.filter((i) => i.category === 'fabric');

  const getDraftForOrder = (order: Order): PrintLogDraft => {
    if (logDrafts[order.id]) return logDrafts[order.id];
    const defaults = calculatePrintConsumptionDefaults(
      order.totalQuantity || 25,
      order.gsm || 160
    );
    return {
      printedMeters: order.printedMeters ?? defaults.printedMeters,
      fabricUsedName: order.fabricUsedName || `${order.fabricType} (${order.gsm || 160} GSM)`,
      fabricUsedKg: order.fabricUsedKg ?? defaults.fabricUsedKg,
      fabricUsedMeters: order.fabricUsedMeters ?? defaults.fabricUsedMeters,
      heatPressJerseyCount: order.heatPressJerseyCount ?? defaults.heatPressJerseyCount,
      ribbonUsedMeters: order.ribbonUsedMeters ?? defaults.ribbonUsedMeters,
      ribbonUsedKg: order.ribbonUsedKg ?? defaults.ribbonUsedKg,
      collarUsedPcs: order.collarUsedPcs ?? defaults.collarUsedPcs,
      collarTypeUsed: order.collarTypeUsed || order.collarType || 'V-Neck Rib Collar',
      printLogNotes: order.printLogNotes || '202°C @ 35s Rotary Calendar Transfer',
    };
  };

  const updateOrderLogField = <K extends keyof PrintLogDraft>(
    order: Order,
    field: K,
    value: PrintLogDraft[K]
  ) => {
    const current = getDraftForOrder(order);
    setLogDrafts((prev) => ({
      ...prev,
      [order.id]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const handleAutoCalculateOrderLog = (order: Order) => {
    const defaults = calculatePrintConsumptionDefaults(
      order.totalQuantity || 25,
      order.gsm || 160
    );
    setLogDrafts((prev) => ({
      ...prev,
      [order.id]: {
        printedMeters: defaults.printedMeters,
        fabricUsedName: order.fabricUsedName || `${order.fabricType} (${order.gsm || 160} GSM)`,
        fabricUsedKg: defaults.fabricUsedKg,
        fabricUsedMeters: defaults.fabricUsedMeters,
        heatPressJerseyCount: defaults.heatPressJerseyCount,
        ribbonUsedMeters: defaults.ribbonUsedMeters,
        ribbonUsedKg: defaults.ribbonUsedKg,
        collarUsedPcs: defaults.collarUsedPcs,
        collarTypeUsed: order.collarType || 'V-Neck Jacquard Collar',
        printLogNotes: 'Auto-calculated from order quantity & GSM',
      },
    }));
  };

  const handleSavePrintConsumptionLog = async (order: Order) => {
    const draft = getDraftForOrder(order);
    await onUpdateOrder(order.id, {
      printedMeters: Number(draft.printedMeters) || 0,
      fabricUsedName: draft.fabricUsedName,
      fabricUsedKg: Number(draft.fabricUsedKg) || 0,
      fabricUsedMeters: Number(draft.fabricUsedMeters) || 0,
      heatPressJerseyCount: Number(draft.heatPressJerseyCount) || 0,
      ribbonUsedMeters: Number(draft.ribbonUsedMeters) || 0,
      ribbonUsedKg: Number(draft.ribbonUsedKg) || 0,
      collarUsedPcs: Number(draft.collarUsedPcs) || 0,
      collarTypeUsed: draft.collarTypeUsed,
      printLogNotes: draft.printLogNotes,
      printLogUpdatedBy: order.assignedToEmployeeName || 'Tongi Print Operator',
      printLogUpdatedAt: new Date().toISOString(),
    });
    setSavedNoticeOrderId(order.id);
    setTimeout(() => setSavedNoticeOrderId(null), 3500);
  };

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

  // Aggregate Print Floor Totals
  const totals = printQueue.reduce(
    (acc, ord) => {
      const d = getDraftForOrder(ord);
      acc.printedMeters += Number(ord.printedMeters ?? d.printedMeters) || 0;
      acc.fabricKg += Number(ord.fabricUsedKg ?? d.fabricUsedKg) || 0;
      acc.fabricMeters += Number(ord.fabricUsedMeters ?? d.fabricUsedMeters) || 0;
      acc.heatPressJerseys += Number(ord.heatPressJerseyCount ?? d.heatPressJerseyCount) || 0;
      acc.ribbonMeters += Number(ord.ribbonUsedMeters ?? d.ribbonUsedMeters) || 0;
      acc.ribbonKg += Number(ord.ribbonUsedKg ?? d.ribbonUsedKg) || 0;
      acc.collarPcs += Number(ord.collarUsedPcs ?? d.collarUsedPcs) || 0;
      return acc;
    },
    {
      printedMeters: 0,
      fabricKg: 0,
      fabricMeters: 0,
      heatPressJerseys: 0,
      ribbonMeters: 0,
      ribbonKg: 0,
      collarPcs: 0,
    }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Factory Banner (Bilingual Bangla & English) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Printer className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                Print Factory Floor Operations (Tongi Hub)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                Sublimation, Fabric KG/Meter, Heat Press, Ribbon & Collar Tracker
              </span>
            </div>
            <p className="text-xs text-emerald-100 max-w-3xl font-bangla mt-0.5">
              Log and track sublimation printed meters, fabric consumption (KG/Meters), heat-pressed jersey count, ribbon usage (Meters/KG), and collar pieces per order.
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
            <span className="text-[10px] text-emerald-100 block">Staff</span>
            <span className="text-xl font-black text-white">{printFactoryStaff.length}</span>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center px-2">
            <span className="text-[10px] text-emerald-100 block">Shortages</span>
            <span className="text-xl font-black text-amber-300">{urgentShortages.length}</span>
          </div>
        </div>
      </div>

      {/* Print Floor Material & Production Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 uppercase">
            <span>Printed Meters</span>
            <Printer className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {totals.printedMeters.toFixed(1)} m
          </div>
          <div className="text-[10px] text-slate-400 font-bangla">
            Total sublimation print length
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase">
            <span>Fabric Used</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {totals.fabricKg.toFixed(1)} KG / {totals.fabricMeters.toFixed(1)} m
          </div>
          <div className="text-[10px] text-slate-400 font-bangla">
            Fabric consumed (KG & Meters)
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase">
            <span>Heat Press Jersey</span>
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {totals.heatPressJerseys} Pcs
          </div>
          <div className="text-[10px] text-slate-400 font-bangla">
            Total heat-pressed jerseys
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-purple-400 uppercase">
            <span>Ribbon Used</span>
            <Ribbon className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {totals.ribbonMeters.toFixed(1)} m ({totals.ribbonKg.toFixed(2)} KG)
          </div>
          <div className="text-[10px] text-slate-400 font-bangla">
            Neck tape & lanyard ribbon
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400 uppercase">
            <span>Collar Used</span>
            <Shirt className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {totals.collarPcs} Pcs
          </div>
          <div className="text-[10px] text-slate-400 font-bangla">
            Total collars consumed (Pcs)
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
              <span>
                Tongi Print Factory Personnel, Designations & Posts)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-bangla">
              Click any staff profile to update NID, contract, designation, and permissions
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

      {/* Main Print Queue & Material Consumption Logging Cards */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Live Factory Print Queue & Material Consumption Entry
            </h3>
            <p className="text-[11px] text-slate-400 font-bangla">
              Enter printed meters, fabric KG/meter consumption, heat-press jersey count, ribbon, and collar pieces for each order
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {printQueue.map((order) => {
            const materials = calculateFabricConsumption(
              order.sizeBreakdown || {},
              order.fabricType
            );
            const draft = getDraftForOrder(order);
            const isExpanded = expandedLogOrderId === order.id;

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition space-y-3"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold">
                        Collar: {(order.collarTypeUsed || order.collarType || 'V-Neck').replace('_', ' ')} ({draft.collarUsedPcs} Pcs)
                      </span>
                    </div>

                    <div className="text-slate-400 text-[11px] flex items-center gap-4 flex-wrap">
                      <span>Client: {order.clientName}</span>
                      <span>
                        Order Qty:{' '}
                        <strong className="text-slate-200">{order.totalQuantity} pcs</strong>
                      </span>
                      <span>
                        Printed:{' '}
                        <strong className="text-emerald-400 font-mono">{draft.printedMeters}m</strong>
                      </span>
                      <span>
                        Fabric Used:{' '}
                        <strong className="text-cyan-300 font-mono">
                          {draft.fabricUsedKg} KG / {draft.fabricUsedMeters}m ({draft.fabricUsedName})
                        </strong>
                      </span>
                      <span>
                        Heat Press Jersey:{' '}
                        <strong className="text-amber-300 font-mono">
                          {draft.heatPressJerseyCount} pcs
                        </strong>
                      </span>
                      <span>
                        Ribbon:{' '}
                        <strong className="text-purple-300 font-mono">
                          {draft.ribbonUsedMeters}m ({draft.ribbonUsedKg} KG)
                        </strong>
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
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-[11px]"
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

                  {/* Direct Stage Advance & Consumption Toggle Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setExpandedLogOrderId(isExpanded ? null : order.id)}
                      className={`btn-press px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border cursor-pointer ${
                        isExpanded
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>
                        {isExpanded
                          ? 'Hide Print & Material Log'
                          : 'Log Print Meter / Fabric KG / Ribbon / Collar'}
                      </span>
                    </button>

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

                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                    >
                      Job Specs
                    </button>
                  </div>
                </div>

                {/* Expandable Print, Fabric KG/Meter, Heat Press, Ribbon & Collar Consumption Form */}
                {isExpanded && (
                  <div className="pt-3 mt-2 border-t border-slate-800/90 bg-slate-900/80 p-4 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-black text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-400" />
                          <span>
                            Order {order.orderNumber} — Print, Fabric, Heat Press, Ribbon & Collar Consumption Log
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-300 font-bangla">
                          Enter printed meters, fabric KG/meters used, heat-pressed jerseys, ribbon, and collar pieces below:
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAutoCalculateOrderLog(order)}
                        className="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer self-start"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Calculate From {order.totalQuantity} Pcs</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* 1. How many Meter is Printed */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-emerald-400 block">
                          1. Printed Sublimation (Meters)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={draft.printedMeters}
                          onChange={(e) =>
                            updateOrderLogField(order, 'printedMeters', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                        />
                      </div>

                      {/* 2. From Which Fabric */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-cyan-400 block">
                          2. Which Fabric Used
                        </label>
                        <input
                          type="text"
                          list={`fabric-list-${order.id}`}
                          value={draft.fabricUsedName}
                          onChange={(e) =>
                            updateOrderLogField(order, 'fabricUsedName', e.target.value)
                          }
                          placeholder="e.g. Micro-Eyelet 160 GSM"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                        />
                        <datalist id={`fabric-list-${order.id}`}>
                          <option value="Micro-Eyelet 160 GSM (White Roll)" />
                          <option value="Poly Interlock 180 GSM (Sublimation)" />
                          <option value="Honeycomb Pro Mesh 170 GSM" />
                          <option value="Jacquard Breathable 145 GSM" />
                          {fabricInventoryOptions.map((item) => (
                            <option key={item.id} value={item.name} />
                          ))}
                        </datalist>
                      </div>

                      {/* 3. How many KGs & Meters from Fabric */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-cyan-400 block">
                          3. Fabric KGs & Meters
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <input
                              type="number"
                              step="0.1"
                              value={draft.fabricUsedKg}
                              onChange={(e) =>
                                updateOrderLogField(order, 'fabricUsedKg', Number(e.target.value))
                              }
                              placeholder="KG"
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                            />
                            <span className="text-[9px] text-slate-400">KG</span>
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.1"
                              value={draft.fabricUsedMeters}
                              onChange={(e) =>
                                updateOrderLogField(
                                  order,
                                  'fabricUsedMeters',
                                  Number(e.target.value)
                                )
                              }
                              placeholder="Meters"
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                            />
                            <span className="text-[9px] text-slate-400">Meters</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Heat Press for Jersey (Pcs) */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-amber-400 block">
                          4. Heat Press for Jersey (Pcs)
                        </label>
                        <input
                          type="number"
                          value={draft.heatPressJerseyCount}
                          onChange={(e) =>
                            updateOrderLogField(
                              order,
                              'heatPressJerseyCount',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                        />
                      </div>

                      {/* 5. How much Meter / KG used for Ribbon */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-purple-400 block">
                          5. Ribbon Used (Meter & KG)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <input
                              type="number"
                              step="0.1"
                              value={draft.ribbonUsedMeters}
                              onChange={(e) =>
                                updateOrderLogField(
                                  order,
                                  'ribbonUsedMeters',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                            />
                            <span className="text-[9px] text-slate-400">Ribbon Meters</span>
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={draft.ribbonUsedKg}
                              onChange={(e) =>
                                updateOrderLogField(order, 'ribbonUsedKg', Number(e.target.value))
                              }
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                            />
                            <span className="text-[9px] text-slate-400">Ribbon KG</span>
                          </div>
                        </div>
                      </div>

                      {/* 6. How many Pcs Collar used for that Order */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 block">
                          6. Collar Used (Pcs)
                        </label>
                        <input
                          type="number"
                          value={draft.collarUsedPcs}
                          onChange={(e) =>
                            updateOrderLogField(order, 'collarUsedPcs', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                        />
                      </div>

                      {/* 7. Collar Type / Rib Specification */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 block">
                          7. Collar Rib Type
                        </label>
                        <input
                          type="text"
                          value={draft.collarTypeUsed}
                          onChange={(e) =>
                            updateOrderLogField(order, 'collarTypeUsed', e.target.value)
                          }
                          placeholder="Polo Jacquard Rib / V-Neck"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                      </div>

                      {/* 8. Press Temp & Operator Notes */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block">
                          8. Heat Press & Batch Notes
                        </label>
                        <input
                          type="text"
                          value={draft.printLogNotes}
                          onChange={(e) =>
                            updateOrderLogField(order, 'printLogNotes', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        {savedNoticeOrderId === order.id ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Saved Print Meter, Fabric KG/Meter, Heat Press, Ribbon & Collar Pcs for {order.orderNumber}!
                          </span>
                        ) : (
                          <span>
                            Last updated by:{' '}
                            <strong className="text-slate-200">
                              {order.printLogUpdatedBy || order.assignedToEmployeeName || 'Print Floor Lead'}
                            </strong>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSavePrintConsumptionLog(order)}
                        className="btn-press px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer self-end sm:self-auto"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Order Print & Material Log</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
