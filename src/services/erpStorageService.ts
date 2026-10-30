/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
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
  OrderStage,
  BankAccount,
  CompanySettings,
  DailyFactoryOutput,
  CompanyAsset,
  CompanyDocument,
  MarketingFaqItem,
  PurchaseOrder,
  ProductSample,
  ColorSwatchRecipe,
} from '../types/erp';
import {
  INITIAL_ORDERS,
  INITIAL_SHORTAGE_TICKETS,
  INITIAL_INVENTORY,
  INITIAL_EXPENSES,
  INITIAL_CUSTOMERS,
  INITIAL_ESTIMATES,
  INITIAL_INVOICES,
  INITIAL_VENDORS,
  INITIAL_LEDGER_ENTRIES,
  INITIAL_PAYMENT_RECORDS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYSLIPS,
  INITIAL_TEAM_MESSAGES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_SETTINGS,
  INITIAL_PRODUCTIVITY_DATA,
  INITIAL_COMPANY_ASSETS,
  INITIAL_COMPANY_DOCUMENTS,
  INITIAL_MARKETING_FAQS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PRODUCT_SAMPLES,
  INITIAL_COLOR_SWATCHES,
} from './seedData';
import { getStageLocation } from '../utils/erpLogic';

const KEYS = {
  ORDERS: 'sportswear_erp_orders_v2',
  SHORTAGES: 'sportswear_erp_shortages_v2',
  INVENTORY: 'sportswear_erp_inventory_v2',
  EXPENSES: 'sportswear_erp_expenses_v2',
  CUSTOMERS: 'sportswear_erp_customers_v3',
  ESTIMATES: 'sportswear_erp_estimates_v2',
  INVOICES: 'sportswear_erp_invoices_v2',
  VENDORS: 'sportswear_erp_vendors_v3',
  LEDGER: 'sportswear_erp_ledger_v2',
  PAYMENTS: 'sportswear_erp_payments_v2',
  EMPLOYEES: 'sportswear_erp_employees_v2',
  ATTENDANCE: 'sportswear_erp_attendance_v2',
  PAYSLIPS: 'sportswear_erp_payslips_v2',
  MESSAGES: 'sportswear_erp_messages_v2',
  BANKS: 'sportswear_erp_banks_v2',
  SETTINGS: 'sportswear_erp_settings_v3',
  PRODUCTIVITY: 'sportswear_erp_productivity_v2',
  ASSETS: 'sportswear_erp_assets_v1',
  DOCUMENTS: 'sportswear_erp_documents_v1',
  FAQS: 'sportswear_erp_faqs_v1',
  PURCHASE_ORDERS: 'sportswear_erp_purchase_orders_v1',
  PRODUCT_SAMPLES: 'sportswear_erp_product_samples_v1',
  COLOR_SWATCHES: 'sportswear_erp_color_swatches_v1',
};

