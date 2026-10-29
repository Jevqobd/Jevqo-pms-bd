/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Order } from '../types/erp';
import { generateQrDataUrl, formatBundleQrData } from '../utils/qrGenerator';
import {
  Printer,
  X,
  QrCode,
  Tag,
  Download,
  Copy,
  Check,
  Scissors,
  Layers,
  MapPin,
  Calendar,
  Building,
} from 'lucide-react';

interface BundleQrCodeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BundleQrCodeModal: React.FC<BundleQrCodeModalProps> = ({ order, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [bundleType, setBundleType] = useState<string>('complete');
  const [bundleNumber, setBundleNumber] = useState<number>(1);
  const [totalBundles, setTotalBundles] = useState<number>(3);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order) return;

    const bundleCode = `BNDL-${order.orderNumber}-${bundleNumber}/${totalBundles}-${bundleType.toUpperCase()}`;
    const rawQrString = formatBundleQrData({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientName: order.clientName,
      teamOrClub: order.teamOrClub,
      fabricType: order.fabricType,
      totalQuantity: order.totalQuantity,
      stage: order.stage,
      bundleCode,
      timestamp: new Date().toISOString(),
    });

    generateQrDataUrl(rawQrString).then((url) => {
      setQrDataUrl(url);
    });
  }, [order, bundleType, bundleNumber, totalBundles]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPayload = () => {
    if (!order) return;
    const bundleCode = `BNDL-${order.orderNumber}-${bundleNumber}/${totalBundles}`;
    navigator.clipboard.writeText(bundleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${order.orderNumber}-Bundle-${bundleNumber}.png`;
    link.click();
  };

  const bundleTypeLabels: Record<string, string> = {
    complete: 'All Pattern Pieces (Complete Jersey Kit)',
    front_back: 'Front & Back Sublimated Panels',
    sleeves_collar: 'Sleeves, Collars & Rib Cuffs',
    shorts: 'Matching Shorts & Drawstrings',
    reprint_shortage: 'Urgent Shortage Re-Print Pieces',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Outer container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Fabric Bundle QR Label & Tag
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {order.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Print and tie to cut fabric roll or sewing bundle for factory scanner tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls / Options */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="text-slate-400 font-medium">Bundle Section:</label>
            <select
              value={bundleType}
              onChange={(e) => setBundleType(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="complete">Complete Kit (All Pieces)</option>
              <option value="front_back">Front & Back Body Panels</option>
              <option value="sleeves_collar">Sleeves & Rib Collar</option>
              <option value="shorts">Shorts & Panels</option>
              <option value="reprint_shortage">Shortage Re-print Bundle</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Bundle:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={bundleNumber}
              onChange={(e) => setBundleNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg py-1 focus:outline-none"
            />
            <span className="text-slate-500">of</span>
            <input
              type="number"
              min={1}
              max={20}
              value={totalBundles}
              onChange={(e) => setTotalBundles(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg py-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Printable Physical Tag Preview */}
        <div className="p-6 bg-slate-950/60 flex flex-col items-center">
          <div
            id="printable-bundle-tag"
            className="w-full max-w-lg bg-white text-slate-950 p-6 rounded-xl shadow-lg border-2 border-dashed border-slate-400 font-sans print:shadow-none print:border print:m-0 print:p-4"
          >
            {/* Top Bar on Tag */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  RIDWEAR SPORTSWEAR • JOB CARD TAG
                </div>
                <div className="text-xl font-extrabold text-slate-950 tracking-tight">
                  {order.orderNumber}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {order.teamOrClub || order.clientName}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                  BUNDLE {bundleNumber} OF {totalBundles}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  TAG #{order.orderNumber.replace('SW-', '')}-B{bundleNumber}
                </div>
              </div>
            </div>

            {/* QR Code and Primary Routing */}
            <div className="grid grid-cols-12 gap-4 items-center border-b-2 border-slate-200 pb-4 mb-3">
              {/* Left QR Code */}
              <div className="col-span-5 flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg border border-slate-300">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${order.orderNumber}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
                <span className="text-[9px] font-mono text-slate-500 uppercase mt-1 tracking-wider">
                  Scan to Open Job Card
                </span>
              </div>

              {/* Right Routing & Specs */}
              <div className="col-span-7 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Bundle Contents</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {bundleTypeLabels[bundleType] || bundleType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Fabric Type</span>
                    <span className="font-semibold text-slate-800">{order.fabricType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">GSM Weight</span>
                    <span className="font-semibold text-slate-800">{order.gsm || 160} GSM</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Lot Qty</span>
                  <span className="text-sm font-black text-slate-900">{order.totalQuantity} Pieces</span>
                </div>

                <div className="bg-slate-100 p-1.5 rounded border border-slate-200 text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span>Route: Tongi Sublimation ➔ Mirpur Sewing Line</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Printed: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Size Breakdown Grid */}
            <div className="mb-3">
              <span className="text-[10px] font-black uppercase text-slate-600 block mb-1">
                Size Breakdown (Bundle Verification)
              </span>
              <div className="grid grid-cols-7 gap-1 text-center font-mono">
                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((sz) => {
                  const qty = order.sizeBreakdown?.[sz] || order.sizeBreakdown?.[sz.toLowerCase()] || 0;
                  return (
                    <div
                      key={sz}
                      className={`p-1 rounded border ${
                        qty > 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase">{sz}</div>
                      <div className="text-xs font-black">{qty}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operator QC Checklist Stamp Box */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-300 pt-2 text-[10px] text-slate-600">
              <div className="border border-slate-300 rounded p-1 text-center">
                <span className="block font-bold text-slate-500 text-[8px] uppercase">Print Inspector</span>
                <span className="block mt-2 border-b border-dashed border-slate-300 text-[8px]">Kabir / Tongi</span>
              </div>
              <div className="border border-slate-300 rounded p-1 text-center">
                <span className="block font-bold text-slate-500 text-[8px] uppercase">Heat Press QC</span>
                <span className="block mt-2 border-b border-dashed border-slate-300 text-[8px]">Passed ✓</span>
              </div>
              <div className="border border-slate-300 rounded p-1 text-center">
                <span className="block font-bold text-slate-500 text-[8px] uppercase">Sewing Line Incharge</span>
                <span className="block mt-2 border-b border-dashed border-slate-300 text-[8px]">Rony / Mirpur</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPayload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Bundle ID' : 'Copy ID'}
            </button>
            <button
              onClick={downloadQrImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Bundle Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
