/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, FactoryLocation, OrderStage, SizeBreakdown, PlayerRosterItem } from '../utils/erpLogic';

export type { UserRole, FactoryLocation, OrderStage, SizeBreakdown, PlayerRosterItem };

export type BusinessType = 'b2b' | 'b2c';

export interface Order {
  id: string;
  orderNumber: string;
  orderType: BusinessType; // B2B (clubs/schools/corporate) vs B2C (individual/direct retail)
  channel?: 'direct_crm' | 'retail_web' | 'distributor' | 'repeat_client' | 'corporate_po';
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  teamOrClub?: string;
  sportType?: string;
  fabricType: string;
  gsm?: number;
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  paymentStatus: 'pending' | 'verified' | 'paid_in_full';
  paymentReference?: string;
  paymentProofUrl?: string;
  sizeBreakdown: SizeBreakdown;
  roster?: PlayerRosterItem[];
  stage: OrderStage;
  currentLocation: FactoryLocation;
  mockupUrl?: string;
  mockupNotes?: string;
  printReadyLink?: string;
  patternSpecSheet?: string;
  fabricDispatchedAt?: string;
  deliveryChallanNumber?: string;
  fabricReceivedAt?: string;
  courierName?: string;
  trackingNumber?: string;
  deliveryAddress?: string;
  hasShortage?: 'yes' | 'no';
  assignedToEmployeeId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  name: string;
  type: BusinessType;
  companyOrClub: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
  status: 'lead' | 'active' | 'vip';
  notes?: string;
  createdAt: string;
}

export interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  type: BusinessType;
  items: EstimateItem[];
  subtotal: number;
  discount: number;
  taxVat: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';
  validUntil: string;
  notes?: string;
  convertedOrderId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  type: BusinessType;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue';
  dueDate: string;
  paymentTerms: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'fabric_mill' | 'ink_supplier' | 'paper_supplier' | 'accessories' | 'equipment' | 'logistics';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number;
  paymentTerms: string;
}

export interface LedgerEntry {
  id: string;
  entityType: 'client' | 'vendor';
  entityId: string;
  entityName: string;
  date: string;
  referenceType: 'invoice' | 'payment' | 'bill' | 'advance' | 'refund';
  referenceId: string;
  description: string;
  debit: number; // money charged / billed
  credit: number; // money paid / credited
  runningBalance: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  type: 'received_from_client' | 'paid_to_vendor';
  partyType: 'client' | 'vendor';
  partyId: string;
  partyName: string;
  amount: number;
  method: 'bank_transfer' | 'bkash_nagad' | 'cash' | 'cheque' | 'card';
  transactionRef: string;
  invoiceOrBillRef: string;
  notes?: string;
  verifiedBy: string;
}

export interface Employee {
  id: string;
  employeeId: string; // e.g. "EMP-014"
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  designation: string;
  location: FactoryLocation;
  baseSalary: number; // Monthly
  hourlyOvertimeRate: number;
  joiningDate: string;
  shift: 'morning' | 'evening' | 'general';
  status: 'active' | 'on_leave' | 'terminated';
  bankAccount?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS
  checkOutTime?: string;
  status: 'present' | 'late' | 'half_day' | 'absent';
  overtimeHours: number;
  location: FactoryLocation;
  notes?: string;
}

export interface Payslip {
  id: string;
  slipNumber: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "October 2026"
  baseSalary: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'disbursed';
  paymentDate?: string;
  paymentMethod?: string;
}

export interface ShortageTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  teamOrClub: string;
  partDamaged: string;
  size: string;
  playerDetails: string;
  quantity: number;
  reason: string;
  status: 'open' | 'reprint_file_ready' | 'reprinted' | 'dispatched_to_sewing' | 'resolved';
  urgentPrintLink?: string;
  createdAt: string;
  createdBy: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'fabric' | 'ink' | 'paper' | 'packaging' | 'thread';
  location: 'print_factory' | 'sewing_factory' | 'head_office';
  currentStock: number;
  unit: string;
  minimumThreshold: number;
  unitCost?: number;
  updatedAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  location: 'head_office' | 'print_factory' | 'sewing_factory';
  amount: number;
  date: string;
  recordedBy?: string;
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  location: FactoryLocation;
}

