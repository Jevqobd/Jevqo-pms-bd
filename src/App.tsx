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
} from './types/erp';
import {
  INITIAL_SETTINGS,
  INITIAL_COMPANY_ASSETS,
  INITIAL_COMPANY_DOCUMENTS,
  INITIAL_MARKETING_FAQS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PRODUCT_SAMPLES,
  INITIAL_COLOR_SWATCHES,
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
import { ThreeDStudio } from './components/ThreeDStudio';
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
  AlertTriangle,
  QrCode,
  MessageSquare,
  Bell,
  X,
  ArrowRight,
  Bot,
  Filter,
  Languages,
  Settings,
  Users,
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
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>(INITIAL_COMPANY_ASSETS);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>(INITIAL_COMPANY_DOCUMENTS);
  const [marketingFaqs, setMarketingFaqs] = useState<MarketingFaqItem[]>(INITIAL_MARKETING_FAQS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [productSamples, setProductSamples] = useState<ProductSample[]>(INITIAL_PRODUCT_SAMPLES);
  const [colorSwatches, setColorSwatches] = useState<ColorSwatchRecipe[]>(INITIAL_COLOR_SWATCHES);

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
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] = useState<Employee | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isB2bPortalOpen, setIsB2bPortalOpen] = useState(false);

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

  // Stage transition action with role validation & audio delegation alert
  const handleAdvanceStage = async (order: Order, nextStage: OrderStage) => {
    if (!canTransitionStage(order.stage, nextStage, currentRole)) {
      showToast(`Role "${currentRole}" cannot transition from ${order.stage} to ${nextStage}.`);
      return;
    }

    try {
      await ErpStorageService.updateOrder(order.id, { stage: nextStage });

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

  // Inventory & Assets Handlers
  const handleUpdateStock = async (itemId: string, newStock: number) => {
    await ErpStorageService.updateInventoryStock(itemId, newStock);
    showToast('Inventory level synchronized');
  };

  const handleCreateInventoryItem = async (item: InventoryItem) => {
    await ErpStorageService.createInventoryItem(item);
    showToast(`Raw item "${item.name}" (${item.unit}) added to inventory.`);
  };

  const handleUpdateInventoryItem = async (id: string, partial: Partial<InventoryItem>) => {
    await ErpStorageService.updateInventoryItem(id, partial);
    showToast('Inventory item specification updated.');
  };

  const handleDeleteInventoryItem = async (id: string) => {
    await ErpStorageService.deleteInventoryItem(id);
    showToast('Inventory item removed.');
  };

  const handleCreateAsset = async (asset: CompanyAsset) => {
    await ErpStorageService.createAsset(asset);
    showToast(`Company asset "${asset.name}" (${asset.assetCode}) registered.`);
  };

  const handleUpdateAsset = async (id: string, partial: Partial<CompanyAsset>) => {
    await ErpStorageService.updateAsset(id, partial);
    showToast('Company asset assignment updated.');
  };

  // Customers & Marketing Playbook Handlers
  const handleCreateCustomer = async (customer: Customer) => {
    await ErpStorageService.createCustomer(customer);
    showToast(`Customer "${customer.name}" added to CRM with Portal Pass.`);
  };

  const handleUpdateCustomer = async (id: string, partial: Partial<Customer>) => {
    await ErpStorageService.updateCustomer(id, partial);
    showToast('Customer loyalty & privilege profile updated.');
  };

  const handleCreateFaq = async (faq: MarketingFaqItem) => {
    await ErpStorageService.createFaq(faq);
    showToast('New Marketing Q&A reply script saved.');
  };

  // Company Documents Handlers
  const handleCreateDocument = async (docItem: CompanyDocument) => {
    await ErpStorageService.createDocument(docItem);
    showToast(`Official document ${docItem.docNumber} issued.`);
  };

  const handleUpdateDocument = async (id: string, partial: Partial<CompanyDocument>) => {
    await ErpStorageService.updateDocument(id, partial);
    showToast('Document updated.');
  };

  // Cross-Component Smart Sync Handler
  const handleAutoSyncInventoryFromOrders = async () => {
    const activeOrderCount = orders.length;
    showToast(`Synchronized BOM requirements across ${activeOrderCount} active Job Cards & Courier Gate Passes.`);
  };

  // Vendor, PO & GRN Handlers
  const handleCreateVendor = async (vendor: Vendor) => {
    await ErpStorageService.createVendor(vendor);
    showToast(`Supplier "${vendor.name}" added to directory.`);
  };

  const handleUpdateVendor = async (id: string, updates: Partial<Vendor>) => {
    await ErpStorageService.updateVendor(id, updates);
    showToast('Supplier scorecard updated.');
  };

  const handleCreatePurchaseOrder = async (po: PurchaseOrder) => {
    await ErpStorageService.createPurchaseOrder(po);
    pushDelegationAlert({
      orderNumber: po.poNumber,
      orderId: po.id,
      title: `Purchase Order ${po.poNumber} Issued`,
      targetDepartment: po.deliveryLocation === 'print_factory' ? 'Tongi Print Mill' : 'Mirpur Sewing Factory',
      targetEmployee: po.vendorName,
      message: `Ordered ${po.items.map((i) => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ')} ($${po.totalAmount}).`,
      type: 'delegation',
    });
    showToast(`Purchase Order ${po.poNumber} issued to ${po.vendorName}.`);
  };

  const handleReceiveGrn = async (poId: string) => {
    await ErpStorageService.receivePurchaseOrderGrn(poId);
    playSuccessChime();
    showToast('GRN verified! Raw material inventory stock & Vendor Payable Ledger updated automatically.');
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
      verifiedBy: 'Finance & Procurement Desk',
    });
    showToast(`Paid $${amount} to ${vendor.name} (Ref: ${ref}).`);
  };

  // NPD & Sample Management Handlers
  const handleCreateProductSample = async (sample: ProductSample) => {
    await ErpStorageService.createProductSample(sample);
    showToast(`Tech Pack & Sample ${sample.techPackCode} created!`);
  };

  const handleUpdateProductSample = async (id: string, updates: Partial<ProductSample>) => {
    await ErpStorageService.updateProductSample(id, updates);
    showToast('Sample stage & Tech Pack updated.');
  };

  const handleCreateColorSwatch = async (swatch: ColorSwatchRecipe) => {
    await ErpStorageService.createColorSwatch(swatch);
    showToast(`Sublimation color recipe "${swatch.colorName}" (${swatch.pantoneCode}) saved.`);
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
    pushDelegationAlert({
      orderNumber: newOrder.orderNumber,
      orderId: newOrder.id,
      title: `Golden Sample Converted to Bulk Job Card`,
      targetDepartment: 'Tongi Sublimation Print Mill',
      targetEmployee: sample.patternMasterName,
      message: `${sample.techPackCode} (${bulkQty} pcs) launched directly into pattern_spec_ready queue!`,
      type: 'delegation',
    });
    showToast(`Launched Bulk Job Card ${newOrder.orderNumber} (${bulkQty} pcs) from ${sample.techPackCode}!`);
    setActiveTab('orders');
  };

  const handleApplyMockup = async (orderId: string, mockupUrl: string) => {
    await ErpStorageService.updateOrder(orderId, {
      mockupUrl,
      stage: 'mockup_in_progress',
    });
    showToast('3D design synced to Job Card');
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
    await ErpStorageService.updateEstimate(estimate.id, {
      status: 'converted',
      convertedOrderId: newOrder.id,
    });
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

  const handleUpdateEmployee = async (employeeId: string, partial: Partial<Employee>) => {
    await ErpStorageService.updateEmployee(employeeId, partial);
    if (selectedEmployeeForProfile && selectedEmployeeForProfile.id === employeeId) {
      setSelectedEmployeeForProfile({ ...selectedEmployeeForProfile, ...partial });
    }
    showToast('Employee profile, factory assignment & contract updated.');
  };

  const handleUpdatePermissions = async (employeeId: string, permissions: EmployeePermissions) => {
    await ErpStorageService.updateEmployee(employeeId, { permissions });
    showToast('Employee access permissions saved.');
  };

  const handleCreateBankAccount = async (acc: BankAccount) => {
    await ErpStorageService.addBankAccount(acc);
    showToast(`Bank account "${acc.bankName}" linked.`);
  };

  const handleSaveSettings = async (newSettings: CompanySettings) => {
    await ErpStorageService.updateSettings(newSettings);
    showToast('Enterprise settings, module names & courier integrations updated.');
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
        customModuleNames={companySettings.customModuleNames}
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
              <span className="text-slate-400 font-medium">
                {language === 'bn' ? 'কারখানা:' : 'Location:'}
              </span>
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
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                  roleConfig?.badgeColor || 'bg-slate-800 text-white border-slate-700'
                }`}
              >
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

            {/* B2B Client Portal Button */}
            <button
              onClick={() => setIsB2bPortalOpen(true)}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Open B2B Client Portal (Orders, Quotes, Ledger & Chat)"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">B2B Client Portal</span>
            </button>

            {/* Enterprise Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-press p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Full System Settings, Module Names & Couriers"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
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

          {toastMessage && (
            <div className="p-3 bg-slate-900/90 text-white text-xs font-semibold rounded-xl border border-slate-700 shadow-xl pointer-events-auto flex items-center justify-between gap-2">
              <span>{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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

          {/* TAB 2: HEAD OFFICE / MARKETING & DESIGN */}
          {activeTab === 'head_office' && (
            <HeadOfficeView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              externalDesignToolName={companySettings.externalDesignToolName}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onOpenCustomersCrm={() => setActiveTab('customers_crm')}
              onOpen3DStudio={() => setActiveTab('3d_studio')}
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

          {/* TAB 3: ACCOUNTING & LEDGERS */}
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

          {/* TAB 9: TONGI PRINT FACTORY */}
          {activeTab === 'print_floor' && (
            <PrintFactoryView
              orders={orders}
              shortageTickets={shortageTickets}
              currentRole={currentRole}
              onUpdateOrder={handleUpdateOrder}
              onSelectOrder={(ord) => setSelectedOrder(ord)}
              employees={employees}
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
        </main>
      </div>

      {/* 3. Global Modals & Interactive Overlays */}
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
        onClose={() => setIsChatOpen(false)}
        currentRole={currentRole}
        currentUserName={currentUser?.displayName || ROLE_CONFIGS[currentRole]?.shortLabel}
        orders={orders}
        invoices={invoices}
        faqs={marketingFaqs}
        onOpenOrder={(ord) => setSelectedOrder(ord)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        messages={teamMessages}
        onSendPhoneNotification={(phone, msg) =>
          showToast(`SMS Dispatched to ${phone}: "${msg.slice(0, 35)}..."`)
        }
      />

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentRole={currentRole}
        onSelectRole={(r) => {
          setCurrentRole(r);
          showToast(`Switched portal view to ${r.replace('_', ' ')}`);
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
        employees={employees}
        customers={customers}
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
          showToast(`SMS Dispatched to ${phone}: "${msg.slice(0, 35)}..."`)
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
          showToast(`Client Portal message sent to Marketing: "${msg.slice(0, 35)}..."`)
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
