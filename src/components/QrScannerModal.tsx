/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Order } from '../types/erp';
import { playDelegationChime, playSuccessChime } from '../utils/soundEffects';
import {
  Camera,
  X,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flashlight,
  Layers,
  ArrowRight,
  Factory,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrder,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchingOrder, setMatchingOrder] = useState<Order | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this browser or requires HTTPS.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or permission denied. Use manual input or quick selector below.');
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setManualInput('');
      setScannedResult(null);
      setMatchingOrder(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleProcessCode = (rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    let targetOrderNumber = cleanCode;

    // Check if JSON payload from bundle QR tag
    try {
      if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
        const parsed = JSON.parse(cleanCode);
        if (parsed.ord) targetOrderNumber = parsed.ord;
        else if (parsed.orderNumber) targetOrderNumber = parsed.orderNumber;
      }
    } catch {
      // not JSON, continue string match
    }

    // Check if contains bundle prefix like BNDL-SW-2025-081-1/3
    if (targetOrderNumber.includes('SW-')) {
      const match = targetOrderNumber.match(/SW-\d{4}-\d+/i);
      if (match) {
        targetOrderNumber = match[0].toUpperCase();
      }
    }

    // Search orders
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === targetOrderNumber.toLowerCase() ||
        o.id === targetOrderNumber ||
        o.orderNumber.replace(/[^0-9]/g, '') === targetOrderNumber.replace(/[^0-9]/g, '')
    );

    setScannedResult(targetOrderNumber);

    if (found) {
      setMatchingOrder(found);
      playSuccessChime();
    } else {
      setMatchingOrder(null);
      playDelegationChime();
    }
  };

  const handleConfirmOpen = () => {
    if (matchingOrder) {
      onSelectOrder(matchingOrder);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fabric Bundle & Job Card Scanner</h3>
              <p className="text-xs text-slate-400">Scan bundle sticker or enter order number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Camera Viewport */}
          <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Targeting HUD overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-44 h-44 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {/* Animated scanning laser line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse duration-700" />
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-4 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 max-w-xs">
                  {cameraError || 'Camera feed paused.'}
                </p>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </button>
              </div>
            )}

            {/* Camera Floating Toggle buttons */}
            {cameraActive && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-lg border border-slate-700/80 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Optical Sensor</span>
              </div>
            )}
          </div>

          {/* Manual Input Form */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Manual Barcode / Order # Lookup
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SW-2025-081 or paste BNDL-..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcessCode(manualInput);
                }}
                className="flex-1 bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleProcessCode(manualInput)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Scan / Find
              </button>
            </div>
          </div>

          {/* Result Alert Box */}
          {scannedResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                matchingOrder
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {matchingOrder ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {matchingOrder
                      ? `Job Card Found: ${matchingOrder.orderNumber}`
                      : `No matching order for "${scannedResult}"`}
                  </div>
                  {matchingOrder && (
                    <div className="text-[11px] text-slate-300 mt-1 space-y-0.5">
                      <div><strong className="text-white">Client:</strong> {matchingOrder.clientName} ({matchingOrder.teamOrClub || 'N/A'})</div>
                      <div><strong className="text-white">Fabric:</strong> {matchingOrder.fabricType} • {matchingOrder.totalQuantity} pcs</div>
                      <div><strong className="text-white">Stage:</strong> <span className="capitalize">{matchingOrder.stage.replace(/_/g, ' ')}</span></div>
                    </div>
                  )}
                </div>
              </div>

              {matchingOrder && (
                <button
                  onClick={handleConfirmOpen}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Open Job Card <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Fast One-Click Test Selector for Shop Floor Demo */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Active Factory Job Cards (Quick Scan Tap)
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {orders.slice(0, 6).map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => {
                    setManualInput(ord.orderNumber);
                    handleProcessCode(ord.orderNumber);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200">{ord.orderNumber}</div>
                    <div className="text-[10px] text-slate-400 truncate">{ord.clientName}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono">
                    {ord.totalQuantity}pcs
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Supported: QR Code, PDF417, Code128</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