export interface RoleConfig {
  id: UserRole;
  title: string;
  shortLabel: string;
  department: string;
  location: FactoryLocation;
  locationLabel: string;
  badgeColor: string;
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  owner: {
    id: 'owner',
    title: 'Owner / General Manager (Super Admin)',
    shortLabel: 'Super Admin',
    department: 'Executive Board',
    location: 'head_office',
    locationLabel: 'HQ & Multi-Factory',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    description: 'Full enterprise visibility across 3 locations, approvals, financial P&L, audits, user roles.',
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing & Sales Department',
    shortLabel: 'Marketing Lead',
    department: 'Sales & CRM',
    location: 'head_office',
    locationLabel: 'Head Office (Banani)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    description: 'B2B/B2C client accounts, quotations/estimates, order intake, payment proofs, CRM deal tracking.',
  },
  accountant: {
    id: 'accountant',
    title: 'Finance & Accounts Manager',
    shortLabel: 'Accounts Lead',
    department: 'Finance & Accounting',
    location: 'head_office',
    locationLabel: 'Head Office (Banani)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Invoicing, client & vendor ledgers, payment verifications, factory expenses, payroll disbursals.',
  },
  hr_manager: {
    id: 'hr_manager',
    title: 'HR & Payroll Manager',
    shortLabel: 'HR Manager',
    department: 'Human Resources',
    location: 'head_office',
    locationLabel: 'Head Office (Banani)',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    description: 'Staff directory, factory shifts, daily biometric/manual attendance, overtime hours, monthly salary slips.',
  },
  design_mockup: {
    id: 'design_mockup',
    title: 'Design Team 1 (Concept & Mockup)',
    shortLabel: 'Design 1 - Concept',
    department: 'Creative Design Studio',
    location: 'head_office',
    locationLabel: 'Head Office (Banani)',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
    description: '2D & 3D sportswear mockups, client revisions, visual sign-offs, AI mockup generation.',
  },
  design_pattern: {
    id: 'design_pattern',
    title: 'Design Team 2 (Pattern & Print-Ready)',
    shortLabel: 'Design 2 - Pattern/Print',
    department: 'Production Pre-Press',
    location: 'head_office',
    locationLabel: 'Head Office (Banani)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    description: 'Nests sizes onto 1.6m roll width, uploads vector PDF spec sheets, cloud drive links, reprint nesting.',
  },
  print_factory: {
    id: 'print_factory',
    title: 'Print Factory Floor Manager',
    shortLabel: 'Print Factory Lead',
    department: 'Sublimation & Heat Press',
    location: 'print_factory',
    locationLabel: 'Print Factory (Tongi)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Sublimation printing, calender rotary heat press, ink tank telemetry, delivery challan dispatch.',
  },
  sewing_factory: {
    id: 'sewing_factory',
    title: 'Sewing & Assembly Factory Manager',
    shortLabel: 'Sewing Factory Lead',
    department: 'Cutting, Sewing & QC',
    location: 'sewing_factory',
    locationLabel: 'Sewing Factory (Mirpur)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    description: 'Fabric roll receipts, line cutting, stitching lines 1-4, QC inspection, shortage loop tickets, courier packing.',
  },
  floor_worker: {
    id: 'floor_worker',
    title: 'Floor Operator / Employee',
    shortLabel: 'Employee / Worker',
    department: 'Shop Floor Production',
    location: 'sewing_factory',
    locationLabel: 'Factory Floor',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    description: 'Employee personal workstation: punch attendance, view assigned job cards, track payslips, report issues.',
  },
};

export type TeamChannelId =
  | 'all-factory'
  | 'sales-marketing'
  | 'design-prepress'
  | 'print-tongi'
  | 'sewing-mirpur'
  | 'urgent-shortages'
  | 'management-board';

export interface TeamChannel {
  id: TeamChannelId;
  name: string;
  description: string;
  icon: string;
  departmentTag: string;
}

export interface TeamMessageAttachment {
  type: 'image' | 'file' | 'audio';
  name: string;
  url: string;
  size?: string;
  durationSec?: number;
}

export interface TeamMessage {
  id: string;
  channelId: TeamChannelId;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  content: string;
  taggedEmployees?: string[];
  taggedDepartments?: string[];
  taggedOrders?: string[];
  taggedInvoices?: string[];
  attachment?: TeamMessageAttachment;
  createdAt: string;
}
