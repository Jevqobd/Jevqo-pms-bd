/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Vendor,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryItem,
  LedgerEntry,
  UserRole,
  FactoryLocation,
} from '../types/erp';
import { Language } from '../utils/translations';
import { useFormDraft } from '../utils/useFormDraft';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  FileText,
  DollarSign,
  Star,
  Clock,
  ShieldCheck,
  Printer,
  ArrowUpRight,
  Building2,
  Layers,
  Sparkles,
  RotateCcw,
  X,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface VendorsSuppliersModuleProps {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  inventory: InventoryItem[];
  ledgerEntries: LedgerEntry[];
  currentRole: UserRole;
  language: Language;
  onCreateVendor: (vendor: Vendor) => void;
  onUpdateVendor: (id: string, updates: Partial<Vendor>) => void;
  onCreatePurchaseOrder: (po: PurchaseOrder) => void;
  onReceiveGrn: (poId: string) => void;
  onRecordVendorPayment?: (vendorId: string, amount: number, ref: string) => void;
}

const INITIAL_VENDOR_DRAFT = {
  name: '',
  supplierCode: '',
  category: 'fabric_mill' as Vendor['category'],
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  paymentTerms: 'Net 30 days on delivery',
  leadTimeDays: 4,
  moq: '200 Meters',
  certificationsInput: 'OEKO-TEX Standard 100, ISO 9001',
  suppliedItemsInput: 'Micro-Eyelet 160 GSM, Poly Interlock 180 GSM',
};

const INITIAL_PO_DRAFT = {
  vendorId: 'ven-1',
  deliveryLocation: 'print_factory' as FactoryLocation,
  expectedDeliveryDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
  inventoryItemId: 'inv-1',
  customItemName: '',
  quantity: 300,
  unitCost: 2.8,
  notes: 'Standard Tongi Print Mill raw material replenishment.',
};

