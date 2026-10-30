/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserRole,
  FactoryLocation,
  ROLE_CONFIGS,
  ShortageTicket,
} from '../types/erp';
import {
  Language,
  getTranslation,
  getRoleName,
} from '../utils/translations';
import {
  LayoutDashboard,
  Building2,
  Printer,
  Scissors,
  AlertTriangle,
  Package,
  DollarSign,
  Users,
  ShieldCheck,
  UserCheck,
  QrCode,
  MessageSquare,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Shirt,
  Layers,
  Plus,
  FileText,
  BookOpen,
  Star,
  Truck,
  FlaskConical,
  Database,
  Lock,
} from 'lucide-react';
import { isAudioEnabled, setAudioEnabled } from '../utils/soundEffects';
import { SoftwareAuthorizedInfoCard } from './SoftwareAuthorizedInfoCard';

export type NavTab =
  | 'dashboard_tasks'
  | 'orders'
  | 'head_office'
  | 'customers_crm'
  | 'product_dev_samples'
  | 'vendors_suppliers'
  | 'accounting'
  | 'hr_payroll'
  | 'users_employees'
  | 'inventory'
  | 'documents_center'
  | 'guidelines_sop'
  | 'bulk_import'
  | 'print_floor'
  | 'sewing_floor'
  | 'shortages'
  | 'managers_portal'
  | 'employee_portal';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: NavTab;
  language?: Language;
  customModuleNames?: Record<string, string>;
  onSelectTab: (tab: NavTab) => void;
  onToggleLanguage?: () => void;
  onOpenRoleSwitcher: () => void;
  canSwitchRole?: boolean;
  shortageTickets: ShortageTicket[];
  onOpenCreateOrder: () => void;
  onOpenQrScanner: () => void;
  onOpenChat: () => void;
  unreadChatCount?: number;
  currentUser: { email?: string | null; displayName?: string | null } | null;
  onAuthAction: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  language = 'en',
  customModuleNames = {},
  onSelectTab,
  onOpenRoleSwitcher,
  canSwitchRole = true,
  shortageTickets,
  onOpenCreateOrder,
  onOpenQrScanner,
  onOpenChat,
  unreadChatCount = 3,
  currentUser,
  onAuthAction,
  collapsed,
  onToggleCollapse,
}) => {
  const [audioActive, setAudioActive] = useState(isAudioEnabled());
  const roleConfig = ROLE_CONFIGS[currentRole];
  const openShortages = shortageTickets.filter((t) => t.status !== 'resolved').length;

  const toggleSound = () => {
    const next = !audioActive;
    setAudioEnabled(next);
    setAudioActive(next);
  };

  // RBAC Tab visibility filter
  const isTabAllowed = (tab: NavTab): boolean => {
    if (currentRole === 'owner') return true;

    switch (tab) {
      case 'dashboard_tasks':
      case 'guidelines_sop':
      case 'bulk_import':
        return true; // Everyone sees Dashboard, Tasks, Bulk Import & Guidelines!
      case 'orders':
        return currentRole !== 'floor_worker';
      case 'head_office':
      case 'customers_crm':
        return currentRole === 'marketing' || currentRole === 'accountant';
      case 'accounting':
        return currentRole === 'accountant' || currentRole === 'marketing';
      case 'documents_center':
        return currentRole !== 'floor_worker';
      case 'hr_payroll':
      case 'users_employees':
        return (
          currentRole === 'hr_manager' ||
          currentRole === 'accountant' ||
          currentRole === 'print_factory' ||
          currentRole === 'sewing_factory'
        );
      case 'inventory':
      case 'vendors_suppliers':
        return (
          currentRole === 'print_factory' ||
          currentRole === 'sewing_factory' ||
          currentRole === 'accountant' ||
          currentRole === 'marketing'
        );
      case 'product_dev_samples':
        return (
          currentRole === 'design_mockup' ||
          currentRole === 'design_pattern' ||
          currentRole === 'marketing' ||
          currentRole === 'print_factory' ||
          currentRole === 'sewing_factory'
        );
      case 'print_floor':
        return currentRole === 'print_factory';
      case 'sewing_floor':
        return currentRole === 'sewing_factory';
      case 'shortages':
        return true; // Everyone can see urgent shortage loop
      case 'managers_portal':
        return currentRole === 'accountant' || currentRole === 'hr_manager';
      case 'employee_portal':
        return true; // All staff have employee workstation portal
      default:
        return true;
    }
  };

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    category: 'core' | 'design' | 'finance' | 'workforce';
  }

  const resolveLabel = (id: NavTab, fallback: string) => {
    return customModuleNames?.[id] || fallback;
  };

  const allItems: NavItem[] = [
    {
      id: 'dashboard_tasks',
      label: resolveLabel('dashboard_tasks', getTranslation('navDashboardTasks', language)),
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: 'Active',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      category: 'core',
    },
    {
      id: 'orders',
      label: resolveLabel('orders', getTranslation('navOrders', language)),
      icon: <Layers className="w-4 h-4" />,
      category: 'core',
    },
    {
      id: 'head_office',
      label: resolveLabel('head_office', getTranslation('navHeadOffice', language)),
      icon: <Building2 className="w-4 h-4" />,
      category: 'core',
    },
    {
      id: 'customers_crm',
      label: resolveLabel('customers_crm', getTranslation('navCustomersCrm', language)),
      icon: <Star className="w-4 h-4" />,
      badge: 'VIP',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      category: 'core',
    },
    {
      id: 'print_floor',
      label: resolveLabel('print_floor', getTranslation('navPrintFloor', language)),
      icon: <Printer className="w-4 h-4" />,
      category: 'core',
    },
    {
      id: 'sewing_floor',
      label: resolveLabel('sewing_floor', getTranslation('navSewingFloor', language)),
      icon: <Scissors className="w-4 h-4" />,
      category: 'core',
    },
    {
      id: 'shortages',
      label: resolveLabel('shortages', getTranslation('navShortages', language)),
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: openShortages > 0 ? openShortages : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      category: 'core',
    },
    {
      id: 'product_dev_samples',
      label: resolveLabel('product_dev_samples', getTranslation('navProductDev', language)),
      icon: <FlaskConical className="w-4 h-4" />,
      badge: 'NPD/BOM',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      category: 'design',
    },
    {
      id: 'bulk_import',
      label: resolveLabel('bulk_import', getTranslation('navBulkImport', language)),
      icon: <Database className="w-4 h-4" />,
      badge: 'CSV/Excel',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      category: 'design',
    },
    {
      id: 'vendors_suppliers',
      label: resolveLabel('vendors_suppliers', getTranslation('navVendors', language)),
      icon: <Truck className="w-4 h-4" />,
      badge: 'PO/GRN',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      category: 'finance',
    },
    {
      id: 'accounting',
      label: resolveLabel('accounting', getTranslation('navAccounting', language)),
      icon: <DollarSign className="w-4 h-4" />,
      badge: currentRole === 'marketing' ? 'BDT' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      category: 'finance',
    },
    {
      id: 'inventory',
      label: resolveLabel('inventory', getTranslation('navInventory', language)),
      icon: <Package className="w-4 h-4" />,
      badge: 'Metrics/PC',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      category: 'finance',
    },
    {
      id: 'documents_center',
      label: resolveLabel('documents_center', getTranslation('navDocuments', language)),
      icon: <FileText className="w-4 h-4" />,
      category: 'finance',
    },
    {
      id: 'users_employees',
      label: resolveLabel('users_employees', getTranslation('navUsersEmployees', language)),
      icon: <Users className="w-4 h-4" />,
      category: 'workforce',
    },
    {
      id: 'hr_payroll',
      label: resolveLabel('hr_payroll', getTranslation('navHrPayroll', language)),
      icon: <UserCheck className="w-4 h-4" />,
      badge:
        currentRole === 'print_factory' || currentRole === 'sewing_factory'
          ? 'Attendance'
          : undefined,
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      category: 'workforce',
    },
    {
      id: 'managers_portal',
      label: resolveLabel('managers_portal', getTranslation('navManagersPortal', language)),
      icon: <ShieldCheck className="w-4 h-4" />,
      category: 'workforce',
    },
    {
      id: 'employee_portal',
      label: resolveLabel('employee_portal', getTranslation('navEmployeePortal', language)),
      icon: <UserCheck className="w-4 h-4" />,
      badge: 'Live',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      category: 'workforce',
    },
    {
      id: 'guidelines_sop',
      label: resolveLabel('guidelines_sop', getTranslation('navGuidelines', language)),
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'SOP',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      category: 'workforce',
    },
  ];

  const allowedItems = allItems.filter((item) => isTabAllowed(item.id));

  return (
    <aside
      className={`relative flex flex-col bg-[#080c14] border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-slate-800/80">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0">
              <Shirt className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                <span>{getTranslation('brandTitle', language)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[9px] font-semibold text-slate-400 tracking-wider truncate uppercase">
                Enterprise ERP (৳ BDT)
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Shirt className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="btn-press p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role / Persona Badge (Switchable ONLY by Owner or Manager) */}
      <div className="px-3 py-2.5">
        <button
          onClick={onOpenRoleSwitcher}
          data-testid="sidebar-role-switcher-btn"
          title={
            canSwitchRole
              ? 'Click to Switch Active Role (Owner/Manager Privilege)'
              : 'Active Role is Locked for your position (Only Owner/Manager can switch)'
          }
          className={`btn-press w-full flex items-center gap-2 p-2 rounded-xl bg-slate-900/90 border transition-colors text-left group ${
            canSwitchRole
              ? 'border-slate-800 hover:border-emerald-500/40 cursor-pointer'
              : 'border-slate-800/70 opacity-90 cursor-not-allowed'
          } ${collapsed ? 'justify-center p-2' : ''}`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          {!collapsed && (
            <div className="truncate flex-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>Active Role</span>
                {canSwitchRole ? (
                  <span className="text-[9px] text-emerald-400 group-hover:underline">
                    Switch
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {getRoleName(currentRole, language)}
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Quick Order Creation Shortcut */}
      {(currentRole === 'owner' || currentRole === 'marketing') && (
        <div className="px-3 pb-2">
          <button
            onClick={onOpenCreateOrder}
            className={`btn-press w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer ${
              collapsed ? 'p-2' : ''
            }`}
            title="Create New Job Card"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{getTranslation('newOrderBtn', language)}</span>}
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1 py-1 no-scrollbar">
        {/* Core Pipeline Section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {getTranslation('catCore', language)}
            </div>
          )}
          {allowedItems
            .filter((item) => item.category === 'core')
            .map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Design Section */}
        {allowedItems.some((item) => item.category === 'design') && (
          <div className="space-y-0.5 pt-2">
            {!collapsed && (
              <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {getTranslation('catDesign', language)}
              </div>
            )}
            {allowedItems
              .filter((item) => item.category === 'design')
              .map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={item.label}
                    className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {/* Finance & Supply */}
        {allowedItems.some((item) => item.category === 'finance') && (
          <div className="space-y-0.5 pt-2">
            {!collapsed && (
              <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {getTranslation('catFinance', language)}
              </div>
            )}
            {allowedItems
              .filter((item) => item.category === 'finance')
              .map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={item.label}
                    className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold font-mono ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {/* Workforce & Portals */}
        {allowedItems.some((item) => item.category === 'workforce') && (
          <div className="space-y-0.5 pt-2">
            {!collapsed && (
              <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {getTranslation('catWorkforce', language)}
              </div>
            )}
            {allowedItems
              .filter((item) => item.category === 'workforce')
              .map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={item.label}
                    className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold font-mono ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </nav>

      {/* Footer Utility Bar */}
      <div className="p-2.5 border-t border-slate-800/80 space-y-1">
        {/* QR Scanner */}
        <button
          onClick={onOpenQrScanner}
          title="Scan Fabric Bundle QR Tag"
          className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && <span>{getTranslation('scanQrBtn', language)}</span>}
        </button>

        {/* Team Chat */}
        <button
          onClick={onOpenChat}
          title="Open Multi-Department Chat"
          className={`btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer relative ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span>{getTranslation('chatBtn', language)}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live
              </span>
            </div>
          )}
          {collapsed && unreadChatCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
        </button>

        {/* Delegation Sound Toggle */}
        <button
          onClick={toggleSound}
          title={audioActive ? 'Task delegation chimes active (click to mute)' : 'Delegation chime muted (click to enable)'}
          className={`btn-press w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
            audioActive ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-400'
          } ${collapsed ? 'justify-center px-0' : ''}`}
        >
          {audioActive ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          {!collapsed && (
            <span>{audioActive ? getTranslation('soundOn', language) : getTranslation('soundOff', language)}</span>
          )}
        </button>

        {/* Auth action */}
        <button
          onClick={onAuthAction}
          data-testid="sidebar-signout-btn"
          title="Sign Out & Lock Terminal"
          className={`btn-press w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-rose-300 hover:text-white hover:bg-rose-950/50 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          {!collapsed && <span className="truncate">Sign Out / Switch User</span>}
        </button>

        {/* Official Software Authorized Info */}
        <SoftwareAuthorizedInfoCard variant="sidebar" collapsed={collapsed} />
      </div>
    </aside>
  );
};
