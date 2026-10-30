/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Customer,
  CustomerPrivilegeTier,
  Order,
  Invoice,
  MarketingFaqItem,
  UserRole,
} from '../types/erp';
import { useFormDraft } from '../utils/useFormDraft';
import { Language } from '../utils/translations';
import {
  Users,
  Star,
  Award,
  TrendingUp,
  Plus,
  Search,
  Copy,
  Check,
  MessageSquare,
  ExternalLink,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  X,
  FileText,
  KeyRound,
  Percent,
} from 'lucide-react';

interface CustomersModuleProps {
  customers: Customer[];
  orders: Order[];
  invoices: Invoice[];
  faqs: MarketingFaqItem[];
  currentRole: UserRole;
  language?: Language;
  onCreateCustomer: (cust: Customer) => Promise<void>;
  onUpdateCustomer: (id: string, partial: Partial<Customer>) => Promise<void>;
  onCreateFaq: (faq: MarketingFaqItem) => Promise<void>;
  onOpenCreateOrder: () => void;
  onOpenClientPortal: () => void;
  onOpenChat: () => void;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  customers,
  orders,
  invoices,
  faqs,
  currentRole,
  language = 'en',
  onCreateCustomer,
  onUpdateCustomer,
  onCreateFaq,
  onOpenCreateOrder,
  onOpenClientPortal,
  onOpenChat,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'customer_directory' | 'marketing_playbook'>('customer_directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Customer Modal + Auto-Draft
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const {
    draft: custDraft,
    updateField: updateCustField,
    clearDraft: clearCustDraft,
    lastSavedAt: custDraftSavedAt,
  } = useFormDraft('customers_create_form', {
    name: '',
    type: 'b2b' as 'b2b' | 'b2c',
    companyOrClub: '',
    email: '',
    phone: '+880 17',
    address: '',
    creditLimit: 5000,
    returningRatio: 85,
    starRating: 5,
    privilegeTier: 'gold' as CustomerPrivilegeTier,
    discountPrivilegePercent: 8,
    notes: '',
  });

  // Create FAQ Script Modal + Auto-Draft
  const [isAddFaqOpen, setIsAddFaqOpen] = useState(false);
  const {
    draft: faqDraft,
    updateField: updateFaqField,
    clearDraft: clearFaqDraft,
  } = useFormDraft('marketing_faq_create_form', {
    category: 'pricing_moq' as MarketingFaqItem['category'],
    question: '',
    answerEn: '',
    answerBn: '',
    proTip: '',
  });

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCustomers = customers.filter((c) => {
    if (tierFilter !== 'all' && c.privilegeTier !== tierFilter) return false;
    if (
      searchTerm &&
      !c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.companyOrClub.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const filteredFaqs = faqs.filter((f) => {
    if (faqCategoryFilter !== 'all' && f.category !== faqCategoryFilter) return false;
    if (
      searchTerm &&
      !f.question.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !f.answerEn.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custDraft.name.trim()) return;

    const codePrefix = custDraft.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: custDraft.name.trim(),
      type: custDraft.type,
      companyOrClub: custDraft.companyOrClub || custDraft.name,
      email: custDraft.email || 'client@sportswear.bd',
      phone: custDraft.phone,
      address: custDraft.address || 'Dhaka, Bangladesh',
      creditLimit: Number(custDraft.creditLimit) || 0,
      outstandingBalance: 0,
      status: custDraft.privilegeTier === 'platinum_vip' ? 'vip' : 'active',
      returningRatio: Number(custDraft.returningRatio) || 80,
      starRating: Number(custDraft.starRating) || 5,
      privilegeTier: custDraft.privilegeTier,
      discountPrivilegePercent: Number(custDraft.discountPrivilegePercent) || 5,
      portalAccessCode: `PORTAL-${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      totalOrdersCount: 1,
      lifetimeSpend: 0,
      notes: custDraft.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    await onCreateCustomer(newCustomer);
    clearCustDraft();
    setIsAddCustomerOpen(false);
  };

  const handleCreateFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqDraft.question.trim() || !faqDraft.answerEn.trim()) return;
    await onCreateFaq({
      id: `faq-${Date.now()}`,
      category: faqDraft.category,
      question: faqDraft.question,
      answerEn: faqDraft.answerEn,
      answerBn: faqDraft.answerBn || faqDraft.answerEn,
      proTip: faqDraft.proTip,
    });
    clearFaqDraft();
    setIsAddFaqOpen(false);
  };

  const getPrivilegeBadge = (tier?: CustomerPrivilegeTier) => {
    switch (tier) {
      case 'platinum_vip':
        return {
          label: '👑 PLATINUM VIP PRIVILEGE',
          classes: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'gold':
        return {
          label: '🥇 GOLD CLUB PARTNER',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'silver':
        return {
          label: '🥈 SILVER MEMBER',
          classes: 'bg-slate-700 text-slate-200 border-slate-600',
        };
      default:
        return {
          label: 'STANDARD CLIENT',
          classes: 'bg-slate-800 text-slate-400 border-slate-700',
        };
    }
  };

  const avgReturningRatio = Math.round(
    customers.reduce((acc, c) => acc + (c.returningRatio || 80), 0) / Math.max(1, customers.length)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-xs">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white border border-indigo-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 backdrop-blur-md">
            <Users className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                {'Customers Directory, Loyalty Privileges & Marketing Playbook'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px]">
                ⭐ Returning Ratio & VIP Star Privileges
              </span>
            </div>
            <p className="text-xs text-indigo-100/90 max-w-2xl mt-0.5">
              Dedicated B2B/B2C customer intelligence with returning order ratios, 5-star loyalty ratings, Customer Portal access codes, and the Marketing Team’s instant Customer Q&A reply script bank.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenClientPortal}
            className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-indigo-300" />
            <span>Open Customer Portal</span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total B2B & B2C Clients</span>
          <div className="text-xl font-black text-white mt-1">{customers.length} Accounts</div>
          <span className="text-[11px] text-emerald-400 font-semibold">
            {customers.filter((c) => c.type === 'b2b').length} Corporate / Clubs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Avg. Returning Ratio</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {avgReturningRatio}% Repeat Rate
          </div>
          <span className="text-[11px] text-slate-400">High tournament retention</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Platinum VIP Partners</span>
          <div className="text-xl font-black text-purple-400 mt-1">
            {customers.filter((c) => c.privilegeTier === 'platinum_vip').length} VIP Clubs
          </div>
          <span className="text-[11px] text-amber-400 font-bold">⭐⭐⭐⭐⭐ 5-Star Tier</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Marketing Q&A Scripts</span>
          <div className="text-xl font-black text-indigo-400 mt-1">{faqs.length} Ready Replies</div>
 <span className="text-[11px] text-slate-400">English & instant copy</span>
        </div>
      </div>

      {/* Sub-Navigation & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('customer_directory')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer ${
              activeSubTab === 'customer_directory'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Dedicated Customer List & Privilege Stars ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('marketing_playbook')}
            className={`btn-press flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer ${
              activeSubTab === 'marketing_playbook'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Marketing Instructions & Customer Q&A Bank ({faqs.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeSubTab === 'customer_directory'
                ? 'Search customer, club, phone...'
                : 'Search customer question or topic...'
            }
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ===================== SUB-TAB 1: DEDICATED CUSTOMER LIST ===================== */}
      {activeSubTab === 'customer_directory' && (
        <div className="space-y-4">
          {/* Privilege Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Customers' },
              { id: 'platinum_vip', label: '👑 Platinum VIP (10-12% Off)' },
              { id: 'gold', label: '🥇 Gold Partner (8% Off)' },
              { id: 'silver', label: '🥈 Silver Member (5% Off)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTierFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  tierFilter === t.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((cust) => {
              const badge = getPrivilegeBadge(cust.privilegeTier);
              const stars = cust.starRating || 5;
              const returning = cust.returningRatio || 85;
              const custOrders = orders.filter(
                (o) => o.clientName.toLowerCase() === cust.name.toLowerCase()
              );

              return (
                <div
                  key={cust.id}
                  className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Top Row: Name + Privilege Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md border mb-1 ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                        <h3 className="font-black text-base text-white leading-tight">
                          {cust.name}
                        </h3>
                        <p className="text-xs font-bold text-indigo-400">{cust.companyOrClub}</p>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold uppercase text-[10px]">
                        {cust.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Returning Ratio & Loyalty Stars Box */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Loyalty Star Rating
                          </span>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => onUpdateCustomer(cust.id, { starRating: s })}
                                title={`Set ${s} Star Rating`}
                                className="cursor-pointer"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    s <= stars
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-1.5 font-mono font-black text-amber-400">
                              {stars}.0
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Returning Ratio
                          </span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {returning}%
                          </span>
                        </div>
                      </div>

                      {/* Returning Ratio Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, returning)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>
                          Privilege Discount:{' '}
                          <strong className="text-amber-300">
                            {cust.discountPrivilegePercent || 10}% OFF
                          </strong>
                        </span>
                        <span>
                          Orders: <strong className="text-white">{cust.totalOrdersCount || custOrders.length || 1}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Portal Access Pass Box */}
                    <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-indigo-300 block">
                            Invoice & Portal Access Key
                          </span>
                          <span className="font-mono font-black text-white text-xs">
                            {cust.portalAccessCode || `PORTAL-${cust.id.toUpperCase()}`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleCopyText(
                            cust.id,
                            cust.portalAccessCode || `PORTAL-${cust.id.toUpperCase()}`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === cust.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Key
                          </>
                        )}
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-slate-200">{cust.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cust.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Outstanding Due</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          cust.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        ৳{cust.outstandingBalance.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={onOpenClientPortal}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
                      >
                        Portal View
                      </button>
                      <button
                        onClick={onOpenCreateOrder}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        + New Order
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== SUB-TAB 2: MARKETING INSTRUCTIONS & CUSTOMER Q&A BANK ===================== */}
      {activeSubTab === 'marketing_playbook' && (
        <div className="space-y-6">
          {/* Marketing Team Golden Rules & Instructions */}
          <div className="p-5 rounded-2xl bg-slate-900/95 border border-emerald-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-sm text-white">
                    Mandatory Marketing Team SOP & Order Intake Instructions
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Follow these 5 steps on every B2B/B2C order to guarantee zero factory delays or size disputes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFaqOpen(true)}
                className="btn-press px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer self-start"
              >
                + Add Custom Q&A Script
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                {
                  step: '01',
                  title: '50% Advance Rule',
                  desc: 'Collect minimum 50% deposit via Bank or bKash Merchant and attach proof screenshot before sending to Design.',
                },
                {
                  step: '02',
                  title: 'Fabric & GSM Match',
                  desc: 'Confirm sport type: 160 GSM Micro-Eyelet for Football, 170 GSM Dot Mesh for Cricket, 180 GSM Interlock for Basketball.',
                },
                {
                  step: '03',
                  title: 'Collar & Shorts Spec',
                  desc: 'Specify exact collar (V-Neck, Polo Ribbed, Mandarin) and whether matching shorts require zipper pockets or inner liner.',
                },
                {
                  step: '04',
                  title: 'PDF Spec Approval',
                  desc: 'Generate the Printable Customer Approval Sheet PDF from the Order Form and get client WhatsApp confirmation.',
                },
                {
                  step: '05',
                  title: 'Invoice Portal Key',
                  desc: 'Share the Invoice PDF containing the Customer Portal Access Key so the client can track live factory stages.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                >
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    STEP {item.step}
                  </span>
                  <h4 className="font-black text-xs text-white pt-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category Filter for FAQs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Customer Q&A Scripts' },
              { id: 'pricing_moq', label: '💰 Pricing & MOQ' },
              { id: 'fabric_gsm', label: '👕 Fabric & GSM Advice' },
              { id: 'delivery_sla', label: '🚚 Delivery & 72h Rush SLA' },
              { id: 'payment_terms', label: '💳 Payment & Advance Policy' },
              { id: 'design_sizing', label: '📐 Roster & Plus Sizing' },
              { id: 'shortage_warranty', label: '🛡️ Color & Reprint Warranty' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFaqCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  faqCategoryFilter === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="p-5 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <h4 className="font-black text-sm text-white leading-snug">
                        {faq.question}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-emerald-300 shrink-0">
                      {faq.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* English Script */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-indigo-400">
                        🇬🇧 English Reply Script
                      </span>
                      <button
                        onClick={() => handleCopyText(`${faq.id}-en`, faq.answerEn)}
                        className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `${faq.id}-en` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy English
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      {faq.answerEn}
                    </p>
                  </div>

                  {/* Bangla Script */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-emerald-400">
 🇧🇩 Bangla Reply
                      </span>
                      <button
                        onClick={() => handleCopyText(`${faq.id}-bn`, faq.answerBn)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `${faq.id}-bn` ? (
                          <>
 <Check className="w-3 h-3 text-emerald-400" /> !
                          </>
                        ) : (
                          <>
 <Copy className="w-3 h-3" /> Copy 
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      {faq.answerBn}
                    </p>
                  </div>
                </div>

                {faq.proTip && (
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Sales Pro-Tip:</strong> {faq.proTip}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD NEW CUSTOMER (WITH AUTO-DRAFT) ===================== */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">Add Customer & Privilege Profile</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    Draft Auto-Saved {custDraftSavedAt ? `@ ${custDraftSavedAt}` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Generates a dedicated Customer Portal Access Pass & Loyalty Star Tier.
                </p>
              </div>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bashundhara Kings Academy"
                    value={custDraft.name}
                    onChange={(e) => updateCustField('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Club / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Kings Sports Division"
                    value={custDraft.companyOrClub}
                    onChange={(e) => updateCustField('companyOrClub', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Account Type</label>
                  <select
                    value={custDraft.type}
                    onChange={(e) => updateCustField('type', e.target.value as 'b2b' | 'b2c')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                  >
                    <option value="b2b">B2B (Club / Corporate)</option>
                    <option value="b2c">B2C (Direct Retail)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={custDraft.phone}
                    onChange={(e) => updateCustField('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Email</label>
                  <input
                    type="email"
                    value={custDraft.email}
                    onChange={(e) => updateCustField('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                  />
                </div>
              </div>

              {/* Privilege & Returning Ratio Config */}
              <div className="p-3.5 rounded-2xl bg-purple-950/25 border border-purple-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-purple-300">Privilege Tier</label>
                  <select
                    value={custDraft.privilegeTier}
                    onChange={(e) => updateCustField('privilegeTier', e.target.value as CustomerPrivilegeTier)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-purple-500/40 text-white font-bold mt-1"
                  >
                    <option value="platinum_vip">👑 Platinum VIP</option>
                    <option value="gold">🥇 Gold Partner</option>
                    <option value="silver">🥈 Silver Member</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-300">Stars (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={custDraft.starRating}
                    onChange={(e) => updateCustField('starRating', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-emerald-300">Privilege % Off</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={custDraft.discountPrivilegePercent}
                    onChange={(e) => updateCustField('discountPrivilegePercent', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Delivery Address</label>
                <input
                  type="text"
                  value={custDraft.address}
                  onChange={(e) => updateCustField('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearCustDraft();
                    setIsAddCustomerOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/50 text-rose-300 border border-rose-800/50 font-bold cursor-pointer"
                >
                  Cancel & Discard Draft
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                  >
                    Keep Draft
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                  >
                    Save Customer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD NEW MARKETING FAQ SCRIPT (WITH AUTO-DRAFT) ===================== */}
      {isAddFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white">Add Marketing Customer Q&A Script</h3>
              <button onClick={() => setIsAddFaqOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFaqSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Topic Category</label>
                <select
                  value={faqDraft.category}
                  onChange={(e) => updateFaqField('category', e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                >
                  <option value="pricing_moq">Pricing & MOQ</option>
                  <option value="fabric_gsm">Fabric & GSM</option>
                  <option value="delivery_sla">Delivery & Rush Orders</option>
                  <option value="payment_terms">Payment Terms</option>
                  <option value="design_sizing">Design & Sizing</option>
                  <option value="shortage_warranty">Warranty & Reprint</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Customer Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Can you match our club's exact Pantone gold color?"
                  value={faqDraft.question}
                  onChange={(e) => updateFaqField('question', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">English Answer Script *</label>
                <textarea
                  rows={3}
                  required
                  value={faqDraft.answerEn}
                  onChange={(e) => updateFaqField('answerEn', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                />
              </div>
              <div>
 <label className="text-[10px] font-bold uppercase text-slate-400"> Bangla Reply Script</label>
                <textarea
                  rows={3}
                  value={faqDraft.answerBn}
                  onChange={(e) => updateFaqField('answerBn', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white mt-1"
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearFaqDraft();
                    setIsAddFaqOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/50 text-rose-300 font-bold"
                >
                  Discard Draft
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                >
                  Save Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