export const VendorsSuppliersModule: React.FC<VendorsSuppliersModuleProps> = ({
  vendors,
  purchaseOrders,
  inventory,
  ledgerEntries,
  language,
  onCreateVendor,
  onCreatePurchaseOrder,
  onReceiveGrn,
  onRecordVendorPayment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'directory' | 'purchase_orders' | 'reorder_radar' | 'vendor_ledger'
  >('directory');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [printablePo, setPrintablePo] = useState<PurchaseOrder | null>(null);
  const [paymentModalVendor, setPaymentModalVendor] = useState<Vendor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [paymentRef, setPaymentRef] = useState<string>('CHQ-CITY-8821');

  // Auto-draft hooks for New Vendor and New Purchase Order forms
  const {
    draft: vendorDraft,
    updateField: updateVendorField,
    clearDraft: clearVendorDraft,
    hasSavedDraft: hasVendorDraft,
    lastSavedAt: vendorDraftSavedAt,
  } = useFormDraft('vendor_supplier_entry', INITIAL_VENDOR_DRAFT);

  const {
    draft: poDraft,
    updateField: updatePoField,
    clearDraft: clearPoDraft,
    hasSavedDraft: hasPoDraft,
    lastSavedAt: poDraftSavedAt,
  } = useFormDraft('purchase_order_entry', INITIAL_PO_DRAFT);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesCat = categoryFilter === 'all' || v.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        (v.supplierCode && v.supplierCode.toLowerCase().includes(q)) ||
        (v.suppliedItems && v.suppliedItems.some((i) => i.toLowerCase().includes(q)));
      return matchesCat && matchesSearch;
    });
  }, [vendors, categoryFilter, searchQuery]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= item.minimumThreshold * 1.25);
  }, [inventory]);

  const totalPayables = useMemo(
    () => vendors.reduce((acc, v) => acc + v.balanceDue, 0),
    [vendors]
  );

  const totalActivePoValue = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.status === 'issued' || po.status === 'in_transit')
        .reduce((acc, po) => acc + po.totalAmount, 0),
    [purchaseOrders]
  );

  const avgOnTimeRate = useMemo(() => {
    const rated = vendors.filter((v) => typeof v.onTimeDeliveryRate === 'number');
    if (!rated.length) return 96;
    return Math.round(
      rated.reduce((acc, v) => acc + (v.onTimeDeliveryRate || 95), 0) / rated.length
    );
  }, [vendors]);

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorDraft.name.trim()) return;

    const newVendor: Vendor = {
      id: `ven-${Date.now()}`,
      supplierCode:
        vendorDraft.supplierCode.trim() ||
        `SUP-${vendorDraft.category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`,
      name: vendorDraft.name.trim(),
      category: vendorDraft.category,
      contactPerson: vendorDraft.contactPerson.trim() || 'Supply Chain Desk',
      phone: vendorDraft.phone.trim() || '+880 1700-000000',
      email: vendorDraft.email.trim() || 'supply@vendor.bd',
      address: vendorDraft.address.trim() || 'Dhaka Industrial Zone',
      totalPurchased: 0,
      totalPaid: 0,
      balanceDue: 0,
      paymentTerms: vendorDraft.paymentTerms,
      rating: 4.8,
      onTimeDeliveryRate: 96,
      qualityScore: 98,
      leadTimeDays: Number(vendorDraft.leadTimeDays) || 4,
      moq: vendorDraft.moq || '100 Units',
      certifications: vendorDraft.certificationsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      suppliedItems: vendorDraft.suppliedItemsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: 'active',
    };

    onCreateVendor(newVendor);
    clearVendorDraft();
    setIsAddVendorOpen(false);
  };

  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === poDraft.vendorId) || vendors[0];
    const invItem = inventory.find((i) => i.id === poDraft.inventoryItemId);
    const itemName = poDraft.customItemName.trim() || invItem?.name || 'Polyester Fabric Roll';
    const unit = invItem?.unit || 'meters';
    const qty = Math.max(1, Number(poDraft.quantity) || 100);
    const rate = Math.max(0.05, Number(poDraft.unitCost) || invItem?.unitCost || 2.5);
    const totalCost = Number((qty * rate).toFixed(2));

    const itemCategory: PurchaseOrderItem['category'] =
      invItem?.category === 'ink' ||
      invItem?.category === 'paper' ||
      invItem?.category === 'thread' ||
      invItem?.category === 'packaging'
        ? invItem.category
        : 'fabric';

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-0${405 + purchaseOrders.length}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCategory: vendor.category,
      deliveryLocation: poDraft.deliveryLocation,
      items: [
        {
          inventoryItemId: invItem?.id,
          itemName,
          category: itemCategory,
          quantity: qty,
          unit,
          unitCost: rate,
          totalCost,
        },
      ],
      totalAmount: totalCost,
      status: 'in_transit',
      expectedDeliveryDate: poDraft.expectedDeliveryDate,
      notes: poDraft.notes,
      createdBy: 'Procurement & Inventory Officer',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreatePurchaseOrder(newPo);
    clearPoDraft();
    setIsCreatePoOpen(false);
    setActiveSubTab('purchase_orders');
  };

  const handleQuickReorderLowStock = (item: InventoryItem) => {
    const matchedVendor =
      vendors.find(
        (v) =>
          (item.category === 'fabric' && v.category === 'fabric_mill') ||
          (item.category === 'ink' && v.category === 'ink_supplier') ||
          (item.category === 'paper' && v.category === 'paper_supplier') ||
          v.category === 'accessories'
      ) || vendors[0];

    const reorderQty = Math.max(item.minimumThreshold * 2, 200);
    const safeUnitCost = item.unitCost ?? 2.5;
    const totalCost = Number((reorderQty * safeUnitCost).toFixed(2));

    const quickPo: PurchaseOrder = {
      id: `po-auto-${Date.now()}`,
      poNumber: `PO-2026-0${410 + purchaseOrders.length}`,
      vendorId: matchedVendor.id,
      vendorName: matchedVendor.name,
      vendorCategory: matchedVendor.category,
      deliveryLocation: item.location,
      items: [
        {
          inventoryItemId: item.id,
          itemName: item.name,
          category:
            item.category === 'ink' ||
            item.category === 'paper' ||
            item.category === 'thread' ||
            item.category === 'packaging'
              ? item.category
              : 'fabric',
          quantity: reorderQty,
          unit: item.unit,
          unitCost: safeUnitCost,
          totalCost,
        },
      ],
      totalAmount: totalCost,
      status: 'in_transit',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      notes: `Auto-generated replenishment PO for low-stock threshold alert (${item.currentStock} ${item.unit} remaining).`,
      createdBy: 'Auto-Replenishment Radar',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreatePurchaseOrder(quickPo);
    setActiveSubTab('purchase_orders');
  };

  const categoryLabel = (cat: Vendor['category']) => {
    switch (cat) {
      case 'fabric_mill':
        return 'Fabric & Knit Mill';
      case 'ink_supplier':
        return 'Sublimation Ink Lab';
      case 'paper_supplier':
        return 'Transfer Paper Roll';
      case 'accessories':
        return 'Trims, Crests & Collars';
      case 'equipment':
        return 'Machinery & Spares';
      case 'logistics':
        return 'Shuttle & Freight';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Command Header */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {language === 'bn'
                  ? 'ভেন্ডর, সাপ্লায়ার ও পারচেজ অর্ডার (PO/GRN) কমান্ড সেন্টার'
                  : 'Vendors, Material Suppliers & PO/GRN Procurement Hub'}
              </h2>
              <p className="text-xs text-slate-400">
                Manage polyester fabric mills, sublimation ink/paper importers, Purchase Orders, and 1-click GRN inventory stock synchronization
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddVendorOpen(true)}
            className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{language === 'bn' ? 'নতুন সাপ্লায়ার যোগ করুন' : 'Add Supplier'}</span>
            {hasVendorDraft && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-mono">
                Draft
              </span>
            )}
          </button>

          <button
            onClick={() => setIsCreatePoOpen(true)}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন পারচেজ অর্ডার (PO)' : 'Issue Purchase Order (PO)'}</span>
            {hasPoDraft && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-black/30 text-amber-200 font-mono">
                Draft
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Verified Textile & Ink Suppliers</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {vendors.length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OEKO-TEX & ISO Audited Mills</span>
          </div>
        </div>

        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Open POs In-Transit (GRN Pending)</span>
            <PackageCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            ${totalActivePoValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">
            {purchaseOrders.filter((p) => p.status !== 'received_grn').length} active shipments to Tongi & Mirpur
          </div>
        </div>

        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Supplier On-Time SLA Score</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {avgOnTimeRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg lead time: <span className="text-white font-mono">3.2 days</span>
          </div>
        </div>

        <div className="bg-[#0a0f1d] border border-slate-800/90 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Accounts Payable (Due)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">
            ${totalPayables.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rolling 15–30 day mill credit lines
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'directory'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Supplier Scorecard Directory ({vendors.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('purchase_orders')}
            className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'purchase_orders'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Purchase Orders & GRN Auto-Stock ({purchaseOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reorder_radar')}
            className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'reorder_radar'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low-Stock Reorder Radar ({lowStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vendor_ledger')}
            className={`btn-press px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'vendor_ledger'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Vendor Payables & Bill Ledger</span>
          </button>
        </div>

        {activeSubTab === 'directory' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mill, GSM fabric, ink..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="fabric_mill">Fabric & Knit Mills</option>
              <option value="ink_supplier">Sublimation Ink Suppliers</option>
              <option value="paper_supplier">Transfer Paper Importers</option>
              <option value="accessories">Trims, Collars & Crests</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: SUPPLIER DIRECTORY & SCORECARD */}
      {activeSubTab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                        {vendor.supplierCode || vendor.id.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {categoryLabel(vendor.category)}
                      </span>
                      {vendor.status === 'preferred' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          PREFERRED MILL
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white mt-1.5">{vendor.name}</h3>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{(vendor.rating || 4.8).toFixed(1)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
                      Lead Time: {vendor.leadTimeDays || 3}d
                    </div>
                  </div>
                </div>

                {/* Contact & Location Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate font-mono">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{vendor.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{vendor.address}</span>
                  </div>
                </div>

                {/* Supplied Items & Certifications */}
                {vendor.suppliedItems && vendor.suppliedItems.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Contracted Sportswear Materials (MOQ: {vendor.moq || 'Standard'})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vendor.suppliedItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-200 border border-slate-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {vendor.certifications && vendor.certifications.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {vendor.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Scorecard & Financial Footer */}
              <div className="pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                  <div>
                    <span className="text-slate-400 block text-[10px]">On-Time SLA</span>
                    <span className="text-emerald-400 font-bold">
                      {vendor.onTimeDeliveryRate || 96}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lab Quality</span>
                    <span className="text-cyan-400 font-bold">
                      {vendor.qualityScore || 98}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Purchased</span>
                    <span className="text-white font-bold">
                      ${vendor.totalPurchased.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Balance Due</span>
                    <span
                      className={`font-bold ${
                        vendor.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      ${vendor.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {vendor.balanceDue > 0 && (
                    <button
                      onClick={() => {
                        setPaymentModalVendor(vendor);
                        setPaymentAmount(vendor.balanceDue);
                      }}
                      className="btn-press px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      Pay Due
                    </button>
                  )}
                  <button
                    onClick={() => {
                      updatePoField('vendorId', vendor.id);
                      setIsCreatePoOpen(true);
                    }}
                    className="btn-press px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create PO</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: PURCHASE ORDERS & GRN AUTO-STOCK SYNC */}
      {activeSubTab === 'purchase_orders' && (
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white">
                Purchase Orders (PO) & Goods Received Note (GRN) Auto-Inventory Sync
              </h3>
              <p className="text-xs text-slate-400">
                Clicking &ldquo;Receive GRN &amp; Sync Stock&rdquo; verifies mill delivery, generates a GRN certificate, and automatically adds the received quantity to Raw Inventory
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">PO / GRN Number</th>
                  <th className="py-3 px-4">Vendor / Mill</th>
                  <th className="py-3 px-4">Line Items &amp; Qty</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                      <div>{po.poNumber}</div>
                      {po.grnNumber && (
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                          ✓ {po.grnNumber} ({po.receivedAt})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{po.vendorName}</div>
                      <div className="text-[11px] text-slate-400">
                        ETA: <span className="font-mono">{po.expectedDeliveryDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="text-slate-200">
                          <span className="font-mono font-bold text-emerald-400 tabular-nums">
                            {item.quantity} {item.unit}
                          </span>{' '}
                          × {item.itemName}{' '}
                          <span className="text-slate-400 font-mono">
                            (${item.unitCost}/{item.unit})
                          </span>
                        </div>
                      ))}
                      {po.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {po.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono">
                        {po.deliveryLocation === 'print_factory'
                          ? 'Tongi Print Mill'
                          : po.deliveryLocation === 'sewing_factory'
                          ? 'Mirpur Sewing'
                          : 'Banani HQ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white tabular-nums">
                      ${po.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {po.status === 'received_grn' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          GRN Stock Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {po.status === 'in_transit' ? 'In Transit to Mill' : 'PO Issued'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {po.status !== 'received_grn' && (
                          <button
                            onClick={() => onReceiveGrn(po.id)}
                            className="btn-press px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive GRN &amp; Sync Stock</span>
                          </button>
                        )}
                        <button
                          onClick={() => setPrintablePo(po)}
                          className="btn-press p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                          title="Print Official PO / GRN Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LOW-STOCK REORDER RADAR */}
      {activeSubTab === 'reorder_radar' && (
        <div className="space-y-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Automated Raw Material Reorder Radar</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detects fabrics, sublimation paper, and inks approaching minimum threshold and pairs them with your highest-rated contracted supplier
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => {
              const isCritical = item.currentStock <= item.minimumThreshold;
              const recommendedOrderQty = Math.max(item.minimumThreshold * 2, 200);
              return (
                <div
                  key={item.id}
                  className={`bg-[#0a0f1d] rounded-2xl p-4 border flex flex-col justify-between gap-4 ${
                    isCritical ? 'border-rose-500/50' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isCritical ? 'LOW STOCK ALERT' : 'OPTIMAL BUFFER'}
                      </span>
                      <span className="text-xs font-mono text-slate-400 tabular-nums">
                        Rate: ${(item.unitCost ?? 2.5).toFixed(2)}/{item.unit}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2">{item.name}</h4>

                    <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono tabular-nums">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Stock</span>
                        <span
                          className={`font-black ${
                            isCritical ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Safety Threshold</span>
                        <span className="font-bold text-slate-200">
                          {item.minimumThreshold} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickReorderLowStock(item)}
                    className="btn-press w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>
                      1-Click Issue PO ({recommendedOrderQty} {item.unit} • $
                      {(recommendedOrderQty * (item.unitCost ?? 2.5)).toFixed(0)})
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VENDOR PAYABLES & LEDGER */}
      {activeSubTab === 'vendor_ledger' && (
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">
                Supplier Bills, GRN Credits &amp; Payment Clearance Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Real-time audit trail of mill invoices, GRN stock receipts, and bank/cheque settlements
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Ref / GRN / Cheque</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 text-right">Paid (Debit)</th>
                  <th className="py-3 px-4 text-right">Billed (Credit)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {ledgerEntries
                  .filter((l) => l.entityType === 'vendor')
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{entry.entityName}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {entry.referenceId}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{entry.description}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400">
                        {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-400">
                        {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-white">
                        ${entry.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD VENDOR (WITH AUTO-DRAFT) */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  Onboard New Textile Mill / Supplier
                </h3>
                {vendorDraftSavedAt && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Auto-saved in draft at {vendorDraftSavedAt}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsAddVendorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Company / Mill Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorDraft.name}
                    onChange={(e) => updateVendorField('name', e.target.value)}
                    placeholder="e.g. Jamuna Poly Knitwear Ltd."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Supplier Category
                  </label>
                  <select
                    value={vendorDraft.category}
                    onChange={(e) =>
                      updateVendorField('category', e.target.value as Vendor['category'])
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="fabric_mill">Fabric &amp; Knit Mill</option>
                    <option value="ink_supplier">Sublimation Ink Supplier</option>
                    <option value="paper_supplier">Transfer Paper Importer</option>
                    <option value="accessories">Trims, Collars &amp; Crests</option>
                    <option value="equipment">Machinery &amp; Parts</option>
                    <option value="logistics">Courier &amp; Freight</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={vendorDraft.contactPerson}
                    onChange={(e) => updateVendorField('contactPerson', e.target.value)}
                    placeholder="Engr. Mahmudul Hasan"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={vendorDraft.phone}
                    onChange={(e) => updateVendorField('phone', e.target.value)}
                    placeholder="+880 17..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={vendorDraft.leadTimeDays}
                    onChange={(e) => updateVendorField('leadTimeDays', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">MOQ</label>
                  <input
                    type="text"
                    value={vendorDraft.moq}
                    onChange={(e) => updateVendorField('moq', e.target.value)}
                    placeholder="200 Meters"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={vendorDraft.paymentTerms}
                    onChange={(e) => updateVendorField('paymentTerms', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Supplied Materials (Comma separated)
                </label>
                <input
                  type="text"
                  value={vendorDraft.suppliedItemsInput}
                  onChange={(e) => updateVendorField('suppliedItemsInput', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Certifications (Comma separated)
                </label>
                <input
                  type="text"
                  value={vendorDraft.certificationsInput}
                  onChange={(e) => updateVendorField('certificationsInput', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    clearVendorDraft();
                    setIsAddVendorOpen(false);
                  }}
                  className="btn-press px-3 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddVendorOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Keep Draft &amp; Close
                  </button>
                  <button
                    type="submit"
                    className="btn-press px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Save Supplier
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE PURCHASE ORDER (WITH AUTO-DRAFT) */}
      {isCreatePoOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  Issue Official Purchase Order (PO)
                </h3>
                {poDraftSavedAt && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Auto-saved in draft at {poDraftSavedAt}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsCreatePoOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePo} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Select Supplier / Mill
                  </label>
                  <select
                    value={poDraft.vendorId}
                    onChange={(e) => updatePoField('vendorId', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({categoryLabel(v.category)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Delivery Facility Gate
                  </label>
                  <select
                    value={poDraft.deliveryLocation}
                    onChange={(e) =>
                      updatePoField('deliveryLocation', e.target.value as FactoryLocation)
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="print_factory">Tongi Sublimation Print Mill</option>
                    <option value="sewing_factory">Mirpur Sewing &amp; Assembly Factory</option>
                    <option value="head_office">Banani Head Office</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Link to Raw Inventory Item (for Automatic GRN Stock Increment)
                </label>
                <select
                  value={poDraft.inventoryItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    updatePoField('inventoryItemId', id);
                    const found = inventory.find((i) => i.id === id);
                    if (found) {
                      updatePoField('unitCost', found.unitCost ?? 2.5);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (In stock: {inv.currentStock} {inv.unit} • ${inv.unitCost}/
                      {inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Order Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={poDraft.quantity}
                    onChange={(e) => updatePoField('quantity', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Unit Rate ($)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={poDraft.unitCost}
                    onChange={(e) => updatePoField('unitCost', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={poDraft.expectedDeliveryDate}
                    onChange={(e) => updatePoField('expectedDeliveryDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Quality / GSM / Batch Instructions
                </label>
                <input
                  type="text"
                  value={poDraft.notes}
                  onChange={(e) => updatePoField('notes', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-slate-400">Estimated PO Total Value:</span>
                <span className="text-base font-black text-emerald-400 tabular-nums">
                  ${(Number(poDraft.quantity || 0) * Number(poDraft.unitCost || 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    clearPoDraft();
                    setIsCreatePoOpen(false);
                  }}
                  className="btn-press px-3 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard Draft</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatePoOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="btn-press px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE PO / GRN SHEET */}
      {printablePo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  OFFICIAL PROCUREMENT &amp; GRN VOUCHER
                </div>
                <h3 className="text-lg font-black text-white font-mono">
                  {printablePo.poNumber}{' '}
                  {printablePo.grnNumber ? `• ${printablePo.grnNumber}` : ''}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-press px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setPrintablePo(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Supplier / Mill:</span>
                <strong className="text-white text-sm">{printablePo.vendorName}</strong>
                <span className="block text-slate-400 mt-1">
                  Created By: {printablePo.createdBy}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-400 block">Issue Date: {printablePo.createdAt}</span>
                <span className="text-slate-300 block">
                  Expected Delivery: {printablePo.expectedDeliveryDate}
                </span>
                {printablePo.grnNumber && (
                  <span className="text-emerald-400 font-bold block mt-1">
                    GRN Verified: {printablePo.grnNumber}
                  </span>
                )}
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Material Description</th>
                  <th className="p-2.5 text-right">Quantity</th>
                  <th className="p-2.5 text-right">Unit Rate</th>
                  <th className="p-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {printablePo.items.map((item, i) => (
                  <tr key={i}>
                    <td className="p-2.5 text-white font-semibold">{item.itemName}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-400">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-300">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white">
                      ${item.totalCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between pt-2 text-sm font-mono">
              <span className="text-slate-400">Total Purchase Order Value:</span>
              <span className="text-xl font-black text-emerald-400">
                ${printablePo.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QUICK VENDOR PAYMENT */}
      {paymentModalVendor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                Record Supplier Settlement — {paymentModalVendor.name}
              </h3>
              <button
                onClick={() => setPaymentModalVendor(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount to Pay ($)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Bank / Cheque / MFS Transaction Reference
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPaymentModalVendor(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onRecordVendorPayment) {
                      onRecordVendorPayment(
                        paymentModalVendor.id,
                        paymentAmount,
                        paymentRef
                      );
                    }
                    setPaymentModalVendor(null);
                  }}
                  className="btn-press px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
