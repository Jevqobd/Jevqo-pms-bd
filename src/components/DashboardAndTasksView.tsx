/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Order,
  ShortageTicket,
  UserRole,
  FactoryLocation,
  OrderStage,
  ROLE_CONFIGS,
  AttendanceRecord,
  DailyFactoryOutput,
} from '../types/erp';
import {
  Language,
  getTranslation,
  getStageTranslation,
  getRoleName,
} from '../utils/translations';
import { canTransitionStage } from '../utils/erpLogic';
import { ProductivityInsightsSection } from './ProductivityInsightsSection';
import { ErpStorageService } from '../services/erpStorageService';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Scissors,
  Building2,
  ShieldAlert,
  Clock,
  QrCode,
  Sparkles,
  Users,
  ChevronRight,
  TrendingUp,
  FileCheck,
  PackageCheck,
  Zap,
} from 'lucide-react';

interface DashboardAndTasksViewProps {
  orders: Order[];
  shortageTickets: ShortageTicket[];
  attendance: AttendanceRecord[];
  currentRole: UserRole;
  language: Language;
  productivityData?: DailyFactoryOutput[];
  onSelectOrder: (order: Order) => void;
  onAdvanceStage: (order: Order, targetStage: OrderStage) => void;
  onOpenCreateOrder: () => void;
  onOpenQrScanner: () => void;
  onOpenShortages: () => void;
  onOpenQrBundleTag: (order: Order) => void;
  onOpenAttendance: () => void;
}