function getLocal<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key}`, e);
  }
  return initial;
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('sportswear_erp_sync'));
  } catch (e) {
    console.error(`Error writing ${key}`, e);
  }
}

export class ErpStorageService {
  // ===================== ORDERS =====================
  static getLocalOrders(): Order[] {
    return getLocal<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  }

  static subscribeOrders(onUpdate: (data: Order[]) => void): () => void {
    onUpdate(this.getLocalOrders());
    const handler = () => onUpdate(this.getLocalOrders());
    window.addEventListener('sportswear_erp_sync', handler);

    if (!auth.currentUser) {
      return () => window.removeEventListener('sportswear_erp_sync', handler);
    }

    const unsub = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ ...(d.data() as Order), id: d.id }));
          setLocal(KEYS.ORDERS, list);
          onUpdate(list);
        } else {
          this.seedAllToFirestore();
        }
      },
      (err) => {
        console.warn('Orders firestore note:', err.message);
        onUpdate(this.getLocalOrders());
      }
    );

    return () => {
      window.removeEventListener('sportswear_erp_sync', handler);
      unsub();
    };
  }

  static async createOrder(order: Order): Promise<void> {
    const current = this.getLocalOrders();
    const updated = [order, ...current];
    setLocal(KEYS.ORDERS, updated);

    // Also auto-generate an initial Invoice for this order
    const inv: Invoice = {
      id: `inv-${order.orderNumber.toLowerCase()}`,
      invoiceNumber: `INV-${order.orderNumber.replace('SW-', '')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: `cust-${order.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      customerName: order.clientName,
      type: order.orderType,
      totalAmount: order.totalAmount,
      paidAmount: order.advanceAmount,
      dueAmount: order.dueAmount,
      status: order.dueAmount === 0 ? 'paid' : order.advanceAmount > 0 ? 'partially_paid' : 'issued',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      paymentTerms: '50% advance, balance on delivery',
      createdAt: new Date().toISOString(),
    };
    await this.createInvoice(inv);

    // Also record in Client Ledger
    await this.addLedgerEntry({
      id: `led-${Date.now()}-inv`,
      entityType: 'client',
      entityId: inv.customerId,
      entityName: order.clientName,
      date: new Date().toISOString().split('T')[0],
      referenceType: 'invoice',
      referenceId: inv.invoiceNumber,
      description: `Order ${order.orderNumber} - ${order.teamOrClub || 'Custom Team Kit'} (${order.totalQuantity} pcs)`,
      debit: order.totalAmount,
      credit: 0,
      runningBalance: order.totalAmount,
    });

    if (order.advanceAmount > 0) {
      await this.recordPayment({
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'received_from_client',
        partyType: 'client',
        partyId: inv.customerId,
        partyName: order.clientName,
        amount: order.advanceAmount,
        method: order.paymentReference?.includes('BKASH') ? 'bkash_nagad' : 'bank_transfer',
        transactionRef: order.paymentReference || 'ADV-DEP',
        invoiceOrBillRef: inv.invoiceNumber,
        notes: 'Advance deposit on order placement',
        verifiedBy: 'Marketing & Accounts',
      });
    }

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'orders', order.id), order);
      } catch (e) {
        console.warn('Firestore write fallback', e);
      }
    }
  }

  static async updateOrder(orderId: string, partial: Partial<Order>): Promise<void> {
    const current = this.getLocalOrders();
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx === -1) return;

    const existing = current[idx];
    const newStage = partial.stage || existing.stage;
    const newLocation = getStageLocation(newStage);

    const merged: Order = {
      ...existing,
      ...partial,
      stage: newStage,
      currentLocation: newLocation,
      updatedAt: new Date().toISOString(),
    };

    current[idx] = merged;
    setLocal(KEYS.ORDERS, [...current]);

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'orders', orderId), partial);
      } catch (e) {
        console.warn('Firestore update fallback', e);
      }
    }
  }

  // ===================== SHORTAGES =====================
  static getLocalShortages(): ShortageTicket[] {
    return getLocal<ShortageTicket[]>(KEYS.SHORTAGES, INITIAL_SHORTAGE_TICKETS);
  }

  static subscribeShortages(onUpdate: (data: ShortageTicket[]) => void): () => void {
    onUpdate(this.getLocalShortages());
    const handler = () => onUpdate(this.getLocalShortages());
    window.addEventListener('sportswear_erp_sync', handler);

    if (!auth.currentUser) {
      return () => window.removeEventListener('sportswear_erp_sync', handler);
    }

    const unsub = onSnapshot(collection(db, 'shortageTickets'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => ({ ...(d.data() as ShortageTicket), id: d.id }));
        setLocal(KEYS.SHORTAGES, list);
        onUpdate(list);
      }
    });

    return () => {
      window.removeEventListener('sportswear_erp_sync', handler);
      unsub();
    };
  }

  static async raiseShortageTicket(ticket: ShortageTicket): Promise<void> {
    const list = [ticket, ...this.getLocalShortages()];
    setLocal(KEYS.SHORTAGES, list);
    await this.updateOrder(ticket.orderId, { hasShortage: 'yes' });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'shortageTickets', ticket.id), ticket);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  static async updateShortageTicket(ticketId: string, partial: Partial<ShortageTicket>): Promise<void> {
    const list = this.getLocalShortages();
    const idx = list.findIndex((t) => t.id === ticketId);
    if (idx === -1) return;

    list[idx] = { ...list[idx], ...partial };
    setLocal(KEYS.SHORTAGES, [...list]);

    if (partial.status === 'resolved') {
      const remainingOpen = list.filter((t) => t.orderId === list[idx].orderId && t.status !== 'resolved');
      if (remainingOpen.length === 0) {
        await this.updateOrder(list[idx].orderId, { hasShortage: 'no' });
      }
    }

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'shortageTickets', ticketId), partial);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // ===================== CUSTOMERS / CRM =====================
  static getLocalCustomers(): Customer[] {
    return getLocal<Customer[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static subscribeCustomers(onUpdate: (data: Customer[]) => void): () => void {
    onUpdate(this.getLocalCustomers());
    const handler = () => onUpdate(this.getLocalCustomers());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createCustomer(customer: Customer): Promise<void> {
    const list = [customer, ...this.getLocalCustomers()];
    setLocal(KEYS.CUSTOMERS, list);
  }

  static async updateCustomer(id: string, partial: Partial<Customer>): Promise<void> {
    const list = this.getLocalCustomers();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.CUSTOMERS, [...list]);
    }
  }

  // ===================== ESTIMATES / QUOTATIONS =====================
  static getLocalEstimates(): Estimate[] {
    return getLocal<Estimate[]>(KEYS.ESTIMATES, INITIAL_ESTIMATES);
  }

  static subscribeEstimates(onUpdate: (data: Estimate[]) => void): () => void {
    onUpdate(this.getLocalEstimates());
    const handler = () => onUpdate(this.getLocalEstimates());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createEstimate(estimate: Estimate): Promise<void> {
    const list = [estimate, ...this.getLocalEstimates()];
    setLocal(KEYS.ESTIMATES, list);
  }

  static async updateEstimate(id: string, partial: Partial<Estimate>): Promise<void> {
    const list = this.getLocalEstimates();
    const idx = list.findIndex((e) => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.ESTIMATES, [...list]);
    }
  }

  // ===================== INVOICES =====================
  static getLocalInvoices(): Invoice[] {
    return getLocal<Invoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
  }

  static subscribeInvoices(onUpdate: (data: Invoice[]) => void): () => void {
    onUpdate(this.getLocalInvoices());
    const handler = () => onUpdate(this.getLocalInvoices());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createInvoice(invoice: Invoice): Promise<void> {
    const list = [invoice, ...this.getLocalInvoices()];
    setLocal(KEYS.INVOICES, list);
  }

  static async updateInvoice(id: string, partial: Partial<Invoice>): Promise<void> {
    const list = this.getLocalInvoices();
    const idx = list.findIndex((i) => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.INVOICES, [...list]);
    }
  }

  // ===================== VENDORS =====================
  static getLocalVendors(): Vendor[] {
    return getLocal<Vendor[]>(KEYS.VENDORS, INITIAL_VENDORS);
  }

  static subscribeVendors(onUpdate: (data: Vendor[]) => void): () => void {
    onUpdate(this.getLocalVendors());
    const handler = () => onUpdate(this.getLocalVendors());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createVendor(vendor: Vendor): Promise<void> {
    const list = [vendor, ...this.getLocalVendors()];
    setLocal(KEYS.VENDORS, list);
  }

  static async updateVendor(id: string, partial: Partial<Vendor>): Promise<void> {
    const list = this.getLocalVendors();
    const idx = list.findIndex((v) => v.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.VENDORS, [...list]);
    }
  }

  // ===================== LEDGER (CLIENT & VENDOR) =====================
  static getLocalLedger(): LedgerEntry[] {
    return getLocal<LedgerEntry[]>(KEYS.LEDGER, INITIAL_LEDGER_ENTRIES);
  }

  static subscribeLedger(onUpdate: (data: LedgerEntry[]) => void): () => void {
    onUpdate(this.getLocalLedger());
    const handler = () => onUpdate(this.getLocalLedger());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async addLedgerEntry(entry: LedgerEntry): Promise<void> {
    const list = [entry, ...this.getLocalLedger()];
    setLocal(KEYS.LEDGER, list);
  }

  // ===================== PAYMENT RECORDS =====================
  static getLocalPayments(): PaymentRecord[] {
    return getLocal<PaymentRecord[]>(KEYS.PAYMENTS, INITIAL_PAYMENT_RECORDS);
  }

  static subscribePayments(onUpdate: (data: PaymentRecord[]) => void): () => void {
    onUpdate(this.getLocalPayments());
    const handler = () => onUpdate(this.getLocalPayments());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async recordPayment(payment: PaymentRecord): Promise<void> {
    const list = [payment, ...this.getLocalPayments()];
    setLocal(KEYS.PAYMENTS, list);

    // Also post matching credit/debit to the Ledger
    await this.addLedgerEntry({
      id: `led-pay-${payment.id}`,
      entityType: payment.partyType,
      entityId: payment.partyId,
      entityName: payment.partyName,
      date: payment.date,
      referenceType: 'payment',
      referenceId: payment.transactionRef,
      description: `${payment.type === 'received_from_client' ? 'Payment received' : 'Payment made to vendor'} via ${payment.method} (${payment.notes || ''})`,
      debit: payment.type === 'paid_to_vendor' ? payment.amount : 0,
      credit: payment.type === 'received_from_client' ? payment.amount : 0,
      runningBalance: 0,
    });
  }

  // ===================== EMPLOYEES & HR =====================
  static getLocalEmployees(): Employee[] {
    return getLocal<Employee[]>(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  static subscribeEmployees(onUpdate: (data: Employee[]) => void): () => void {
    onUpdate(this.getLocalEmployees());
    const handler = () => onUpdate(this.getLocalEmployees());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createEmployee(emp: Employee): Promise<void> {
    const list = [emp, ...this.getLocalEmployees()];
    setLocal(KEYS.EMPLOYEES, list);
  }

  static async updateEmployee(id: string, partial: Partial<Employee>): Promise<void> {
    const list = this.getLocalEmployees();
    const idx = list.findIndex((e) => e.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.EMPLOYEES, [...list]);
    }
  }

  // ===================== ATTENDANCE =====================
  static getLocalAttendance(): AttendanceRecord[] {
    return getLocal<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  static subscribeAttendance(onUpdate: (data: AttendanceRecord[]) => void): () => void {
    onUpdate(this.getLocalAttendance());
    const handler = () => onUpdate(this.getLocalAttendance());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async punchAttendance(record: AttendanceRecord): Promise<void> {
    const list = this.getLocalAttendance();
    const existingIndex = list.findIndex(
      (a) => a.employeeId === record.employeeId && a.date === record.date
    );

    if (existingIndex !== -1) {
      list[existingIndex] = { ...list[existingIndex], ...record };
      setLocal(KEYS.ATTENDANCE, [...list]);
    } else {
      setLocal(KEYS.ATTENDANCE, [record, ...list]);
    }
  }

  // ===================== PAYROLL & PAYSLIPS =====================
  static getLocalPayslips(): Payslip[] {
    return getLocal<Payslip[]>(KEYS.PAYSLIPS, INITIAL_PAYSLIPS);
  }

  static subscribePayslips(onUpdate: (data: Payslip[]) => void): () => void {
    onUpdate(this.getLocalPayslips());
    const handler = () => onUpdate(this.getLocalPayslips());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createPayslip(slip: Payslip): Promise<void> {
    const list = [slip, ...this.getLocalPayslips()];
    setLocal(KEYS.PAYSLIPS, list);
  }

  static async disburseSalary(slipId: string, paymentMethod: string): Promise<void> {
    const list = this.getLocalPayslips();
    const idx = list.findIndex((p) => p.id === slipId);
    if (idx === -1) return;

    list[idx] = {
      ...list[idx],
      status: 'disbursed',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
    };
    setLocal(KEYS.PAYSLIPS, [...list]);

    // Automatically record an Expense for Salary Payout
    await this.addExpense({
      id: `exp-sal-${Date.now()}`,
      title: `Salary Disbursement: ${list[idx].employeeName} (${list[idx].month})`,
      category: 'Payroll',
      location: 'head_office',
      amount: list[idx].netSalary,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'HR & Accounts Manager',
      notes: `Disbursed via ${paymentMethod}. Net amount: BDT/USD ${list[idx].netSalary}`,
    });
  }

  // ===================== INVENTORY =====================
  static getLocalInventory(): InventoryItem[] {
    return getLocal<InventoryItem[]>(KEYS.INVENTORY, INITIAL_INVENTORY);
  }

  static subscribeInventory(onUpdate: (data: InventoryItem[]) => void): () => void {
    onUpdate(this.getLocalInventory());
    const handler = () => onUpdate(this.getLocalInventory());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async updateInventoryStock(itemId: string, newStock: number): Promise<void> {
    const list = this.getLocalInventory();
    const idx = list.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], currentStock: newStock, updatedAt: new Date().toISOString() };
      setLocal(KEYS.INVENTORY, [...list]);
    }
  }

  static async createInventoryItem(item: InventoryItem): Promise<void> {
    const list = [item, ...this.getLocalInventory()];
    setLocal(KEYS.INVENTORY, list);
  }

  static async updateInventoryItem(itemId: string, partial: Partial<InventoryItem>): Promise<void> {
    const list = this.getLocalInventory();
    const idx = list.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial, updatedAt: new Date().toISOString() };
      setLocal(KEYS.INVENTORY, [...list]);
    }
  }

  static async deleteInventoryItem(itemId: string): Promise<void> {
    const list = this.getLocalInventory().filter((i) => i.id !== itemId);
    setLocal(KEYS.INVENTORY, list);
  }

  // ===================== COMPANY ASSETS =====================
  static getLocalAssets(): CompanyAsset[] {
    return getLocal<CompanyAsset[]>(KEYS.ASSETS, INITIAL_COMPANY_ASSETS);
  }

  static subscribeAssets(onUpdate: (data: CompanyAsset[]) => void): () => void {
    onUpdate(this.getLocalAssets());
    const handler = () => onUpdate(this.getLocalAssets());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createAsset(asset: CompanyAsset): Promise<void> {
    const list = [asset, ...this.getLocalAssets()];
    setLocal(KEYS.ASSETS, list);
  }

  static async updateAsset(assetId: string, partial: Partial<CompanyAsset>): Promise<void> {
    const list = this.getLocalAssets();
    const idx = list.findIndex((a) => a.id === assetId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.ASSETS, [...list]);
    }
  }

  // ===================== COMPANY DOCUMENTS =====================
  static getLocalDocuments(): CompanyDocument[] {
    return getLocal<CompanyDocument[]>(KEYS.DOCUMENTS, INITIAL_COMPANY_DOCUMENTS);
  }

  static subscribeDocuments(onUpdate: (data: CompanyDocument[]) => void): () => void {
    onUpdate(this.getLocalDocuments());
    const handler = () => onUpdate(this.getLocalDocuments());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createDocument(docItem: CompanyDocument): Promise<void> {
    const list = [docItem, ...this.getLocalDocuments()];
    setLocal(KEYS.DOCUMENTS, list);
  }

  static async updateDocument(docId: string, partial: Partial<CompanyDocument>): Promise<void> {
    const list = this.getLocalDocuments();
    const idx = list.findIndex((d) => d.id === docId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.DOCUMENTS, [...list]);
    }
  }

  // ===================== MARKETING FAQS =====================
  static getLocalFaqs(): MarketingFaqItem[] {
    return getLocal<MarketingFaqItem[]>(KEYS.FAQS, INITIAL_MARKETING_FAQS);
  }

  static subscribeFaqs(onUpdate: (data: MarketingFaqItem[]) => void): () => void {
    onUpdate(this.getLocalFaqs());
    const handler = () => onUpdate(this.getLocalFaqs());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createFaq(faq: MarketingFaqItem): Promise<void> {
    const list = [faq, ...this.getLocalFaqs()];
    setLocal(KEYS.FAQS, list);
  }

  // ===================== EXPENSES =====================
  static getLocalExpenses(): Expense[] {
    return getLocal<Expense[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  static subscribeExpenses(onUpdate: (data: Expense[]) => void): () => void {
    onUpdate(this.getLocalExpenses());
    const handler = () => onUpdate(this.getLocalExpenses());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async addExpense(expense: Expense): Promise<void> {
    const list = [expense, ...this.getLocalExpenses()];
    setLocal(KEYS.EXPENSES, list);
  }

  // ===================== TEAM CHAT MESSAGES =====================
  static getLocalMessages(): TeamMessage[] {
    return getLocal<TeamMessage[]>(KEYS.MESSAGES, INITIAL_TEAM_MESSAGES);
  }

  static subscribeMessages(onUpdate: (data: TeamMessage[]) => void): () => void {
    onUpdate(this.getLocalMessages());
    const handler = () => onUpdate(this.getLocalMessages());
    window.addEventListener('sportswear_erp_sync', handler);

    if (!auth.currentUser) {
      return () => window.removeEventListener('sportswear_erp_sync', handler);
    }

    const unsub = onSnapshot(
      collection(db, 'teamMessages'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as TeamMessage);
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setLocal(KEYS.MESSAGES, list);
          onUpdate(list);
        }
      },
      (err) => console.warn('Firestore messages subscription fallback', err)
    );

    return () => {
      window.removeEventListener('sportswear_erp_sync', handler);
      unsub();
    };
  }

  static async sendTeamMessage(msg: TeamMessage): Promise<void> {
    const list = [...this.getLocalMessages(), msg];
    setLocal(KEYS.MESSAGES, list);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'teamMessages', msg.id), msg);
      } catch (err) {
        console.warn('Firestore send message failed', err);
      }
    }
  }

  // ===================== BANK ACCOUNTS =====================
  static getLocalBankAccounts(): BankAccount[] {
    return getLocal<BankAccount[]>(KEYS.BANKS, INITIAL_BANK_ACCOUNTS);
  }

  static subscribeBankAccounts(onUpdate: (data: BankAccount[]) => void): () => void {
    onUpdate(this.getLocalBankAccounts());
    const handler = () => onUpdate(this.getLocalBankAccounts());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async addBankAccount(bank: BankAccount): Promise<void> {
    const list = [...this.getLocalBankAccounts(), bank];
    setLocal(KEYS.BANKS, list);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'bankAccounts', bank.id), bank);
      } catch (err) {
        console.warn('Firestore bank account save fallback', err);
      }
    }
  }

  static async updateBankAccount(id: string, updates: Partial<BankAccount>): Promise<void> {
    const list = this.getLocalBankAccounts().map((b) => (b.id === id ? { ...b, ...updates } : b));
    setLocal(KEYS.BANKS, list);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'bankAccounts', id), updates);
      } catch (err) {
        console.warn('Firestore bank account update fallback', err);
      }
    }
  }

  // ===================== COMPANY SETTINGS =====================
  static getLocalSettings(): CompanySettings {
    return getLocal<CompanySettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static subscribeSettings(onUpdate: (data: CompanySettings) => void): () => void {
    onUpdate(this.getLocalSettings());
    const handler = () => onUpdate(this.getLocalSettings());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async updateSettings(updates: Partial<CompanySettings>): Promise<void> {
    const current = this.getLocalSettings();
    const updated = { ...current, ...updates };
    setLocal(KEYS.SETTINGS, updated);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'company'), updated);
      } catch (err) {
        console.warn('Firestore settings update fallback', err);
      }
    }
  }

  // ===================== PRODUCTIVITY & DAILY OUTPUT =====================
  static getLocalProductivity(): DailyFactoryOutput[] {
    return getLocal<DailyFactoryOutput[]>(KEYS.PRODUCTIVITY, INITIAL_PRODUCTIVITY_DATA);
  }

  static subscribeProductivity(onUpdate: (data: DailyFactoryOutput[]) => void): () => void {
    onUpdate(this.getLocalProductivity());
    const handler = () => onUpdate(this.getLocalProductivity());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async updateDailyProductivity(record: DailyFactoryOutput): Promise<void> {
    const list = this.getLocalProductivity();
    const idx = list.findIndex((item) => item.date === record.date);
    let nextList: DailyFactoryOutput[];
    if (idx >= 0) {
      nextList = list.map((item, i) => (i === idx ? record : item));
    } else {
      nextList = [...list, record];
    }
    setLocal(KEYS.PRODUCTIVITY, nextList);
  }

  // ===================== PURCHASE ORDERS (PO) & GRN STOCK SYNC =====================
  static getLocalPurchaseOrders(): PurchaseOrder[] {
    return getLocal<PurchaseOrder[]>(KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
  }

  static subscribePurchaseOrders(onUpdate: (data: PurchaseOrder[]) => void): () => void {
    onUpdate(this.getLocalPurchaseOrders());
    const handler = () => onUpdate(this.getLocalPurchaseOrders());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createPurchaseOrder(po: PurchaseOrder): Promise<void> {
    const list = [po, ...this.getLocalPurchaseOrders()];
    setLocal(KEYS.PURCHASE_ORDERS, list);
  }

  static async updatePurchaseOrder(id: string, partial: Partial<PurchaseOrder>): Promise<void> {
    const list = this.getLocalPurchaseOrders();
    const idx = list.findIndex((p) => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      setLocal(KEYS.PURCHASE_ORDERS, [...list]);
    }
  }

  static async receivePurchaseOrderGrn(poId: string): Promise<void> {
    const list = this.getLocalPurchaseOrders();
    const idx = list.findIndex((p) => p.id === poId);
    if (idx === -1) return;

    const po = list[idx];
    if (po.status === 'received_grn') return;

    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    list[idx] = {
      ...po,
      status: 'received_grn',
      grnNumber,
      receivedAt: today,
      qualityCheckPassed: true,
    };
    setLocal(KEYS.PURCHASE_ORDERS, [...list]);

    // Auto-increment linked raw inventory stock
    const invList = this.getLocalInventory();
    let invUpdated = false;
    for (const item of po.items) {
      const matchIdx = invList.findIndex(
        (i) =>
          (item.inventoryItemId && i.id === item.inventoryItemId) ||
          i.name.toLowerCase() === item.itemName.toLowerCase()
      );
      if (matchIdx !== -1) {
        invList[matchIdx] = {
          ...invList[matchIdx],
          currentStock: Number((invList[matchIdx].currentStock + item.quantity).toFixed(2)),
          updatedAt: new Date().toISOString(),
        };
        invUpdated = true;
      }
    }
    if (invUpdated) {
      setLocal(KEYS.INVENTORY, [...invList]);
    }

    // Update vendor balance & ledger
    const vendors = this.getLocalVendors();
    const vIdx = vendors.findIndex((v) => v.id === po.vendorId);
    if (vIdx !== -1) {
      const v = vendors[vIdx];
      vendors[vIdx] = {
        ...v,
        totalPurchased: v.totalPurchased + po.totalAmount,
        balanceDue: v.balanceDue + po.totalAmount,
      };
      setLocal(KEYS.VENDORS, [...vendors]);

      const ledger = this.getLocalLedger();
      const newEntry: LedgerEntry = {
        id: `led-grn-${Date.now()}`,
        entityType: 'vendor',
        entityId: v.id,
        entityName: v.name,
        date: today,
        referenceType: 'bill',
        referenceId: `${po.poNumber} / ${grnNumber}`,
        description: `GRN Received: ${po.items.map((i) => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ')}`,
        debit: 0,
        credit: po.totalAmount,
        runningBalance: vendors[vIdx].balanceDue,
      };
      setLocal(KEYS.LEDGER, [newEntry, ...ledger]);
    }
  }

  // ===================== NEW PRODUCT DEVELOPMENT (NPD) & SAMPLES =====================
  static getLocalProductSamples(): ProductSample[] {
    return getLocal<ProductSample[]>(KEYS.PRODUCT_SAMPLES, INITIAL_PRODUCT_SAMPLES);
  }

  static subscribeProductSamples(onUpdate: (data: ProductSample[]) => void): () => void {
    onUpdate(this.getLocalProductSamples());
    const handler = () => onUpdate(this.getLocalProductSamples());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createProductSample(sample: ProductSample): Promise<void> {
    const list = [sample, ...this.getLocalProductSamples()];
    setLocal(KEYS.PRODUCT_SAMPLES, list);
  }

  static async updateProductSample(id: string, partial: Partial<ProductSample>): Promise<void> {
    const list = this.getLocalProductSamples();
    const idx = list.findIndex((s) => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial, updatedAt: new Date().toISOString().split('T')[0] };
      setLocal(KEYS.PRODUCT_SAMPLES, [...list]);
    }
  }

  // ===================== SUBLIMATION COLOR SWATCH RECIPES =====================
  static getLocalColorSwatches(): ColorSwatchRecipe[] {
    return getLocal<ColorSwatchRecipe[]>(KEYS.COLOR_SWATCHES, INITIAL_COLOR_SWATCHES);
  }

  static subscribeColorSwatches(onUpdate: (data: ColorSwatchRecipe[]) => void): () => void {
    onUpdate(this.getLocalColorSwatches());
    const handler = () => onUpdate(this.getLocalColorSwatches());
    window.addEventListener('sportswear_erp_sync', handler);
    return () => window.removeEventListener('sportswear_erp_sync', handler);
  }

  static async createColorSwatch(swatch: ColorSwatchRecipe): Promise<void> {
    const list = [swatch, ...this.getLocalColorSwatches()];
    setLocal(KEYS.COLOR_SWATCHES, list);
  }

  static async updateColorSwatch(id: string, partial: Partial<ColorSwatchRecipe>): Promise<void> {
    const list = this.getLocalColorSwatches();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial, updatedAt: new Date().toISOString().split('T')[0] };
      setLocal(KEYS.COLOR_SWATCHES, [...list]);
    }
  }

  // Seed to firestore helper
  static async seedAllToFirestore(): Promise<void> {
    if (!auth.currentUser) return;
    try {
      for (const ord of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', ord.id), ord);
      }
      for (const sht of INITIAL_SHORTAGE_TICKETS) {
        await setDoc(doc(db, 'shortageTickets', sht.id), sht);
      }
    } catch (e) {
      console.warn('Firestore bulk seed fallback', e);
    }
  }
}
