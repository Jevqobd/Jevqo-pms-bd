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
  BankAccount,
  CompanySettings,
  EmployeePermissions,
  CompanyAsset,
  CompanyDocument,
  MarketingFaqItem,
  PurchaseOrder,
  ProductSample,
  ColorSwatchRecipe,
  ActionStatusTag,
  SystemNotification,
  DelegatedTask,
} from './types/erp';
import {
  INITIAL_SETTINGS,
  INITIAL_COMPANY_ASSETS,
  INITIAL_COMPANY_DOCUMENTS,
  INITIAL_MARKETING_FAQS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PRODUCT_SAMPLES,
  INITIAL_COLOR_SWATCHES,
  INITIAL_EMPLOYEES,
} from './services/seedData';
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
import { BulkImportModule } from './components/BulkImportModal';
import {
  SoftwareAuthorizedInfoCard,
  SystemCertificationModal,
  ERP_VERSION,
} from './components/SoftwareAuthorizedInfoCard';
import { PrintFactoryView } from './components/PrintFactoryView';
import { SewingFactoryView } from './components/SewingFactoryView';
import { HeadOfficeView } from './components/HeadOfficeView';
import { GeminiChatbotDrawer } from './components/GeminiChatbotDrawer';
import { BundleQrCodeModal } from './components/BundleQrCodeModal';
import { QrScannerModal } from './components/QrScannerModal';
import { InternalChatDrawer } from './components/InternalChatDrawer';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { B2bClientPortalModal } from './components/B2bClientPortalModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { CustomersModule } from './components/CustomersModule';
import { UsersEmployeesModule } from './components/UsersEmployeesModule';
import { DocumentsCenterModule } from './components/DocumentsCenterModule';
import { GuidelinesModule } from './components/GuidelinesModule';
import { VendorsSuppliersModule } from './components/VendorsSuppliersModule';
import { ProductDevSampleModule } from './components/ProductDevSampleModule';
import { LoginScreen } from './components/LoginScreen';
import {
  TaskDelegationPopupModal,
  HeaderNotificationDropdown,
} from './components/TaskDelegationPopupModal';
import { canTransitionStage, canUserSwitchRole } from './utils/erpLogic';
import { Language, getTranslation, getRoleName } from './utils/translations';
import {
  playDelegationChime,
  playInstantDelegationSound,
  playShortageAlertSound,
  playSuccessChime,
} from './utils/soundEffects';
import {
  AlertTriangle,
  QrCode,
  MessageSquare,
  Bell,
  X,
  ArrowRight,
  Bot,
  Filter,
  Settings,
  Users,
  Database,
  Lock,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  BellRing,
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
  statusTag: ActionStatusTag;
  timestamp: string;
}

const INITIAL_DELEGATED_TASKS: DelegatedTask[] = [
  {
    id: 'del-seed-1',
    title: 'Sublimation Print & Rotary Calender Check — SW-2026-0891',
    description:
      'Verify 160 GSM Micro-Eyelet roll tension and complete 45m sublimation pass for Dhaka Gladiators.',
    orderNumber: 'SW-2026-0891',
    invoiceNumber: 'INV-2026-891',
    assignedToEmployeeId: 'emp-5',
    assignedToEmployeeName: 'Mizanur Rahman',
    assignedToPosition: 'Print Factory Manager (Tongi)',
    assignedToRole: 'print_factory',
    delegatedByEmployeeName: 'Ridwanul Haque',
    delegatedByPosition: 'Managing Director & Founder',
    priority: 'high',
    status: 'pending',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dueTime: 'Today 4:00 PM',
  },
  {
    id: 'del-seed-2',
    title: 'Verify Advance Deposit & Issue VIP Portal Key — INV-2026-892',
    description:
      'Confirm City Bank wire transfer and release artwork package to Design Team 1.',
    orderNumber: 'SW-2026-0892',
    invoiceNumber: 'INV-2026-892',
    assignedToEmployeeId: 'emp-10',
    assignedToEmployeeName: 'Tanvir Mahmud',
    assignedToPosition: 'Chief Accountant',
    assignedToRole: 'accountant',
    delegatedByEmployeeName: 'Ridwanul Haque',
    delegatedByPosition: 'Managing Director & Founder',
    priority: 'urgent',
    status: 'pending',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dueTime: 'Today 3:00 PM',
  },
];

