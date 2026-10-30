/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  InventoryItem,
  InventoryCategory,
  CompanyAsset,
  AssetCategory,
  Employee,
  Order,
  UserRole,
} from '../types/erp';
import { useFormDraft } from '../utils/useFormDraft';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Printer,
  Scissors,
  CheckCircle2,
  Layers,
  X,
  Monitor,
  Cpu,
  Wrench,
  UserCheck,
  Search,
  Sliders,
  Save,
  Trash2,
  ArrowRight,
  FileCheck,
  Tag,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  assets?: CompanyAsset[];
  employees?: Employee[];
  orders?: Order[];
  currentRole: UserRole;
  onUpdateStock: (itemId: string, newStock: number) => Promise<void>;
  onCreateInventoryItem?: (item: InventoryItem) => Promise<void>;
  onDeleteInventoryItem?: (itemId: string) => Promise<void>;
  onCreateAsset?: (asset: CompanyAsset) => Promise<void>;
  onUpdateAsset?: (assetId: string, partial: Partial<CompanyAsset>) => Promise<void>;
  onOpenEmployeeProfile?: (emp: Employee) => void;
}

const PREFERABLE_METRICS = [
  { value: 'meters', label: 'Meters (m) — Fabric / Transfer Paper Rolls' },
  { value: 'yards', label: 'Yards (yd) — Elastic / Ribbing Trims' },
  { value: 'kg', label: 'Kilograms (kg) — Knitted Collar / Bulk Yarn' },
  { value: 'grams', label: 'Grams (g) — Pigments / Powders' },
  { value: 'liters', label: 'Liters (L) — Sublimation CMYK Bulk Inks' },
  { value: 'ml', label: 'Milliliters (ml) — Cleaning Solutions / Cartridges' },
  { value: 'rolls', label: 'Rolls — Full Master Fabric / Paper Rolls' },
  { value: 'cones', label: 'Cones — Spun Polyester Overlock Threads' },
  { value: 'pieces', label: 'Pieces (pcs) — Woven Labels, Zippers, Polybags' },
  { value: 'boxes', label: 'Boxes — Master Shipping Cartons' },
  { value: 'sets', label: 'Sets — Complete Accessory Kits' },
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  assets = [],
  employees = [],
  orders = [],
  currentRole,
  onUpdateStock,
  onCreateInventoryItem,
  onDeleteInventoryItem,
  onCreateAsset,
  onUpdateAsset,
  onOpenEmployeeProfile,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'raw_materials' | 'company_assets'>('raw_materials');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Stock adjustment modal state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [linkedOrderIdForDeduct, setLinkedOrderIdForDeduct] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create Raw Item Modal & Auto-Draft
  const [isCreateRawModalOpen, setIsCreateRawModalOpen] = useState(false);
  const {
    draft: rawDraft,
    updateField: updateRawField,
    clearDraft: clearRawDraft,
    lastSavedAt: rawDraftSavedAt,
  } = useFormDraft('inventory_create_raw_item', {
    sku: `RAW-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    category: 'fabric' as InventoryCategory,
    location: 'print_factory' as 'print_factory' | 'sewing_factory' | 'head_office',
    currentStock: 100,
    unit: 'meters',
    customUnit: '',
    gsm: 160,
    rollWidth: '1.60m (62 inch)',
    supplierName: 'Bengal Synthetic Textile Mills',
    minimumThreshold: 50,
    unitCost: 2.8,
  });

  // Create Company Asset Modal & Auto-Draft
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const {
    draft: assetDraft,
    updateField: updateAssetField,
    clearDraft: clearAssetDraft,
    lastSavedAt: assetDraftSavedAt,
  } = useFormDraft('inventory_create_company_asset', {
    assetCode: `AST-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    category: 'sewing_machine' as AssetCategory,
    brandModel: '',
    serialNumber: '',
    location: 'sewing_factory' as 'head_office' | 'print_factory' | 'sewing_factory',
    assignedEmployeeId: '',
    status: 'operational' as CompanyAsset['status'],
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: 950,
    notes: '',
  });

  const filteredItems = inventory.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (
      searchTerm &&
      !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filteredAssets = assets.filter((ast) => {
    if (assetCategoryFilter !== 'all' && ast.category !== assetCategoryFilter) return false;
    if (
      searchTerm &&
      !ast.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ast.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(ast.assignedEmployeeName || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minimumThreshold).length;
  const totalInventoryValuation = inventory.reduce(
    (sum, i) => sum + i.currentStock * (i.unitCost || 0),
    0
  );
  const totalAssetValuation = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);

  const handleAdjustStock = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const newStock = Math.max(0, Number((editingItem.currentStock + adjustmentValue).toFixed(2)));
      await onUpdateStock(editingItem.id, newStock);
      setEditingItem(null);
      setLinkedOrderIdForDeduct('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawDraft.name.trim() || !onCreateInventoryItem) return;

    const finalMetric =
      rawDraft.unit === 'custom' && rawDraft.customUnit.trim()
        ? rawDraft.customUnit.trim()
        : rawDraft.unit;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: rawDraft.sku || `RAW-${Date.now().toString().slice(-4)}`,
      name: rawDraft.name.trim(),
      category: rawDraft.category,
      location: rawDraft.location,
      currentStock: Number(rawDraft.currentStock) || 0,
      unit: finalMetric,
      preferredMetric: finalMetric,
      gsm: rawDraft.category === 'fabric' || rawDraft.category === 'paper' ? Number(rawDraft.gsm) : undefined,
      rollWidth: rawDraft.rollWidth || undefined,
      supplierName: rawDraft.supplierName || undefined,
      minimumThreshold: Number(rawDraft.minimumThreshold) || 10,
      unitCost: Number(rawDraft.unitCost) || 0,
      updatedAt: new Date().toISOString(),
    };

    await onCreateInventoryItem(newItem);
    clearRawDraft();
    setIsCreateRawModalOpen(false);
  };

  const handleCreateAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetDraft.name.trim() || !onCreateAsset) return;

    const assignedEmp = employees.find((emp) => emp.id === assetDraft.assignedEmployeeId);

    const newAsset: CompanyAsset = {
      id: `ast-${Date.now()}`,
      assetCode: assetDraft.assetCode || `AST-${Date.now().toString().slice(-4)}`,
      name: assetDraft.name.trim(),
      category: assetDraft.category,
      brandModel: assetDraft.brandModel || 'Industrial Standard',
      serialNumber: assetDraft.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      location: assetDraft.location,
      assignedEmployeeId: assignedEmp?.id,
      assignedEmployeeName: assignedEmp?.name,
      status: assetDraft.status,
      purchaseDate: assetDraft.purchaseDate,
      purchaseValue: Number(assetDraft.purchaseValue) || 0,
      lastServicedDate: new Date().toISOString().split('T')[0],
      notes: assetDraft.notes,
    };

    await onCreateAsset(newAsset);
    clearAssetDraft();
    setIsCreateAssetModalOpen(false);
  };

  const getAssetBadge = (cat: AssetCategory) => {
    switch (cat) {
      case 'pc_workstation':
        return { label: 'PC / CAD Workstation', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'sewing_machine':
        return { label: 'Sewing Machine', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'sublimation_printer':
        return { label: 'Sublimation Plotter', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' };
      case 'heat_press':
        return { label: 'Rotary Heat Press', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'scanner_mobile':
        return { label: 'QR / Mobile Device', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: cat.replace('_', ' ').toUpperCase(), color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white border border-emerald-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md">
            <Package className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                Raw Materials Warehouse & Company Assets Registry
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-200">
                Multi-Metric Inventory &bull; Employee-Linked Hardware
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 max-w-2xl mt-0.5">
              Create raw items with custom preferable metrics (meters, kg, liters, cones, rolls), allocate stock to Job Cards, and track company assets (PCs, sewing machines, printers) linked directly to employees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {lowStockCount > 0 && (
            <div className="px-3 py-2 rounded-xl bg-amber-400 text-amber-950 font-black text-xs flex items-center gap-1.5 shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockCount} Low Stock Alert(s)</span>
            </div>
          )}

          <button
            onClick={() => setIsCreateRawModalOpen(true)}
            className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Raw Material</span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('company_assets');
              setIsCreateAssetModalOpen(true);
            }}
            className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span>+ Add Company Asset (PC/Machine)</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Raw SKUs</span>
          <div className="text-xl font-black text-white mt-1">{inventory.length} Items</div>
          <span className="text-[11px] text-emerald-400 font-semibold">
            Across 3 facilities
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Raw Stock Valuation</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ${totalInventoryValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-400">Live unit cost calculation</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Registered Company Assets</span>
          <div className="text-xl font-black text-indigo-400 mt-1">{assets.length} Devices</div>
          <span className="text-[11px] text-slate-400">PCs, Printers & Sewing Machines</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Hardware Asset Value</span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            ${totalAssetValuation.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">Assigned to factory staff</span>
        </div>
      </div>

      {/* Primary Module Switcher Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('raw_materials')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer ${
              activeMainTab === 'raw_materials'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Raw Materials & Preferable Metrics ({inventory.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('company_assets')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer ${
              activeMainTab === 'company_assets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Company Assets & Employee Devices ({assets.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeMainTab === 'raw_materials'
                ? 'Search raw material, SKU, fabric...'
                : 'Search PC, sewing machine, or employee...'
            }
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ===================== TAB 1: RAW MATERIALS ===================== */}
      {activeMainTab === 'raw_materials' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Raw Items (${inventory.length})` },
              { id: 'fabric', label: 'Polyester & Knit Fabrics' },
              { id: 'paper', label: 'Sublimation Paper Rolls' },
              { id: 'ink', label: 'CMYK Sublimation Inks' },
              { id: 'thread', label: 'Sewing Thread Cones' },
              { id: 'trims', label: 'Collars, Ribbing & Trims' },
              { id: 'accessories', label: 'Zippers, Buttons & Labels' },
              { id: 'packaging', label: 'Polybags & Cartons' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLowStock = item.currentStock <= item.minimumThreshold;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isLowStock
                      ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                            {item.sku || item.id.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {item.category} &bull; {item.location.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="font-black text-sm text-white leading-tight">
                          {item.name}
                        </h3>
                      </div>

                      {isLowStock ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse shrink-0">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                          Optimal
                        </span>
                      )}
                    </div>

                    {/* Technical Specs Pill */}
                    {(item.gsm || item.rollWidth || item.supplierName) && (
                      <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] text-slate-400">
                        {item.gsm && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                            {item.gsm} GSM
                          </span>
                        )}
                        {item.rollWidth && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                            Width: {item.rollWidth}
                          </span>
                        )}
                        {item.supplierName && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 truncate max-w-[180px]">
                            Supplier: {item.supplierName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stock Gauge with Preferable Metric */}
                    <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800/80 mb-3 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-black text-white font-mono">
                            {item.currentStock}
                          </span>
                          <span className="text-xs font-black text-emerald-400 ml-1.5 uppercase">
                            {item.preferredMetric || item.unit}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Min Alert:{' '}
                          <strong className="text-slate-200">
                            {item.minimumThreshold} {item.unit}
                          </strong>
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (item.currentStock / Math.max(1, item.minimumThreshold * 2.5)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[11px] font-mono">
                        Cost: <strong className="text-white">${item.unitCost || 0}</strong>/{item.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onDeleteInventoryItem && currentRole === 'owner' && (
                        <button
                          onClick={() => onDeleteInventoryItem(item.id)}
                          title="Delete Raw Item"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setAdjustmentValue(50);
                        }}
                        className="btn-press px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 font-bold text-emerald-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Adjust / Allocate</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: COMPANY ASSETS & EMPLOYEE DEVICES ===================== */}
      {activeMainTab === 'company_assets' && (
        <div className="space-y-4">
          {/* Asset Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Assets (${assets.length})` },
              { id: 'pc_workstation', label: '💻 PCs & CAD Workstations' },
              { id: 'sewing_machine', label: '🪡 Sewing Machines (Juki/Pegasus)' },
              { id: 'sublimation_printer', label: '🖨️ Sublimation Plotters' },
              { id: 'heat_press', label: '🔥 Rotary Heat Press' },
              { id: 'scanner_mobile', label: '📱 QR Scanners & Mobile Devices' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setAssetCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  assetCategoryFilter === cat.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => {
              const badge = getAssetBadge(asset.category);
              const assignedEmp = employees.find(
                (e) => e.id === asset.assignedEmployeeId || e.name === asset.assignedEmployeeName
              );

              return (
                <div
                  key={asset.id}
                  className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono font-black text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                            {asset.assetCode}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="font-black text-sm text-white">{asset.name}</h3>
                        <p className="text-[11px] text-slate-400">{asset.brandModel}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          asset.status === 'operational'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : asset.status === 'in_maintenance'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {asset.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Serial & Facility Info */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Serial Number</span>
                        <span className="font-mono font-bold text-slate-200">{asset.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-bold">Facility Floor</span>
                        <span className="font-bold text-emerald-400 uppercase">
                          {asset.location.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Linked Employee Assignment Box */}
                    <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-indigo-300 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> Assigned Operator / Staff
                        </span>
                        {assignedEmp && onOpenEmployeeProfile && (
                          <button
                            onClick={() => onOpenEmployeeProfile(assignedEmp)}
                            className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                          >
                            View Staff Profile &rarr;
                          </button>
                        )}
                      </div>

                      <select
                        value={asset.assignedEmployeeId || ''}
                        onChange={(e) => {
                          const emp = employees.find((x) => x.id === e.target.value);
                          onUpdateAsset?.(asset.id, {
                            assignedEmployeeId: emp?.id || '',
                            assignedEmployeeName: emp?.name || 'Unassigned',
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                      >
                        <option value="">-- Unassigned / Floor Pool --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.designation} • {emp.location.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status Switcher & Value Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Value: <strong className="text-white">${asset.purchaseValue.toLocaleString()}</strong>
                    </span>

                    <select
                      value={asset.status}
                      onChange={(e) =>
                        onUpdateAsset?.(asset.id, {
                          status: e.target.value as CompanyAsset['status'],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200"
                    >
                      <option value="operational">✅ Operational</option>
                      <option value="in_maintenance">🔧 In Maintenance</option>
                      <option value="repair_required">🚨 Repair Needed</option>
                      <option value="standby">⏸️ Standby</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: CREATE RAW MATERIAL ITEM (WITH AUTO-DRAFT) ===================== */}
      {isCreateRawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">
                    Create Raw Material Item & Metric
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    Draft Auto-Saved {rawDraftSavedAt ? `@ ${rawDraftSavedAt}` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Entries remain saved in draft until you click Cancel/Discard or Save.
                </p>
              </div>
              <button
                onClick={() => setIsCreateRawModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRawSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">SKU / Item Code</label>
                  <input
                    type="text"
                    required
                    value={rawDraft.sku}
                    onChange={(e) => updateRawField('sku', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Raw Material Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Honeycomb Micro-Mesh 165 GSM (Optical White)"
                    value={rawDraft.name}
                    onChange={(e) => updateRawField('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Material Category</label>
                  <select
                    value={rawDraft.category}
                    onChange={(e) => updateRawField('category', e.target.value as InventoryCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    <option value="fabric">Polyester / Athletic Fabric</option>
                    <option value="paper">Sublimation Transfer Paper</option>
                    <option value="ink">CMYK / Fluorescent Sublimation Ink</option>
                    <option value="thread">Overlock / Flatlock Thread Cones</option>
                    <option value="trims">Collar Ribbing / Elastic Trims</option>
                    <option value="accessories">Zippers / Woven Labels / Drawstrings</option>
                    <option value="packaging">Polybags & Master Cartons</option>
                    <option value="chemicals">Pre-treatment & Cleaning Solvents</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Warehouse Location</label>
                  <select
                    value={rawDraft.location}
                    onChange={(e) => updateRawField('location', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    <option value="print_factory">Tongi Print Factory Warehouse</option>
                    <option value="sewing_factory">Mirpur Sewing Factory Store</option>
                    <option value="head_office">Banani Head Office Sample Store</option>
                  </select>
                </div>
              </div>

              {/* Preferable Metric Selector */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
                <label className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Choose Preferable Metric / Measurement Unit *
                </label>
                <select
                  value={rawDraft.unit}
                  onChange={(e) => updateRawField('unit', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-white font-bold"
                >
                  {PREFERABLE_METRICS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                  <option value="custom">✨ Custom Metric Unit (Type below)...</option>
                </select>

                {rawDraft.unit === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom unit (e.g. spools, bundles, sheets, drums)..."
                    value={rawDraft.customUnit}
                    onChange={(e) => updateRawField('customUnit', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500 text-white font-bold"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Opening Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rawDraft.currentStock}
                    onChange={(e) => updateRawField('currentStock', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Min Alert Level</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rawDraft.minimumThreshold}
                    onChange={(e) => updateRawField('minimumThreshold', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rawDraft.unitCost}
                    onChange={(e) => updateRawField('unitCost', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">GSM (If Fabric/Paper)</label>
                  <input
                    type="number"
                    value={rawDraft.gsm}
                    onChange={(e) => updateRawField('gsm', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Roll Width / Spec</label>
                  <input
                    type="text"
                    value={rawDraft.rollWidth}
                    onChange={(e) => updateRawField('rollWidth', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Supplier Mill</label>
                  <input
                    type="text"
                    value={rawDraft.supplierName}
                    onChange={(e) => updateRawField('supplierName', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearRawDraft();
                    setIsCreateRawModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-bold cursor-pointer"
                >
                  Cancel & Discard Draft
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateRawModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    Keep Draft & Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                  >
                    Save Raw Material
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: CREATE COMPANY ASSET (WITH AUTO-DRAFT) ===================== */}
      {isCreateAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">
                    Register Company Asset & Link Employee
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                    Draft Saved {assetDraftSavedAt ? `@ ${assetDraftSavedAt}` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Register PCs, sewing machines, sublimation plotters, or scanners and assign to an operator.
                </p>
              </div>
              <button
                onClick={() => setIsCreateAssetModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssetSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Asset Tag Code</label>
                  <input
                    type="text"
                    required
                    value={assetDraft.assetCode}
                    onChange={(e) => updateAssetField('assetCode', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-indigo-400 font-mono font-bold mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Device / Machine Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juki 4-Thread Overlock #4 or Design PC #3"
                    value={assetDraft.name}
                    onChange={(e) => updateAssetField('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Hardware Category</label>
                  <select
                    value={assetDraft.category}
                    onChange={(e) => updateAssetField('category', e.target.value as AssetCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    <option value="sewing_machine">🪡 Industrial Sewing Machine</option>
                    <option value="pc_workstation">💻 PC / CAD Design Workstation</option>
                    <option value="sublimation_printer">🖨️ Large-Format Sublimation Printer</option>
                    <option value="heat_press">🔥 Rotary Calendar Heat Press</option>
                    <option value="laser_cutter">⚡ Laser Fabric Cutter</option>
                    <option value="scanner_mobile">📱 QR Barcode Scanner / Mobile Device</option>
                    <option value="power_generator">🔋 Industrial Generator / Online UPS</option>
                    <option value="vehicle">🚐 Factory Delivery Van / Shuttle</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Assigned Facility</label>
                  <select
                    value={assetDraft.location}
                    onChange={(e) => updateAssetField('location', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    <option value="sewing_factory">Mirpur Sewing Factory</option>
                    <option value="print_factory">Tongi Print Factory</option>
                    <option value="head_office">Banani Head Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Brand & Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Juki MO-6814S / Dell Precision"
                    value={assetDraft.brandModel}
                    onChange={(e) => updateAssetField('brandModel', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-JUKI-88412"
                    value={assetDraft.serialNumber}
                    onChange={(e) => updateAssetField('serialNumber', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono mt-1"
                  />
                </div>
              </div>

              {/* Employee Link Selector */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Link to Dedicated Employee / Operator
                </label>
                <select
                  value={assetDraft.assignedEmployeeId}
                  onChange={(e) => updateAssetField('assignedEmployeeId', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-indigo-500/40 text-white font-bold"
                >
                  <option value="">-- Assign Later / Shared Floor Pool --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.designation} ({emp.location.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Purchase Value ($)</label>
                  <input
                    type="number"
                    value={assetDraft.purchaseValue}
                    onChange={(e) => updateAssetField('purchaseValue', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Purchase Date</label>
                  <input
                    type="date"
                    value={assetDraft.purchaseDate}
                    onChange={(e) => updateAssetField('purchaseDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearAssetDraft();
                    setIsCreateAssetModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-bold cursor-pointer"
                >
                  Cancel & Discard Draft
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateAssetModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg cursor-pointer"
                  >
                    Save & Link Asset
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: ADJUST STOCK & ALLOCATE TO ORDER ===================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white">
                Adjust / Allocate Stock: {editingItem.name}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div>
                Current Stock:{' '}
                <strong className="text-emerald-400 font-mono text-sm">
                  {editingItem.currentStock} {editingItem.preferredMetric || editingItem.unit}
                </strong>
              </div>
              <div>
                Location: <strong className="uppercase">{editingItem.location.replace('_', ' ')}</strong>
              </div>
            </div>

            {/* Cross-Component Order Linker */}
            {orders.length > 0 && (
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-indigo-300 block">
                  Link Deduction to Active Job Card (Optional Cross-Sync)
                </label>
                <select
                  value={linkedOrderIdForDeduct}
                  onChange={(e) => {
                    const ord = orders.find((o) => o.id === e.target.value);
                    setLinkedOrderIdForDeduct(e.target.value);
                    if (ord && editingItem.category === 'fabric') {
                      setAdjustmentValue(-Math.round(ord.totalQuantity * 1.45));
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="">-- Manual Stock Adjustment --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} • {o.teamOrClub} ({o.totalQuantity} pcs — Est. {Math.round(o.totalQuantity * 1.45)}m)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-bold block mb-1 text-slate-300">
                Quantity Change (+ to receive shipment, - to deduct usage)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white"
                />
                <span className="font-black text-emerald-400 uppercase">
                  {editingItem.preferredMetric || editingItem.unit}
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[50, 100, 250, -25, -50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdjustmentValue(val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      val < 0
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                        : 'bg-slate-800 text-emerald-300 border border-slate-700'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-800 rounded-xl font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleAdjustStock}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black cursor-pointer"
              >
                Confirm Stock Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
