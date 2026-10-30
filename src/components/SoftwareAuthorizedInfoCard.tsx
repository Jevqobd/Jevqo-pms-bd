/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Phone, Globe, Mail, Code2, Award } from 'lucide-react';

interface SoftwareAuthorizedInfoCardProps {
  variant?: 'footer' | 'sidebar' | 'card';
  collapsed?: boolean;
}

export const SoftwareAuthorizedInfoCard: React.FC<SoftwareAuthorizedInfoCardProps> = ({
  variant = 'footer',
  collapsed = false,
}) => {
  if (variant === 'sidebar') {
    if (collapsed) {
      return (
        <div
          className="mx-auto w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400"
          title="Software Authorized Info: MD IBRAHIM KHALIL | SOFTWEAR ENGENNER | +8801570299337 | RIDWEAR.COM | JEVQO.COM | EBRAHIMKROHAN@GMAIL.COM"
        >
          <Code2 className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className="mx-2 my-1.5 p-2.5 rounded-xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-950 border border-emerald-500/30 text-[10px] space-y-1 shadow-md">
        <div className="flex items-center justify-between text-emerald-400 font-black uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Softwear Authorized Info</span>
          </span>
        </div>
        <div className="pt-0.5 border-t border-slate-800/80 space-y-0.5 text-slate-300">
          <div className="font-extrabold text-white text-[11px]">
            Developer: MD IBRAHIM KHALIL
          </div>
          <div className="text-[10px] text-amber-300 font-bold">
            SOFTWEAR ENGENNER (Software Engineer)
          </div>
          <div className="flex items-center gap-1 text-slate-300 font-mono">
            <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <a href="tel:+8801570299337" className="hover:text-emerald-300">
              +8801570299337
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
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>Softwear Authorized Info</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                  Verified License
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Official Developer & System Architect Credentials
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Developer
            </span>
            <strong className="text-sm font-black text-white block mt-0.5">
              MD IBRAHIM KHALIL
            </strong>
            <span className="text-[11px] text-emerald-400 font-bold block">
              SOFTWEAR ENGENNER (Software Engineer)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Contact
            </span>
            <a
              href="tel:+8801570299337"
              className="text-sm font-black text-amber-300 font-mono hover:underline flex items-center gap-1.5 mt-0.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+8801570299337</span>
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Direct Hotline & WhatsApp Support
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Official Websites
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
              Authorized Brand & Enterprise Portals
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Official Mail
            </span>
            <a
              href="mailto:EBRAHIMKROHAN@GMAIL.COM"
              className="text-xs font-black text-indigo-300 font-mono hover:underline flex items-center gap-1.5 mt-1 break-all"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>EBRAHIMKROHAN@GMAIL.COM</span>
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              24/7 Enterprise Technical Support
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default: Footer bar
  return (
    <footer className="mt-8 pt-4 pb-2 border-t border-slate-800/90">
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-emerald-400 uppercase tracking-wider text-[11px]">
                Softwear Authorized Info
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-black text-white">
                Developer: MD IBRAHIM KHALIL
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                SOFTWEAR ENGENNER (Software Engineer)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Authorized Enterprise Multi-Factory Cloud ERP & Sportswear Brand Operating System
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <a
            href="tel:+8801570299337"
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 hover:border-emerald-500/50 flex items-center gap-1.5 font-bold"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>CONTACT: +8801570299337</span>
          </a>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-1.5 font-bold">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>WEBSITE:</span>
            <a
              href="https://ridwear.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-white"
            >
              RIDWEAR.COM
            </a>
            <span className="text-slate-600">/</span>
            <a
              href="https://jevqo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-white"
            >
              JEVQO.COM
            </a>
          </div>

          <a
            href="mailto:EBRAHIMKROHAN@GMAIL.COM"
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 hover:border-indigo-500/50 flex items-center gap-1.5 font-bold"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>MAIL: EBRAHIMKROHAN@GMAIL.COM</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
