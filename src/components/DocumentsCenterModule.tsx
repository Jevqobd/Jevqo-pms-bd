/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CompanyDocument,
  DocumentTemplateType,
  Order,
  Vendor,
  CompanySettings,
  UserRole,
} from '../types/erp';
import { useFormDraft } from '../utils/useFormDraft';
import { Language } from '../utils/translations';
import {
  FileText,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Building2,
  FileCheck,
  Truck,
  ShoppingBag,
  ShieldCheck,
  X,
  Eye,
  Trash2,
} from 'lucide-react';

interface DocumentsCenterModuleProps {
  documents: CompanyDocument[];
  orders: Order[];
  vendors: Vendor[];
  settings: CompanySettings;
  currentRole: UserRole;
  language?: Language;
  onCreateDocument: (docItem: CompanyDocument) => Promise<void>;
  onUpdateDocument: (id: string, partial: Partial<CompanyDocument>) => Promise<void>;
}

const TEMPLATE_CONFIGS: Record<
  DocumentTemplateType,
  { label: string; prefix: string; badge: string; defaultBody: string }
> = {
  delivery_challan: {
    label: '🚚 Delivery Challan / Gate Pass',
    prefix: 'DOC-CHAL-2026-',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    defaultBody:
      'Please receive the following sublimated sportswear garment bundles / printed fabric rolls in good condition. Count and bundle QR tags verified prior to factory gate dispatch.',
  },
  purchase_order: {
    label: '📦 Raw Material Purchase Order (PO)',
    prefix: 'DOC-PO-2026-',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    defaultBody:
      'We are pleased to place this official Purchase Order for the raw materials specified below. Please deliver to our Tongi Print Mill / Mirpur Sewing Hub within 5 working days along with test certificates.',
  },
  proforma_invoice: {
    label: '📄 Commercial Proforma Invoice (PI)',
    prefix: 'DOC-PI-2026-',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    defaultBody:
      'Proforma Invoice for custom sublimated athletic uniforms. Production commences immediately upon 50% advance wire/LC confirmation.',
  },
  qc_certificate: {
    label: '🛡️ Quality Control (QC) Certificate',
    prefix: 'DOC-QC-2026-',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    defaultBody:
      'This certifies that the sportswear batch detailed below has passed 100% inspection for sublimation color fastness (200°C heat press), 4-thread overlock seam strength, and player roster sizing accuracy.',
  },
  factory_memo: {
    label: '📢 Official Factory Memo / Circular',
    prefix: 'DOC-MEMO-2026-',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    defaultBody:
      'All floor supervisors and shift operators across Banani HQ, Tongi Print Mill, and Mirpur Sewing Factory are hereby notified to follow the updated production schedule.',
  },
  asset_handover: {
    label: '💻 Employee Asset Handover Receipt',
    prefix: 'DOC-AST-2026-',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    defaultBody:
      'The company hardware / machinery listed below has been officially allocated to the designated employee in full working condition for official ERP & production duties.',
  },
  custom_letter: {
    label: '✉️ Official Corporate Letterhead',
    prefix: 'DOC-LTR-2026-',
    badge: 'bg-slate-700 text-slate-200 border-slate-600',
    defaultBody: 'Official corporate correspondence issued on behalf of Sportswear OS Management.',
  },
};

