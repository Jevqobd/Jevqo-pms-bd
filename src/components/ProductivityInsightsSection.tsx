/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { DailyFactoryOutput } from '../types/erp';
import { Language } from '../utils/translations';
import {
  TrendingUp,
  Printer,
  Scissors,
  Target,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface ProductivityInsightsSectionProps {
  data: DailyFactoryOutput[];
  language?: Language;
}

export const ProductivityInsightsSection: React.FC<ProductivityInsightsSectionProps> = ({
  data,
  language = 'en',
}) => {
  const [metricTab, setMetricTab] = useState<'both' | 'print' | 'sewing'>('both');

  const todayData = data[data.length - 1] || data[0];
  const printEfficiency = Math.round((todayData.printActual / (todayData.printTarget || 1)) * 100);
  const sewingEfficiency = Math.round((todayData.sewingActual / (todayData.sewingTarget || 1)) * 100);

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
          <div className="font-black text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Daily Shift Record</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-mono text-[11px]">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
                {entry.value} {entry.dataKey.includes('print') ? 'm' : 'pcs'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>{'Productivity Insights: Print & Sewing Factories'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono">
                  Live Telemetry
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {'Daily output vs. engineering targets for Tongi Print Mill (meters) and Mirpur Sewing Line (pieces).'}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMetricTab('both')}
            className={`btn-press px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              metricTab === 'both' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            {'Combined View'}
          </button>
          <button
            onClick={() => setMetricTab('print')}
            className={`btn-press px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              metricTab === 'print' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3 h-3" />
            <span>{'Tongi Print'}</span>
          </button>
          <button
            onClick={() => setMetricTab('sewing')}
            className={`btn-press px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              metricTab === 'sewing' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span>{'Mirpur Sewing'}</span>
          </button>
        </div>
      </div>

      {/* Target vs Actual KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tongi Print */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>{'Tongi Print Mill'}</span>
            </span>
            <span className="text-emerald-400 font-bold font-mono text-[11px]">{printEfficiency}% of Target</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">
              {todayData.printActual} <span className="text-xs font-normal text-slate-400">meters</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Target: {todayData.printTarget}m</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
              style={{ width: `${Math.min(printEfficiency, 100)}%` }}
            />
          </div>
        </div>

        {/* Mirpur Sewing */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span>{'Mirpur Sewing Line'}</span>
            </span>
            <span className="text-indigo-400 font-bold font-mono text-[11px]">{sewingEfficiency}% of Target</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">
              {todayData.sewingActual} <span className="text-xs font-normal text-slate-400">pieces</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Target: {todayData.sewingTarget} pcs</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400"
              style={{ width: `${Math.min(sewingEfficiency, 100)}%` }}
            />
          </div>
        </div>

        {/* Quality Defect / Ruined Rate */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{'Ruined Pieces Rate'}</span>
            </span>
            <span className="text-emerald-400 font-bold font-mono text-[11px]">99.1% First-Pass Yield</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-amber-400 font-mono">
              {todayData.reprintsRuined} <span className="text-xs font-normal text-slate-400">re-prints</span>
            </span>
            <span className="text-xs text-emerald-400 font-mono">Target: &lt;10 pcs</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
              style={{ width: `${Math.max(100 - todayData.reprintsRuined * 3, 20)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricTab === 'both' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Bar
                name={'Tongi Print (Meters)'}
                dataKey="printActual"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name={'Mirpur Sewing (Pieces)'}
                dataKey="sewingActual"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : metricTab === 'print' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="printGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="printActual"
                name={'Actual Sublimation (Meters)'}
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#printGradient)"
              />
              <Line
                type="monotone"
                dataKey="printTarget"
                name={'Target Output (650m)'}
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="sewingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="sewingActual"
                name={'Actual Stitched (Pieces)'}
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sewingGradient)"
              />
              <Line
                type="monotone"
                dataKey="sewingTarget"
                name={'Target Output (450 pcs)'}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
