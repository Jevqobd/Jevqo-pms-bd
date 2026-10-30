/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { Language } from '../utils/translations';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallBannerProps {
  language?: Language;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ language = 'en' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwReady(true);
      });
    }

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowManualHelp(true);
      return;
    }

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // If offline, always show an offline service worker active banner
  if (!isOnline) {
    return (
      <div className="bg-amber-950/90 border border-amber-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs mb-4">
        <div className="flex items-center gap-2.5">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <span className="font-black text-amber-200">
              {'Offline Mode Active — Serving Cached ERP Assets via Service Worker'}
            </span>
            <p className="text-[11px] text-amber-300/80">
              {'All form entries are auto-saved in local draft storage and will sync automatically when back online.'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0">
          OFFLINE READY
        </span>
      </div>
    );
  }

  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-white">
              {'Install Sportswear OS on Android / Desktop'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" /> PWA Offline Cache {swReady ? 'Active' : 'Ready'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5" /> Auto-Draft Enabled
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {showManualHelp
              ? 'On Android Chrome: Tap the top-right 3-dot menu and select "Install app" or "Add to Home screen".'
              : 'Multi-tier service worker caches critical fonts, icons & UI shells for instant mobile speed and offline resilience.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{'Install App'}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="btn-press p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
