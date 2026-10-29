/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, testFirestoreConnection } from './firebase/config';
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
  UserRole,
  FactoryLocation,
  OrderStage,
} from './types/erp';
import { ErpStorageService } from './services/erpStorageService';
import { Header, NavTab } from './components/Header';
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
import { canTransitionStage } from './utils/erpLogic';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [selectedLocation, setSelectedLocation] = useState<FactoryLocation | 'all'>('all');
  const [activeTab, setActiveTab] = useState<NavTab>('orders');

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

  // Modals & Panels
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isRaiseShortageOpen, setIsRaiseShortageOpen] = useState(false);
  const [orderForShortage, setOrderForShortage] = useState<Order | null>(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
    };
  }, [currentUser]);

  // Keep selectedOrder in sync when orders list updates
  useEffect(() => {
    if (selectedOrder) {
      const refreshed = orders.find((o) => o.id === selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
    }
  }, [orders]);

  // Stage transition action with role validation
  const handleAdvanceStage = async (order: Order, nextStage: OrderStage) => {
    if (!canTransitionStage(order.stage, nextStage, currentRole)) {
      showToast(`Role "${currentRole}" cannot transition from ${order.stage} to ${nextStage}.`);
      return;
    }

    try {
      await ErpStorageService.updateOrder(order.id, { stage: nextStage });
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
  };

  const handleRaiseShortage = async (ticket: ShortageTicket) => {
    await ErpStorageService.raiseShortageTicket(ticket);
    showToast(`Priority Shortage Ticket ${ticket.orderNumber} raised! Design 2 & Print Dept notified.`);
  };

  const handleUpdateShortageTicket = async (ticketId: string, partial: Partial<ShortageTicket>) => {
    await ErpStorageService.updateShortageTicket(ticketId, partial);
    showToast('Shortage ticket updated');
  };

  const handleUpdateStock = async (itemId: string, newStock: number) => {
    await ErpStorageService.updateInventoryStock(itemId, newStock);
    showToast('Inventory level updated');
  };

  const handleAddExpense = async (expense: Expense) => {
    await ErpStorageService.addExpense(expense);
    showToast('Expense recorded');
  };

  const handleRecordPayment = async (payment: PaymentRecord) => {
    await ErpStorageService.recordPayment(payment);
    showToast(`Payment of $${payment.amount} recorded successfully in general ledger`);
  };

  const handlePunchAttendance = async (record: AttendanceRecord) => {
    await ErpStorageService.punchAttendance(record);
    showToast(`Attendance clocked for ${record.employeeName} (${record.status.toUpperCase()})`);
  };

  const handleDisburseSalary = async (slipId: string, method: string) => {
    await ErpStorageService.disburseSalary(slipId, method);
    showToast(`Salary disbursed & posted to company expenses`);
  };

  const handleCreateEmployee = async (emp: Employee) => {
    await ErpStorageService.createEmployee(emp);
    showToast(`Employee ${emp.name} registered`);
  };

  const handleCreateEstimate = async (est: Estimate) => {
    await ErpStorageService.createEstimate(est);
    showToast(`Estimate ${est.estimateNumber} generated`);
  };

  const handleConvertEstimate = async (est: Estimate) => {
    const newOrd: Order = {
      id: `ord-${Date.now().toString(36)}`,
      orderNumber: `SW-${Math.floor(2026000 + Math.random() * 9000)}`,
      orderType: est.type,
      clientName: est.customerName,
      teamOrClub: `Quotation Conversion: ${est.estimateNumber}`,
      sportType: 'Team Kits',
      fabricType: 'Micro-Eyelet 160 GSM',
      gsm: 160,
      totalQuantity: est.items.reduce((s, i) => s + i.quantity, 0),
      unitPrice: est.items[0]?.unitPrice || 16,
      totalAmount: est.totalAmount,
      advanceAmount: Math.round(est.totalAmount * 0.5),
      dueAmount: Math.round(est.totalAmount * 0.5),
      paymentStatus: 'pending',
      sizeBreakdown: { S: 5, M: 15, L: 10, XL: 5 },
      stage: 'payment_pending',
      currentLocation: 'head_office',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sales@sportswear.erp',
    };
    await ErpStorageService.createOrder(newOrd);
    await ErpStorageService.updateEstimate(est.id, {
      status: 'converted',
      convertedOrderId: newOrd.id,
    });
    showToast(`Estimate ${est.estimateNumber} converted into active Job Card ${newOrd.orderNumber}!`);
  };

  const handleUpdateInvoice = async (id: string, partial: Partial<Invoice>) => {
    await ErpStorageService.updateInvoice(id, partial);
    showToast('Invoice updated');
  };

  const handleApplyMockup = async (orderId: string, mockupUrl: string) => {
    await ErpStorageService.updateOrder(orderId, {
      mockupUrl,
      stage: 'mockup_approved',
    });
    showToast('Mockup applied and design approved on Job Card!');
  };

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Department Navigation */}
      <Header
        currentRole={currentRole}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        shortageTickets={shortageTickets}
        onOpenShortages={() => setActiveTab('shortages')}
        onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">
        {/* KPI Dashboard Stats Bar */}
        <DashboardStats
          orders={orders}
          shortageTickets={shortageTickets}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />

        {/* Dynamic Department Views */}
        {activeTab === 'orders' && (
          <KanbanBoard
            orders={orders}
            currentRole={currentRole}
            selectedLocation={selectedLocation}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
            onAdvanceStage={handleAdvanceStage}
            onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
            onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          />
        )}

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

        {activeTab === 'employee_portal' && (
          <EmployeePortal
            employees={employees}
            attendance={attendance}
            payslips={payslips}
            orders={orders}
            shortageTickets={shortageTickets}
            currentRole={currentRole}
            onPunchAttendance={handlePunchAttendance}
            onUpdateOrder={handleUpdateOrder}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
            onOpenRaiseShortage={(ord) => {
              setOrderForShortage(ord || null);
              setIsRaiseShortageOpen(true);
            }}
          />
        )}

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

        {activeTab === 'hr_payroll' && (
          <HrPayrollModule
            employees={employees}
            attendance={attendance}
            payslips={payslips}
            currentRole={currentRole}
            onPunchAttendance={handlePunchAttendance}
            onDisburseSalary={handleDisburseSalary}
            onCreateEmployee={handleCreateEmployee}
          />
        )}

        {activeTab === '3d_studio' && (
          <ThreeDStudio
            orders={orders}
            activeOrder={selectedOrder}
            onApply3DToOrder={handleApplyMockup}
          />
        )}

        {activeTab === 'mockup_studio' && (
          <AiMockupStudio
            orders={orders}
            onApplyMockupToOrder={handleApplyMockup}
          />
        )}

        {activeTab === 'print_floor' && (
          <PrintFactoryView
            orders={orders}
            shortageTickets={shortageTickets}
            currentRole={currentRole}
            onUpdateOrder={handleUpdateOrder}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
          />
        )}

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

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            currentRole={currentRole}
            onUpdateStock={handleUpdateStock}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <GeminiChatbotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentRole={currentRole}
        onSelectRole={(r) => {
          setCurrentRole(r);
          showToast(`Switched view to ${r.replace('_', ' ')}`);
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
      />

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onCreateOrder={handleCreateOrder}
      />

      <RaiseShortageModal
        isOpen={isRaiseShortageOpen}
        onClose={() => setIsRaiseShortageOpen(false)}
        orders={orders}
        preSelectedOrder={orderForShortage}
        onRaiseTicket={handleRaiseShortage}
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        orders={orders}
      />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 text-center text-xs text-gray-500 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Enterprise Sportswear Cloud ERP &bull; Head Office &bull; Print Factory &bull; Sewing Factory
          </span>
          <span className="font-mono text-[11px] text-gray-400">
            Powered by Firebase Firestore, Three.js & Gemini 3.8 / 3.1 Flash-Lite
          </span>
        </div>
      </footer>
    </div>
  );
}
