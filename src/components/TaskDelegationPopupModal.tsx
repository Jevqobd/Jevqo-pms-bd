/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DelegatedTask,
  SystemNotification,
  ActionStatusTag,
  ROLE_CONFIGS,
} from '../types/erp';
import {
  Bell,
  Volume2,
  CheckCircle2,
  X,
  Clock,
  FileText,
  Layers,
  CheckCheck,
  Trash2,
} from 'lucide-react';

interface TaskDelegationPopupModalProps {
  task: DelegatedTask | null;
  onAcknowledge?: (task: DelegatedTask) => void;
  onAcceptTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onOpenOrder?: (orderNumber: string) => void;
  onClose: () => void;
}

export const TaskDelegationPopupModal: React.FC<TaskDelegationPopupModalProps> = ({
  task,
  onAcknowledge,
  onAcceptTask,
  onCompleteTask,
  onOpenOrder,
  onClose,
}) => {
  if (!task) return null;

  const isUrgent = task.priority === 'urgent';
  const isHigh = task.priority === 'high';

  const assigneeName = task.assignedToEmployeeName || task.delegatedToName || 'Assigned Staff';
  const assigneePosition = task.assignedToPosition || task.delegatedToPosition || 'Operator';
  const assigneeDept =
    task.delegatedToDepartment ||
    (task.assignedToRole ? ROLE_CONFIGS[task.assignedToRole]?.shortLabel : 'Factory Line');
  const assignerName = task.delegatedByEmployeeName || task.delegatedByName || 'Manager';
  const assignerPosition = task.delegatedByPosition || 'Lead';
  const orderRef = task.orderNumber || task.relatedOrderNumber;
  const invoiceRef = task.invoiceNumber || task.relatedInvoiceNumber;
  const dueTimeText = task.dueTime || 'Within 2 Hours';

  return (
    <div
      data-testid="instant-delegation-popup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className={`relative w-full max-w-lg rounded-2xl border-2 shadow-2xl overflow-hidden text-slate-100 ${
          isUrgent
            ? 'bg-slate-900 border-rose-500 shadow-rose-950/60'
            : isHigh
            ? 'bg-slate-900 border-amber-500 shadow-amber-950/60'
            : 'bg-slate-900 border-emerald-500 shadow-emerald-950/60'
        }`}
      >
        {/* Top Audio Alert Banner */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between ${
            isUrgent
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white'
              : isHigh
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 animate-bounce">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  Instant Task Delegated Alert
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-mono font-bold uppercase">
                  {task.priority} Priority
                </span>
              </div>
              <p className="text-[11px] text-white/90">
                Audio notification chime triggered for assigned personnel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
            title="Dismiss popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Delegated To Person Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm flex items-center justify-center shrink-0">
                {assigneeName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Delegated To Person
                </span>
                <strong className="text-sm font-black text-white block">
                  {assigneeName}
                </strong>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {assigneePosition} • {assigneeDept}
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block">Due By</span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5" />
                {dueTimeText}
              </span>
            </div>
          </div>

          {/* Task Details */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-white">{task.title}</h4>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                DELEGATED
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[11px]">
              {orderRef && (
                <button
                  type="button"
                  onClick={() => onOpenOrder?.(orderRef)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-mono font-bold cursor-pointer"
                >
                  <Layers className="w-3 h-3" />
                  Job: {orderRef}
                </button>
              )}
              {invoiceRef && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  <FileText className="w-3 h-3" />
                  Invoice: {invoiceRef}
                </span>
              )}
              <span className="text-slate-400 ml-auto">
                Assigned by: <strong className="text-slate-200">{assignerName}</strong> ({assignerPosition})
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
            {onCompleteTask && (
              <button
                type="button"
                data-testid="complete-delegation-btn"
                onClick={() => onCompleteTask(task.id)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Done (DONE)</span>
              </button>
            )}
            <button
              type="button"
              data-testid="acknowledge-delegation-btn"
              onClick={() => {
                if (onAcceptTask) {
                  onAcceptTask(task.id);
                } else if (onAcknowledge) {
                  onAcknowledge(task);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge & Accept Task (APPROVED)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HeaderNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  delegatedTasks?: DelegatedTask[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectNotification?: (notif: SystemNotification) => void;
  onSelectDelegatedTask?: (task: DelegatedTask) => void;
}

export const HeaderNotificationDropdown: React.FC<HeaderNotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  delegatedTasks = [],
  onMarkAllRead,
  onClearAll,
  onSelectNotification,
  onSelectDelegatedTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'DELEGATED' | 'APPROVED' | 'DONE'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.statusTag === filter;
  });

  const getBadgeStyle = (tag: ActionStatusTag) => {
    switch (tag) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'DONE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'DELEGATED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'VERIFIED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'ALERT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div
      data-testid="header-notification-dropdown"
      className="fixed top-14 right-4 z-50 w-[94vw] sm:w-[440px] max-h-[78vh] bg-slate-900/98 border-2 border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              System Action & Delegation Notifications
            </h3>
            <p className="text-[10px] text-slate-400">
              Real-time log of all Done, Approved, Verified & Delegated actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onMarkAllRead}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            title="Mark all as read"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Mark Read</span>
          </button>
          <button
            onClick={onClearAll}
            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 cursor-pointer"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5 text-[11px] font-bold overflow-x-auto">
        {(['all', 'DONE', 'APPROVED', 'DELEGATED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              filter === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab === 'all' ? `All (${notifications.length})` : tab}
          </button>
        ))}
      </div>

      {/* Active Delegated Tasks Quick Strip */}
      {delegatedTasks.length > 0 && onSelectDelegatedTask && (
        <div className="px-3 py-2 bg-amber-950/25 border-b border-amber-500/20 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-amber-300 font-bold">
            Active Delegated Tasks: {delegatedTasks.filter((t) => t.status !== 'completed').length}
          </span>
          <button
            type="button"
            onClick={() => onSelectDelegatedTask(delegatedTasks[0])}
            className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] cursor-pointer"
          >
            Inspect Latest Popup
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 max-h-[420px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-1">
            <CheckCircle2 className="w-7 h-7 text-emerald-500/60 mx-auto mb-1" />
            <div className="font-bold text-slate-300">No notifications in this filter</div>
            <div className="text-[11px]">Every system action will appear here with status tags.</div>
          </div>
        ) : (
          filtered.map((n) => {
            const isReadFlag = Boolean(n.read ?? n.isRead);
            const timeLabel = n.timestamp || n.createdAt || 'Just now';
            const targetName = n.targetEmployeeName || n.targetPersonName;

            return (
              <div
                key={n.id}
                onClick={() => onSelectNotification?.(n)}
                className={`p-3.5 hover:bg-slate-800/50 transition cursor-pointer space-y-1.5 ${
                  !isReadFlag ? 'bg-emerald-950/15' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono font-black uppercase ${getBadgeStyle(
                        n.statusTag
                      )}`}
                    >
                      ✓ {n.statusTag}
                    </span>
                    <h4 className="text-xs font-black text-white">{n.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {timeLabel}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                  <span>
                    By: <strong className="text-slate-200">{n.actorName}</strong> ({n.actorPosition})
                  </span>
                  {targetName && (
                    <span className="text-amber-300 font-bold">
                      → To: {targetName}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
