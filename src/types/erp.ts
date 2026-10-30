/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, FactoryLocation, OrderStage, SizeBreakdown, PlayerRosterItem } from '../utils/erpLogic';

export type { UserRole, FactoryLocation, OrderStage, SizeBreakdown, PlayerRosterItem };

export type BusinessType = 'b2b' | 'b2c';

export interface OrderShortsSpec {
  enabled: boolean;
  quantity: number;
  sizeBreakdown: SizeBreakdown;
  hasInnerLiner: boolean;
  hasPockets: boolean;
  notes?: string;
}

export interface OrderDesignImages {
  front?: string;
  back?: string;
  leftSleeve?: string;
  rightSleeve?: string;
  collarMockup?: string;
  additional?: string[];
}

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
  collarType?: string; // Round Neck, V-Neck, Mandarin Collar, Polo Ribbed, Overlap
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
  shorts?: OrderShortsSpec;
  designImages?: OrderDesignImages;
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
  assignedToEmployeeName?: string;
  externalDesignProjectId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type CustomerPrivilegeTier = 'standard' | 'silver' | 'gold' | 'platinum_vip';

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
  returningRatio?: number; // e.g. 92 (%)
  starRating?: number; // 1 to 5 stars
  privilegeTier?: CustomerPrivilegeTier;
  discountPrivilegePercent?: number; // e.g. 10%
  portalAccessCode?: string; // e.g. "PORTAL-RSA-8891"
  totalOrdersCount?: number;
  lifetimeSpend?: number;
  assignedMarketingRep?: string;
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
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
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
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  customerPortalCode?: string;
  customerStarRating?: number;
  customerReturningRatio?: number;
  customerPrivilegeTier?: CustomerPrivilegeTier;
  createdAt: string;
}

export interface Vendor {
  id: string;
  supplierCode?: string;
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
  rating?: number;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  leadTimeDays?: number;
  moq?: string;
  certifications?: string[];
  suppliedItems?: string[];
  status?: 'preferred' | 'active' | 'on_hold';
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

export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  branch?: string;
  routingNumber?: string;
  accountType: 'bank' | 'mobile_banking' | 'cash';
  balance: number;
  status: 'active' | 'inactive';
  isDefault?: boolean;
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
  bankAccountId?: string;
  bankAccountName?: string;
  proofImageUrl?: string;
  transactionRef: string;
  invoiceOrBillRef: string;
  notes?: string;
  verifiedBy: string;
}