export const DashboardAndTasksView: React.FC<DashboardAndTasksViewProps> = ({
  orders,
  shortageTickets,
  attendance,
  currentRole,
  language,
  productivityData,
  onSelectOrder,
  onAdvanceStage,
  onOpenCreateOrder,
  onOpenQrScanner,
  onOpenShortages,
  onOpenQrBundleTag,
  onOpenAttendance,
}) => {
  const roleConfig = ROLE_CONFIGS[currentRole];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const openShortages = shortageTickets.filter((t) => t.status !== 'resolved');

  // Filter tasks that need immediate action from the current role
  const getRolePendingOrders = (): Order[] => {
    switch (currentRole) {
      case 'owner':
        return orders.filter(
          (o) =>
            o.stage === 'payment_pending' ||
            o.stage === 'mockup_approved' ||
            o.stage === 'quality_finishing' ||
            o.hasShortage === 'yes'
        );
      case 'marketing':
        return orders.filter(
          (o) =>
            o.stage === 'payment_pending' ||
            o.stage === 'mockup_in_progress' ||
            o.stage === 'quality_finishing' ||
            o.stage === 'shipped'
        );
      case 'design_mockup':
        return orders.filter(
          (o) => o.stage === 'payment_verified' || o.stage === 'mockup_in_progress'
        );
      case 'design_pattern':
        return orders.filter(
          (o) => o.stage === 'mockup_approved' || (o.hasShortage === 'yes' && o.stage.includes('print'))
        );
      case 'print_factory':
        return orders.filter(
          (o) =>
            o.stage === 'pattern_spec_ready' ||
            o.stage === 'paper_printed' ||
            o.hasShortage === 'yes'
        );
      case 'sewing_factory':
        return orders.filter(
          (o) =>
            o.stage === 'fabric_dispatched' ||
            o.stage === 'fabric_received' ||
            o.stage === 'cutting_sewing' ||
            o.stage === 'quality_finishing'
        );
      case 'accountant':
        return orders.filter(
          (o) => o.stage === 'payment_pending' || o.paymentStatus !== 'paid_in_full'
        );
      case 'hr_manager':
        return orders.slice(0, 5);
      case 'floor_worker':
        return orders.filter(
          (o) =>
            o.stage === 'cutting_sewing' ||
            o.stage === 'paper_printed' ||
            o.stage === 'heat_press_done'
        );
      default:
        return orders.slice(0, 6);
    }
  };

  const pendingOrders = getRolePendingOrders();

  // Find next valid stage helper
  const getNextStageForOrder = (order: Order): OrderStage | null => {
    const stageFlow: OrderStage[] = [
      'payment_pending',
      'payment_verified',
      'mockup_in_progress',
      'mockup_approved',
      'pattern_spec_ready',
      'paper_printed',
      'heat_press_done',
      'fabric_dispatched',
      'fabric_received',
      'cutting_sewing',
      'quality_finishing',
      'shipped',
      'delivered',
    ];
    const currentIndex = stageFlow.indexOf(order.stage);
    if (currentIndex >= 0 && currentIndex < stageFlow.length - 1) {
      const next = stageFlow[currentIndex + 1];
      if (canTransitionStage(order.stage, next, currentRole)) {
        return next;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Persona Command Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {'LIVE CONTROL ROOM'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{getRoleName(currentRole, language)}</span>
              <span className="text-sm font-normal text-slate-400">
                • {roleConfig.location.replace('_', ' ').toUpperCase()}
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {'Centralized manufacturing execution and real-time handoff between Banani HQ, Tongi Mill, and Mirpur Sewing Factory.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCreateOrder}
              className="btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-200" />
              <span>{getTranslation('newOrderBtn', language)}</span>
            </button>

            <button
              onClick={onOpenQrScanner}
              className="btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>{getTranslation('scanQrBtn', language)}</span>
            </button>

            <button
              onClick={onOpenAttendance}
              className="btn-press flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>{'Dept Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Urgent Shortage Re-Print Alert (Flashing if active) */}
      {openShortages.length > 0 && (
        <div className="card-hover-rose bg-rose-950/40 border border-rose-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white">
                  {getTranslation('shortageAlertBanner', language)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce">
                  {openShortages.length} {'Tickets'}
                </span>
              </div>
              <p className="text-xs text-rose-300/80">
                {'Sewing floor raised urgent re-print tickets for ruined pattern pieces (collar/sleeves/front panels). Expedited print needed.'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenShortages}
            className="btn-press px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>{'View Re-Print Queue'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Dark Theme Eye-Friendly KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Orders */}
        <div className="card-hover bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">
              {getTranslation('activeOrdersCount', language)}
            </span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {orders.length}
          </div>
          <p className="text-[11px] text-slate-400">
            {'Across Banani, Tongi & Mirpur'}
          </p>
        </div>

        {/* My Role Tasks */}
        <div className="card-hover bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">
              {'Pending in My Dept'}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {pendingOrders.length}
          </div>
          <p className="text-[11px] text-slate-400">
            {'Immediate handoff actions'}
          </p>
        </div>

        {/* Urgent Shortages */}
        <div className="card-hover bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">
              {getTranslation('urgentShortagesCount', language)}
            </span>
            <AlertTriangle className={`w-4 h-4 ${openShortages.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${openShortages.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {openShortages.length}
          </div>
          <p className="text-[11px] text-slate-400">
            {'Expedited floor tickets'}
          </p>
        </div>

        {/* Shift Attendance */}
        <div className="card-hover bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">
              {getTranslation('todayClockIns', language)}
            </span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">
            {presentCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {'Operators & staff clocked in'}
          </p>
        </div>
      </div>

      {/* 3.5. Recharts Productivity Insights: Print & Sewing Factory Output vs Target */}
      <ProductivityInsightsSection
        data={productivityData || ErpStorageService.getLocalProductivity()}
        language={language}
      />

      {/* 4. "My Role Task Queue" (Immediate 1-Click Action Hub) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{getTranslation('taskQueueTitle', language)}</span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {pendingOrders.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {getTranslation('taskQueueSubtitle', language)}
            </p>
          </div>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
            <h4 className="font-bold text-sm text-white">
              {getTranslation('noPendingTasks', language)}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {'No pending orders waiting for your department handoff right now. Great job keeping the line moving!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order) => {
              const stageInfo = getStageTranslation(order.stage, language);
              const nextStage = getNextStageForOrder(order);
              const nextStageInfo = nextStage ? getStageTranslation(nextStage, language) : null;

              return (
                <div
                  key={order.id}
                  className="card-hover bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Job Number & Current Stage Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                          {order.orderNumber}
                        </span>
                        <h3 className="font-black text-sm text-white mt-1 leading-snug">
                          {order.teamOrClub || order.clientName}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {order.clientName} • {order.totalQuantity} {'pcs'}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {stageInfo.title}
                      </span>
                    </div>

                    {/* Stage Explanation */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{'Current Stage Details'}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {stageInfo.desc}
                      </p>
                    </div>

                    {/* Fabric and Size Spec Summary */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>{order.fabricType}</span>
                      <span>৳{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    {nextStage && nextStageInfo && (
                      <button
                        onClick={() => onAdvanceStage(order, nextStage)}
                        className="btn-press w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer"
                        title={nextStageInfo.actionPrompt}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>
                          {'Advance'}: {nextStageInfo.nextStepName}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="btn-press flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 cursor-pointer"
                      >
                        <FileCheck className="w-3 h-3 text-indigo-400" />
                        <span>{getTranslation('viewDetails', language)}</span>
                      </button>

                      <button
                        onClick={() => onOpenQrBundleTag(order)}
                        className="btn-press flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-emerald-400" />
                        <span>{getTranslation('printQrTag', language)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
