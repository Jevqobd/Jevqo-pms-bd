/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'owner'
  | 'marketing'
  | 'design_mockup'
  | 'design_pattern'
  | 'print_factory'
  | 'sewing_factory'
  | 'accountant'
  | 'hr_manager'
  | 'floor_worker';

export type FactoryLocation = 'head_office' | 'print_factory' | 'sewing_factory' | 'dispatched';

export type OrderStage =
  | 'draft'
  | 'payment_pending'
  | 'payment_verified'
  | 'mockup_in_progress'
  | 'mockup_approved'
  | 'pattern_spec_ready'
  | 'paper_printed'
  | 'heat_press_done'
  | 'fabric_dispatched'
  | 'fabric_received'
  | 'cutting_sewing'
  | 'quality_finishing'
  | 'shipped'
  | 'delivered';

export interface SizeBreakdown {
  [size: string]: number;
}

export interface PlayerRosterItem {
  id: string;
  name: string;
  number: string;
  size: string;
}

export interface FinancialCalculation {
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  paymentStatus: 'pending' | 'verified' | 'paid_in_full';
}

export interface MaterialRequirements {
  fabricMeters: number;
  transferPaperMeters: number;
  inkEstimatedMl: number;
  wasteMarginPercent: number;
  suggestedRollCount: number;
}

/**
 * Computes order financial figures
 */
export function calculateOrderTotals(
  quantity: number,
  unitPrice: number,
  advanceAmount: number = 0,
  isPaymentVerified: boolean = false
): FinancialCalculation {
  const safeQty = Math.max(0, quantity);
  const safePrice = Math.max(0, unitPrice);
  const totalAmount = Math.round(safeQty * safePrice);
  const safeAdvance = Math.min(totalAmount, Math.max(0, advanceAmount));
  const dueAmount = totalAmount - safeAdvance;

  let paymentStatus: 'pending' | 'verified' | 'paid_in_full' = 'pending';
  if (totalAmount > 0 && safeAdvance >= totalAmount) {
    paymentStatus = 'paid_in_full';
  } else if (isPaymentVerified && safeAdvance > 0) {
    paymentStatus = 'verified';
  }

  return {
    totalQuantity: safeQty,
    unitPrice: safePrice,
    totalAmount,
    advanceAmount: safeAdvance,
    dueAmount,
    paymentStatus,
  };
}

/**
 * Calculates raw material meterage & ink based on jersey size breakdown
 */
export function calculateFabricConsumption(
  sizes: SizeBreakdown,
  fabricType: string = 'Eyelet 160 GSM'
): MaterialRequirements {
  // Standard consumption in linear meters (assumes 1.5m fabric width)
  const consumptionPerSize: Record<string, number> = {
    XS: 0.85,
    S: 0.95,
    M: 1.05,
    L: 1.15,
    XL: 1.25,
    '2XL': 1.35,
    '3XL': 1.45,
  };

  let netMeters = 0;
  for (const [size, count] of Object.entries(sizes)) {
    const unitMeter = consumptionPerSize[size.toUpperCase()] ?? 1.1;
    netMeters += unitMeter * (count || 0);
  }

  // 6% safety waste margin for cutting alignment and heat press tension
  const wasteMarginPercent = 6;
  const grossFabricMeters = Math.ceil(netMeters * (1 + wasteMarginPercent / 100) * 10) / 10;
  // Sublimation paper requires ~3% additional margin for lead in/out feed
  const transferPaperMeters = Math.ceil(grossFabricMeters * 1.03 * 10) / 10;
  // Ink coverage approx 12ml per linear meter of full-bleed sublimated kit
  const inkEstimatedMl = Math.round(grossFabricMeters * 12);
  // Standard fabric roll is 50 meters
  const suggestedRollCount = Math.max(1, Math.ceil(grossFabricMeters / 50));

  return {
    fabricMeters: grossFabricMeters,
    transferPaperMeters,
    inkEstimatedMl,
    wasteMarginPercent,
    suggestedRollCount,
  };
}

/**
 * Stage order sequencing and role gatekeeper
 */
export const STAGE_ORDER: OrderStage[] = [
  'draft',
  'payment_pending',
  'payment_verified',
  'mockup_in_progress',
  'mockup_approved',
  'pattern_spec_ready',
  'paper_printed',
  'heat_press_done',
  'fabric_dispatched',
  'fabric_received',
  'cutting_sewing',
  'quality_finishing',
  'shipped',
  'delivered',
];

