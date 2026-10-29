/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testFirestoreConnection, loginWithGoogle, logoutUser } from './firebase/config';
import {
  Order,
  ShortageTicket,
  InventoryItem,
  Expense,
  Customer,
  Estimate,
  Invoice,
  Vendor,
  LedgerEntry,
  PaymentRecord,
  Employee,
  AttendanceRecord,
  Payslip,
  TeamMessage,
  UserRole,
  FactoryLocation,
  OrderStage,
  ROLE_CONFIGS,
} from './types/erp';
import { ErpStorageService } from './services/erpStorageService';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardAndTasksView } from './components/DashboardAndTasksView';
import { DashboardStats } from './components/DashboardStats';
import { KanbanBoard } from './components/KanbanBoard';
import { OrderModal } from './components/OrderModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { ShortageTicketsView } from './components/ShortageTicketsView';
import { RaiseShortageModal } from './components/RaiseShortageModal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { InventoryView } from './components/InventoryView';
import { AccountingModule } from './components/AccountingModule';
import { HrPayrollModule } from './components/HrPayrollModule';
import { ManagersPortal } from './components/ManagersPortal';
import { EmployeePortal } from './components/EmployeePortal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ThreeDStudio } from './components/ThreeDStudio';
import { AiMockupStudio } from './components/AiMockupStudio';
import { PrintFactoryView } from './components/PrintFactoryView';
import { SewingFactoryView } from './components/SewingFactoryView';
import { HeadOfficeView } from './components/HeadOfficeView';
import { GeminiChatbotDrawer } from './components/GeminiChatbotDrawer';
import { BundleQrCodeModal } from './components/BundleQrCodeModal';
import { QrScannerModal } from './components/QrScannerModal';
import { InternalChatDrawer } from './components/InternalChatDrawer';
import { canTransitionStage } from './utils/erpLogic';
import {
  Language,
  getTranslation,
  getRoleName,
} from './utils/translations';
import {
  playDelegationChime,
  playShortageAlertSound,
  playSuccessChime,
} from './utils/soundEffects';
import {
  Building2,
  Printer,
  Scissors,
  Sparkles,
  AlertTriangle,
  QrCode,
  MessageSquare,
  Search,
  Bell,
  X,
  ArrowRight,
  ShieldAlert,
  Bot,
  Filter,
  Languages,
} from 'lucide-react';

interface DelegationAlert {
  id: string;
  orderNumber: string;
  orderId: string;
  title: string;
  targetDepartment: string;
  targetEmployee?: string;
  message: string;
  type: 'delegation' | 'shortage' | 'payment';
  timestamp: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [selectedLocation, setSelectedLocation] = useState<FactoryLocation | 'all'>('all');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard_tasks');
  const [language, setLanguage] = useState<Language>('en');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  // Real-time collections
  const [orders, setOrders] = useState<Order[]>([]);
  const [shortageTickets, setShortageTickets] = useState<ShortageTicket[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);

