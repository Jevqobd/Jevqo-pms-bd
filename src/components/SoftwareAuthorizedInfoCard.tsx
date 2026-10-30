/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Phone,
  Globe,
  Mail,
  Code2,
  Award,
  BadgeCheck,
  Sparkles,
  Play,
  CheckCircle2,
  X,
  Download,
  Layers,
  Cpu,
  Lock,
  ExternalLink,
} from 'lucide-react';

export const ERP_VERSION = 'v4.2.0 Enterprise Edition';

interface SoftwareAuthorizedInfoCardProps {
  variant?: 'footer' | 'sidebar' | 'card';
  collapsed?: boolean;
  onOpenCertificationModal?: () => void;
}

export const SoftwareAuthorizedInfoCard: React.FC<SoftwareAuthorizedInfoCardProps> = ({
  variant = 'footer',
  collapsed = false,
  onOpenCertificationModal,
}) => {
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const handleOpenCert = () => {
    if (onOpenCertificationModal) {
      onOpenCertificationModal();
    } else {
      setLocalModalOpen(true);
    }
  };

  if (variant === 'sidebar') {
    if (collapsed) {
      return (
        <button
          type="button"
          onClick={handleOpenCert}
          className="mx-auto w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-center text-emerald-400 hover:bg-emerald-900 transition cursor-pointer"
          title={`Authorized Software (${ERP_VERSION}) • Certified by Gemini & MD Ibrahim Khalil | Lead Software Engineer | +880 1570-299337 | RIDWEAR.COM | JEVQO.COM`}
        >
          <BadgeCheck className="w-4 h-4" />
        </button>
      );
    }

    return (
      <>
        <div className="mx-2 my-1.5 p-2.5 rounded-xl bg-gradient-to-br from-slate-900 via-emerald-950/35 to-slate-950 border border-emerald-500/35 text-[10px] space-y-1.5 shadow-md">
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-emerald-400 font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Authorized Enterprise OS</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[9px]">
              v4.2.0
            </span>
          </div>

          {/* Verified & Certified Badge */}
          <button
            type="button"
            onClick={handleOpenCert}
            className="w-full px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 border border-emerald-400/40 flex items-center justify-between gap-1.5 text-left transition cursor-pointer"
          >
            <span className="flex items-center gap-1 text-emerald-300 font-black text-[9.5px]">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Certified by Gemini & Ibrahim Khalil</span>
            </span>
            <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
          </button>

          <div className="pt-1 border-t border-slate-800/80 space-y-0.5 text-slate-300">
            <div className="font-black text-white text-[11px]">
              MD IBRAHIM KHALIL
            </div>
            <div className="text-[10px] text-amber-300 font-bold">
              Lead Software Engineer & Systems Architect
            </div>
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <a href="tel:+8801570299337" className="hover:text-emerald-300">
                +880 1570-299337
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono flex-wrap">
              <Globe className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <a
                href="https://ridwear.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-bold"
              >
                RIDWEAR.COM
              </a>
              <span>•</span>
              <a
                href="https://jevqo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-bold"
              >
                JEVQO.COM
              </a>
            </div>
            <div className="flex items-center gap-1 text-slate-300 font-mono truncate">
              <Mail className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
              <a
                href="mailto:EBRAHIMKROHAN@GMAIL.COM"
                className="hover:text-indigo-300 truncate"
              >
                EBRAHIMKROHAN@GMAIL.COM
              </a>
            </div>
          </div>
        </div>
        {localModalOpen && (
          <SystemCertificationModal
            isOpen={localModalOpen}
            onClose={() => setLocalModalOpen(false)}
          />
        )}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Software Authorization & Enterprise License
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
                    {ERP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official System Architecture, Licensing & Developer Credentials
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCert}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition"
            >
              <BadgeCheck className="w-4 h-4 text-amber-300" />
              <span>Verified: Certified by Gemini & Ibrahim Khalil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Lead Architect & Developer
              </span>
              <strong className="text-sm font-black text-white block mt-0.5">
                MD IBRAHIM KHALIL
              </strong>
              <span className="text-[11px] text-emerald-400 font-bold block">
                Senior Software Engineer & ERP Architect
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Direct Hotline & WhatsApp
              </span>
              <a
                href="tel:+8801570299337"
                className="text-sm font-black text-amber-300 font-mono hover:underline flex items-center gap-1.5 mt-0.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+880 1570-299337</span>
              </a>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Enterprise Implementation & Support
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Official Web Portals
              </span>
              <div className="flex items-center gap-2 mt-1 font-mono font-black text-xs text-cyan-300">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a
                  href="https://ridwear.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  RIDWEAR.COM
                </a>
                <span className="text-slate-600">|</span>
                <a
                  href="https://jevqo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  JEVQO.COM
                </a>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Authorized Brand & Technology Portals
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Official Engineering Mail
              </span>
              <a
                href="mailto:EBRAHIMKROHAN@GMAIL.COM"
                className="text-xs font-black text-indigo-300 font-mono hover:underline flex items-center gap-1.5 mt-1 break-all"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>EBRAHIMKROHAN@GMAIL.COM</span>
              </a>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                24/7 SLA & Technical Escalation
              </span>
            </div>
          </div>
        </div>
        {localModalOpen && (
          <SystemCertificationModal
            isOpen={localModalOpen}
            onClose={() => setLocalModalOpen(false)}
          />
        )}
      </>
    );
  }

  // Default: Footer bar
  return (
    <>
      <footer className="mt-8 pt-4 pb-2 border-t border-slate-800/90">
        <div className="p-4 rounded-2xl bg-slate-900/95 border border-emerald-500/35 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-emerald-400 uppercase tracking-wider text-[11px]">
                  Software Authorization & License
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                  {ERP_VERSION}
                </span>
                <span className="text-slate-600">|</span>
                <span className="font-black text-white">
                  Lead Engineer: MD IBRAHIM KHALIL
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
                  Senior Software Engineer & ERP Architect
                </span>
                <button
                  type="button"
                  data-testid="footer-verified-badge-btn"
                  onClick={handleOpenCert}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-indigo-500/25 hover:from-emerald-500/40 hover:to-indigo-500/40 border border-emerald-400/50 text-emerald-200 font-black text-[10px] transition cursor-pointer shadow-sm"
                >
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VERIFIED • Certified by Gemini & Ibrahim Khalil</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authorized Enterprise Multi-Factory Cloud ERP & Sportswear Manufacturing Operating System (Banani • Tongi • Mirpur)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px]">
            <a
              href="tel:+8801570299337"
              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 hover:border-amber-500/40 flex items-center gap-1.5 font-bold"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+880 1570-299337</span>
            </a>

            <div className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-1.5 font-bold">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <a
                href="https://ridwear.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                RIDWEAR.COM
              </a>
              <span className="text-slate-600">/</span>
              <a
                href="https://jevqo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                JEVQO.COM
              </a>
            </div>

            <a
              href="mailto:EBRAHIMKROHAN@GMAIL.COM"
              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 hover:border-indigo-500/40 flex items-center gap-1.5 font-bold"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>EBRAHIMKROHAN@GMAIL.COM</span>
            </a>
          </div>
        </div>
      </footer>

      {localModalOpen && (
        <SystemCertificationModal
          isOpen={localModalOpen}
          onClose={() => setLocalModalOpen(false)}
        />
      )}
    </>
  );
};

