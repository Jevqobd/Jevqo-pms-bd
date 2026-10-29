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
