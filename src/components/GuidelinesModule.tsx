import React, { useState } from 'react';
import {
  BookOpen, CheckCircle2, Circle, Layers, ArrowRight, ShieldCheck,
  Printer, Scissors, Sparkles, Truck, Package, FileText, Users,
  Zap, RefreshCw, ExternalLink, HelpCircle, Check, AlertTriangle, Building2
} from 'lucide-react';
import { Order, InventoryItem, Customer, CompanySettings } from '../types/erp';
import { Language } from '../utils/translations';
import { useFormDraft } from '../utils/useFormDraft';

interface GuidelinesModuleProps {
  orders: Order[];
  inventory: InventoryItem[];
  customers: Customer[];
  companySettings: CompanySettings;
  lang?: Language;
  onAutoSyncInventoryFromOrders?: () => void;
  onNavigateTab?: (tab: any) => void;
}

interface OnboardingStep {
  id: string;
  role: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  targetTab: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'step_1',
    role: 'Marketing & Sales',
    titleEn: '1. Create Order & Assign Dedicated Handler',
    titleBn: '১. অর্ডার তৈরি এবং ডেডিকেটেড প্রতিনিধি নির্ধারণ',
    descEn: 'Select customer from CRM (auto-applies Privilege Tier discount), enter size breakdown, collar type, shorts option, and reference artwork. Form stays in Draft automatically until saved.',
    descBn: 'CRM থেকে গ্রাহক নির্বাচন করুন (ভিআইপি ডিসকাউন্ট অটো যুক্ত হবে), সাইজ ব্রেকডাউন, কলারের ধরন ও শর্টস যোগ করুন। সেভ না করা পর্যন্ত ফর্ম অটো-ড্রাফট থাকবে।',
    targetTab: 'head_office',
  },
  {
    id: 'step_2',
    role: 'Design Team 1 & 2',
    titleEn: '2. External Design Sync & Print-Ready Separations',
    titleBn: '২. এক্সটার্নাল ডিজাইন সিঙ্ক ও প্রিন্ট-রেডি ফাইল প্রস্তুতি',
    descEn: 'Sync 3D artwork via the External Design Tool API, get customer approval, then generate Front, Back, Sleeve & Collar RIP separation files in Design Team 2.',
    descBn: 'এক্সটার্নাল ডিজাইন টুল API-এর মাধ্যমে থ্রিডি আর্টওয়ার্ক সিঙ্ক করুন, গ্রাহকের অনুমোদন নিন এবং প্রিন্টের জন্য প্যানেল ফাইল প্রস্তুত করুন।',
    targetTab: 'head_office',
  },
  {
    id: 'step_3',
    role: 'Print Factory (Konabari)',
    titleEn: '3. Sublimation Roll Printing & Heat Transfer QC',
    titleBn: '৩. সাবলিমেশন রোল প্রিন্টিং এবং হিট ট্রান্সফার কিউসি',
    descEn: 'Scan bundle QR code at Factory 1, verify ink & transfer paper metrics in Inventory, complete rotary calendar transfer, and dispatch bundle to Sewing.',
    descBn: 'ফ্যাক্টরি ১-এ বান্ডেল QR কোড স্ক্যান করুন, ইনভেন্টরিতে কালি ও পেপার যাচাই করুন এবং হিট ট্রান্সফার শেষে সুইং কারখানায় পাঠান।',
    targetTab: 'print_floor',
  },
  {
    id: 'step_4',
    role: 'Sewing Factory (Ashulia)',
    titleEn: '4. Line Stitching, Shortage Ticket & Packing',
    titleBn: '৪. লাইন সুইং, শর্টেজ/রি-প্রিন্ট টিকিট এবং প্যাকিং',
    descEn: 'Receive printed panels at Factory 2. If any panel is ruined during heat press or stitching, click "Report Shortage" to alert Design Team 2 & Print immediately.',
    descBn: 'ফ্যাক্টরি ২-এ প্রিন্টেড প্যানেল গ্রহণ করুন। কোনো প্যানেল নষ্ট হলে "Report Shortage" বাটনে ক্লিক করে দ্রুত রি-প্রিন্টের রিকোয়েস্ট পাঠান।',
    targetTab: 'sewing_floor',
  },
  {
    id: 'step_5',
    role: 'Accounts & Dispatch',
    titleEn: '5. Executive Invoice, Portal Pass & Courier Booking',
    titleBn: '৫. ইনভয়েস তৈরি, কাস্টমার পোর্টাল পাস এবং কুরিয়ার বুকিং',
    descEn: 'Generate executive PDF Invoice with Customer Portal Access Key, Returning Ratio & Privilege Stars. Book Steadfast/Pathao/RedX courier directly and issue Delivery Challan.',
    descBn: 'কাস্টমার পোর্টাল অ্যাক্সেস কী ও লয়্যালটি স্টারসহ ইনভয়েস প্রিন্ট করুন এবং কুরিয়ার বুকিং ও ডেলিভারি চালান ইস্যু করুন।',
    targetTab: 'accounting',
  },
];

