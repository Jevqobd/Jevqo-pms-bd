/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Jersey3DConfig {
  primaryColor: string;
  accentColor: string;
  collarColor: string;
  trimColor: string;
  pattern: 'solid' | 'stripes' | 'geometric' | 'gradient' | 'sash';
  fabricType: string;
  playerName: string;
  playerNumber: string;
  teamCrestText: string;
  sponsorText: string;
}

export const DEFAULT_JERSEY_CONFIG: Jersey3DConfig = {
  primaryColor: '#1e3a8a', // Deep Royal Blue
  accentColor: '#f59e0b',  // Gold Accent
  collarColor: '#ffffff',  // Crisp White Rib
  trimColor: '#f59e0b',
  pattern: 'sash',
  fabricType: 'Micro-Eyelet 160 GSM',
  playerName: 'L. MESSI',
  playerNumber: '10',
  teamCrestText: 'TITANS FC',
  sponsorText: 'EMIRATES FLY',
};

/**
 * Creates procedural fabric textures on HTML5 Canvas without any external asset dependencies
 */
export function createProceduralJerseyTexture(config: Jersey3DConfig, isFront: boolean = true): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Base Fill
  ctx.fillStyle = config.primaryColor;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Pattern Layer
  if (config.pattern === 'stripes') {
    ctx.fillStyle = config.accentColor;
    const stripeWidth = 64;
    for (let x = 0; x < 1024; x += stripeWidth * 2) {
      ctx.fillRect(x, 0, stripeWidth, 1024);
    }
  } else if (config.pattern === 'sash') {
    ctx.save();
    ctx.fillStyle = config.accentColor;
    ctx.beginPath();
    ctx.moveTo(120, 0);
    ctx.lineTo(320, 0);
    ctx.lineTo(920, 1024);
    ctx.lineTo(720, 1024);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (config.pattern === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, config.primaryColor);
    grad.addColorStop(1, config.accentColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
  } else if (config.pattern === 'geometric') {
    ctx.fillStyle = config.accentColor;
    ctx.globalAlpha = 0.25;
    for (let y = 0; y < 1024; y += 64) {
      for (let x = 0; x < 1024; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x + 32, y);
        ctx.lineTo(x + 64, y + 64);
        ctx.lineTo(x, y + 64);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // 3. Subtle Polyester Eyelet Mesh Micro-Texture (Procedural Bump/Perforation)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let y = 0; y < 1024; y += 8) {
    for (let x = (y % 16 === 0 ? 0 : 4); x < 1024; x += 8) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // 4. Graphics: Front vs Back
  if (isFront) {
    // Club Crest Shield (Left Chest)
    ctx.save();
    ctx.translate(340, 320);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-45, -45);
    ctx.lineTo(45, -45);
    ctx.lineTo(45, 15);
    ctx.quadraticCurveTo(45, 60, 0, 80);
    ctx.quadraticCurveTo(-45, 60, -45, 15);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = config.accentColor;
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.teamCrestText || 'FC', 0, 20);
    ctx.restore();

    // Brand Logo (Right Chest)
    ctx.save();
    ctx.translate(680, 320);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = config.accentColor;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 0);
    ctx.restore();

    // Center Sponsor
    if (config.sponsorText) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillText(config.sponsorText, 512, 540);
      ctx.restore();
    }
  } else {
    // Back: Player Name & Giant Number
    ctx.save();
    // Name Arc / Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 62px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(config.playerName || 'PLAYER', 512, 340);

    // Number
    ctx.font = '900 240px sans-serif';
    ctx.fillStyle = config.accentColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeText(config.playerNumber || '10', 512, 580);
    ctx.fillText(config.playerNumber || '10', 512, 580);
    ctx.restore();
  }

  return canvas;
}

/**
 * Creates normal/bump canvas texture for athletic eyelet fabric weave
 */
export function createEyeletBumpMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#8080ff'; // Neutral normal base (RGB 128, 128, 255)
  ctx.fillRect(0, 0, 256, 256);

  // Micro-perforations
  for (let y = 0; y < 256; y += 12) {
    for (let x = (y % 24 === 0 ? 0 : 6); x < 256; x += 12) {
      ctx.fillStyle = '#5050c0';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}