export function getStageLocation(stage: OrderStage): FactoryLocation {
  switch (stage) {
    case 'draft':
    case 'payment_pending':
    case 'payment_verified':
    case 'mockup_in_progress':
    case 'mockup_approved':
    case 'pattern_spec_ready':
      return 'head_office';
    case 'paper_printed':
    case 'heat_press_done':
      return 'print_factory';
    case 'fabric_dispatched':
      return 'dispatched';
    case 'fabric_received':
    case 'cutting_sewing':
    case 'quality_finishing':
    case 'shipped':
    case 'delivered':
      return 'sewing_factory';
    default:
      return 'head_office';
  }
}

/**
 * Validates if a user role can perform a specific stage transition
 */
export function canTransitionStage(
  currentStage: OrderStage,
  targetStage: OrderStage,
  role: UserRole
): boolean {
  if (role === 'owner') return true;

  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStage);

  // Normal progression should move sequentially forward, or jump back to rework
  if (role === 'marketing') {
    // Marketing can manage order entry, payment submit, and client mockup approvals
    if (targetStage === 'payment_pending' || targetStage === 'mockup_approved') return true;
    return false;
  }

  if (role === 'design_mockup') {
    // Design 1 works on mockups
    if (currentStage === 'payment_verified' && targetStage === 'mockup_in_progress') return true;
    if (currentStage === 'mockup_in_progress' && targetStage === 'mockup_approved') return true;
    return false;
  }

  if (role === 'design_pattern') {
    // Design 2 prepares print-ready layout & pattern specs
    if (currentStage === 'mockup_approved' && targetStage === 'pattern_spec_ready') return true;
    return false;
  }

  if (role === 'print_factory') {
    // Print factory handles printing, heat press, dispatch
    if (currentStage === 'pattern_spec_ready' && targetStage === 'paper_printed') return true;
    if (currentStage === 'paper_printed' && targetStage === 'heat_press_done') return true;
    if (currentStage === 'heat_press_done' && targetStage === 'fabric_dispatched') return true;
    return false;
  }

  if (role === 'sewing_factory') {
    // Sewing factory handles receipt, cutting, sewing, finishing, shipping
    if (currentStage === 'fabric_dispatched' && targetStage === 'fabric_received') return true;
    if (currentStage === 'fabric_received' && targetStage === 'cutting_sewing') return true;
    if (currentStage === 'cutting_sewing' && targetStage === 'quality_finishing') return true;
    if (currentStage === 'quality_finishing' && targetStage === 'shipped') return true;
    if (currentStage === 'shipped' && targetStage === 'delivered') return true;
    return false;
  }

  if (role === 'accountant') {
    // Accountant can verify payments or complete order delivery accounting
    if (targetStage === 'payment_verified' || targetStage === 'delivered') return true;
    return false;
  }

  if (role === 'floor_worker') {
    // Floor workers can advance print or sewing physical operations
    if (['pattern_spec_ready', 'paper_printed', 'heat_press_done'].includes(currentStage)) return true;
    if (['fabric_received', 'cutting_sewing', 'quality_finishing'].includes(currentStage)) return true;
    return false;
  }

  return false;
}

/**
 * Robust text parser for team roster and size breakdowns
 * Handles inputs like:
 * "10 - Messi - L"
 * "7, Cristiano, M"
 * "8 | Bruno Fernandes | XL"
 * "Neymar Jr #10 L"
 */