export const GuidelinesModule: React.FC<GuidelinesModuleProps> = ({
  orders,
  inventory,
  customers,
  companySettings,
  lang = 'en',
  onAutoSyncInventoryFromOrders,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'architecture' | 'smart_sync'>('onboarding');
  const {
    draft: checklistState,
    updateField: updateChecklistField,
    clearDraft: clearChecklistDraft,
  } = useFormDraft('onboarding_checklist_progress', {
    completedSteps: ['step_1'] as string[],
  });
  const completedSteps = checklistState.completedSteps || [];
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const toggleStep = (id: string) => {
    const next = completedSteps.includes(id)
      ? completedSteps.filter((item) => item !== id)
      : [...completedSteps, id];
    updateChecklistField('completedSteps', next);
  };

  const triggerSyncNotification = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Compute live cross-module metrics
  const totalOrderUnits = orders.reduce((acc, o) => acc + (o.totalQuantity || 0), 0);
  const estimatedFabricMeters = Math.round(totalOrderUnits * 1.35);
  const estimatedPaperMeters = Math.round(totalOrderUnits * 1.45);
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minimumThreshold).length;
  const activeCouriers = (companySettings.shippingProviders || []).filter((s) => s.enabled);

  return (
    <div className="space-y-6">
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400" />
          {syncToast}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {lang === 'bn'
                    ? 'সিস্টেম গাইডলাইন, নতুন ইউজার অনবোর্ডিং এবং স্মার্ট ডেটা সিঙ্ক'
                    : 'System Guidelines, User Onboarding & Cross-Module Data Hub'}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'নতুন কর্মীদের দ্রুত প্রশিক্ষণ এবং এক মডিউলের সাথে অন্য মডিউলের স্বয়ংক্রিয় ডেটা আদান-প্রদান'
                    : 'Step-by-step bilingual SOPs to adapt new staff quickly + live cross-component data sharing & automation'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'onboarding'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {lang === 'bn' ? 'অনবোর্ডিং গাইড (SOP)' : 'New User Onboarding SOP'}
            </button>
            <button
              onClick={() => setActiveTab('smart_sync')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'smart_sync'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              {lang === 'bn' ? 'মডিউল ডেটা কানেকশন ও আপগ্রেড' : 'Cross-Component Sync & Upgrades'}
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              {lang === 'bn' ? '৩-ফ্যাক্টরি ওয়ার্কফ্লো ম্যাপ' : '3-Facility Workflow Map'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          {/* Progress Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                {lang === 'bn' ? 'নতুন কর্মী প্রশিক্ষণ অগ্রগতি' : 'New Staff Adaptation Progress'}
              </div>
              <div className="text-lg font-black text-white mt-0.5">
                {completedSteps.length} / {ONBOARDING_STEPS.length} Modules Mastered ({Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100)}%)
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Progress is auto-saved in draft state so new users can complete training at their own pace.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-44 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${(completedSteps.length / ONBOARDING_STEPS.length) * 100}%` }}
                />
              </div>
              <button
                onClick={clearChecklistDraft}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 text-[11px] font-bold border border-slate-800 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Steps */}
          <div className="grid grid-cols-1 gap-4">
            {ONBOARDING_STEPS.map((step) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-emerald-950/15 border-emerald-500/30'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="mt-1 text-teal-400 hover:text-teal-300 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-1.5">
                        {step.role}
                      </span>
                      <h3 className="text-base font-black text-white">
                        {lang === 'bn' ? step.titleBn : step.titleEn}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {lang === 'bn' ? step.descBn : step.descEn}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {lang === 'bn' ? step.descEn : step.descBn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isDone ? 'Completed ✓' : 'Mark Learned'}
                    </button>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab(step.targetTab)}
                        className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        Open Module <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Golden Rules for Staff */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                Rule #1: Auto-Draft Protection
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every form in this ERP automatically saves your typing as a draft. If your internet drops or you switch tabs, your work is safe until you explicitly click <strong>Cancel (Discard Draft)</strong> or <strong>Save</strong>.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-black text-sky-400 uppercase tracking-wider mb-1">
                Rule #2: Chat @Mentions & #JobCards
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Never use personal WhatsApp for order changes. Use the floating <strong>Internal Team Chat</strong> to mention <code>#JOB-2025-101</code> or <code>#INV-2025-001</code> so anyone can click and open the record directly.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider mb-1">
                Rule #3: Ruined Panel Shortage Protocol
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If a jersey panel is damaged in Sewing, never ask verbally. Raise a <strong>Shortage / Re-Print Ticket</strong> in the Sewing Portal so Design Team 2 and Print get an instant audio + popup alert.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'smart_sync' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/60 border border-teal-500/30 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-wider">
                  Smart Cross-Component Data Bridge
                </span>
                <h3 className="text-lg font-black text-white mt-2">
                  Connected ERP Components & Automated Data Sharing
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  All modules share live data automatically so staff never have to type the same information twice across Marketing, Inventory, Factory Floors, Accounting, and Courier Dispatch.
                </p>
              </div>
              {onAutoSyncInventoryFromOrders && (
                <button
                  onClick={() => {
                    onAutoSyncInventoryFromOrders();
                    triggerSyncNotification('Synced BOM fabric & paper reservations across all active Job Cards!');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-600/25 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  Run Full Cross-Module Sync Now
                </button>
              )}
            </div>
          </div>

          {/* Connected Bridges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Bridge 1: Job Cards ↔ Raw Inventory BOM
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Automatically calculates required fabric & sublimation transfer paper from active Job Cards ({totalOrderUnits.toLocaleString()} total units = ~{estimatedFabricMeters.toLocaleString()} meters fabric & ~{estimatedPaperMeters.toLocaleString()} meters transfer paper) and links stock deductions directly to Job Card IDs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Low Stock Alerts Triggered: <strong className="text-amber-400">{lowStockCount} items</strong></span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('inventory')}
                    className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Inspect BOM Stock <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Bridge 2: Customer Loyalty ↔ Invoice PDF & Order Discounts
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Selecting a client in Order Entry or Invoice automatically pulls their <strong>Returning Ratio %</strong>, <strong>1–5 Star Rating</strong>, <strong>Privilege Tier Discount %</strong>, and embeds their <strong>Customer Portal Access Pass</strong> directly on the printable Invoice PDF.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">VIP Tier Clients Synced: <strong className="text-white">{customers.length} clients</strong></span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('customers_crm')}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Open Customer CRM <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Bridge 3: Company Assets ↔ Employee Profiles
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Workstation PCs, Industrial Sewing Machines, Sublimation Printers, and Scanners registered in Inventory are live-linked to Employee IDs and automatically appear on the Employee Directory and Asset Handover Receipts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Linked across 3 locations</span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('users_employees')}
                    className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    View Staff & Devices <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Bridge 4: Packing Dispatch ↔ Courier API & Delivery Challan
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    {activeCouriers.length} COURIERS LINKED
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When an order finishes Sewing QC & Packing, one click auto-fills its size breakdown and carton count into a formal <strong>Delivery Challan / Gate Pass</strong> and connects with {activeCouriers.map((c) => c.providerName).join(', ') || 'configured couriers'}.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">One-Click Auto-Fill Ready</span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('documents_center')}
                    className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Generate Challan <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-black text-sky-400 uppercase tracking-wider">Facility 1 • Head Office</div>
            <h3 className="text-base font-black text-white">{companySettings.addressHeadOffice}</h3>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li>• Marketing & B2B/B2C Order Entry</li>
              <li>• Customer Loyalty CRM & Reply Playbook</li>
              <li>• Design Team 1 (External 3D Mockup API Sync)</li>
              <li>• Design Team 2 (Pattern Grading & RIP Print Files)</li>
              <li>• Accounting, Invoicing & B2B Client Ledgers</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Printer className="w-5 h-5" />
            </div>
            <div className="text-xs font-black text-purple-400 uppercase tracking-wider">Facility 2 • Print Factory</div>
            <h3 className="text-base font-black text-white">{companySettings.addressPrintMill}</h3>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li>• QR Bundle Verification & RIP Queue</li>
              <li>• Roll-to-Roll Sublimation Paper Printing</li>
              <li>• Rotary Heat Calendar Press (205°C Transfer)</li>
              <li>• Expedited Re-Print Queue for Shortage Tickets</li>
              <li>• Sublimation Ink (Liters) & Paper (Meters) Tracking</li>
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">Facility 3 • Sewing Factory</div>
            <h3 className="text-base font-black text-white">{companySettings.addressSewingFactory}</h3>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li>• Bundle Intake Check from Print Factory</li>
              <li>• Industrial Overlock, Flatlock & Collar Rib Lines</li>
              <li>• Instant Shortage / Damaged Panel Ticket Alert</li>
              <li>• Final Ironing, Polybag Barcode & Carton Packing</li>
              <li>• Courier Booking & Gate Pass Challan Dispatch</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