export const DocumentsCenterModule: React.FC<DocumentsCenterModuleProps> = ({
  documents,
  orders,
  vendors,
  settings,
  currentRole,
  language = 'en',
  onCreateDocument,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<CompanyDocument | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    draft: docDraft,
    setDraft: setDocDraft,
    updateField: updateDocField,
    clearDraft: clearDocDraft,
    lastSavedAt: docDraftSavedAt,
  } = useFormDraft('company_documents_create_form', {
    type: 'delivery_challan' as DocumentTemplateType,
    title: '',
    department: 'Operations & Logistics',
    recipientName: '',
    recipientOrg: '',
    linkedOrderNumber: '',
    contentBody: TEMPLATE_CONFIGS.delivery_challan.defaultBody,
    lineItem1Desc: 'Custom Sublimated Team Jerseys (Micro-Eyelet 160 GSM)',
    lineItem1Qty: '30 Sets',
    lineItem1Remarks: 'Checked & Packed',
    lineItem2Desc: 'Matching Sublimated Shorts with Pockets',
    lineItem2Qty: '30 Pcs',
    lineItem2Remarks: 'Bundle #01-02',
  });

  const filteredDocs = documents.filter((d) => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (
      searchTerm &&
      !d.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !d.recipientName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleTemplateTypeChange = (newType: DocumentTemplateType) => {
    const conf = TEMPLATE_CONFIGS[newType];
    setDocDraft((prev) => ({
      ...prev,
      type: newType,
      contentBody: conf.defaultBody,
    }));
  };

  const handleAutoFillFromOrder = (orderNum: string) => {
    const ord = orders.find((o) => o.orderNumber === orderNum);
    if (!ord) {
      updateDocField('linkedOrderNumber', orderNum);
      return;
    }
    setDocDraft((prev) => ({
      ...prev,
      linkedOrderNumber: ord.orderNumber,
      title: `${TEMPLATE_CONFIGS[prev.type].label.replace(/^[^\s]+\s/, '')} — ${ord.teamOrClub || ord.clientName} (#${ord.orderNumber})`,
      recipientName: ord.clientName,
      recipientOrg: ord.teamOrClub || ord.deliveryAddress || 'Client Facility',
      lineItem1Desc: `${ord.sportType || 'Athletic'} Sublimated Jersey (${ord.fabricType})`,
      lineItem1Qty: `${ord.totalQuantity} Pcs`,
      lineItem1Remarks: `Collar: ${ord.collarType || 'Standard'} • Order #${ord.orderNumber}`,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docDraft.title.trim()) return;

    const conf = TEMPLATE_CONFIGS[docDraft.type];
    const lineItems = [];
    if (docDraft.lineItem1Desc.trim()) {
      lineItems.push({
        description: docDraft.lineItem1Desc,
        qty: docDraft.lineItem1Qty,
        remarks: docDraft.lineItem1Remarks,
      });
    }
    if (docDraft.lineItem2Desc.trim()) {
      lineItems.push({
        description: docDraft.lineItem2Desc,
        qty: docDraft.lineItem2Qty,
        remarks: docDraft.lineItem2Remarks,
      });
    }

    const newDoc: CompanyDocument = {
      id: `doc-${Date.now()}`,
      docNumber: `${conf.prefix}${Math.floor(1000 + Math.random() * 9000)}`,
      title: docDraft.title.trim(),
      type: docDraft.type,
      department: docDraft.department,
      recipientName: docDraft.recipientName || 'Authorized Receiver',
      recipientOrg: docDraft.recipientOrg || 'Partner Facility',
      linkedOrderNumber: docDraft.linkedOrderNumber || undefined,
      contentBody: docDraft.contentBody,
      lineItems,
      status: 'issued',
      createdBy: `${currentRole.toUpperCase()} Desk`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    await onCreateDocument(newDoc);
    clearDocDraft();
    setIsCreateOpen(false);
    setPreviewDoc(newDoc);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white border border-indigo-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md">
            <FileText className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                {language === 'bn'
                  ? 'কোম্পানি ডকুমেন্টস ও অফিসিয়াল লেটারহেড সেন্টার'
                  : 'Official Company Documents & Letterhead Generator'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-[10px]">
                Challans &bull; Purchase Orders &bull; QC Certificates &bull; Memos
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Generate, auto-draft, and print official corporate documents linked directly to active Job Cards, Vendors, and Company Settings.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Company Document</span>
        </button>
      </div>

      {/* Quick Template Launcher Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(Object.keys(TEMPLATE_CONFIGS) as DocumentTemplateType[]).slice(0, 6).map((tKey) => {
          const conf = TEMPLATE_CONFIGS[tKey];
          return (
            <button
              key={tKey}
              onClick={() => {
                handleTemplateTypeChange(tKey);
                setIsCreateOpen(true);
              }}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition cursor-pointer space-y-1"
            >
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${conf.badge}`}>
                Template
              </span>
              <div className="font-black text-white text-xs leading-snug">{conf.label}</div>
              <span className="text-[10px] text-emerald-400 block font-bold">+ Generate &rarr;</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Documents ({documents.length})
          </button>
          {(Object.keys(TEMPLATE_CONFIGS) as DocumentTemplateType[]).map((tKey) => (
            <button
              key={tKey}
              onClick={() => setTypeFilter(tKey)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                typeFilter === tKey
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {TEMPLATE_CONFIGS[tKey].label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doc number, title, recipient..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
          />
        </div>
      </div>

      {/* Documents List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((docItem) => {
          const conf = TEMPLATE_CONFIGS[docItem.type] || TEMPLATE_CONFIGS.custom_letter;
          return (
            <div
              key={docItem.id}
              className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${conf.badge}`}>
                    {conf.label}
                  </span>
                  <span className="font-mono font-bold text-[10px] text-slate-400">
                    {docItem.createdAt}
                  </span>
                </div>

                <div>
                  <span className="font-mono font-black text-xs text-indigo-400 block">
                    {docItem.docNumber}
                  </span>
                  <h3 className="font-black text-sm text-white leading-snug mt-0.5">
                    {docItem.title}
                  </h3>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500">To:</span>{' '}
                    <strong className="text-slate-200">{docItem.recipientName}</strong>{' '}
                    {docItem.recipientOrg ? `(${docItem.recipientOrg})` : ''}
                  </div>
                  {docItem.linkedOrderNumber && (
                    <div>
                      <span className="text-slate-500">Linked Order:</span>{' '}
                      <strong className="font-mono text-emerald-400">
                        #{docItem.linkedOrderNumber}
                      </strong>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {docItem.contentBody}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">By: {docItem.createdBy}</span>
                <button
                  onClick={() => setPreviewDoc(docItem)}
                  className="btn-press px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open & Print PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== MODAL: CREATE COMPANY DOCUMENT (WITH AUTO-DRAFT) ===================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">
                    Create Official Company Document
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    Draft Saved {docDraftSavedAt ? `@ ${docDraftSavedAt}` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Link an active Job Card to auto-populate items, or customize any corporate document.
                </p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Document Template Type</label>
                  <select
                    value={docDraft.type}
                    onChange={(e) => handleTemplateTypeChange(e.target.value as DocumentTemplateType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    {(Object.keys(TEMPLATE_CONFIGS) as DocumentTemplateType[]).map((k) => (
                      <option key={k} value={k}>
                        {TEMPLATE_CONFIGS[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-emerald-400">
                    Auto-Fill from Active Job Card (Optional)
                  </label>
                  <select
                    value={docDraft.linkedOrderNumber}
                    onChange={(e) => handleAutoFillFromOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-white font-bold mt-1"
                  >
                    <option value="">-- Select Order to Auto-Populate --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.orderNumber}>
                        {o.orderNumber} • {o.teamOrClub} ({o.clientName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Document Title / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delivery Challan — Titans FC 28 Sublimated Kits"
                  value={docDraft.title}
                  onChange={(e) => updateDocField('title', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Issuing Department</label>
                  <input
                    type="text"
                    value={docDraft.department}
                    onChange={(e) => updateDocField('department', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Selim Mia / Client Manager"
                    value={docDraft.recipientName}
                    onChange={(e) => updateDocField('recipientName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Recipient Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Mirpur Sewing Hub / Club"
                    value={docDraft.recipientOrg}
                    onChange={(e) => updateDocField('recipientOrg', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Official Body Text / Terms</label>
                <textarea
                  rows={3}
                  value={docDraft.contentBody}
                  onChange={(e) => updateDocField('contentBody', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                />
              </div>

              {/* Line Items Table Entry */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-indigo-400 block">
                  Itemized Table Rows (Challan / PO / Packing Details)
                </span>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Row 1 Description"
                    value={docDraft.lineItem1Desc}
                    onChange={(e) => updateDocField('lineItem1Desc', e.target.value)}
                    className="col-span-6 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Qty / Unit"
                    value={docDraft.lineItem1Qty}
                    onChange={(e) => updateDocField('lineItem1Qty', e.target.value)}
                    className="col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Remarks"
                    value={docDraft.lineItem1Remarks}
                    onChange={(e) => updateDocField('lineItem1Remarks', e.target.value)}
                    className="col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
                  />
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Row 2 Description (Optional)"
                    value={docDraft.lineItem2Desc}
                    onChange={(e) => updateDocField('lineItem2Desc', e.target.value)}
                    className="col-span-6 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Qty / Unit"
                    value={docDraft.lineItem2Qty}
                    onChange={(e) => updateDocField('lineItem2Qty', e.target.value)}
                    className="col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Remarks"
                    value={docDraft.lineItem2Remarks}
                    onChange={(e) => updateDocField('lineItem2Remarks', e.target.value)}
                    className="col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearDocDraft();
                    setIsCreateOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/50 text-rose-300 font-bold cursor-pointer"
                >
                  Cancel & Discard Draft
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                  >
                    Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                  >
                    Generate & Preview PDF
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PRINTABLE DOCUMENT LETTERHEAD PREVIEW ===================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-6 my-auto">
            {/* Top Action Bar (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs">
                  Official Printable Corporate Document
                </span>
                <span className="font-mono text-xs text-slate-500">{previewDoc.docNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Corporate Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {settings.companyName}
                </h1>
                <p className="text-xs font-bold text-emerald-700">{settings.tagline}</p>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                  <div>
                    <strong>HQ:</strong> {settings.addressHeadOffice}
                  </div>
                  <div>
                    <strong>Print Mill:</strong> {settings.addressPrintMill} &bull;{' '}
                    <strong>Sewing Hub:</strong> {settings.addressSewingFactory}
                  </div>
                  <div>
                    <strong>Phone:</strong> {settings.phone} &bull; <strong>Email:</strong>{' '}
                    {settings.email}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-black text-xs uppercase tracking-wider">
                  {TEMPLATE_CONFIGS[previewDoc.type]?.label.replace(/^[^\s]+\s/, '') || 'OFFICIAL DOCUMENT'}
                </span>
                <div className="mt-2 font-mono text-xs">
                  <div>
                    <strong>Doc Ref:</strong> {previewDoc.docNumber}
                  </div>
                  <div>
                    <strong>Date:</strong> {previewDoc.createdAt}
                  </div>
                  {previewDoc.linkedOrderNumber && (
                    <div>
                      <strong>Job Card:</strong> #{previewDoc.linkedOrderNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient & Issuing Box */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Issued To / Recipient
                </span>
                <div className="font-black text-sm text-slate-900 mt-0.5">
                  {previewDoc.recipientName}
                </div>
                <div className="text-slate-600 font-semibold">{previewDoc.recipientOrg}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Originating Department
                </span>
                <div className="font-black text-sm text-slate-900 mt-0.5">
                  {previewDoc.department}
                </div>
                <div className="text-slate-600">Prepared by: {previewDoc.createdBy}</div>
              </div>
            </div>

            {/* Subject & Body */}
            <div className="space-y-3">
              <h2 className="font-black text-base text-slate-900 border-b border-slate-200 pb-2">
                Subject: {previewDoc.title}
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {previewDoc.contentBody}
              </p>
            </div>

            {/* Itemized Table */}
            {previewDoc.lineItems && previewDoc.lineItems.length > 0 && (
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-2.5 text-left border border-slate-300">#</th>
                    <th className="p-2.5 text-left border border-slate-300">Item / Specification Description</th>
                    <th className="p-2.5 text-left border border-slate-300">Quantity / Metric</th>
                    <th className="p-2.5 text-left border border-slate-300">Verification Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {previewDoc.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2.5 font-mono font-bold border border-slate-300">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900 border border-slate-300">
                        {item.description}
                      </td>
                      <td className="p-2.5 font-mono font-black text-emerald-700 border border-slate-300">
                        {item.qty}
                      </td>
                      <td className="p-2.5 text-slate-600 border border-slate-300">
                        {item.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Official Signatures */}
            <div className="grid grid-cols-3 gap-8 pt-12 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <div className="font-bold text-slate-900">Prepared By</div>
                <div className="text-[10px] text-slate-500">{previewDoc.createdBy}</div>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <div className="font-bold text-slate-900">Department Head / QC</div>
                <div className="text-[10px] text-slate-500">{previewDoc.department}</div>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <div className="font-bold text-slate-900">Receiver Signature & Seal</div>
                <div className="text-[10px] text-slate-500">{previewDoc.recipientName}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
