/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole, ROLE_CONFIGS } from '../types/erp';
import { X, Check, ShieldCheck, MapPin, Building, Printer, Scissors } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  const getLocationIcon = (loc: string) => {
    switch (loc) {
      case 'head_office':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'print_factory':
        return <Printer className="w-4 h-4 text-emerald-600" />;
      case 'sewing_factory':
        return <Scissors className="w-4 h-4 text-indigo-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:bg-gray-900 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Switch Department Role
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                View the ERP as any department across Head Office, Print Factory, or Sewing Factory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((roleKey) => {
            const role = ROLE_CONFIGS[roleKey];
            const isSelected = currentRole === roleKey;

            return (
              <div
                key={roleKey}
                onClick={() => {
                  onSelectRole(roleKey);
                  onClose();
                }}
                className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 dark:border-indigo-500 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-850'
                }`}
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {role.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${role.badgeColor}`}>
                      {role.department}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {role.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                    {getLocationIcon(role.location)}
                    <span className="font-medium">{role.locationLabel}</span>
                  </div>
                </div>

                <div className="pt-1">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