export interface EmployeePermissions {
  canApprovePayments: boolean;
  canAdvancePrint: boolean;
  canAdvanceSewing: boolean;
  canRaiseShortages: boolean;
  canAccessFinancials: boolean;
  canCreateInvoices: boolean;
  canDisburseSalary: boolean;
  canManageSettings: boolean;
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
  post?: string;
  location: FactoryLocation;
  baseSalary: number; // Monthly
  hourlyOvertimeRate: number;
  joiningDate: string;
  shift: 'morning' | 'evening' | 'general';
  status: 'active' | 'on_leave' | 'terminated';
  bankAccount?: string;
  permissions?: EmployeePermissions;
  activeStatus?: 'online' | 'idle' | 'offline';
  lastSeen?: string;
  nid?: string;
  pictureUrl?: string;
  contractStatus?: 'permanent' | 'contractual' | 'probation' | 'internship';
  contractDocumentUrl?: string;
  contractCreatedDate?: string;
  contractExpiryDate?: string;
  emergencyContact?: string;
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

export type InventoryCategory =
  | 'fabric'
  | 'ink'
  | 'paper'
  | 'packaging'
  | 'thread'
  | 'accessories'
  | 'trims'
  | 'chemicals';

export interface InventoryItem {
  id: string;
  sku?: string;
  name: string;
  category: InventoryCategory;
  location: 'print_factory' | 'sewing_factory' | 'head_office';
  currentStock: number;
  unit: string; // Preferable metric: meters, yards, kg, grams, liters, ml, rolls, cones, pieces, boxes, sets
  preferredMetric?: string;
  gsm?: number;
  rollWidth?: string;
  supplierName?: string;
  minimumThreshold: number;
  unitCost?: number;
  updatedAt: string;
}

export type AssetCategory =
  | 'pc_workstation'
  | 'sewing_machine'
  | 'sublimation_printer'
  | 'heat_press'
  | 'laser_cutter'
  | 'scanner_mobile'
  | 'power_generator'
  | 'vehicle';

export interface CompanyAsset {
  id: string;
  assetCode: string; // e.g. "AST-SEW-012"
  name: string;
  category: AssetCategory;
  brandModel: string;
  serialNumber: string;
  location: 'head_office' | 'print_factory' | 'sewing_factory';
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  status: 'operational' | 'in_maintenance' | 'repair_required' | 'standby';
  purchaseDate: string;
  purchaseValue: number;
  lastServicedDate?: string;
  notes?: string;
}

export type DocumentTemplateType =
  | 'delivery_challan'
  | 'purchase_order'
  | 'proforma_invoice'
  | 'qc_certificate'
  | 'factory_memo'
  | 'asset_handover'
  | 'custom_letter';

export interface CompanyDocument {
  id: string;
  docNumber: string;
  title: string;
  type: DocumentTemplateType;
  department: string;
  recipientName: string;
  recipientOrg?: string;
  linkedOrderNumber?: string;
  linkedInvoiceNumber?: string;
  contentBody: string;
  lineItems?: { description: string; qty: string; remarks: string }[];
  status: 'draft' | 'issued' | 'archived';
  createdBy: string;
  createdAt: string;
}

export interface MarketingFaqItem {
  id: string;
  category: 'pricing_moq' | 'fabric_gsm' | 'delivery_sla' | 'payment_terms' | 'design_sizing' | 'shortage_warranty';
  question: string;
  answerEn: string;
  answerBn: string;
  proTip?: string;
}

export interface ShippingIntegration {
  id: string;
  providerName: string; // Pathao, Steadfast, RedX, Paperfly, DHL
  enabled: boolean;
  merchantId: string;
  apiEndpoint: string;
  insideCityRate: number;
  outsideCityRate: number;
  autoBookOnDispatch: boolean;
  status: 'connected' | 'sandbox' | 'disconnected';
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  location: 'head_office' | 'print_factory' | 'sewing_factory';
  amount: number;
  date: string;
  bankAccountId?: string;
  bankAccountName?: string;
  proofImageUrl?: string;
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
    description: '2D & 3D sportswear mockups, client revisions, visual sign-offs, external design API sync.',
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
    shortLabel: 'Tongi Print Floor',
    department: 'Sublimation & Calendar Printing',
    location: 'print_factory',
    locationLabel: 'Tongi Industrial Area',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    description: 'Large-format paper sublimation printers, calendar heat press transfer, fabric roll dispatch to sewing.',
  },
  sewing_factory: {
    id: 'sewing_factory',
    title: 'Sewing & Assembly Factory Manager',
    shortLabel: 'Mirpur Sewing Line',
    department: 'Apparel Assembly & Stitching',
    location: 'sewing_factory',
    locationLabel: 'Mirpur Garment Hub',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    description: 'Receives printed rolls, laser/hand cutting, flatlock sewing lines, quality control packing & courier dispatch.',
  },
  floor_worker: {
    id: 'floor_worker',
    title: 'Factory Line Worker / Operator',
    shortLabel: 'Line Worker',
    department: 'Shop Floor Production',
    location: 'sewing_factory',
    locationLabel: 'Mirpur / Tongi Lines',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
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
  status?: 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
  reactions?: Record<string, number>;
  taggedEmployees?: string[];
  taggedDepartments?: string[];
  taggedOrders?: string[];
  taggedInvoices?: string[];
  attachment?: TeamMessageAttachment;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  addressHeadOffice: string;
  addressPrintMill: string;
  addressSewingFactory: string;
  phone: string;
  email: string;
  website: string;
  taxVatPercentage: number;
  currencySymbol: string;
  invoicePrefix: string;
  estimatePrefix: string;
  jobCardPrefix: string;
  dailyPrintTargetMeters: number;
  dailySewingTargetPcs: number;
  customModuleNames?: Record<string, string>;
  shippingProviders?: ShippingIntegration[];
  externalDesignToolName?: string;
  externalDesignApiUrl?: string;
  externalDesignWebhookEnabled?: boolean;
  enabledFeatures?: Record<string, boolean>;
}

export interface DailyFactoryOutput {
  date: string;
  day: string;
  printActual: number;
  printTarget: number;
  sewingActual: number;
  sewingTarget: number;
  reprintsRuined: number;
  efficiencyPercent: number;
}

export interface PurchaseOrderItem {
  inventoryItemId?: string;
  itemName: string;
  category: 'fabric' | 'ink' | 'paper' | 'thread' | 'packaging' | 'accessories';
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: Vendor['category'];
  deliveryLocation: FactoryLocation;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'issued' | 'in_transit' | 'received_grn' | 'cancelled';
  expectedDeliveryDate: string;
  grnNumber?: string;
  receivedAt?: string;
  qualityCheckPassed?: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type SampleStage =
  | 'concept_techpack'
  | 'cad_3d_pattern'
  | 'proto_sample'
  | 'fit_wear_test'
  | 'pp_sample'
  | 'approved_for_bulk';

export interface BomCostItem {
  id: string;
  componentName: string;
  category: 'Fabric' | 'Sublimation Paper & Ink' | 'Trims & Labels' | 'Sewing SMV Labor' | 'Packaging & QC';
  consumptionPerPc: number;
  unit: string;
  ratePerUnit: number;
  costPerPc: number;
}

export interface ProductSample {
  id: string;
  techPackCode: string;
  styleName: string;
  category:
    | 'Football Kit'
    | 'Cricket Jersey'
    | 'Basketball Uniform'
    | 'Marathon Singlet'
    | 'Esports Pro Jersey'
    | 'Tracksuit / Warmup'
    | 'Training Shorts';
  seasonOrCollection: string;
  clientOrBrand: string;
  fabricSpec: string;
  gsm: number;
  collarType: string;
  fitType: 'Athletic Pro Fit' | 'Regular Club Fit' | 'Compression Fit' | 'Relaxed Training';
  stage: SampleStage;
  sampleVersion: string;
  heatPressTempC: number;
  heatPressTimeSec: number;
  shrinkageWarpPct: number;
  shrinkageWeftPct: number;
  washFastnessGrade: string;
  fabricYieldMetersPerPc: number;
  bomItems: BomCostItem[];
  unitProductionCost: number;
  targetWholesalePrice: number;
  targetRetailPrice: number;
  estimatedMarginPct: number;
  measurements: {
    chestCm: number;
    lengthCm: number;
    sleeveCm: number;
    toleranceCm: number;
  };
  designerName: string;
  patternMasterName: string;
  statusNotes: string;
  mockupUrl?: string;
  convertedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColorSwatchRecipe {
  id: string;
  swatchCode: string;
  colorName: string;
  pantoneCode: string;
  hexPreview: string;
  cmykRecipe: {
    c: number;
    m: number;
    y: number;
    k: number;
  };
  targetFabric: string;
  gsm: number;
  pressTempC: number;
  pressSeconds: number;
  deltaEScore: number;
  status: 'approved' | 'testing' | 're_calibration';
  labNotes: string;
  updatedAt: string;
}

