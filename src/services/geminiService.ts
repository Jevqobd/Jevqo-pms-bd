/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AiProductionAnalysisResult {
  parsedRoster?: { name: string; number: string; size: string }[];
  sizeBreakdown?: Record<string, number>;
  fabricMetersNeeded?: number;
  transferPaperMeters?: number;
  inkEstimatedMl?: number;
  suggestedRolls?: number;
  estimatedProductionDays?: number;
  riskAssessment?: string;
  clientUpdateMessage?: string;
  rawTextResponse?: string;
}

export async function askGeminiProductionCopilot(
  prompt: string,
  context?: {
    orderNumber?: string;
    teamName?: string;
    totalQty?: number;
    fabricType?: string;
    stage?: string;
  }
): Promise<AiProductionAnalysisResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend Gemini API endpoint not reachable, applying client heuristic parser', err);
  }

  // Fallback high-speed deterministic heuristic for instant low-latency responses
  return fallbackFastAnalysis(prompt, context);
}

function fallbackFastAnalysis(
  prompt: string,
  context?: {
    orderNumber?: string;
    teamName?: string;
    totalQty?: number;
    fabricType?: string;
    stage?: string;
  }
): AiProductionAnalysisResult {
  const lines = prompt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedRoster: { name: string; number: string; size: string }[] = [];
  const sizeBreakdown: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, '2XL': 0 };

  const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

  lines.forEach((line, idx) => {
    let parts = line.split(/[,|\-\t]+/).map((p) => p.trim());
    if (parts.length === 1) parts = line.split(/\s+/).map((p) => p.trim());

    let size = 'L';
    for (const part of [...parts].reverse()) {
      const upper = part.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (validSizes.includes(upper)) {
        size = upper;
        parts = parts.filter((p) => p !== part);
        break;
      }
    }

    let num = '';
    for (const part of parts) {
      const clean = part.replace(/[^0-9]/g, '');
      if (clean.length > 0 && clean.length <= 3) {
        num = clean;
        parts = parts.filter((p) => p !== part);
        break;
      }
    }

    const name = parts.join(' ').replace(/^#/, '').trim() || `Player ${idx + 1}`;
    parsedRoster.push({ name, number: num || `${idx + 1}`, size });
    sizeBreakdown[size] = (sizeBreakdown[size] || 0) + 1;
  });

  const totalQty = parsedRoster.length > 0 ? parsedRoster.length : (context?.totalQty || 20);
  const fabricMeters = Math.ceil(totalQty * 1.15 * 1.06 * 10) / 10;
  const paperMeters = Math.ceil(fabricMeters * 1.03 * 10) / 10;
  const inkMl = Math.round(fabricMeters * 12);
  const rolls = Math.max(1, Math.ceil(fabricMeters / 50));
  const estimatedDays = Math.ceil(totalQty / 40) + 2;

  const team = context?.teamName || 'Your Club';
  const orderNum = context?.orderNumber || 'SW-ORDER';

  const clientMsg = `Hello! Update on your order *${orderNum}* (${team}): The job is currently progressing on schedule. Our production timeline estimates delivery within ${estimatedDays} business days. We will share the courier tracking reference as soon as final quality inspection completes!`;

  return {
    parsedRoster,
    sizeBreakdown,
    fabricMetersNeeded: fabricMeters,
    transferPaperMeters: paperMeters,
    inkEstimatedMl: inkMl,
    suggestedRolls: rolls,
    estimatedProductionDays: estimatedDays,
    riskAssessment:
      totalQty > 80
        ? 'High volume order: Allocate dedicated rotary calendar heat press to avoid sewing line bottlenecks.'
        : 'Standard capacity order: Normal sublimation and cutting sequence recommended.',
    clientUpdateMessage: clientMsg,
    rawTextResponse: `Analyzed ${totalQty} units for ${team}. Required ~${fabricMeters}m fabric and ${paperMeters}m sublimation paper. Estimated completion: ${estimatedDays} days.`,
  };
}
