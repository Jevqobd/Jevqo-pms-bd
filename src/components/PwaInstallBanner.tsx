/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
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

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
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
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // In case beforeinstallprompt hasn't fired yet or browser unsupported
      alert(
        language === 'bn'
          ? 'অ্যান্ড্রয়েড ক্রোম ব্রাউজারে ডানদিকের ৩-ডট মেনুতে ক্লিক করে "Add to Home screen" বা "Install App" সিলেক্ট করুন।'
          : 'To install on Android Chrome: Tap the top-right 3 dots menu and select "Install app" or "Add to Home screen".'
      );
      return;
    }

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-white">
              {language === 'bn' ? 'অ্যান্ড্রয়েড অ্যাপ হিসেবে ইনস্টল করুন' : 'Install Sportswear OS on Android'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              PWA App
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            {language === 'bn'
              ? 'মোবাইল হোম স্ক্রিন থেকে ফুল-স্ক্রিন অ্যাপ হিসেবে চালান ও কিউআর স্ক্যানার দ্রুত ব্যবহার করুন।'
              : 'Add to mobile home screen for full-screen native experience, instant camera scanner & offline cache.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'ইনস্টল' : 'Install'}</span>
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
