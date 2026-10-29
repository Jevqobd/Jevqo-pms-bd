/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole, FactoryLocation, ROLE_CONFIGS, ShortageTicket } from '../types/erp';
import {
  Building2,
  Printer,
  Scissors,
  AlertTriangle,
  Sparkles,
  Plus,
  LogIn,
  LogOut,
  User as UserIcon,
  Layers,
  ChevronDown,
  Wand2,
  Bot,
  Users,
  DollarSign,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../firebase/config';

export type NavTab =
  | 'orders'
  | 'head_office'
  | 'accounting'
  | 'hr_payroll'
  | 'inventory'
  | '3d_studio'
  | 'mockup_studio'
  | 'print_floor'
  | 'sewing_floor'
  | 'shortages'
  | 'managers_portal'
  | 'employee_portal';

interface HeaderProps {
  currentRole: UserRole;
  onOpenRoleSwitcher: () => void;
  selectedLocation: FactoryLocation | 'all';
  onSelectLocation: (loc: FactoryLocation | 'all') => void;
  shortageTickets: ShortageTicket[];
  onOpenShortages: () => void;
  onOpenCreateOrder: () => void;
  onOpenAiAssistant: () => void;
  onOpenChatbot: () => void;
  currentUser: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onOpenRoleSwitcher,
  selectedLocation,
  onSelectLocation,
  shortageTickets,
  onOpenShortages,
  onOpenCreateOrder,
  onOpenAiAssistant,
  onOpenChatbot,
  currentUser,
  activeTab,
  onSelectTab,
}) => {
  const roleConfig = ROLE_CONFIGS[currentRole];
  const openShortageCount = shortageTickets.filter((t) => t.status !== 'resolved').length;

  const handleAuthAction = async () => {
    if (currentUser) {
      await logoutUser();
    } else {
      try {
        await loginWithGoogle();
      } catch (e) {
        console.error('Login error:', e);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-xs">
      {/* Top Notification Bar if there are open urgent shortage tickets */}
      {openShortageCount > 0 && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>
              URGENT FACTORY REPRINT LOOP: {openShortageCount} active shortage ticket(s) raised by Sewing Factory!
            </span>
          </div>
          <button
            onClick={onOpenShortages}
            className="underline hover:text-red-100 font-bold text-xs cursor-pointer flex items-center gap-1"
          >
            Review Re-print Queue &rarr;
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black tracking-wider shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-gray-900 dark:text-white tracking-tight text-base sm:text-lg">
                  Sportswear Cloud ERP
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  3-Factory Realtime
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                Head Office &bull; Print Factory &bull; Sewing Factory
              </p>
            </div>
          </div>

          {/* Location View Filter (Desktop) */}
          <div className="hidden xl:flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-xs font-medium">
            <button
              onClick={() => onSelectLocation('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedLocation === 'all'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              All 3 Locations
            </button>
            <button
              onClick={() => onSelectLocation('head_office')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedLocation === 'head_office'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Head Office
            </button>
            <button
              onClick={() => onSelectLocation('print_factory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedLocation === 'print_factory'
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Print Factory
            </button>
            <button
              onClick={() => onSelectLocation('sewing_factory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedLocation === 'sewing_factory'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Sewing Factory
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Multi-Turn Chatbot Drawer Trigger */}
            <button
              onClick={onOpenChatbot}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs hover:from-indigo-700 hover:to-violet-700 transition"
              title="Open Multi-Turn Gemini ERP Chatbot"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Chatbot</span>
            </button>

            {/* AI Fast Copilot Button */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 transition"
              title="Open Gemini Production Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">Copilot</span>
            </button>

            {/* New Job Card Button (for Marketing & Owner) */}
            {(currentRole === 'marketing' || currentRole === 'owner') && (
              <button
                onClick={onOpenCreateOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Job Card</span>
              </button>
            )}

            {/* Role Switcher Pill */}
            <button
              onClick={onOpenRoleSwitcher}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition text-left"
              title="Click to switch employee role"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-medium leading-none">Role:</span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">
                  {roleConfig.shortLabel}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
            </button>

            {/* Google Auth Status */}
            <button
              onClick={handleAuthAction}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition"
              title={currentUser ? `Signed in as ${currentUser.email}. Click to sign out` : 'Sign in with Google'}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-500" />
              )}
              <span className="hidden md:inline font-medium text-xs">
                {currentUser ? currentUser.displayName?.split(' ')[0] || 'Logged in' : 'Sign In'}
              </span>
              {currentUser ? (
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs covering all departments and modules */}
        <div className="flex items-center gap-1 sm:gap-2 border-t border-gray-100 dark:border-gray-800 overflow-x-auto py-2 text-xs font-bold">
          <button
            onClick={() => onSelectTab('orders')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            📋 Production Pipeline
          </button>

          <button
            onClick={() => onSelectTab('managers_portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'managers_portal'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Managers Portal</span>
          </button>

          <button
            onClick={() => onSelectTab('employee_portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'employee_portal'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Employee Portal</span>
          </button>

          <button
            onClick={() => onSelectTab('head_office')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'head_office'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Marketing CRM (B2B/B2C)</span>
          </button>

          <button
            onClick={() => onSelectTab('accounting')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'accounting'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accounting & Ledgers</span>
          </button>

          <button
            onClick={() => onSelectTab('hr_payroll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'hr_payroll'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span>HR & Payroll</span>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            📦 Warehouse & Stock
          </button>

          <button
            onClick={() => onSelectTab('3d_studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === '3d_studio'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-[10px] font-black px-1.5 py-0.2 bg-indigo-500/30 rounded text-indigo-300">
              3D
            </span>
            <span>Three.js 3D Studio</span>
          </button>

          <button
            onClick={() => onSelectTab('mockup_studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'mockup_studio'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Mockup Studio</span>
          </button>

          <button
            onClick={() => onSelectTab('print_floor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'print_floor'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-teal-500" />
            <span>Print Factory Floor</span>
          </button>

          <button
            onClick={() => onSelectTab('sewing_floor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'sewing_floor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sewing Factory Floor</span>
          </button>

          <button
            onClick={() => onSelectTab('shortages')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'shortages'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Shortages & Re-prints</span>
            {openShortageCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 dark:bg-red-900/80 dark:text-red-200 font-black">
                {openShortageCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