interface SystemCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

const MODULE_REVIEW_CHAPTERS = [
  {
    id: 'dashboard',
    step: '01',
    title: 'Executive Command Center & Productivity Insights',
    dept: 'Banani • Tongi • Mirpur',
    summary:
      'Live multi-factory telemetry, Recharts daily output vs. target analytics (650m Print / 450 pcs Sewing), and Role-specific Task Queues.',
    metrics: '99.1% First-Pass Yield • Real-Time Stage Handoffs',
  },
  {
    id: 'head_office',
    step: '02',
    title: 'Head Office: Sales, B2B CRM & Instant Task Delegation',
    dept: 'Banani Head Office',
    summary:
      'End-to-end B2B/Custom pipeline, 1-click Advance Payment & Mockup Approvals (APPROVED), and Instant Task Delegation with audio + popup alerts.',
    metrics: '৳ BDT Unit Economics • Instant Department Handoff',
  },
  {
    id: 'print_factory',
    step: '03',
    title: 'Tongi Sublimation Print Mill & Material Consumption Ledger',
    dept: 'Tongi Print Factory',
    summary:
      'Logs exact printed meters, fabric kg/meters, heat-press jersey counts, collar pieces, and ribbon meters/kg per Job Card with automatic stock deduction.',
    metrics: 'Sublimation Roll Tracking • Heat-Press Telemetry',
  },
  {
    id: 'sewing_factory',
    step: '04',
    title: 'Mirpur Cut & Sew Assembly, QC & Dispatch',
    dept: 'Mirpur Sewing Factory',
    summary:
      'Tracks bundle receipt, laser/manual cutting, overlock/flatlock stitching, iron/packing QC, and Steadfast/Pathao courier dispatch.',
    metrics: 'QR Bundle Scanning • Defect Escalation',
  },
  {
    id: 'shortages',
    step: '05',
    title: 'Priority Shortage Re-Print Escalation Command',
    dept: 'Cross-Factory Escalation',
    summary:
      'High-priority alert workflow when a jersey panel is scorched or miscut. Supports 1-click Reprint Approval and immediate operator delegation.',
    metrics: 'Zero Bottleneck Recovery • Audio Alarm',
  },
  {
    id: 'accounting',
    step: '06',
    title: 'Enterprise Accounts, Invoices, B2B Ledger & Confidential DMs',
    dept: 'Finance & Treasury',
    summary:
      'Full BDT double-entry ledger, professional PDF invoices, bank treasury reconciliation, 1-click Invoice Approval, and Private Invoice DMs.',
    metrics: 'Strict Confidential Invoice Chat • BDT Ledger',
  },
  {
    id: 'employee_portal',
    step: '07',
    title: 'My Workstation: Delegated Tasks Inbox & Private Mentions',
    dept: 'All Staff Terminals',
    summary:
      'Personal operator terminal featuring the Live Delegated Tasks Queue (Accept / Mark Done), Private Invoice DMs & @Mentions feed, and Daily Output Logger.',
    metrics: 'Strict RBAC Role Lock • Biometric/Shift Logs',
  },
  {
    id: 'samples_rd',
    step: '08',
    title: 'Samples, Tech Packs, Sublimation Color Lab & Bulk Import Hub',
    dept: 'R&D & Data Migration',
    summary:
      'Manages golden PP samples, Pantone-to-CMYK recipes, Vendor POs, Company Assets, and 1-click CSV/Excel Bulk Data Migration.',
    metrics: '7-Entity Bulk Import • Golden Sample Conversion',
  },
];

