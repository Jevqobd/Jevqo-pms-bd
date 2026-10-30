/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'bn';

export interface StageTranslation {
  title: string;
  desc: string;
  actionPrompt: string;
  nextStepName: string;
}

const ENGLISH_STRINGS = {
  // Brand & Header
  brandTitle: 'SPORTSWEAR OS',
  brandSub: 'ENTERPRISE ERP & FACTORY CONTROL',
  searchPlaceholder: 'Search Job ID, team, SKU, client, invoice...',
  soundOn: 'Audio FX Active',
  soundOff: 'Audio FX Muted',
  scanQrBtn: 'Scan QR Tag',
  chatBtn: 'Internal Comms',
  newOrderBtn: 'New Job Card',
  roleSwitcher: 'Switch Role',
  activeRole: 'Active Role',
  locationAll: 'All Facilities',
  locationHq: 'Banani HQ (Sales/Design)',
  locationPrint: 'Tongi Print Mill',
  locationSewing: 'Mirpur Sewing Factory',

  // Left Sidebar Navigation (Strictly English)
  navDashboardTasks: 'Dashboard & Tasks',
  navOrders: 'Job Cards & Pipeline',
  navHeadOffice: 'HQ Sales & CRM',
  navCustomersCrm: 'Customer List & Playbook',
  navPrintFloor: 'Tongi Print Factory',
  navSewingFloor: 'Mirpur Sewing Line',
  navShortages: 'Shortage Re-Prints',
  navProductDev: 'Product Dev & Samples',
  navBulkImport: 'Bulk Data Import',
  navVendors: 'Vendors & Suppliers',
  navMockupStudio: 'External Design API',
  navAccounting: 'Accounting & Ledgers (BDT)',
  navInventory: 'Inventory & Assets',
  navDocuments: 'Company Documents',
  navUsersEmployees: 'User & Employee List',
  navHrPayroll: 'HR, Attendance & Wages',
  navManagersPortal: 'Executive Approvals',
  navEmployeePortal: 'My Workstation',
  navGuidelines: 'Guidelines & Data Sync',

  // Categories in Sidebar
  catCore: 'Factory Pipeline',
  catDesign: 'Product Dev & Migration',
  catFinance: 'Finance (BDT) & Supply',
  catWorkforce: 'Workforce & Portals',

  // Common Actions
  advanceStage: 'Advance Stage',
  completed: 'Completed',
  inProgress: 'In Progress',
  pending: 'Pending',
  raiseShortage: 'Raise Shortage Ticket',
  printQrTag: 'Print QR Tag',
  viewDetails: 'View Details',
  exportPdf: 'Export PDF',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  confirm: 'Confirm',
  urgent: 'Urgent',

  // Attendance Manager Entry
  attendanceTitle: 'Department Attendance Terminal',
  attendanceSubtitle: 'Department Managers: Punch daily attendance, overtime & shift logs for floor workers',
  selectDept: 'Select Department / Facility',
  markAllPresent: '1-Click: Mark All Present',
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  overtime: 'Overtime',
  shift: 'Shift',
  checkIn: 'Check-In',
  checkOut: 'Check-Out',
  status: 'Status',
  actions: 'Actions',
  todaySummary: 'Today Shift Roster',

  // Dashboard & Tasks Specific
  welcomeBack: 'Enterprise Operations Command',
  taskQueueTitle: 'My Role Task Queue',
  taskQueueSubtitle: 'Immediate actionable orders requiring your department verification or handoff',
  noPendingTasks: 'All tasks up to date! No pending actions in your queue.',
  quickAdvance: '1-Click Advance',
  activeOrdersCount: 'Active Orders',
  urgentShortagesCount: 'Urgent Re-Prints',
  factoryFloorThroughput: 'Factory Floor Throughput',
  totalRevenue: 'Total Pipeline Value (BDT)',
  pendingPayments: 'Pending Payments (BDT)',
  todayClockIns: 'Floor Staff Clocked In',

  // Shortage
  shortageAlertBanner: 'Critical Shortage Re-Print Tickets Pending Floor Action',
  reprintPieces: 'Ruined / Replacement Pieces',
};

export const TRANSLATIONS = {
  en: ENGLISH_STRINGS,
  bn: ENGLISH_STRINGS,
};

