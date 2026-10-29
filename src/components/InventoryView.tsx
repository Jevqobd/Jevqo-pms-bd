/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryItem, UserRole } from '../types/erp';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Printer,
  Scissors,
  CheckCircle2,
  TrendingDown,
  Layers,
  X,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  currentRole: UserRole;
  onUpdateStock: (itemId: string, newStock: number) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  currentRole,
  onUpdateStock,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = inventory.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    return true;
  });

  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minimumThreshold).length;

  const handleAdjustStock = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const newStock = Math.max(0, editingItem.currentStock + adjustmentValue);
      await onUpdateStock(editingItem.id, newStock);
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">
              Factory Raw Materials & Warehouse Inventory
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl">
              Monitors white sublimation polyester rolls, transfer paper rolls, CMYK high-density sublimation inks, and sewing accessories across the Print and Sewing factories.
            </p>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-amber-950 font-black text-xs flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{lowStockCount} Item(s) Below Minimum Stock!</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto text-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            categoryFilter === 'all'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          All Raw Materials ({inventory.length})
        </button>
        <button
          onClick={() => setCategoryFilter('fabric')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            categoryFilter === 'fabric'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Blank Polyester Fabrics
        </button>
        <button
          onClick={() => setCategoryFilter('paper')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            categoryFilter === 'paper'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Sublimation Paper Rolls
        </button>
        <button
          onClick={() => setCategoryFilter('ink')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            categoryFilter === 'ink'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          CMYK Inks
        </button>
        <button
          onClick={() => setCategoryFilter('thread')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
            categoryFilter === 'thread'
              ? 'bg-emerald-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          Sewing Thread Cones
        </button>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isLowStock = item.currentStock <= item.minimumThreshold;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                isLowStock
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30'
                  : 'bg-white dark:bg-gray-850 border-gray-200 dark:border-gray-800 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    {item.category} &bull; {item.location.replace('_', ' ')}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
                    {item.name}
                  </h3>
                </div>

                {isLowStock ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Low Stock
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Optimal
                  </span>
                )}
              </div>

              {/* Stock Gauge */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-750 mb-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {item.currentStock}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 ml-1">
                      {item.unit}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Min Threshold: <strong>{item.minimumThreshold} {item.unit}</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (item.currentStock / (item.minimumThreshold * 2.5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Adjustment Button */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 text-[11px]">
                  Unit Cost: ${item.unitCost || 0}
                </span>
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setAdjustmentValue(50);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 font-bold text-gray-800 dark:text-gray-200 transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Adjust Stock
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Adjust Stock: {editingItem.name}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-1">
              <div>Current Level: <strong>{editingItem.currentStock} {editingItem.unit}</strong></div>
              <div>Location: <strong>{editingItem.location.replace('_', ' ')}</strong></div>
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Quantity Change (+ to receive, - to deduct usage)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg text-xs font-bold"
                />
                <span className="font-semibold">{editingItem.unit}</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentValue(50)}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentValue(100)}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentValue(-20)}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-red-600"
                >
                  -20
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 border rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleAdjustStock}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