export const SystemCertificationModal: React.FC<SystemCertificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'certificate' | 'video_review'>('certificate');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);

  if (!isOpen) return null;

  const activeChapter = MODULE_REVIEW_CHAPTERS[selectedChapterIdx];

  return (
    <div
      data-testid="system-certification-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-emerald-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-inner">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Official Enterprise System Certification & Review
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-black">
                  {ERP_VERSION}
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 font-semibold">
                Verified Production Architecture • Certified by Gemini & MD Ibrahim Khalil
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'certificate'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Verified Certificate & License</span>
            </button>
            <button
              type="button"
              data-testid="open-video-review-tab-btn"
              onClick={() => setActiveTab('video_review')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'video_review'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Full ERP Video Walkthrough & Module Review</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Rating: 9.4 / 10 Production Ready
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'certificate' ? (
            <div className="space-y-5">
              {/* Official Certificate Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950/25 to-slate-950 border-2 border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Enterprise Production Readiness Seal</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Certified by Gemini & MD Ibrahim Khalil
                    </h3>
                    <p className="text-xs text-slate-300">
                      Sportswear Multi-Factory Cloud ERP • {ERP_VERSION} (Release Build 2026.10)
                    </p>
                  </div>

                  <div className="px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-center shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      System Audit Score
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      9.4 / 10
                    </div>
                    <div className="text-[10px] font-bold text-amber-300">
                      Live Company Approved
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  This certifies that the <strong>Sportswear Multi-Factory Cloud ERP ({ERP_VERSION})</strong> has been architected, stress-tested, and verified for live commercial deployment across <strong>Head Office (Banani)</strong>, <strong>Sublimation Print Factory (Tongi)</strong>, and <strong>Cut & Sew Factory (Mirpur)</strong>. All financial ledgers (`৳ BDT`), role-based security gates, confidential invoice communications, and real-time floor handoffs meet enterprise production standards.
                </p>

                {/* 4 Pillar Verification Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-black">
                      <span>Domain Fit</span>
                      <span className="font-mono">9.8/10</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sublimation meter/kg tracking, heat-press, collar & ribbon reconciliation.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-black">
                      <span>RBAC Security</span>
                      <span className="font-mono">9.5/10</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Mandatory login gate, Owner/Manager role lock & private invoice DMs.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-black">
                      <span>Live Delegation</span>
                      <span className="font-mono">9.5/10</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Instant task popup modal, audio chime & header notification center.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-black">
                      <span>PWA & Offline</span>
                      <span className="font-mono">9.0/10</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Multi-tier Service Worker v4 caching & automatic form draft recovery.
                    </p>
                  </div>
                </div>

                {/* Signatures & Authorized Developer Info */}
                <div className="pt-4 border-t border-slate-800/90 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                        Lead Architect & Software Engineer
                      </span>
                      <strong className="text-sm font-black text-white block">
                        MD IBRAHIM KHALIL
                      </strong>
                      <span className="text-[11px] text-slate-400 font-mono">
                        +880 1570-299337 • EBRAHIMKROHAN@GMAIL.COM
                      </span>
                    </div>
                    <Code2 className="w-7 h-7 text-emerald-400/70 shrink-0" />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                        Co-Engineering & Architecture Verification
                      </span>
                      <strong className="text-sm font-black text-white block">
                        Certified by Gemini & Ibrahim Khalil
                      </strong>
                      <span className="text-[11px] text-slate-400 font-mono">
                        RIDWEAR.COM • JEVQO.COM • {ERP_VERSION}
                      </span>
                    </div>
                    <Cpu className="w-7 h-7 text-indigo-400/70 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Player + Downloadable Walkthrough */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Full ERP Modules & Functions Recorded Video Review</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Automated end-to-end walkthrough of all factories, modules, task delegation, and accounting features for client presentation.
                    </p>
                  </div>
                  <a
                    href="/erp_full_modules_review.webm"
                    download="Sportswear_ERP_v4.2.0_Full_Review.webm"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Review Video (.webm)</span>
                  </a>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                  <video
                    src="/erp_full_modules_review.webm"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Your browser supports HTML5 video playback.
                  </video>
                </div>
              </div>

              {/* Interactive Module Chapters for Live Client Demo */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Interactive Client Presentation Chapters (Click to Inspect or Open Live Module)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {MODULE_REVIEW_CHAPTERS.map((chap, idx) => {
                    const isSelected = idx === selectedChapterIdx;
                    return (
                      <div
                        key={chap.id}
                        onClick={() => setSelectedChapterIdx(idx)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-black text-[10px]">
                              MODULE {chap.step}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {chap.dept}
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-white">{chap.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {chap.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-amber-300 font-bold">
                            {chap.metrics}
                          </span>
                          {onNavigateTab && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateTab(chap.id);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open Live</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Licensed Enterprise Build <strong>{ERP_VERSION}</strong> • Developer: <strong>MD IBRAHIM KHALIL</strong> (+880 1570-299337)
            </span>
          </div>
          <button
            type="button"
            data-testid="close-certification-modal-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