export function parseRosterInput(text: string): {
  roster: PlayerRosterItem[];
  sizeBreakdown: SizeBreakdown;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const roster: PlayerRosterItem[] = [];
  const sizeBreakdown: SizeBreakdown = {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    '2XL': 0,
  };

  const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

  lines.forEach((line, idx) => {
    // Common separators: commas, tabs, dashes, pipes, or spaces
    let parts = line.split(/[,|\-\t]+/).map((p) => p.trim());
    if (parts.length === 1) {
      // Space separation fallback
      parts = line.split(/\s+/).map((p) => p.trim());
    }

    let detectedNumber = '';
    let detectedName = '';
    let detectedSize = 'L'; // default standard

    // Extract size first
    for (const part of [...parts].reverse()) {
      const upper = part.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (validSizes.includes(upper)) {
        detectedSize = upper;
        parts = parts.filter((p) => p !== part);
        break;
      }
    }

    // Extract number
    for (const part of parts) {
      const cleanNum = part.replace(/[^0-9]/g, '');
      if (cleanNum.length > 0 && cleanNum.length <= 3) {
        detectedNumber = cleanNum;
        parts = parts.filter((p) => p !== part);
        break;
      }
    }

    // Rest is player name
    detectedName = parts.join(' ').replace(/^#/, '').trim();
    if (!detectedName) {
      detectedName = `Player ${idx + 1}`;
    }

    roster.push({
      id: `p-${idx + 1}-${Date.now().toString(36)}`,
      name: detectedName,
      number: detectedNumber || `${idx + 1}`,
      size: detectedSize,
    });

    sizeBreakdown[detectedSize] = (sizeBreakdown[detectedSize] || 0) + 1;
  });

  return { roster, sizeBreakdown };
}

/**
 * Computes default Print Factory consumption metrics for a jersey order:
 * - printedMeters: sublimation paper meters printed
 * - fabricUsedMeters: fabric roll meters used
 * - fabricUsedKg: fabric weight in KGs based on GSM & 1.6m roll width
 * - heatPressJerseyCount: number of jersey pieces heat-pressed
 * - ribbonUsedMeters & ribbonUsedKg: neck tape / lanyard ribbon consumption
 * - collarUsedPcs: collar rib pieces used
 */
export function calculatePrintConsumptionDefaults(
  totalQuantity: number,
  gsm: number = 160
): {
  printedMeters: number;
  fabricUsedMeters: number;
  fabricUsedKg: number;
  heatPressJerseyCount: number;
  ribbonUsedMeters: number;
  ribbonUsedKg: number;
  collarUsedPcs: number;
} {
  const qty = Math.max(0, Number(totalQuantity) || 0);
  const effectiveGsm = Math.max(100, Number(gsm) || 160);
  const fabricUsedMeters = Number((qty * 1.35).toFixed(2));
  const printedMeters = Number((fabricUsedMeters * 1.04).toFixed(2));
  // 1.6m roll width * gsm / 1000 = kg per linear meter
  const kgPerMeter = (1.6 * effectiveGsm) / 1000;
  const fabricUsedKg = Number((fabricUsedMeters * kgPerMeter).toFixed(2));
  const heatPressJerseyCount = qty;
  const ribbonUsedMeters = Number((qty * 0.45).toFixed(2));
  const ribbonUsedKg = Number((ribbonUsedMeters * 0.03).toFixed(2));
  const collarUsedPcs = qty;

  return {
    printedMeters,
    fabricUsedMeters,
    fabricUsedKg,
    heatPressJerseyCount,
    ribbonUsedMeters,
    ribbonUsedKg,
    collarUsedPcs,
  };
}

/**
 * Parses CSV, TSV, or pipe-separated text for bulk offline-to-online data migration.
 */
export function parseBulkDelimitedText(rawText: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes('|')
    ? '|'
    : ',';

  const splitLine = (line: string): string[] =>
    line
      .split(delimiter)
      .map((cell) => cell.trim().replace(/^["']|["']$/g, ''));

  const headers = splitLine(firstLine);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.every((v) => !v)) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(record);
  }

  return { headers, rows };
}

/**
 * Determines if the logged-in user account is permitted to switch active ERP roles.
 * Rule: ONLY Owner ('owner') or Manager ('hr_manager' / General Manager) can switch roles.
 * Other users are locked to their assigned role.
 */
export function canUserSwitchRole(
  accountRole: UserRole,
  isManagerOverride?: boolean
): boolean {
  if (typeof isManagerOverride === 'boolean') {
    return isManagerOverride;
  }
  return accountRole === 'owner' || accountRole === 'hr_manager';
}

/**
 * Determines if a user can initiate a private personal/invoice message to any employee.
 * Rule: Owner, Manager, and Department Heads can send personal messages related to invoices/orders.
 */
export function canUserSendPrivateMessage(role: UserRole): boolean {
  return role !== 'floor_worker';
}

export interface ChatVisibilityMessage {
  isPrivate?: boolean;
  senderId?: string;
  senderEmployeeId?: string;
  senderName?: string;
  recipientEmployeeIds?: string[];
  recipientEmployeeNames?: string[];
  taggedEmployees?: string[];
  mentionedEmployeeIds?: string[];
  mentionedEmployeeNames?: string[];
  relatedInvoiceAssignedEmployeeId?: string;
}

export interface ChatViewerIdentity {
  id?: string;
  employeeId?: string;
  name?: string;
  employeeName?: string;
  role: UserRole;
}

/**
 * Enforces privacy for personal / invoice-related messages in Live Chat.
 * If `isPrivate` is true, ONLY the sender, the direct recipient(s), the @mentioned person(s),
 * or the employee assigned to the related invoice can view the message.
 */
export function canUserViewChatMessage(
  msg: ChatVisibilityMessage,
  viewer: ChatViewerIdentity
): boolean {
  if (!msg.isPrivate) return true;
  const resolvedName = viewer?.name || viewer?.employeeName || '';
  const resolvedId = viewer?.id || viewer?.employeeId || '';
  if (!viewer || (!resolvedName && !resolvedId)) return false;

  const viewerNameLower = resolvedName.trim().toLowerCase();
  const viewerFirstLower = viewerNameLower.split(/\s+/)[0];
  const viewerSlugLower = viewerNameLower.replace(/\s+/g, '_');

  // 1. Sender can always see their own sent message
  const msgSenderId = msg.senderId || msg.senderEmployeeId;
  if (
    (msgSenderId && (msgSenderId === viewer.id || msgSenderId === viewer.employeeId)) ||
    (msg.senderName && viewerNameLower && msg.senderName.trim().toLowerCase() === viewerNameLower)
  ) {
    return true;
  }

  // 2. Direct recipient by ID
  if (
    msg.recipientEmployeeIds &&
    msg.recipientEmployeeIds.some(
      (rid) => rid === viewer.id || (viewer.employeeId && rid === viewer.employeeId)
    )
  ) {
    return true;
  }

  // 3. Direct recipient by Name
  if (
    msg.recipientEmployeeNames &&
    viewerNameLower &&
    msg.recipientEmployeeNames.some((rName) => {
      const clean = rName.trim().toLowerCase();
      return clean === viewerNameLower || clean === viewerFirstLower;
    })
  ) {
    return true;
  }

  // 4. Mentioned via @Mention tag or mentionedEmployeeIds/mentionedEmployeeNames
  if (
    msg.mentionedEmployeeIds &&
    msg.mentionedEmployeeIds.some(
      (mid) => mid === viewer.id || (viewer.employeeId && mid === viewer.employeeId)
    )
  ) {
    return true;
  }

  const allMentionNames = [
    ...(msg.taggedEmployees || []),
    ...(msg.mentionedEmployeeNames || []),
  ];
  if (
    allMentionNames.length > 0 &&
    allMentionNames.some((tag) => {
      const cleanTag = tag.replace(/^@/, '').trim().toLowerCase();
      return (
        (viewerNameLower &&
          (cleanTag === viewerNameLower ||
            cleanTag === viewerFirstLower ||
            cleanTag === viewerSlugLower)) ||
        (resolvedId && cleanTag === resolvedId.toLowerCase()) ||
        (viewer.employeeId && cleanTag === viewer.employeeId.toLowerCase())
      );
    })
  ) {
    return true;
  }

  // 5. Related employee assigned on the referenced invoice
  if (
    msg.relatedInvoiceAssignedEmployeeId &&
    (msg.relatedInvoiceAssignedEmployeeId === viewer.id ||
      msg.relatedInvoiceAssignedEmployeeId === viewer.employeeId)
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts @mentioned employees from message text.
 */
export function extractMentionedEmployees<T extends { id: string; name: string }>(
  text: string,
  employees: T[]
): T[] {
  if (!text || !employees?.length) return [];
  const lowerText = text.toLowerCase();
  return employees.filter((emp) => {
    const fullLower = emp.name.trim().toLowerCase();
    const firstLower = fullLower.split(/\s+/)[0];
    const slugLower = fullLower.replace(/\s+/g, '_');
    return (
      lowerText.includes(`@${fullLower}`) ||
      lowerText.includes(`@${slugLower}`) ||
      lowerText.includes(`@${firstLower}`)
    );
  });
}


