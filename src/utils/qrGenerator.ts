/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

export interface BundleQrPayload {
  orderId: string;
  orderNumber: string;
  clientName: string;
  teamOrClub?: string;
  fabricType: string;
  totalQuantity: number;
  stage: string;
  bundleCode: string;
  timestamp: string;
}

/**
 * Encodes order/bundle information into a standardized payload string
 */
export function formatBundleQrData(payload: BundleQrPayload): string {
  // Use compact JSON or standard formatted string that scanners can read
  return JSON.stringify({
    ord: payload.orderNumber,
    id: payload.orderId,
    bndl: payload.bundleCode,
    fab: payload.fabricType,
    qty: payload.totalQuantity,
    team: payload.teamOrClub || payload.clientName,
  });
}

/**
 * Generates high-resolution Data URL (PNG) for printing or rendering in an <img> tag
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    return '';
  }
}

/**
 * Generates vector SVG markup for crisp printing on any thermal label roll size
 */
export async function generateQrSvgString(text: string): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
    return '';
  }
}