  // Modals & Panels
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [bundleQrOrder, setBundleQrOrder] = useState<Order | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isRaiseShortageOpen, setIsRaiseShortageOpen] = useState(false);
  const [orderForShortage, setOrderForShortage] = useState<Order | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Status & Audio Delegation Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<DelegationAlert[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const pushDelegationAlert = (alert: Omit<DelegationAlert, 'id' | 'timestamp'>) => {
    const newAlert: DelegationAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (alert.type === 'shortage') {
      playShortageAlertSound();
    } else if (alert.type === 'payment') {
      playSuccessChime();
    } else {
      playDelegationChime();
    }

    setActiveAlerts((prev) => [newAlert, ...prev].slice(0, 3));
    setTimeout(() => {
      setActiveAlerts((prev) => prev.filter((a) => a.id !== newAlert.id));
    }, 7000);
  };

  // 1. Initial connection test & auth listener
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.email === 'ridwearbd@gmail.com') {
        setCurrentRole('owner');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time data subscriptions across all enterprise domains
  useEffect(() => {
    const unsubOrders = ErpStorageService.subscribeOrders(setOrders);
    const unsubShortages = ErpStorageService.subscribeShortages(setShortageTickets);
    const unsubInventory = ErpStorageService.subscribeInventory(setInventory);
    const unsubExpenses = ErpStorageService.subscribeExpenses(setExpenses);
    const unsubCustomers = ErpStorageService.subscribeCustomers(setCustomers);
    const unsubEstimates = ErpStorageService.subscribeEstimates(setEstimates);
    const unsubInvoices = ErpStorageService.subscribeInvoices(setInvoices);
    const unsubVendors = ErpStorageService.subscribeVendors(setVendors);
    const unsubLedger = ErpStorageService.subscribeLedger(setLedgerEntries);
    const unsubPayments = ErpStorageService.subscribePayments(setPayments);
    const unsubEmployees = ErpStorageService.subscribeEmployees(setEmployees);
    const unsubAttendance = ErpStorageService.subscribeAttendance(setAttendance);
    const unsubPayslips = ErpStorageService.subscribePayslips(setPayslips);
    const unsubMessages = ErpStorageService.subscribeMessages(setTeamMessages);

    return () => {
      unsubOrders();
      unsubShortages();
      unsubInventory();
      unsubExpenses();
      unsubCustomers();
      unsubEstimates();
      unsubInvoices();
      unsubVendors();
      unsubLedger();
      unsubPayments();
      unsubEmployees();
      unsubAttendance();
      unsubPayslips();
      unsubMessages();
    };
  }, [currentUser]);

  // Keep selectedOrder in sync when orders list updates
  useEffect(() => {
    if (selectedOrder) {
      const refreshed = orders.find((o) => o.id === selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
    }
  }, [orders]);

  // Stage transition action with role validation & audio delegation alert
  const handleAdvanceStage = async (order: Order, nextStage: OrderStage) => {
    if (!canTransitionStage(order.stage, nextStage, currentRole)) {
      showToast(`Role "${currentRole}" cannot transition from ${order.stage} to ${nextStage}.`);
      return;
    }

    try {
      await ErpStorageService.updateOrder(order.id, { stage: nextStage });

      // Delegation mapping
      let targetDept = 'Next Production Stage';
      let targetEmp = 'Floor Operator';

      if (nextStage === 'payment_verified') {
        targetDept = 'Design Studio (Banani)';
        targetEmp = 'Farhana Sultana (Mockup Lead)';
      } else if (nextStage === 'mockup_approved') {
        targetDept = 'Pre-Press Nesting (Banani)';
        targetEmp = 'Nusrat Jahan (Pattern Spec Lead)';
      } else if (nextStage === 'pattern_spec_ready') {
        targetDept = 'Print Factory (Tongi Floor)';
        targetEmp = 'Kabir Hossain (Sublimation Lead)';
      } else if (nextStage === 'paper_printed') {
        targetDept = 'Tongi Heat Press Line';
        targetEmp = 'Heat Press Master';
      } else if (nextStage === 'fabric_dispatched') {
        targetDept = 'Sewing Factory (Mirpur Line)';
        targetEmp = 'Rony Mia (Assembly Master)';
      } else if (nextStage === 'fabric_received') {
        targetDept = 'Mirpur Cutting & Stitching';
        targetEmp = 'Line 1 & 2 Operators';
      } else if (nextStage === 'shipped') {
        targetDept = 'Marketing & Dispatch (Banani)';
        targetEmp = 'Client Delivery Desk';
      }

      pushDelegationAlert({
        orderNumber: order.orderNumber,
        orderId: order.id,
        title: `Task Delegated: ${nextStage.replace(/_/g, ' ').toUpperCase()}`,
        targetDepartment: targetDept,
        targetEmployee: targetEmp,
        message: `Order #${order.orderNumber} handed off to ${targetDept} (${targetEmp})`,
        type: 'delegation',
      });

      showToast(`Order ${order.orderNumber} advanced to ${nextStage.replace(/_/g, ' ')}`);
    } catch (err) {
      console.error(err);
      showToast('Error updating order stage');
    }
  };

  const handleUpdateOrder = async (orderId: string, partial: Partial<Order>) => {
    await ErpStorageService.updateOrder(orderId, partial);
    showToast('Job Card updated successfully');
  };

  const handleCreateOrder = async (newOrder: Order) => {
    await ErpStorageService.createOrder(newOrder);
    showToast(`Job Card ${newOrder.orderNumber} created! Awaiting payment verification.`);
    pushDelegationAlert({
      orderNumber: newOrder.orderNumber,
      orderId: newOrder.id,
      title: 'New Order Entry Created',
      targetDepartment: 'Finance & Accounts',
      targetEmployee: 'Rafiqul Islam',
      message: `Awaiting initial deposit verification for ${newOrder.clientName}`,
      type: 'payment',
    });
  };

  const handleRaiseShortage = async (ticket: ShortageTicket) => {
    await ErpStorageService.raiseShortageTicket(ticket);
    pushDelegationAlert({
      orderNumber: ticket.orderNumber,
      orderId: ticket.orderId,
      title: '🚨 PRIORITY SHORTAGE RAISED',
      targetDepartment: 'Design 2 & Tongi Print Floor',
      targetEmployee: 'Nusrat Jahan & Kabir Hossain',
      message: `${ticket.quantity} pcs (${ticket.size}) ruined in ${ticket.partDamaged} (${ticket.reason}). Urgent reprint initiated!`,
      type: 'shortage',
    });
    showToast(`Priority Shortage Ticket ${ticket.orderNumber} raised! Re-print loop alerted.`);
  };

  const handleUpdateShortageTicket = async (ticketId: string, partial: Partial<ShortageTicket>) => {
    await ErpStorageService.updateShortageTicket(ticketId, partial);
    showToast('Shortage ticket updated');
  };

  const handleUpdateStock = async (itemId: string, newStock: number) => {
    await ErpStorageService.updateInventoryStock(itemId, newStock);
    showToast('Inventory level synchronized');
  };

  const handleApplyMockup = async (orderId: string, mockupUrl: string) => {
    await ErpStorageService.updateOrder(orderId, {
      mockupUrl,
      stage: 'mockup_in_progress',
    });
    showToast('Mockup design synced to Job Card');
  };

  // Accounting Handlers
  const handleRecordPayment = async (payment: PaymentRecord) => {
    await ErpStorageService.recordPayment(payment);
    pushDelegationAlert({
      orderNumber: payment.invoiceOrBillRef || 'PAYMENT',
      orderId: payment.partyId,
      title: 'Payment Recorded & Logged',
      targetDepartment: 'Finance & General Manager',
      targetEmployee: 'Executive Approvals Desk',
      message: `Received $${payment.amount} from ${payment.partyName} via ${payment.method}`,
      type: 'payment',
    });
    showToast(`Payment of $${payment.amount} logged.`);
  };

  const handleAddExpense = async (expense: Expense) => {
    await ErpStorageService.addExpense(expense);
    showToast(`Operating expense "$${expense.amount}" recorded.`);
  };

  const handleCreateEstimate = async (estimate: Estimate) => {
    await ErpStorageService.createEstimate(estimate);
    showToast(`Quotation ${estimate.estimateNumber} generated!`);
  };

  const handleConvertEstimate = async (estimate: Estimate) => {
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `SW-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderType: estimate.type,
      channel: 'direct_crm',
      clientName: estimate.customerName,
      fabricType: 'Micro-Eyelet 160 GSM',
      gsm: 160,
      totalQuantity: estimate.items.reduce((s, i) => s + i.quantity, 0),
      unitPrice: estimate.items[0]?.unitPrice || 18,
      totalAmount: estimate.totalAmount,
      advanceAmount: 0,
      dueAmount: estimate.totalAmount,
      paymentStatus: 'pending',
      sizeBreakdown: { S: 5, M: 10, L: 10, XL: 5 },
      stage: 'payment_pending',
      currentLocation: 'head_office',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Marketing Desk',
    };

    await ErpStorageService.createOrder(newOrder);
    await ErpStorageService.updateEstimate(estimate.id, { status: 'converted', convertedOrderId: newOrder.id });
    showToast(`Quotation converted to Job Card ${newOrder.orderNumber}!`);
  };

  const handleUpdateInvoice = async (id: string, partial: Partial<Invoice>) => {
    await ErpStorageService.updateInvoice(id, partial);
    showToast('Invoice updated successfully');
  };

  // HR Handlers
  const handlePunchAttendance = async (record: AttendanceRecord) => {
    await ErpStorageService.punchAttendance(record);
    showToast(`Attendance recorded: ${record.status.toUpperCase()} (${record.employeeName})`);
  };

  const handleDisburseSalary = async (payslipId: string, paymentMethod: string = 'Bank Wire') => {
    await ErpStorageService.disburseSalary(payslipId, paymentMethod);
    showToast('Salary payment disbursed and logged to ledger.');
  };

  const handleCreateEmployee = async (emp: Employee) => {
    await ErpStorageService.createEmployee(emp);
    showToast(`New staff member ${emp.name} added to directory.`);
  };

  const handleAuthAction = async () => {
    if (currentUser) {
      await logoutUser();
      showToast('Logged out of Sportswear ERP');
    } else {
      try {
        await loginWithGoogle();
        showToast('Signed in successfully');
      } catch (e) {
        showToast('Google sign-in completed');
      }
    }
  };

  const openShortageCount = shortageTickets.filter((t) => t.status !== 'resolved').length;
  const roleConfig = ROLE_CONFIGS[currentRole];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b12] text-slate-100 font-sans antialiased select-none">
      {/* 1. Left-Side Collapsible Navigation Panel */}
      <Sidebar
        currentRole={currentRole}
        activeTab={activeTab}
        language={language}
        onSelectTab={(tab) => setActiveTab(tab)}
        onToggleLanguage={toggleLanguage}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        shortageTickets={shortageTickets}
        onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        unreadChatCount={teamMessages.length}
        currentUser={currentUser}
        onAuthAction={handleAuthAction}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Enterprise Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0f1d]/90">
        {/* Sticky Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          {/* Left: Location Filter & Current Role Beacon */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">{language === 'bn' ? 'কারখানা:' : 'Location:'}</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as any)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  {language === 'bn' ? 'সকল ৩টি কারখানা ও দপ্তর' : 'All 3 Factory Locations'}
                </option>
                <option value="head_office" className="bg-slate-900 text-white">
                  {language === 'bn' ? 'বনানী হেড অফিস' : 'Head Office (Banani)'}
                </option>
                <option value="print_factory" className="bg-slate-900 text-white">
                  {language === 'bn' ? 'টঙ্গী প্রিন্ট মিল' : 'Print Factory (Tongi)'}
                </option>
                <option value="sewing_factory" className="bg-slate-900 text-white">
                  {language === 'bn' ? 'মিরপুর সুইং কারখানা' : 'Sewing Factory (Mirpur)'}
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${roleConfig?.badgeColor || 'bg-slate-800 text-white border-slate-700'}`}>
                {getRoleName(currentRole, language)}
              </span>
            </div>
          </div>

          {/* Right: Quick Tools, Scanner, Chat & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="btn-press flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-bold transition cursor-pointer"
              title="Toggle English / বাংলা"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Quick QR Scanner Button */}
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Scan Bundle QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{getTranslation('scanQrBtn', language)}</span>
            </button>

            {/* Internal Team Comms Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Open Multi-Department Chat"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-900/80 hover:to-indigo-900/80 text-purple-200 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">AI Co-Pilot</span>
            </button>

            {/* Shortage Alarm Icon (if active) */}
            {openShortageCount > 0 && (
              <button
                onClick={() => setActiveTab('shortages')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{openShortageCount} Re-print</span>
              </button>
            )}

            {/* User Avatar / Switcher */}
            <button
              onClick={() => setIsRoleSwitcherOpen(true)}
              className="flex items-center gap-2 p-1 pl-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 font-bold text-xs flex items-center justify-center">
                {currentRole[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden lg:inline mr-1">
                {roleConfig?.shortLabel}
              </span>
            </button>
          </div>
        </header>

        {/* Real-time Audio Delegation Toast Alerts Stack */}
        <div className="fixed top-16 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl pointer-events-auto transition-all animate-in slide-in-from-top-4 duration-200 ${
                alert.type === 'shortage'
                  ? 'bg-rose-950/90 border-rose-500/60 text-white shadow-rose-950/40'
                  : alert.type === 'payment'
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-white shadow-emerald-950/40'
                  : 'bg-slate-900/95 border-emerald-500/50 text-white shadow-black/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      alert.type === 'shortage'
                        ? 'bg-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black tracking-tight">{alert.title}</h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {alert.targetDepartment} {alert.targetEmployee ? `• ${alert.targetEmployee}` : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                  }
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{alert.message}</p>

              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                <button
                  onClick={() => {
                    const ord = orders.find((o) => o.id === alert.orderId || o.orderNumber === alert.orderNumber);
                    if (ord) setSelectedOrder(ord);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Open Job Card <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {toastMessage && (
            <div className="p-3 bg-slate-900/90 text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-xl pointer-events-auto flex items-center justify-between gap-2">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Workstation Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 0: DASHBOARD & TASKS (PRIMARY INITIAL VIEW) */}
          {activeTab === 'dashboard_tasks' && (
            <DashboardAndTasksView
              orders={orders}
              shortageTickets={shortageTickets}
              attendance={attendance}
              currentRole={currentRole}
              language={language}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onAdvanceStage={handleAdvanceStage}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
              onOpenShortages={() => setActiveTab('shortages')}
              onOpenQrBundleTag={(ord) => setBundleQrOrder(ord)}
              onOpenAttendance={() => setActiveTab('hr_payroll')}
            />
          )}

          {/* TAB 1: ALL ORDERS & PIPELINE KANBAN */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <DashboardStats
                orders={orders}
                shortageTickets={shortageTickets}
                selectedLocation={selectedLocation}
                onSelectLocation={(loc) => setSelectedLocation(loc)}
                language={language}
              />
              <KanbanBoard
                orders={orders}
                currentRole={currentRole}
                selectedLocation={selectedLocation}
                onSelectOrder={(ord) => setSelectedOrder(ord)}
                onAdvanceStage={handleAdvanceStage}
                onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
                onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
              />
            </div>
          )}

          {/* TAB 2: HEAD OFFICE / MARKETING & CRM */}
          {activeTab === 'head_office' && (
            <HeadOfficeView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onOpenAiMockup={() => setActiveTab('mockup_studio')}
              onOpen3DStudio={() => setActiveTab('3d_studio')}
            />
          )}

          {/* TAB 3: ACCOUNTING & LEDGERS (RBAC PROTECTED) */}
          {activeTab === 'accounting' && (
            <AccountingModule
              invoices={invoices}
              estimates={estimates}
              vendors={vendors}
              ledgerEntries={ledgerEntries}
              payments={payments}
              expenses={expenses}
              orders={orders}
              currentRole={currentRole}
              onRecordPayment={handleRecordPayment}
              onAddExpense={handleAddExpense}
              onCreateEstimate={handleCreateEstimate}
              onConvertEstimate={handleConvertEstimate}
              onUpdateInvoice={handleUpdateInvoice}
            />
          )}

          {/* TAB 4: HR & PAYROLL MODULE */}
          {activeTab === 'hr_payroll' && (
            <HrPayrollModule
              employees={employees}
              attendance={attendance}
              payslips={payslips}
              currentRole={currentRole}
              language={language}
              onPunchAttendance={handlePunchAttendance}
              onDisburseSalary={handleDisburseSalary}
              onCreateEmployee={handleCreateEmployee}
            />
          )}

          {/* TAB 5: MANAGERS APPROVALS DESK */}
          {activeTab === 'managers_portal' && (
            <ManagersPortal
              orders={orders}
              shortageTickets={shortageTickets}
              invoices={invoices}
              estimates={estimates}
              employees={employees}
              attendance={attendance}
              payslips={payslips}
              vendors={vendors}
              currentRole={currentRole}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onDisburseSalary={handleDisburseSalary}
            />
          )}

          {/* TAB 6: EMPLOYEE PERSONAL WORKSTATION */}
          {activeTab === 'employee_portal' && (
            <EmployeePortal
              orders={orders}
              employees={employees}
              attendance={attendance}
              payslips={payslips}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              onPunchAttendance={handlePunchAttendance}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onOpenRaiseShortage={(ord?: Order) => {
                setOrderForShortage(ord || null);
                setIsRaiseShortageOpen(true);
              }}
            />
          )}

          {/* TAB 7: 3D JERSEY STUDIO */}
          {activeTab === '3d_studio' && (
            <ThreeDStudio
              orders={orders}
              activeOrder={selectedOrder}
              onApply3DToOrder={handleApplyMockup}
            />
          )}

          {/* TAB 8: AI MOCKUP GENERATOR */}
          {activeTab === 'mockup_studio' && (
            <AiMockupStudio
              orders={orders}
              onApplyMockupToOrder={handleApplyMockup}
            />
          )}

          {/* TAB 9: TONGI PRINT FACTORY */}
          {activeTab === 'print_floor' && (
            <PrintFactoryView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
            />
          )}

          {/* TAB 10: MIRPUR SEWING ASSEMBLY FACTORY */}
          {activeTab === 'sewing_floor' && (
            <SewingFactoryView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onOpenRaiseShortage={(ord) => {
                setOrderForShortage(ord || null);
                setIsRaiseShortageOpen(true);
              }}
            />
          )}

          {/* TAB 11: SHORTAGE TICKETS RED ALERT */}
          {activeTab === 'shortages' && (
            <ShortageTicketsView
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              orders={orders}
              onUpdateTicket={handleUpdateShortageTicket}
              onOpenRaiseModal={() => {
                setOrderForShortage(null);
                setIsRaiseShortageOpen(true);
              }}
            />
          )}

          {/* TAB 12: FABRIC & INK INVENTORY */}
          {activeTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              currentRole={currentRole}
              onUpdateStock={handleUpdateStock}
            />
          )}
        </main>
      </div>

      {/* 3. Global Modals & Interactive Overlays */}
      {/* Fabric Bundle QR Tag Modal */}
      <BundleQrCodeModal
        order={bundleQrOrder}
        isOpen={Boolean(bundleQrOrder)}
        onClose={() => setBundleQrOrder(null)}
      />

      {/* Camera & Barcode QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        orders={orders}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
      />

      {/* WhatsApp Style Multi-Department Internal Chat Drawer */}
      <InternalChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentRole={currentRole}
        currentUserName={currentUser?.displayName || ROLE_CONFIGS[currentRole]?.shortLabel}
        orders={orders}
        invoices={invoices}
        onOpenOrder={(ord) => setSelectedOrder(ord)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        messages={teamMessages}
      />

      {/* Role / Persona Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentRole={currentRole}
        onSelectRole={(r) => {
          setCurrentRole(r);
          showToast(`Switched portal view to ${r.replace('_', ' ')}`);
        }}
      />

      {/* Primary Order Detail & Job Card Spec Modal */}
      <OrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        currentRole={currentRole}
        onUpdateOrder={handleUpdateOrder}
        onOpenRaiseShortage={(ord) => {
          setOrderForShortage(ord);
          setIsRaiseShortageOpen(true);
        }}
        onOpenQrBundleModal={(ord) => setBundleQrOrder(ord)}
      />

      {/* Order Creation Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onCreateOrder={handleCreateOrder}
      />

      {/* Shortage Escalation Ticket Modal */}
      <RaiseShortageModal
        isOpen={isRaiseShortageOpen}
        onClose={() => setIsRaiseShortageOpen(false)}
        orders={orders}
        preSelectedOrder={orderForShortage}
        onRaiseTicket={handleRaiseShortage}
      />

      {/* Production AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        orders={orders}
      />

      {/* Gemini AI Co-Pilot Drawer */}
      <GeminiChatbotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  );
}