const STAGE_ENGLISH: Record<string, StageTranslation> = {
  payment_pending: {
    title: 'Payment Pending',
    desc: 'Order created by Marketing; waiting for 50% advance deposit (BDT)',
    actionPrompt: 'Verify 50% advance payment from customer',
    nextStepName: 'Payment Verified',
  },
  payment_verified: {
    title: 'Payment Verified',
    desc: 'Accounts approved advance; queued for Design Team 1 mockup',
    actionPrompt: 'Assign to Design Team 1 for concept artwork',
    nextStepName: 'Mockup In Progress',
  },
  mockup_in_progress: {
    title: 'Mockup In Progress',
    desc: 'Design Team 1 creating jersey graphics & client mockup',
    actionPrompt: 'Submit mockup for client approval',
    nextStepName: 'Mockup Approved',
  },
  mockup_approved: {
    title: 'Mockup Approved',
    desc: 'Client approved visual art; queued for Design Team 2 grading',
    actionPrompt: 'Generate pattern files, nested layout & spec sheets',
    nextStepName: 'Pattern Spec Ready',
  },
  pattern_spec_ready: {
    title: 'Pattern & Print Ready',
    desc: 'Print-ready files and Drive link uploaded; sent to Tongi Factory',
    actionPrompt: 'Queue sublimation printer & load paper roll',
    nextStepName: 'Paper Printed',
  },
  paper_printed: {
    title: 'Paper Sublimation Printed',
    desc: 'Design printed on sublimation transfer paper at Tongi factory',
    actionPrompt: 'Heat press transfer onto poly-spandex fabric rolls',
    nextStepName: 'Heat Press Done',
  },
  heat_press_done: {
    title: 'Heat Press Done',
    desc: 'Colors transferred into fabric fibers; ready for dispatch to sewing',
    actionPrompt: 'Pack printed fabric bundles & dispatch to Mirpur Sewing',
    nextStepName: 'Dispatched to Sewing',
  },
  fabric_dispatched: {
    title: 'Dispatched to Sewing',
    desc: 'In transit from Tongi Factory to Mirpur Sewing Factory',
    actionPrompt: 'Acknowledge receiving bundle with Challan QR check',
    nextStepName: 'Fabric Received',
  },
  fabric_received: {
    title: 'Fabric Received at Mirpur',
    desc: 'Floor manager verified bundle quantity; loaded onto cutting tables',
    actionPrompt: 'Begin precision laser/hand cutting & sewing line feed',
    nextStepName: 'Cutting & Sewing',
  },
  cutting_sewing: {
    title: 'Cutting & Sewing Active',
    desc: 'Operators assembling front, back, collar, and side mesh panels',
    actionPrompt: 'Final stitching complete; move to QA inspection & poly bagging',
    nextStepName: 'Quality Check & Packing',
  },
  quality_finishing: {
    title: 'Quality Check & Packing',
    desc: 'Measurement audit, thread trim, individual poly bagging complete',
    actionPrompt: 'Dispatch finished cartons with courier tracking number',
    nextStepName: 'Shipped',
  },
  quality_packing: {
    title: 'Quality Check & Packing',
    desc: 'Measurement audit, thread trim, individual poly bagging complete',
    actionPrompt: 'Dispatch finished cartons with courier tracking number',
    nextStepName: 'Shipped',
  },
  shipped: {
    title: 'Shipped to Customer',
    desc: 'Consignment handed over to courier (Steadfast/Sundarban/RedX)',
    actionPrompt: 'Verify customer delivery receipt & full payment clearance',
    nextStepName: 'Delivered',
  },
  delivered: {
    title: 'Delivered & Closed',
    desc: 'Customer received goods, final settlement complete in Ledger',
    actionPrompt: 'Order lifecycle successfully completed',
    nextStepName: 'Completed',
  },
};

export const STAGE_DETAILS: Record<string, { en: StageTranslation; bn: StageTranslation }> = Object.fromEntries(
  Object.entries(STAGE_ENGLISH).map(([k, v]) => [k, { en: v, bn: v }])
);

export const ROLE_TRANSLATIONS: Record<string, { en: string; bn: string }> = {
  owner: { en: 'Super Admin / Managing Director', bn: 'Super Admin / Managing Director' },
  marketing: { en: 'Head Office Sales & CRM', bn: 'Head Office Sales & CRM' },
  design_mockup: { en: 'Design Team 1 (Mockup & Concept)', bn: 'Design Team 1 (Mockup & Concept)' },
  design_pattern: { en: 'Design Team 2 (Print & Grading)', bn: 'Design Team 2 (Print & Grading)' },
  print_factory: { en: 'Tongi Print Factory Manager', bn: 'Tongi Print Factory Manager' },
  sewing_factory: { en: 'Mirpur Sewing Factory Manager', bn: 'Mirpur Sewing Factory Manager' },
  accountant: { en: 'Chief Financial Officer', bn: 'Chief Financial Officer' },
  hr_manager: { en: 'HR & Factory Operations Manager', bn: 'HR & Factory Operations Manager' },
  floor_worker: { en: 'Production Floor Technician', bn: 'Production Floor Technician' },
};

export function getTranslation(key: keyof typeof ENGLISH_STRINGS, _lang?: Language): string {
  return ENGLISH_STRINGS[key] || key;
}

export function getStageTranslation(stage: string, _lang?: Language): StageTranslation {
  const fallback: StageTranslation = {
    title: stage.replace(/_/g, ' '),
    desc: 'Stage workflow',
    actionPrompt: 'Advance to next stage',
    nextStepName: 'Next Stage',
  };
  return STAGE_ENGLISH[stage] || fallback;
}

export function getRoleName(role: string, _lang?: Language): string {
  return ROLE_TRANSLATIONS[role]?.en || role.replace(/_/g, ' ');
}

export function formatBdt(amount: number | undefined | null): string {
  const num = Number(amount || 0);
  return `৳${num.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}