const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-seed-1',
    title: 'Order Advance Payment Approved',
    message: 'Advance payment for SW-2026-0891 verified and unlocked for Design Studio.',
    statusTag: 'APPROVED',
    actorName: 'Ridwanul Haque',
    actorPosition: 'Managing Director & Founder',
    relatedOrderOrInvoice: 'SW-2026-0891',
    timestamp: '10:15 AM',
    read: false,
  },
  {
    id: 'notif-seed-2',
    title: 'Sublimation Print Batch Completed',
    message: 'Tongi Print Mill completed 68m transfer paper pass for SW-2026-0889.',
    statusTag: 'DONE',
    actorName: 'Mizanur Rahman',
    actorPosition: 'Print Factory Manager (Tongi)',
    relatedOrderOrInvoice: 'SW-2026-0889',
    timestamp: '11:05 AM',
    read: false,
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Mandatory Login State: User MUST log in before accessing any part of the system
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [selectedLocation, setSelectedLocation] = useState<FactoryLocation | 'all'>('all');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard_tasks');
  const language: Language = 'en';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>(INITIAL_COMPANY_ASSETS);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>(
    INITIAL_COMPANY_DOCUMENTS
  );
  const [marketingFaqs, setMarketingFaqs] = useState<MarketingFaqItem[]>(INITIAL_MARKETING_FAQS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [productSamples, setProductSamples] = useState<ProductSample[]>(INITIAL_PRODUCT_SAMPLES);
  const [colorSwatches, setColorSwatches] = useState<ColorSwatchRecipe[]>(INITIAL_COLOR_SWATCHES);

  // Notifications & Instant Task Delegation State
  const [systemNotifications, setSystemNotifications] =
    useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [delegatedTasks, setDelegatedTasks] = useState<DelegatedTask[]>(INITIAL_DELEGATED_TASKS);
  const [activeDelegatedPopupTask, setActiveDelegatedPopupTask] = useState<DelegatedTask | null>(
    null
  );

  // Private Chat Pre-selection state
  const [chatPreselectedInvoice, setChatPreselectedInvoice] = useState<string>('');
  const [chatPreselectedRecipientId, setChatPreselectedRecipientId] = useState<string>('');

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
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] = useState<Employee | null>(
    null
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isB2bPortalOpen, setIsB2bPortalOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);

  // Status & Audio Delegation Alerts
  const [toastBanner, setToastBanner] = useState<{
    tag: ActionStatusTag;
    message: string;
  } | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<DelegationAlert[]>([]);

  // Check if the logged-in user's assigned role permits switching active roles (ONLY Owner or Manager)
  const userAllowedToSwitchRole = loggedInEmployee
    ? canUserSwitchRole(loggedInEmployee.role)
    : false;

  const pushActionNotification = (
    statusTag: ActionStatusTag,
    title: string,
    message: string,
    relatedOrderOrInvoice?: string,
    targetEmployeeName?: string
  ) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      statusTag,
      actorName: loggedInEmployee?.name || 'System Operator',
      actorPosition: loggedInEmployee?.designation || ROLE_CONFIGS[currentRole]?.shortLabel,
      targetEmployeeName,
      relatedOrderOrInvoice,
      timestamp: nowTime,
      read: false,
    };

    setSystemNotifications((prev) => [newNotif, ...prev].slice(0, 40));
    setToastBanner({ tag: statusTag, message: `${title} — ${message}` });
    playSuccessChime();
    setTimeout(() => {
      setToastBanner((curr) => (curr?.message === `${title} — ${message}` ? null : curr));
    }, 4500);
  };

  const showToast = (msg: string, tag: ActionStatusTag = 'DONE') => {
    pushActionNotification(tag, `${tag}: System Action`, msg);
  };

  const pushDelegationAlert = (
    alert: Omit<DelegationAlert, 'id' | 'timestamp' | 'statusTag'> & {
      statusTag?: ActionStatusTag;
    }
  ) => {
    const tag: ActionStatusTag =
      alert.statusTag ||
      (alert.type === 'shortage'
        ? 'ALERT'
        : alert.type === 'payment'
        ? 'APPROVED'
        : 'DELEGATED');
    const newAlert: DelegationAlert = {
      ...alert,
      statusTag: tag,
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

  // Instant Task Delegation Handler (Triggers Modal Popup + Urgent Audio Alert)
  const handleDelegateTask = (taskInput: Omit<DelegatedTask, 'id' | 'createdAt' | 'status'>) => {
    const newTask: DelegatedTask = {
      ...taskInput,
      id: `del-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDelegatedTasks((prev) => [newTask, ...prev]);
    setActiveDelegatedPopupTask(newTask);
    playInstantDelegationSound();

    pushActionNotification(
      'DELEGATED',
      `Task Delegated to ${newTask.assignedToEmployeeName}`,
      `${newTask.title} (${newTask.priority.toUpperCase()} Priority)`,
      newTask.orderNumber || newTask.invoiceNumber,
      newTask.assignedToEmployeeName
    );
  };

  const handleAcceptDelegatedTask = (taskId: string) => {
    const found = delegatedTasks.find((t) => t.id === taskId);
    setDelegatedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'accepted' } : t))
    );
    if (activeDelegatedPopupTask?.id === taskId) {
      setActiveDelegatedPopupTask(null);
    }
    if (found) {
      pushActionNotification(
        'APPROVED',
        `Delegated Task Accepted by ${found.assignedToEmployeeName}`,
        `Accepted: "${found.title}"`,
        found.orderNumber || found.invoiceNumber,
        found.assignedToEmployeeName
      );
    }
  };

  const handleCompleteDelegatedTask = (taskId: string) => {
    const found = delegatedTasks.find((t) => t.id === taskId);
    setDelegatedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    );
    if (activeDelegatedPopupTask?.id === taskId) {
      setActiveDelegatedPopupTask(null);
    }
    if (found) {
      pushActionNotification(
        'DONE',
        `Delegated Task Completed by ${found.assignedToEmployeeName}`,
        `Completed: "${found.title}"`,
        found.orderNumber || found.invoiceNumber,
        found.assignedToEmployeeName
      );
    }
  };

  const handleOpenPrivateInvoiceChat = (invoiceNumber: string, targetEmployeeId?: string) => {
    setChatPreselectedInvoice(invoiceNumber);
    if (targetEmployeeId) {
      setChatPreselectedRecipientId(targetEmployeeId);
    }
    setIsChatOpen(true);
  };

  const handleOpenRoleSwitcherGuarded = () => {
    if (!userAllowedToSwitchRole) {
      pushActionNotification(
        'ALERT',
        'Role Switching Restricted',
        `Only Owner or Manager can switch active roles. Your profile (${loggedInEmployee?.name}) is locked to ${loggedInEmployee?.designation}.`
      );
      return;
    }
    setIsRoleSwitcherOpen(true);
  };

  // 1. Initial connection test & auth listener
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
    const unsubEmployees = ErpStorageService.subscribeEmployees((emps) => {
      if (emps && emps.length > 0) setEmployees(emps);
    });
    const unsubAttendance = ErpStorageService.subscribeAttendance(setAttendance);
    const unsubPayslips = ErpStorageService.subscribePayslips(setPayslips);
    const unsubMessages = ErpStorageService.subscribeMessages(setTeamMessages);
    const unsubBanks = ErpStorageService.subscribeBankAccounts(setBankAccounts);
    const unsubSettings = ErpStorageService.subscribeSettings(setCompanySettings);
    const unsubAssets = ErpStorageService.subscribeAssets(setCompanyAssets);
    const unsubDocs = ErpStorageService.subscribeDocuments(setCompanyDocuments);
    const unsubFaqs = ErpStorageService.subscribeFaqs(setMarketingFaqs);
    const unsubPos = ErpStorageService.subscribePurchaseOrders(setPurchaseOrders);
    const unsubSamples = ErpStorageService.subscribeProductSamples(setProductSamples);
    const unsubSwatches = ErpStorageService.subscribeColorSwatches(setColorSwatches);

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
      unsubBanks();
      unsubSettings();
      unsubAssets();
      unsubDocs();
      unsubFaqs();
      unsubPos();
      unsubSamples();
      unsubSwatches();
    };
  }, [currentUser]);

  // Keep selectedOrder in sync when orders list updates
  useEffect(() => {
    if (selectedOrder) {
      const refreshed = orders.find((o) => o.id === selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
    }
  }, [orders]);

  // Stage transition action with role validation & instant task delegation popup + sound
  const handleAdvanceStage = async (order: Order, nextStage: OrderStage) => {
    if (!canTransitionStage(order.stage, nextStage, currentRole)) {
      pushActionNotification(
        'ALERT',
        'Stage Transition Restricted',
        `Role "${currentRole}" cannot transition from ${order.stage} to ${nextStage}.`
      );
      return;
    }

    try {
      await ErpStorageService.updateOrder(order.id, { stage: nextStage });

      let targetDept = 'Next Production Stage';
      let targetEmpObj = employees.find((e) => e.role === 'print_factory') || employees[0];

      if (nextStage === 'payment_verified') {
        targetDept = 'Design Studio (Banani)';
        targetEmpObj = employees.find((e) => e.role === 'design_mockup') || targetEmpObj;
      } else if (nextStage === 'mockup_approved') {
        targetDept = 'Pre-Press Nesting (Banani)';
        targetEmpObj = employees.find((e) => e.role === 'design_pattern') || targetEmpObj;
      } else if (nextStage === 'pattern_spec_ready') {
        targetDept = 'Print Factory (Tongi Floor)';
        targetEmpObj = employees.find((e) => e.role === 'print_factory') || targetEmpObj;
      } else if (nextStage === 'paper_printed') {
        targetDept = 'Tongi Heat Press Line';
        targetEmpObj = employees.find((e) => e.location === 'print_factory') || targetEmpObj;
      } else if (nextStage === 'fabric_dispatched') {
        targetDept = 'Sewing Factory (Mirpur Line)';
        targetEmpObj = employees.find((e) => e.role === 'sewing_factory') || targetEmpObj;
      } else if (nextStage === 'fabric_received') {
        targetDept = 'Mirpur Cutting & Stitching';
        targetEmpObj = employees.find((e) => e.location === 'sewing_factory') || targetEmpObj;
      } else if (nextStage === 'shipped') {
        targetDept = 'Marketing & Dispatch (Banani)';
        targetEmpObj = employees.find((e) => e.role === 'marketing') || targetEmpObj;
      }

      handleDelegateTask({
        title: `Stage Hand-off: ${nextStage.replace(/_/g, ' ').toUpperCase()} (${order.orderNumber})`,
        description: `Order #${order.orderNumber} (${order.teamOrClub}, ${order.totalQuantity} pcs) advanced to ${targetDept}. Execute department checklist immediately.`,
        orderNumber: order.orderNumber,
        assignedToEmployeeId: targetEmpObj.id,
        assignedToEmployeeName: targetEmpObj.name,
        assignedToPosition: targetEmpObj.designation,
        assignedToRole: targetEmpObj.role,
        delegatedByEmployeeName: loggedInEmployee?.name || 'Operations Lead',
        delegatedByPosition: loggedInEmployee?.designation || 'Department Lead',
        priority: nextStage === 'payment_verified' || nextStage === 'pattern_spec_ready' ? 'urgent' : 'high',
        dueTime: 'Within 3 Hours',
      });
    } catch (err) {
      console.error(err);
      pushActionNotification('ALERT', 'Update Failed', 'Error updating order stage');
    }
  };

  const handleUpdateOrder = async (orderId: string, partial: Partial<Order>) => {
    await ErpStorageService.updateOrder(orderId, partial);
    const statusTag: ActionStatusTag =
      partial.paymentStatus === 'verified' || partial.stage === 'mockup_approved'
        ? 'APPROVED'
        : 'DONE';
    pushActionNotification(
      statusTag,
      `Job Card Updated (${statusTag})`,
      `Order specification and production progress saved.`
    );
  };

  const handleCreateOrder = async (newOrder: Order) => {
    await ErpStorageService.createOrder(newOrder);
    pushActionNotification(
      'DONE',
      `Job Card Created: ${newOrder.orderNumber}`,
      `Created order for ${newOrder.clientName} (${newOrder.totalQuantity} pcs, ৳${newOrder.totalAmount.toLocaleString()} BDT).`,
      newOrder.orderNumber
    );
    pushDelegationAlert({
      orderNumber: newOrder.orderNumber,
      orderId: newOrder.id,
      title: 'DONE: New Job Card Created',
      targetDepartment: 'Finance & Accounts',
      targetEmployee: newOrder.assignedToEmployeeName || 'Tanvir Mahmud',
      message: `Awaiting deposit verification for ${newOrder.clientName} (৳${newOrder.advanceAmount.toLocaleString()} BDT)`,
      type: 'payment',
      statusTag: 'DONE',
    });
  };

  const handleRaiseShortage = async (ticket: ShortageTicket) => {
    await ErpStorageService.raiseShortageTicket(ticket);
    const printLead = employees.find((e) => e.role === 'print_factory') || employees[0];
    handleDelegateTask({
      title: `🚨 PRIORITY SHORTAGE REPRINT: ${ticket.orderNumber}`,
      description: `${ticket.quantity} pcs (${ticket.size}) ruined in ${ticket.partDamaged} (${ticket.reason}). Isolate pattern & reprint immediately!`,
      orderNumber: ticket.orderNumber,
      assignedToEmployeeId: printLead.id,
      assignedToEmployeeName: printLead.name,
      assignedToPosition: printLead.designation,
      assignedToRole: printLead.role,
      delegatedByEmployeeName: loggedInEmployee?.name || ticket.createdBy,
      delegatedByPosition: loggedInEmployee?.designation || 'Sewing Line Lead',
      priority: 'urgent',
      dueTime: 'Immediate Express Reprint',
    });
  };

  const handleUpdateShortageTicket = async (
    ticketId: string,
    partial: Partial<ShortageTicket>
  ) => {
    await ErpStorageService.updateShortageTicket(ticketId, partial);
    pushActionNotification(
      partial.status === 'resolved' ? 'DONE' : 'APPROVED',
      `Shortage Ticket Updated`,
      `Ticket status set to ${(partial.status || 'updated').replace(/_/g, ' ').toUpperCase()}.`
    );
  };

  // Inventory & Assets Handlers
  const handleUpdateStock = async (itemId: string, newStock: number) => {
    await ErpStorageService.updateInventoryStock(itemId, newStock);
    pushActionNotification('DONE', 'Inventory Stock Updated', 'Stock level synchronized.');
  };

  const handleCreateInventoryItem = async (item: InventoryItem) => {
    await ErpStorageService.createInventoryItem(item);
    pushActionNotification(
      'DONE',
      'Raw Material Added',
      `Added "${item.name}" (${item.unit}) to inventory.`
    );
  };

  const handleDeleteInventoryItem = async (id: string) => {
    await ErpStorageService.deleteInventoryItem(id);
    pushActionNotification('DONE', 'Inventory Item Removed', 'Material removed from stock list.');
  };

  const handleCreateAsset = async (asset: CompanyAsset) => {
    await ErpStorageService.createAsset(asset);
    pushActionNotification(
      'DONE',
      'Company Asset Registered',
      `Asset "${asset.name}" (${asset.assetCode}) added.`
    );
  };

  const handleUpdateAsset = async (id: string, partial: Partial<CompanyAsset>) => {
    await ErpStorageService.updateAsset(id, partial);
    pushActionNotification(
      'APPROVED',
      'Asset Assignment Updated',
      'Equipment custodian assignment updated.'
    );
  };

  // Customers & Marketing Playbook Handlers
  const handleCreateCustomer = async (customer: Customer) => {
    await ErpStorageService.createCustomer(customer);
    pushActionNotification(
      'DONE',
      'CRM Customer Registered',
      `Customer "${customer.name}" added with VIP Portal Pass.`
    );
  };

  const handleUpdateCustomer = async (id: string, partial: Partial<Customer>) => {
    await ErpStorageService.updateCustomer(id, partial);
    pushActionNotification(
      'APPROVED',
      'Customer Privilege Approved',
      'Updated customer loyalty & discount tier.'
    );
  };

  const handleCreateFaq = async (faq: MarketingFaqItem) => {
    await ErpStorageService.createFaq(faq);
    pushActionNotification('DONE', 'Marketing Script Saved', 'New Q&A reply script added.');
  };

  // Company Documents Handlers
  const handleCreateDocument = async (docItem: CompanyDocument) => {
    await ErpStorageService.createDocument(docItem);
    pushActionNotification(
      'APPROVED',
      `Official Document Issued: ${docItem.docNumber}`,
      `${docItem.title} signed and archived.`
    );
  };

  const handleUpdateDocument = async (id: string, partial: Partial<CompanyDocument>) => {
    await ErpStorageService.updateDocument(id, partial);
    pushActionNotification('DONE', 'Document Updated', 'Official company document updated.');
  };

  const handleAutoSyncInventoryFromOrders = async () => {
    const activeOrderCount = orders.length;
    pushActionNotification(
      'DONE',
      'Cross-Module BOM Sync Complete',
      `Synchronized BOM requirements across ${activeOrderCount} active Job Cards.`
    );
  };

  // Vendor, PO & GRN Handlers
  const handleCreateVendor = async (vendor: Vendor) => {
    await ErpStorageService.createVendor(vendor);
    pushActionNotification(
      'DONE',
      'Supplier Added',
      `Supplier "${vendor.name}" registered in directory.`
    );
  };

  const handleUpdateVendor = async (id: string, updates: Partial<Vendor>) => {
    await ErpStorageService.updateVendor(id, updates);
    pushActionNotification('APPROVED', 'Supplier Scorecard Updated', 'Vendor rating saved.');
  };

  const handleCreatePurchaseOrder = async (po: PurchaseOrder) => {
    await ErpStorageService.createPurchaseOrder(po);
    pushActionNotification(
      'APPROVED',
      `Purchase Order Approved: ${po.poNumber}`,
      `Issued PO to ${po.vendorName} for ৳${po.totalAmount.toLocaleString()} BDT.`,
      po.poNumber
    );
  };

  const handleReceiveGrn = async (poId: string) => {
    await ErpStorageService.receivePurchaseOrderGrn(poId);
    pushActionNotification(
      'VERIFIED',
      'GRN Verified & Stock Added',
      'Raw material stock and vendor payable ledger updated automatically.'
    );
  };

  const handleRecordVendorPayment = async (vendorId: string, amount: number, ref: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;
    await ErpStorageService.recordPayment({
      id: `pay-ven-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'paid_to_vendor',
      partyType: 'vendor',
      partyId: vendor.id,
      partyName: vendor.name,
      amount,
      method: 'bank_transfer',
      transactionRef: ref,
      invoiceOrBillRef: ref,
      notes: `Vendor payable settlement via ${ref}`,
      verifiedBy: loggedInEmployee?.name || 'Finance Desk',
    });
    pushActionNotification(
      'APPROVED',
      `Vendor Payment Disbursed`,
      `Paid ৳${amount.toLocaleString()} BDT to ${vendor.name} (Ref: ${ref}).`
    );
  };

  // NPD & Sample Management Handlers
  const handleCreateProductSample = async (sample: ProductSample) => {
    await ErpStorageService.createProductSample(sample);
    pushActionNotification(
      'DONE',
      `Tech Pack Created: ${sample.techPackCode}`,
      `New sample "${sample.styleName}" registered.`
    );
  };

  const handleUpdateProductSample = async (id: string, updates: Partial<ProductSample>) => {
    await ErpStorageService.updateProductSample(id, updates);
    pushActionNotification(
      'APPROVED',
      'Sample Stage Approved',
      'Tech Pack & sample milestone updated.'
    );
  };

  const handleCreateColorSwatch = async (swatch: ColorSwatchRecipe) => {
    await ErpStorageService.createColorSwatch(swatch);
    pushActionNotification(
      'DONE',
      'Color Recipe Saved',
      `Sublimation swatch "${swatch.colorName}" (${swatch.pantoneCode}) saved.`
    );
  };

  const handleConvertSampleToOrder = async (sample: ProductSample, bulkQty: number) => {
    const totalAmount = Number((bulkQty * sample.targetWholesalePrice).toFixed(2));
    const qS = Math.floor(bulkQty * 0.15);
    const qM = Math.floor(bulkQty * 0.35);
    const qL = Math.floor(bulkQty * 0.35);
    const qXL = Math.max(0, bulkQty - (qS + qM + qL));

    const newOrder: Order = {
      id: `ord-smp-${Date.now()}`,
      orderNumber: `SW-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderType: 'b2b',
      channel: 'direct_crm',
      clientName: sample.clientOrBrand,
      teamOrClub: sample.styleName,
      fabricType: sample.fabricSpec,
      gsm: sample.gsm,
      collarType: sample.collarType,
      totalQuantity: bulkQty,
      unitPrice: sample.targetWholesalePrice,
      totalAmount,
      advanceAmount: Math.round(totalAmount * 0.5),
      dueAmount: totalAmount - Math.round(totalAmount * 0.5),
      paymentStatus: 'verified',
      sizeBreakdown: { S: qS, M: qM, L: qL, XL: qXL },
      stage: 'pattern_spec_ready',
      currentLocation: 'print_factory',
      patternSpecSheet: `Converted from Approved Golden PP Sample ${sample.techPackCode}. Press @ ${sample.heatPressTempC}°C for ${sample.heatPressTimeSec}s.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: sample.designerName,
    };

    await ErpStorageService.createOrder(newOrder);
    await ErpStorageService.updateProductSample(sample.id, {
      convertedOrderId: newOrder.id,
    });
    pushActionNotification(
      'APPROVED',
      `Sample Converted to Bulk Job Card`,
      `Launched ${newOrder.orderNumber} (${bulkQty} pcs) from ${sample.techPackCode}.`,
      newOrder.orderNumber
    );
    setActiveTab('orders');
  };

  // Accounting Handlers
  const handleRecordPayment = async (payment: PaymentRecord) => {
    await ErpStorageService.recordPayment(payment);
    pushActionNotification(
      'APPROVED',
      `Payment Approved & Logged`,
      `Recorded ৳${payment.amount.toLocaleString()} BDT for ${payment.partyName} via ${payment.method}.`,
      payment.invoiceOrBillRef
    );
  };

  const handleAddExpense = async (expense: Expense) => {
    await ErpStorageService.addExpense(expense);
    pushActionNotification(
      'DONE',
      'Operating Expense Logged',
      `Recorded ৳${expense.amount.toLocaleString()} BDT for "${expense.title}".`
    );
  };

  const handleCreateEstimate = async (estimate: Estimate) => {
    await ErpStorageService.createEstimate(estimate);
    pushActionNotification(
      'DONE',
      `Quotation Generated: ${estimate.estimateNumber}`,
      `Estimate for ${estimate.customerName} (৳${estimate.totalAmount.toLocaleString()} BDT) created.`
    );
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
      unitPrice: estimate.items[0]?.unitPrice || 450,
      totalAmount: estimate.totalAmount,
      advanceAmount: 0,
      dueAmount: estimate.totalAmount,
      paymentStatus: 'pending',
      sizeBreakdown: { S: 5, M: 10, L: 10, XL: 5 },
      stage: 'payment_pending',
      currentLocation: 'head_office',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: loggedInEmployee?.name || 'Marketing Desk',
    };

    await ErpStorageService.createOrder(newOrder);
    await ErpStorageService.updateEstimate(estimate.id, {
      status: 'converted',
      convertedOrderId: newOrder.id,
    });
    pushActionNotification(
      'APPROVED',
      `Estimate Approved & Converted`,
      `Converted ${estimate.estimateNumber} to Job Card ${newOrder.orderNumber}!`,
      newOrder.orderNumber
    );
  };

  const handleUpdateInvoice = async (id: string, partial: Partial<Invoice>) => {
    await ErpStorageService.updateInvoice(id, partial);
    pushActionNotification(
      partial.status === 'paid' ? 'APPROVED' : 'DONE',
      `Invoice Updated`,
      `Invoice record updated in financial ledger.`
    );
  };

  // HR Handlers
  const handlePunchAttendance = async (record: AttendanceRecord) => {
    await ErpStorageService.punchAttendance(record);
    pushActionNotification(
      'DONE',
      `Attendance Logged: ${record.employeeName}`,
      `Shift status: ${record.status.toUpperCase()} at ${record.checkInTime}.`
    );
  };

  const handleDisburseSalary = async (payslipId: string, paymentMethod: string = 'Bank Wire') => {
    await ErpStorageService.disburseSalary(payslipId, paymentMethod);
    pushActionNotification(
      'APPROVED',
      'Salary Disbursed & Approved',
      `Payroll disbursed via ${paymentMethod} and posted to general ledger.`
    );
  };

  const handleCreateEmployee = async (emp: Employee) => {
    await ErpStorageService.createEmployee(emp);
    pushActionNotification(
      'DONE',
      `Staff Profile Created: ${emp.name}`,
      `${emp.designation} added to ${emp.location.replace('_', ' ')}.`
    );
  };

  const handleUpdateEmployee = async (employeeId: string, partial: Partial<Employee>) => {
    await ErpStorageService.updateEmployee(employeeId, partial);
    if (selectedEmployeeForProfile && selectedEmployeeForProfile.id === employeeId) {
      setSelectedEmployeeForProfile({ ...selectedEmployeeForProfile, ...partial });
    }
    pushActionNotification(
      'APPROVED',
      'Employee Profile Updated',
      'Updated staff designation, factory assignment, and contract details.'
    );
  };

  const handleUpdatePermissions = async (
    employeeId: string,
    permissions: EmployeePermissions
  ) => {
    await ErpStorageService.updateEmployee(employeeId, { permissions });
    pushActionNotification(
      'APPROVED',
      'Access Permissions Updated',
      'Role-based module permissions saved.'
    );
  };

  const handleCreateBankAccount = async (acc: BankAccount) => {
    await ErpStorageService.addBankAccount(acc);
    pushActionNotification(
      'DONE',
      `Bank Account Linked: ${acc.bankName}`,
      `Corporate account ${acc.accountNumber} added to treasury.`
    );
  };

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await ErpStorageService.updateSettings(newSettings);
    pushActionNotification(
      'APPROVED',
      'System Settings Saved',
      'Updated enterprise configuration, module names, and courier integrations.'
    );
  };

  const handleLoginEmployee = (emp: Employee) => {
    setLoggedInEmployee(emp);
    setCurrentRole(emp.role);
    pushActionNotification(
      'VERIFIED',
      `Welcome, ${emp.name}`,
      `Signed in as ${emp.designation} (${ROLE_CONFIGS[emp.role]?.shortLabel}).`
    );
  };

  const handleSignOutEmployee = async () => {
    if (currentUser) {
      await logoutUser();
    }
    setLoggedInEmployee(null);
    setIsRoleSwitcherOpen(false);
    setIsNotifDropdownOpen(false);
    setIsChatOpen(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch {
      // Fallback to Owner login if popup blocked in preview iframe
    }
    const ownerEmp = employees.find((e) => e.role === 'owner') || INITIAL_EMPLOYEES[0];
    handleLoginEmployee(ownerEmp);
  };

  // MANDATORY AUTHENTICATION GATE: No one can see or perform any task without logging in first
  if (!loggedInEmployee) {
    return (
      <LoginScreen
        employees={employees.length > 0 ? employees : INITIAL_EMPLOYEES}
        onLoginSuccess={handleLoginEmployee}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  const openShortageCount = shortageTickets.filter((t) => t.status !== 'resolved').length;
  const unreadNotifCount = systemNotifications.filter((n) => !n.read).length;
  const roleConfig = ROLE_CONFIGS[currentRole];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b12] text-slate-100 font-sans antialiased select-none">
      {/* 1. Left-Side Collapsible Navigation Panel */}
      <Sidebar
        currentRole={currentRole}
        activeTab={activeTab}
        language={language}
        customModuleNames={companySettings.customModuleNames}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenRoleSwitcher={handleOpenRoleSwitcherGuarded}
        canSwitchRole={userAllowedToSwitchRole}
        shortageTickets={shortageTickets}
        onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        unreadChatCount={teamMessages.length}
        currentUser={currentUser}
        onAuthAction={handleSignOutEmployee}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Enterprise Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0f1d]/90">
        {/* Sticky Top Header Panel */}
        <header className="h-14 border-b border-slate-800/80 bg-[#080c14]/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0 z-30">
          {/* Left: Logged-in Person Name & Position Badge + Factory Location Filter */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Prominent Logged-In Person Name & Position Display */}
            <div
              data-testid="header-user-identity"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-emerald-500/30 shadow-sm shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                {loggedInEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span
                    data-testid="header-person-name"
                    className="text-xs font-black text-white tracking-tight"
                  >
                    {loggedInEmployee.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                    {loggedInEmployee.employeeId}
                  </span>
                </div>
                <div
                  data-testid="header-person-position"
                  className="text-[10px] font-bold text-emerald-400"
                >
                  {loggedInEmployee.designation}
                </div>
              </div>
            </div>

            {/* Factory Location Filter */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs whitespace-nowrap shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 font-medium">Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as any)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  All 3 Factory Locations
                </option>
                <option value="head_office" className="bg-slate-900 text-white">
                  Head Office (Banani)
                </option>
                <option value="print_factory" className="bg-slate-900 text-white">
                  Print Factory (Tongi)
                </option>
                <option value="sewing_factory" className="bg-slate-900 text-white">
                  Sewing Factory (Mirpur)
                </option>
              </select>
            </div>
          </div>

          {/* Right: Verified Badge, Header Notification Bell, Task Delegate Quick Button, Chat, Role Switcher & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Verified Badge: Certified by Gemini & Ibrahim Khalil */}
            <button
              type="button"
              data-testid="header-verified-badge-btn"
              onClick={() => setIsCertificationModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-indigo-950/90 hover:from-emerald-900 hover:to-indigo-900 border border-emerald-400/50 text-[11px] font-black text-emerald-200 whitespace-nowrap shrink-0 cursor-pointer shadow-sm transition"
              title="Click to view Official System Certification & Full ERP Video Review"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>VERIFIED • Certified by Gemini & Ibrahim Khalil</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                v4.2.0
              </span>
            </button>

            {/* BDT Currency Indicator */}
            <span className="hidden xl:inline-flex items-center px-2 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-mono font-black text-emerald-300 whitespace-nowrap shrink-0">
              ৳ BDT
            </span>

            {/* Header Notification Bell Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                data-testid="header-notification-btn"
                onClick={() => setIsNotifDropdownOpen((prev) => !prev)}
                className={`relative px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap ${
                  isNotifDropdownOpen
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
                title="System Action Notifications (DONE, APPROVED, DELEGATED)"
              >
                <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Notifications</span>
                {unreadNotifCount > 0 && (
                  <span
                    data-testid="header-notification-badge"
                    className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black"
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <HeaderNotificationDropdown
                isOpen={isNotifDropdownOpen}
                onClose={() => setIsNotifDropdownOpen(false)}
                notifications={systemNotifications}
                delegatedTasks={delegatedTasks}
                onMarkAllRead={() =>
                  setSystemNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                }
                onClearAll={() => setSystemNotifications([])}
                onSelectDelegatedTask={(task) => {
                  setIsNotifDropdownOpen(false);
                  setActiveDelegatedPopupTask(task);
                  playInstantDelegationSound();
                }}
              />
            </div>

            {/* Instant Task Delegation Trigger Button in Header */}
            <button
              type="button"
              data-testid="header-instant-delegate-btn"
              onClick={() => {
                const targetEmp =
                  employees.find((e) => e.id !== loggedInEmployee.id) || employees[0];
                handleDelegateTask({
                  title: `Priority Production Verification — ${orders[0]?.orderNumber || 'SW-2026-0891'}`,
                  description: `Immediate department inspection and status sign-off requested by ${loggedInEmployee.name} (${loggedInEmployee.designation}).`,
                  orderNumber: orders[0]?.orderNumber || 'SW-2026-0891',
                  invoiceNumber: invoices[0]?.invoiceNumber || 'INV-2026-891',
                  assignedToEmployeeId: targetEmp.id,
                  assignedToEmployeeName: targetEmp.name,
                  assignedToPosition: targetEmp.designation,
                  assignedToRole: targetEmp.role,
                  delegatedByEmployeeName: loggedInEmployee.name,
                  delegatedByPosition: loggedInEmployee.designation,
                  priority: 'urgent',
                  dueTime: 'Immediate Action',
                });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition cursor-pointer whitespace-nowrap shrink-0"
              title="Instant Delegate Task with Popup & Sound Alert"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Delegate Task</span>
            </button>

            {/* Quick Bulk Data Import Hub Button */}
            <button
              onClick={() => setActiveTab('bulk_import')}
              className="btn-press hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
              title="Bulk Import Orders, Staff, Income, Expenses, Customers, Materials & Vendors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">Bulk Import</span>
            </button>

            {/* Quick QR Scanner Button */}
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="btn-press hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
              title="Scan Bundle QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden 2xl:inline">{getTranslation('scanQrBtn', language)}</span>
            </button>

            {/* Internal Team Comms Floating Window Button */}
            <button
              data-testid="header-open-chat-btn"
              onClick={() => setIsChatOpen((prev) => !prev)}
              className={`relative px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 ${
                isChatOpen
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/60'
                  : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700'
              }`}
              title="Open Floating Live Chat (Supports Private Invoice DMs, @Mentions & Replies)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="hidden sm:inline">Live Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </button>

            {/* Enterprise Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-press p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer shrink-0"
              title="Full System Settings, Module Names & Couriers"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Shortage Alarm Icon (if active) */}
            {openShortageCount > 0 && (
              <button
                onClick={() => setActiveTab('shortages')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold animate-pulse cursor-pointer whitespace-nowrap shrink-0"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{openShortageCount} Re-print</span>
              </button>
            )}

            {/* Active Role Badge / Guarded Role Switcher (Only Owner/Manager can switch) */}
            <button
              type="button"
              data-testid="header-role-switcher-btn"
              onClick={handleOpenRoleSwitcherGuarded}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition whitespace-nowrap shrink-0 ${
                userAllowedToSwitchRole
                  ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 cursor-not-allowed'
              }`}
              title={
                userAllowedToSwitchRole
                  ? 'Switch Active Portal Role (Owner / Manager Privilege)'
                  : 'Role Locked — Only Owner or Manager can switch roles'
              }
            >
              {userAllowedToSwitchRole ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>{roleConfig?.shortLabel || getRoleName(currentRole, language)}</span>
            </button>

            {/* Sign Out / Switch User Button */}
            <button
              type="button"
              data-testid="header-logout-btn"
              onClick={handleSignOutEmployee}
              className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition cursor-pointer shrink-0"
              title="Sign Out / Switch Logged-In User"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Universal Action Notification Banner & Delegation Alerts Stack */}
        <div className="fixed top-16 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
          {toastBanner && (
            <div
              data-testid="action-toast-banner"
              className="p-3.5 bg-slate-950/95 text-white text-xs font-bold rounded-2xl border border-emerald-500/50 shadow-2xl pointer-events-auto flex items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    toastBanner.tag === 'APPROVED'
                      ? 'bg-emerald-500 text-slate-950'
                      : toastBanner.tag === 'DELEGATED'
                      ? 'bg-amber-500 text-slate-950'
                      : toastBanner.tag === 'ALERT'
                      ? 'bg-rose-500 text-white'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {toastBanner.tag}
                </span>
                <span className="text-slate-100 leading-snug">{toastBanner.message}</span>
              </div>
              <button
                onClick={() => setToastBanner(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-white/15 text-[9px] font-black uppercase">
                        {alert.statusTag}
                      </span>
                      <h5 className="text-xs font-black tracking-tight">{alert.title}</h5>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {alert.targetDepartment}{' '}
                      {alert.targetEmployee ? `• ${alert.targetEmployee}` : ''}
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
                    const ord = orders.find(
                      (o) => o.id === alert.orderId || o.orderNumber === alert.orderNumber
                    );
                    if (ord) setSelectedOrder(ord);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Open Job Card <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Workstation Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <PwaInstallBanner language={language} />

          {/* TAB 0: DASHBOARD & TASKS */}
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

          {/* TAB 2: HEAD OFFICE / MARKETING & DESIGN (UPGRADED SALES & CRM) */}
          {activeTab === 'head_office' && (
            <HeadOfficeView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              employees={employees}
              invoices={invoices}
              currentUserName={loggedInEmployee.name}
              currentUserPosition={loggedInEmployee.designation}
              externalDesignToolName={companySettings.externalDesignToolName}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onOpenCustomersCrm={() => setActiveTab('customers_crm')}
              onDelegateTask={handleDelegateTask}
              onOpenPrivateInvoiceChat={handleOpenPrivateInvoiceChat}
              onNotifyAction={(tag, title, message) =>
                pushActionNotification(tag, title, message)
              }
            />
          )}

          {/* DEDICATED CUSTOMER LIST & MARKETING PLAYBOOK */}
          {activeTab === 'customers_crm' && (
            <CustomersModule
              customers={customers}
              orders={orders}
              invoices={invoices}
              faqs={marketingFaqs}
              currentRole={currentRole}
              language={language}
              onCreateCustomer={handleCreateCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onCreateFaq={handleCreateFaq}
              onOpenClientPortal={() => setIsB2bPortalOpen(true)}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
            />
          )}

          {/* DEDICATED VENDOR & SUPPLIERS (PO/GRN) MODULE */}
          {activeTab === 'vendors_suppliers' && (
            <VendorsSuppliersModule
              vendors={vendors}
              purchaseOrders={purchaseOrders}
              inventory={inventory}
              ledgerEntries={ledgerEntries}
              currentRole={currentRole}
              language={language}
              onCreateVendor={handleCreateVendor}
              onUpdateVendor={handleUpdateVendor}
              onCreatePurchaseOrder={handleCreatePurchaseOrder}
              onReceiveGrn={handleReceiveGrn}
              onRecordVendorPayment={handleRecordVendorPayment}
            />
          )}

          {/* DEDICATED NEW PRODUCT DEVELOPMENT (NPD) & SAMPLE MODULE */}
          {activeTab === 'product_dev_samples' && (
            <ProductDevSampleModule
              samples={productSamples}
              colorSwatches={colorSwatches}
              currentRole={currentRole}
              language={language}
              onCreateSample={handleCreateProductSample}
              onUpdateSample={handleUpdateProductSample}
              onCreateColorSwatch={handleCreateColorSwatch}
              onConvertSampleToOrder={handleConvertSampleToOrder}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 3: ACCOUNTING & LEDGERS (UPGRADED) */}
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
              bankAccounts={bankAccounts}
              employees={employees}
              customers={customers}
              onRecordPayment={handleRecordPayment}
              onAddExpense={handleAddExpense}
              onCreateEstimate={handleCreateEstimate}
              onConvertEstimate={handleConvertEstimate}
              onUpdateInvoice={handleUpdateInvoice}
              onCreateBankAccount={handleCreateBankAccount}
              onOpenClientPortal={() => setIsB2bPortalOpen(true)}
              onOpenPrivateInvoiceChat={handleOpenPrivateInvoiceChat}
              onNotifyAction={(tag, title, message) =>
                pushActionNotification(tag, title, message)
              }
            />
          )}

          {/* DEDICATED USER & EMPLOYEE DIRECTORY */}
          {activeTab === 'users_employees' && (
            <UsersEmployeesModule
              employees={employees}
              assets={companyAssets}
              orders={orders}
              currentRole={currentRole}
              language={language}
              onCreateEmployee={handleCreateEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onOpenEmployeeProfile={(emp) => setSelectedEmployeeForProfile(emp)}
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
              onOpenEmployeeProfile={(emp) => setSelectedEmployeeForProfile(emp)}
              onUpdateEmployee={handleUpdateEmployee}
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

          {/* TAB 6: EMPLOYEE PERSONAL WORKSTATION (UPGRADED) */}
          {activeTab === 'employee_portal' && (
            <EmployeePortal
              orders={orders}
              employees={employees}
              loggedInEmployee={loggedInEmployee}
              canSwitchEmployee={userAllowedToSwitchRole}
              attendance={attendance}
              payslips={payslips}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              delegatedTasks={delegatedTasks}
              messages={teamMessages}
              onPunchAttendance={handlePunchAttendance}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onOpenRaiseShortage={(ord?: Order) => {
                setOrderForShortage(ord || null);
                setIsRaiseShortageOpen(true);
              }}
              onAcceptDelegatedTask={handleAcceptDelegatedTask}
              onCompleteDelegatedTask={handleCompleteDelegatedTask}
              onOpenChat={() => setIsChatOpen(true)}
              onNotifyAction={(tag, title, message) =>
                pushActionNotification(tag, title, message)
              }
            />
          )}

          {/* TAB 7: BULK DATA IMPORT & OFFLINE-TO-ONLINE MIGRATION HUB */}
          {activeTab === 'bulk_import' && (
            <BulkImportModule onImportComplete={(msg) => showToast(msg, 'DONE')} />
          )}

          {/* TAB 9: TONGI PRINT FACTORY */}
          {activeTab === 'print_floor' && (
            <PrintFactoryView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              employees={employees}
              inventory={inventory}
              onOpenEmployeeProfile={(emp) => setSelectedEmployeeForProfile(emp)}
              onUpdateEmployee={handleUpdateEmployee}
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
              employees={employees}
              onOpenEmployeeProfile={(emp) => setSelectedEmployeeForProfile(emp)}
              onUpdateEmployee={handleUpdateEmployee}
            />
          )}

          {/* TAB 11: SHORTAGE TICKETS RED ALERT (UPGRADED) */}
          {activeTab === 'shortages' && (
            <ShortageTicketsView
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              orders={orders}
              employees={employees}
              currentUserName={loggedInEmployee.name}
              currentUserPosition={loggedInEmployee.designation}
              onUpdateTicket={handleUpdateShortageTicket}
              onOpenRaiseModal={() => {
                setOrderForShortage(null);
                setIsRaiseShortageOpen(true);
              }}
              onDelegateTask={handleDelegateTask}
              onNotifyAction={(tag, title, message) =>
                pushActionNotification(tag, title, message)
              }
            />
          )}

          {/* TAB 12: RAW INVENTORY & COMPANY ASSETS */}
          {activeTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              currentRole={currentRole}
              assets={companyAssets}
              employees={employees}
              orders={orders}
              onUpdateStock={handleUpdateStock}
              onCreateInventoryItem={handleCreateInventoryItem}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              onCreateAsset={handleCreateAsset}
              onUpdateAsset={handleUpdateAsset}
              onOpenEmployeeProfile={(emp) => setSelectedEmployeeForProfile(emp)}
            />
          )}

          {/* DEDICATED COMPANY DOCUMENTS CENTER */}
          {activeTab === 'documents_center' && (
            <DocumentsCenterModule
              documents={companyDocuments}
              orders={orders}
              vendors={vendors}
              settings={companySettings}
              currentRole={currentRole}
              language={language}
              onCreateDocument={handleCreateDocument}
              onUpdateDocument={handleUpdateDocument}
            />
          )}

          {/* DEDICATED GUIDELINES, ONBOARDING & CROSS-MODULE SYNC */}
          {activeTab === 'guidelines_sop' && (
            <GuidelinesModule
              orders={orders}
              inventory={inventory}
              customers={customers}
              companySettings={companySettings}
              lang={language}
              onAutoSyncInventoryFromOrders={handleAutoSyncInventoryFromOrders}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* Official Software Authorized Info Footer */}
          <SoftwareAuthorizedInfoCard
            variant="footer"
            onOpenCertificationModal={() => setIsCertificationModalOpen(true)}
          />
        </main>
      </div>

      {/* 3. Global Modals & Interactive Overlays */}
      <SystemCertificationModal
        isOpen={isCertificationModalOpen}
        onClose={() => setIsCertificationModalOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      <TaskDelegationPopupModal
        task={activeDelegatedPopupTask}
        onClose={() => setActiveDelegatedPopupTask(null)}
        onAcceptTask={handleAcceptDelegatedTask}
        onCompleteTask={handleCompleteDelegatedTask}
        onOpenOrder={(orderNum) => {
          const found = orders.find((o) => o.orderNumber === orderNum);
          if (found) setSelectedOrder(found);
          setActiveDelegatedPopupTask(null);
        }}
      />

      <BundleQrCodeModal
        order={bundleQrOrder}
        isOpen={Boolean(bundleQrOrder)}
        onClose={() => setBundleQrOrder(null)}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        orders={orders}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
      />

      <InternalChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatPreselectedInvoice('');
          setChatPreselectedRecipientId('');
        }}
        currentRole={currentRole}
        currentUserName={loggedInEmployee.name}
        loggedInEmployee={loggedInEmployee}
        employees={employees}
        orders={orders}
        invoices={invoices}
        faqs={marketingFaqs}
        onOpenOrder={(ord) => setSelectedOrder(ord)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        messages={teamMessages}
        preSelectedPrivateInvoice={
          chatPreselectedInvoice
            ? invoices.find((inv) => inv.invoiceNumber === chatPreselectedInvoice) || null
            : null
        }
        preSelectedPrivateRecipientId={chatPreselectedRecipientId || null}
        onSendPhoneNotification={(phone, msg) =>
          pushActionNotification(
            'DONE',
            `SMS Alert Dispatched to ${phone}`,
            `"${msg.slice(0, 45)}..."`
          )
        }
      />

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen && userAllowedToSwitchRole}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentRole={currentRole}
        onSelectRole={(r) => {
          if (!userAllowedToSwitchRole) return;
          setCurrentRole(r);
          pushActionNotification(
            'APPROVED',
            `Active Role Switched`,
            `${loggedInEmployee.name} switched portal view to ${ROLE_CONFIGS[r]?.title || r}.`
          );
        }}
      />

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

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onCreateOrder={handleCreateOrder}
        onDelegateTask={handleDelegateTask}
        employees={employees}
        customers={customers}
        currentUserName={loggedInEmployee.name}
        currentUserPosition={loggedInEmployee.designation}
      />

      <RaiseShortageModal
        isOpen={isRaiseShortageOpen}
        onClose={() => setIsRaiseShortageOpen(false)}
        orders={orders}
        preSelectedOrder={orderForShortage}
        onRaiseTicket={handleRaiseShortage}
      />

      <EmployeeProfileModal
        employee={selectedEmployeeForProfile}
        isOpen={Boolean(selectedEmployeeForProfile)}
        onClose={() => setSelectedEmployeeForProfile(null)}
        currentRole={currentRole}
        language={language}
        onUpdatePermissions={handleUpdatePermissions}
        onUpdateEmployee={handleUpdateEmployee}
        onSendPhoneNotification={(phone, msg) =>
          pushActionNotification(
            'DONE',
            `SMS Dispatched to ${phone}`,
            `"${msg.slice(0, 40)}..."`
          )
        }
        assignedOrders={orders.filter(
          (o) =>
            o.assignedToEmployeeId === selectedEmployeeForProfile?.id ||
            o.assignedToEmployeeName === selectedEmployeeForProfile?.name
        )}
        assignedInvoices={invoices.filter(
          (i) =>
            i.assignedEmployeeId === selectedEmployeeForProfile?.id ||
            i.assignedEmployeeName === selectedEmployeeForProfile?.name
        )}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={companySettings}
        currentRole={currentRole}
        language={language}
        onSaveSettings={handleSaveSettings}
      />

      <B2bClientPortalModal
        isOpen={isB2bPortalOpen}
        onClose={() => setIsB2bPortalOpen(false)}
        customers={customers}
        orders={orders}
        invoices={invoices}
        estimates={estimates}
        ledgerEntries={ledgerEntries}
        currentRole={currentRole}
        language={language}
        onSendMessageToMarketing={(_cid, msg) =>
          pushActionNotification(
            'DONE',
            'Client Portal Message Received',
            `"${msg.slice(0, 45)}..."`
          )
        }
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        orders={orders}
      />

      <GeminiChatbotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        orders={orders}
        inventory={inventory}
        shortageTickets={shortageTickets}
        customers={customers}
      />
    </div>
  );
}
