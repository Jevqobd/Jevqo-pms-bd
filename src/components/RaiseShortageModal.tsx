/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, ShortageTicket } from '../types/erp';
import { X, AlertTriangle, Flame } from 'lucide-react';

interface RaiseShortageModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  preSelectedOrder?: Order | null;
  onRaiseTicket: (ticket: ShortageTicket) => Promise<void>;
}

export const RaiseShortageModal: React.FC<RaiseShortageModalProps> = ({
  isOpen,
  onClose,
  orders,
  preSelectedOrder,
  onRaiseTicket,
}) => {
  if (!isOpen) return null;

  const [selectedOrderId, setSelectedOrderId] = useState(
    preSelectedOrder ? preSelectedOrder.id : orders[0]?.id || ''
  );
  const [partDamaged, setPartDamaged] = useState('Front Panel');
  const [size, setSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [playerDetails, setPlayerDetails] = useState('');
  const [reason, setReason] = useState('Fabric scorched during calendar heat press transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || preSelectedOrder;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    setIsSubmitting(true);
    try {
      const newTicket: ShortageTicket = {
        id: `sht-${Date.now().toString(36)}`,
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        teamOrClub: activeOrder.teamOrClub || 'Team Jersey',
        partDamaged,
        size,
        playerDetails: playerDetails || 'No Player Name',
        quantity: Number(quantity) || 1,
        reason,
        status: 'open',
        createdAt: new Date().toISOString(),
        createdBy: 'Sewing Line Floor Manager',
      };

      await onRaiseTicket(newTicket);
      onClose();
    } catch (err) {
      console.error('Error raising shortage ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-red-200 dark:border-red-900 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 text-white">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Raise Urgent Shortage / Re-print Ticket
              </h2>
              <p className="text-[11px] text-red-100">
                Notifies Design Team 2 and Print Factory for priority mini reprint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-red-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Order Selection */}
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Select Job Card / Order ID *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold focus:ring-2 focus:ring-red-500"
            >
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.orderNumber} - {ord.teamOrClub} ({ord.clientName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Part Damaged */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Ruined / Damaged Component *
              </label>
              <select
                value={partDamaged}
                onChange={(e) => setPartDamaged(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold"
              >
                <option value="Front Panel">Front Panel (Chest Logo & Sponsor)</option>
                <option value="Back Panel">Back Panel (Player Name & Number)</option>
                <option value="Left Sleeve">Left Sleeve</option>
                <option value="Right Sleeve">Right Sleeve</option>
                <option value="Collar Rib">Collar / Ribbing</option>
                <option value="Shorts Front">Shorts Front</option>
                <option value="Complete Kit">Complete Jersey (Full Set)</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Jersey Size *
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold"
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="2XL">2XL</option>
                <option value="3XL">3XL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Defective Pieces (Qty) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold"
                required
              />
            </div>

            {/* Player Details */}
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Player Details (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. #10 Messi"
                value={playerDetails}
                onChange={(e) => setPlayerDetails(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Defect Reason / Root Cause *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-medium mb-2"
            >
              <option value="Fabric scorched during calendar heat press transfer">
                Fabric scorched / burned during heat press
              </option>
              <option value="Cutting blade misalignment / dimension trimmed wrong">
                Cutting blade misalignment / dimension trimmed short
              </option>
              <option value="Sublimation ink bleeding / ghosting onto fabric">
                Sublimation ink bleeding / ghosting / color shift
              </option>
              <option value="Overlock needle stitch cut fabric fiber">
                Overlock needle stitch cut fabric fiber / seam tear
              </option>
              <option value="Missing piece from printed roll">
                Missing piece from printed roll
              </option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Broadcast Priority Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
