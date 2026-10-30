/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  TeamMessage,
  TeamMessageReplyRef,
  TeamChannelId,
  UserRole,
  Order,
  Invoice,
  Employee,
  ROLE_CONFIGS,
  MarketingFaqItem,
  ActionStatusTag,
} from '../types/erp';
import { INITIAL_TEAM_CHANNELS, INITIAL_MARKETING_FAQS, INITIAL_EMPLOYEES } from '../services/seedData';
import { ErpStorageService } from '../services/erpStorageService';
import {
  canUserSendPrivateMessage,
  canUserViewChatMessage,
  extractMentionedEmployees,
} from '../utils/erpLogic';
import { playDelegationChime, playShortageAlertSound } from '../utils/soundEffects';
import { useFormDraft } from '../utils/useFormDraft';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  Image as ImageIcon,
  Building2,
  AlertTriangle,
  DollarSign,
  Sparkles,
  Printer,
  Scissors,
  ShieldAlert,
  FileText,
  Square,
  Check,
  CheckCheck,
  ExternalLink,
  Maximize2,
  Minimize2,
  Search,
  Phone,
  Layers,
  Pin,
  HelpCircle,
  Move,
  Minus,
  ClipboardPaste,
  Upload,
  Lock,
  AtSign,
  Reply,
  CornerDownRight,
  UserCheck,
} from 'lucide-react';

interface InternalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentUserName: string;
  loggedInEmployee?: Employee | null;
  employees?: Employee[];
  orders: Order[];
  invoices: Invoice[];
  faqs?: MarketingFaqItem[];
  onOpenOrder: (order: Order) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
  onNavigateTab: (tab: any) => void;
  messages: TeamMessage[];
  onSendPhoneNotification?: (phone: string, message: string) => void;
  preSelectedPrivateInvoice?: Invoice | null;
  preSelectedPrivateRecipientId?: string | null;
  onClearPreSelectedPrivate?: () => void;
  onNotifyAction?: (
    title: string,
    message: string,
    statusTag: ActionStatusTag,
    targetPersonName?: string
  ) => void;
}

type FloatingPreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'custom';

export const InternalChatDrawer: React.FC<InternalChatDrawerProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentUserName,
  loggedInEmployee,
  employees = INITIAL_EMPLOYEES,
  orders,
  invoices,
  faqs = INITIAL_MARKETING_FAQS,
  onOpenOrder,
  onOpenInvoice,
  onNavigateTab,
  messages,
  onSendPhoneNotification,
  preSelectedPrivateInvoice,
  preSelectedPrivateRecipientId,
  onClearPreSelectedPrivate,
  onNotifyAction,
}) => {
  // All hooks MUST run unconditionally before `if (!isOpen) return null;`
  const [activeChannelId, setActiveChannelId] = useState<TeamChannelId>('all-factory');
  const {
    draft: chatDraft,
    updateField: updateChatDraft,
    clearDraft: clearChatDraft,
  } = useFormDraft('internal_chat_composer_draft', {
    inputText: '',
  });
  const inputText = chatDraft.inputText;
  const setInputText = (val: string | ((prev: string) => string)) => {
    const next = typeof val === 'function' ? val(inputText) : val;
    updateChatDraft('inputText', next);
  };

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    type: 'image' | 'file' | 'audio';
    name: string;
    url: string;
  } | null>(null);

  // Floating, draggable & resizable window state
  const [chatSize, setChatSize] = useState<'compact' | 'normal' | 'wide'>('normal');
  const [isMinimizedPill, setIsMinimizedPill] = useState(false);
  const [positionPreset, setPositionPreset] = useState<FloatingPreset>('bottom-right');
  const [customCoords, setCustomCoords] = useState<{ x: number; y: number }>({
    x: 40,
    y: 70,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });
  const windowRef = useRef<HTMLDivElement | null>(null);

  // Search, pinned, reactions, @Mentions, Reply & Private Invoice Message states
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>({});
  const [isInvoiceMentionOpen, setIsInvoiceMentionOpen] = useState(false);
  const [isOrderMentionOpen, setIsOrderMentionOpen] = useState(false);
  const [isPersonMentionOpen, setIsPersonMentionOpen] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [isSimulatedTyping, setIsSimulatedTyping] = useState(false);
  const [phoneAlertSent, setPhoneAlertSent] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Private Personal / Invoice Message & Reply State
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [privateRecipientId, setPrivateRecipientId] = useState<string>(
    employees[1]?.id || 'emp-002'
  );
  const [privateInvoiceNumber, setPrivateInvoiceNumber] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<TeamMessageReplyRef | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const staffList = employees.length > 0 ? employees : INITIAL_EMPLOYEES;
  const canSendPrivate = canUserSendPrivateMessage(currentRole);

  // Current Viewer Identity for strict private chat filtering
  const viewerIdentity = useMemo(
    () => ({
      id: loggedInEmployee?.id || `user-${currentRole}`,
      employeeId: loggedInEmployee?.employeeId,
      name: loggedInEmployee?.name || currentUserName || ROLE_CONFIGS[currentRole]?.shortLabel || 'Operator',
      role: currentRole,
    }),
    [loggedInEmployee, currentUserName, currentRole]
  );

  // Handle pre-selected private invoice message from Accounting / CRM
  useEffect(() => {
    if (preSelectedPrivateInvoice) {
      setIsPrivateMode(true);
      setPrivateInvoiceNumber(preSelectedPrivateInvoice.invoiceNumber);
      if (preSelectedPrivateRecipientId) {
        setPrivateRecipientId(preSelectedPrivateRecipientId);
      } else if (preSelectedPrivateInvoice.assignedEmployeeId) {
        setPrivateRecipientId(preSelectedPrivateInvoice.assignedEmployeeId);
      }
      setInputText(
        `Regarding Invoice #${preSelectedPrivateInvoice.invoiceNumber} (${preSelectedPrivateInvoice.customerName}, Due: ৳${preSelectedPrivateInvoice.dueAmount.toLocaleString()} BDT): Please confirm status.`
      );
      onClearPreSelectedPrivate?.();
    }
  }, [preSelectedPrivateInvoice, preSelectedPrivateRecipientId]);

  const channels = INITIAL_TEAM_CHANNELS.filter((ch) => {
    if (ch.id === 'management-board') {
      return currentRole === 'owner' || currentRole === 'accountant' || currentRole === 'hr_manager';
    }
    return true;
  });

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  // Strictly filter messages so private personal/invoice messages are ONLY visible to sender & related/mentioned person
  const visibleChannelMessages = useMemo(() => {
    return messages
      .filter((m) => m.channelId === activeChannelId)
      .filter((m) => canUserViewChatMessage(m, viewerIdentity))
      .filter((m) => {
        if (showPinnedOnly && !pinnedMessageIds.includes(m.id)) return false;
        if (showPrivateOnly && !m.isPrivate) return false;
        if (
          searchQuery.trim() &&
          !m.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [
    messages,
    activeChannelId,
    viewerIdentity,
    showPinnedOnly,
    showPrivateOnly,
    pinnedMessageIds,
    searchQuery,
  ]);

  useEffect(() => {
    if (isOpen && !isMinimizedPill) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleChannelMessages.length, activeChannelId, isOpen, isMinimizedPill]);

  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceRecordSeconds(0);
      const interval = window.setInterval(() => {
        setVoiceRecordSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecordingVoice]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setIsSimulatedTyping(true);
      setTimeout(() => setIsSimulatedTyping(false), 3000);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeChannelId, isOpen]);

  // Pointer drag listener for moving floating window anywhere on screen
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const nextX = Math.max(
        8,
        Math.min(window.innerWidth - 320, e.clientX - dragOffsetRef.current.offsetX)
      );
      const nextY = Math.max(
        8,
        Math.min(window.innerHeight - 80, e.clientY - dragOffsetRef.current.offsetY)
      );
      setPositionPreset('custom');
      setCustomCoords({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffsetRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setIsDragging(true);
  };

  const togglePinMessage = (msgId: string) => {
    setPinnedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const addReaction = (msgId: string, emoji: string) => {
    setReactionsMap((prev) => {
      const msgReacts = prev[msgId] || {};
      return {
        ...prev,
        [msgId]: {
          ...msgReacts,
          [emoji]: (msgReacts[emoji] || 0) + 1,
        },
      };
    });
  };

  const attachImageBlob = (blob: Blob, labelPrefix = 'Screenshot') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const fileName = `${labelPrefix}_${new Date()
          .toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          .replace(/[:\s]/g, '-')}.png`;
        setSelectedAttachment({
          type: 'image',
          name: fileName,
          url: reader.result,
        });
        setPasteNotice(`✓ Screenshot ready to send (${fileName})`);
        setTimeout(() => setPasteNotice(null), 3500);
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleChatPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          attachImageBlob(file, 'Pasted_Screenshot');
        }
        return;
      }
    }
  };

  const handlePasteScreenshotClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            attachImageBlob(blob, 'Clipboard_Screenshot');
            return;
          }
        }
      }
      setPasteNotice('Press Ctrl+V (or Cmd+V) in the message box to paste screenshot!');
      setTimeout(() => setPasteNotice(null), 3500);
    } catch {
      setPasteNotice('Press Ctrl+V (or Cmd+V) in the message box to paste screenshot!');
      setTimeout(() => setPasteNotice(null), 3500);
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    attachImageBlob(file, file.name.replace(/\.[^/.]+$/, ''));
    e.target.value = '';
  };

  const handleReplyClick = (msg: TeamMessage) => {
    setReplyingTo({
      messageId: msg.id,
      senderName: msg.senderName,
      contentSnippet: msg.content.slice(0, 75),
      invoiceRef: msg.relatedInvoiceNumber || msg.taggedInvoices?.[0],
    });
    if (msg.isPrivate && msg.senderId) {
      setIsPrivateMode(true);
      const matchedSender = staffList.find(
        (s) => s.id === msg.senderId || s.name === msg.senderName
      );
      if (matchedSender) {
        setPrivateRecipientId(matchedSender.id);
      }
      if (msg.relatedInvoiceNumber) {
        setPrivateInvoiceNumber(msg.relatedInvoiceNumber);
      }
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text && !selectedAttachment && !isRecordingVoice) return;

    const orderMatches = text.match(/#SW-\d{4}-\d+/gi) || [];
    const taggedOrders = orderMatches.map((m) => m.replace('#', '').toUpperCase());

    const invoiceMatches = text.match(/#INV-\d{4}-\d+/gi) || [];
    const taggedInvoices = Array.from(
      new Set([
        ...invoiceMatches.map((m) => m.replace('#', '').toUpperCase()),
        ...(privateInvoiceNumber ? [privateInvoiceNumber.toUpperCase()] : []),
      ])
    );

    const deptMatches =
      text.match(/@(PrintFactory|SewingFactory|DesignTeam|Marketing|Accounts|All)/gi) || [];
    const taggedDepartments = deptMatches.map((d) => d);

    // Extract @Mentioned Employees
    const mentionedEmpObjects = extractMentionedEmployees(text, staffList);
    const selectedPrivateEmp = isPrivateMode
      ? staffList.find((e) => e.id === privateRecipientId || e.employeeId === privateRecipientId)
      : undefined;

    const recipientEmployeeIds = Array.from(
      new Set([
        ...(selectedPrivateEmp ? [selectedPrivateEmp.id, selectedPrivateEmp.employeeId] : []),
        ...mentionedEmpObjects.flatMap((e) => [e.id, e.employeeId]),
      ])
    );

    const recipientEmployeeNames = Array.from(
      new Set([
        ...(selectedPrivateEmp ? [selectedPrivateEmp.name] : []),
        ...mentionedEmpObjects.map((e) => e.name),
      ])
    );

    const taggedEmployees = Array.from(
      new Set([
        ...mentionedEmpObjects.map((e) => e.name),
        ...(selectedPrivateEmp ? [selectedPrivateEmp.name] : []),
      ])
    );

    const linkedInvoiceObj = privateInvoiceNumber
      ? invoices.find(
          (i) => i.invoiceNumber.toUpperCase() === privateInvoiceNumber.toUpperCase()
        )
      : undefined;

    let finalAttachment = selectedAttachment;
    if (isRecordingVoice) {
      finalAttachment = {
        type: 'audio',
        name: `Voice Note (${voiceRecordSeconds || 3}s)`,
        url: '#',
      };
      setIsRecordingVoice(false);
    }

    const newMessage: TeamMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannelId,
      senderId: viewerIdentity.id,
      senderName: viewerIdentity.name,
      senderRole: currentRole,
      senderPosition: loggedInEmployee?.designation || ROLE_CONFIGS[currentRole]?.title,
      content:
        text ||
        (finalAttachment?.type === 'audio' ? '🎤 Sent a voice note' : '📎 Sent an attachment'),
      status: 'read',
      isPrivate: isPrivateMode,
      recipientEmployeeIds: recipientEmployeeIds.length > 0 ? recipientEmployeeIds : undefined,
      recipientEmployeeNames:
        recipientEmployeeNames.length > 0 ? recipientEmployeeNames : undefined,
      relatedInvoiceNumber: privateInvoiceNumber || taggedInvoices[0],
      relatedInvoiceAssignedEmployeeId: linkedInvoiceObj?.assignedEmployeeId,
      replyTo: replyingTo || undefined,
      taggedEmployees: taggedEmployees.length > 0 ? taggedEmployees : undefined,
      taggedOrders,
      taggedInvoices,
      taggedDepartments,
      attachment: finalAttachment
        ? {
            type: finalAttachment.type,
            name: finalAttachment.name,
            url: finalAttachment.url,
          }
        : undefined,
      createdAt: new Date().toISOString(),
    };

    await ErpStorageService.sendTeamMessage(newMessage);

    if (activeChannelId === 'urgent-shortages') {
      playShortageAlertSound();
    } else {
      playDelegationChime();
    }

    if (isPrivateMode && selectedPrivateEmp) {
      onNotifyAction?.(
        `Private Invoice Message Sent`,
        `Direct confidential message sent to ${selectedPrivateEmp.name}${
          privateInvoiceNumber ? ` regarding #${privateInvoiceNumber}` : ''
        }. Hidden from other staff.`,
        'DONE',
        selectedPrivateEmp.name
      );
    } else if (mentionedEmpObjects.length > 0) {
      const names = mentionedEmpObjects.map((e) => e.name).join(', ');
      onNotifyAction?.(
        `Mentioned @${names}`,
        `${viewerIdentity.name} mentioned ${names} in #${activeChannel.name}`,
        'DONE',
        names
      );
    }

    clearChatDraft();
    setSelectedAttachment(null);
    setReplyingTo(null);
  };

  const insertMention = (tag: string) => {
    setInputText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  };

  const handleOrderTagClick = (orderNumber: string) => {
    const ord = orders.find((o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
    if (ord) {
      onOpenOrder(ord);
    }
  };

  const handleInvoiceTagClick = (invoiceNumber: string) => {
    const inv = invoices.find((i) => i.invoiceNumber.toUpperCase() === invoiceNumber.toUpperCase());
    if (inv && onOpenInvoice) {
      onOpenInvoice(inv);
    } else {
      onNavigateTab('accounting');
    }
  };

  const handleSendOfflinePhoneAlert = (member: Employee) => {
    const alertMsg = `[Sportswear OS Alert] Urgent handoff in #${activeChannel.name}. Please check ERP terminal or reply.`;
    onSendPhoneNotification?.(member.phone, alertMsg);
    setPhoneAlertSent(member.name);
    setTimeout(() => setPhoneAlertSent(null), 3500);
  };

  const getDimensionsClass = () => {
    if (chatSize === 'wide') return 'w-[95vw] sm:w-[680px] h-[84vh] max-h-[740px]';
    if (chatSize === 'compact') return 'w-[92vw] sm:w-[400px] h-[68vh] max-h-[560px]';
    return 'w-[94vw] sm:w-[510px] h-[78vh] max-h-[670px]';
  };

  const getPositionClasses = () => {
    if (positionPreset === 'bottom-left') return 'bottom-4 left-4';
    if (positionPreset === 'top-right') return 'top-16 right-4';
    if (positionPreset === 'center') return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    if (positionPreset === 'custom') return '';
    return 'bottom-4 right-4';
  };

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'DollarSign':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case 'Printer':
        return <Printer className="w-3.5 h-3.5 text-amber-400" />;
      case 'Scissors':
        return <Scissors className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  // Minimized Floating Pill Mode
  if (isMinimizedPill) {
    return (
      <div
        ref={windowRef}
        style={
          positionPreset === 'custom'
            ? { left: `${customCoords.x}px`, top: `${customCoords.y}px` }
            : undefined
        }
        className={`fixed z-50 ${getPositionClasses()} bg-slate-900/95 border-2 border-emerald-500/60 rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-xl select-none`}
      >
        <div
          onPointerDown={handleDragStart}
          className="flex items-center gap-2 cursor-move"
          title="Drag to move floating chat"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black text-white">
            Team Chat Floating (#{activeChannel.name})
          </span>
        </div>

        <button
          onClick={() => setIsMinimizedPill(false)}
          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
        >
          Expand Chat
        </button>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          title="Close Floating Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      data-testid="internal-chat-drawer"
      onPaste={handleChatPaste}
      style={
        positionPreset === 'custom'
          ? { left: `${customCoords.x}px`, top: `${customCoords.y}px` }
          : undefined
      }
      className={`fixed z-50 ${getPositionClasses()} ${getDimensionsClass()} bg-slate-900/95 border-2 border-emerald-500/40 rounded-2xl shadow-2xl shadow-black/80 flex flex-col backdrop-blur-xl overflow-hidden transition-shadow`}
    >
      {/* 1. Draggable & Repositionable Floating Header */}
      <div
        onPointerDown={handleDragStart}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/95 border-b border-slate-700/80 shrink-0 cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Move className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Floating Live Comms • @Mention & Private Invoice Chat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-emerald-300/90">
              Logged in as: <strong>{viewerIdentity.name}</strong> • Private messages visible only to recipient
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <select
            value={positionPreset}
            onChange={(e) => setPositionPreset(e.target.value as FloatingPreset)}
            className="px-1.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
            title="Adjust Floating Window Place"
          >
            <option value="bottom-right">↘ Bottom Right</option>
            <option value="bottom-left">↙ Bottom Left</option>
            <option value="top-right">↗ Top Right</option>
            <option value="center">⊕ Center Float</option>
            {positionPreset === 'custom' && <option value="custom">✥ Custom Dragged</option>}
          </select>

          <button
            onClick={() =>
              setChatSize((prev) =>
                prev === 'compact' ? 'normal' : prev === 'normal' ? 'wide' : 'compact'
              )
            }
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            title={`Resize window (${chatSize})`}
          >
            {chatSize === 'wide' ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={() => setIsMinimizedPill(true)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            title="Minimize to Floating Pill"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-rose-400 hover:text-white rounded-lg hover:bg-rose-600/80 transition cursor-pointer"
            title="Close Floating Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Team Member Active Status Roster Bar (Click to @Mention or DM) */}
      <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Staff:
        </span>
        {staffList.map((m) => {
          const isOnline = m.activeStatus !== 'offline';
          return (
            <div
              key={m.id}
              onClick={() => insertMention(`@${m.name.replace(/\s+/g, '_')}`)}
              title={`Click to @Mention ${m.name} (${m.designation})`}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] shrink-0 font-medium cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-200 font-bold">{m.name.split(' ')[0]}</span>
              <span className="text-slate-500 text-[9px]">({m.designation.split(' ')[0]})</span>
              {!isOnline && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendOfflinePhoneAlert(m);
                  }}
                  className="btn-press text-[9px] text-amber-400 hover:underline flex items-center gap-0.5 ml-1 cursor-pointer"
                  title={`Worker offline. Send SMS alert to ${m.phone}`}
                >
                  <Phone className="w-2.5 h-2.5" />
                  <span>SMS</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {phoneAlertSent && (
        <div className="px-4 py-1.5 bg-amber-950/80 border-b border-amber-800/80 text-[11px] text-amber-300 flex items-center justify-between">
          <span>Dispatched urgent SMS gateway notification to {phoneAlertSent}!</span>
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      {/* 3. Channel Selector Horizontal Scroll */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {channels.map((ch) => {
          const isActive = ch.id === activeChannelId;
          const count = messages.filter(
            (m) => m.channelId === ch.id && canUserViewChatMessage(m, viewerIdentity)
          ).length;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {getChannelIcon(ch.icon)}
              <span>{ch.name}</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80 text-slate-300 font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Fast Search, Pinned & Private Filter Sub-Bar */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in #${activeChannel.name} (#SW, #INV, @person)...`}
            className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-[11px] focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={() => setShowPrivateOnly(!showPrivateOnly)}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border cursor-pointer ${
            showPrivateOnly
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Filter private direct & invoice messages visible to you"
        >
          <Lock className="w-3 h-3" />
          <span>My Private</span>
        </button>
        <button
          onClick={() => setShowPinnedOnly(!showPinnedOnly)}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border cursor-pointer ${
            showPinnedOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Pin className="w-3 h-3" />
          <span>Pinned ({pinnedMessageIds.length})</span>
        </button>
      </div>

      {/* 4. Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/40">
        {visibleChannelMessages.map((msg) => {
          const isMe =
            msg.senderId === viewerIdentity.id ||
            msg.senderName.toLowerCase() === viewerIdentity.name.toLowerCase();
          const senderConfig = ROLE_CONFIGS[msg.senderRole];
          const isPinned = pinnedMessageIds.includes(msg.id);
          const msgReactions = reactionsMap[msg.id] || {};

          return (
            <div
              key={msg.id}
              data-testid={msg.isPrivate ? 'private-chat-message' : 'public-chat-message'}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 flex-wrap">
                <span className="font-bold text-slate-200">{msg.senderName}</span>
                <span className="text-slate-600">•</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                    senderConfig?.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {msg.senderPosition || senderConfig?.shortLabel || msg.senderRole}
                </span>
                {msg.isPrivate && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-200 border border-purple-500/40 text-[9px] font-bold">
                    <Lock className="w-2.5 h-2.5" />
                    Private to {msg.recipientEmployeeNames?.join(', ') || 'Mentioned Person'}
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => handleReplyClick(msg)}
                  data-testid={`reply-btn-${msg.id}`}
                  className="ml-1 px-1.5 py-0.2 rounded bg-slate-800/80 hover:bg-emerald-600/30 text-emerald-300 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Reply to this message"
                >
                  <Reply className="w-2.5 h-2.5" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={() => togglePinMessage(msg.id)}
                  className={`p-0.5 rounded hover:text-amber-400 cursor-pointer ${
                    isPinned
                      ? 'text-amber-400'
                      : 'opacity-0 group-hover:opacity-100 text-slate-500'
                  }`}
                  title="Pin / Unpin Message"
                >
                  <Pin className="w-3 h-3" />
                </button>
              </div>

              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md border ${
                  msg.isPrivate
                    ? 'border-purple-500/60 bg-purple-950/30 text-slate-100'
                    : isPinned
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : isMe
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-slate-100 rounded-tr-none'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Quoted Reply Block if this message is a reply */}
                {msg.replyTo && (
                  <div
                    data-testid="quoted-reply-block"
                    className="mb-2 p-2 rounded-xl bg-slate-950/80 border-l-2 border-emerald-400 text-[10px] text-slate-300 space-y-0.5"
                  >
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" />
                      <span>Replying to {msg.replyTo.senderName}</span>
                      {msg.replyTo.invoiceRef && (
                        <span className="font-mono text-amber-300">
                          (#{msg.replyTo.invoiceRef})
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 italic truncate">
                      "{msg.replyTo.contentSnippet}"
                    </div>
                  </div>
                )}

                <div className="leading-relaxed whitespace-pre-wrap">
                  {msg.content.split(' ').map((word, i) => {
                    if (word.startsWith('#SW-')) {
                      return (
                        <button
                          key={i}
                          onClick={() => handleOrderTagClick(word.replace(/[.,!?;:]/g, ''))}
                          className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-mono font-bold hover:bg-blue-500/30 cursor-pointer"
                        >
                          {word}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </button>
                      );
                    }
                    if (word.startsWith('#INV-')) {
                      return (
                        <button
                          key={i}
                          onClick={() => handleInvoiceTagClick(word.replace(/[.,!?;:]/g, ''))}
                          className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono font-bold hover:bg-emerald-500/30 cursor-pointer"
                        >
                          {word}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </button>
                      );
                    }
                    if (word.startsWith('@')) {
                      return (
                        <span
                          key={i}
                          className="mx-0.5 px-1.5 py-0.5 bg-amber-500/25 text-amber-200 border border-amber-500/40 rounded font-bold"
                        >
                          {word}
                        </span>
                      );
                    }
                    return word + ' ';
                  })}
                </div>

                {/* Render Attached or Pasted Screenshot / Image / Voice Note */}
                {msg.attachment && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    {msg.attachment.type === 'image' ? (
                      <div className="space-y-1">
                        <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-48 flex items-center justify-center">
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="max-h-48 w-auto object-contain rounded-lg"
                          />
                        </div>
                        <div className="text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span className="truncate">{msg.attachment.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-[11px] text-indigo-300 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span>{msg.attachment.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {msg.taggedInvoices && msg.taggedInvoices.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 space-y-1">
                    {msg.taggedInvoices.map((invNum) => {
                      const inv = invoices.find(
                        (i) => i.invoiceNumber.toUpperCase() === invNum.toUpperCase()
                      );
                      return (
                        <div
                          key={invNum}
                          className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 font-mono">
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-bold text-white">{invNum}</span>
                            {inv && (
                              <span className="text-slate-400">
                                • {inv.customerName} (৳{inv.totalAmount.toLocaleString()} BDT)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleInvoiceTagClick(invNum)}
                            className="btn-press px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Open Invoice
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/5 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    {(['👍', '✅', '🔥', '🚨'] as const).map((emo) => {
                      const cnt = msgReactions[emo] || 0;
                      return (
                        <button
                          key={emo}
                          onClick={() => addReaction(msg.id, emo)}
                          className={`px-1.5 py-0.2 rounded-full border text-[10px] transition cursor-pointer ${
                            cnt > 0
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-white font-bold'
                              : 'bg-slate-900/60 border-slate-700/60 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {emo} {cnt > 0 ? cnt : ''}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReplyClick(msg)}
                      className="text-emerald-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                    {isMe && (
                      <span className="text-cyan-400 font-bold" title="Read & Delivered">
                        <CheckCheck className="w-3.5 h-3.5 inline" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isSimulatedTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic px-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Nusrat Jahan (Design 1) is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Quick Mention & Picker Trays (@Person, #Invoice, #Job Card, Quick Q&A) */}
      {isPersonMentionOpen && (
        <div
          data-testid="mention-person-tray"
          className="p-3 bg-slate-900 border-t border-slate-800 max-h-44 overflow-y-auto space-y-1 text-xs"
        >
          <div className="flex items-center justify-between pb-1 text-amber-400 text-[10px] font-bold uppercase">
            <span>Select Employee to @Mention in Message:</span>
            <button onClick={() => setIsPersonMentionOpen(false)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {staffList.map((emp) => (
              <button
                key={emp.id}
                type="button"
                data-testid={`mention-option-${emp.employeeId}`}
                onClick={() => {
                  insertMention(`@${emp.name.replace(/\s+/g, '_')}`);
                  setIsPersonMentionOpen(false);
                }}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <span className="font-bold text-amber-300 block">@{emp.name}</span>
                  <span className="text-[10px] text-slate-400">{emp.designation}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400">
                  {emp.employeeId}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isInvoiceMentionOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-40 overflow-y-auto space-y-1 text-xs">
          <div className="flex items-center justify-between pb-1 text-slate-400 text-[10px] font-bold uppercase">
            <span>Select Invoice to Mention or Link Privately:</span>
            <button onClick={() => setIsInvoiceMentionOpen(false)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => {
                insertMention(`#${inv.invoiceNumber}`);
                setPrivateInvoiceNumber(inv.invoiceNumber);
                setIsInvoiceMentionOpen(false);
              }}
              className="w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <span className="font-mono font-bold text-emerald-400">{inv.invoiceNumber}</span>
                <span className="text-white text-xs block">{inv.customerName}</span>
              </div>
              <div className="text-right font-mono text-[11px]">
                <span className="text-white font-bold">৳{inv.totalAmount.toLocaleString()} BDT</span>
                <span className="text-amber-400 block text-[10px]">
                  Due: ৳{inv.dueAmount.toLocaleString()} BDT
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOrderMentionOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-40 overflow-y-auto space-y-1 text-xs">
          <div className="flex items-center justify-between pb-1 text-slate-400 text-[10px] font-bold uppercase">
            <span>Select Job Card to Mention:</span>
            <button onClick={() => setIsOrderMentionOpen(false)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {orders.map((ord) => (
            <button
              key={ord.id}
              onClick={() => {
                insertMention(`#${ord.orderNumber}`);
                setIsOrderMentionOpen(false);
              }}
              className="w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <span className="font-mono font-bold text-indigo-400">{ord.orderNumber}</span>
                <span className="text-white text-xs block">
                  {ord.teamOrClub} • {ord.clientName}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {ord.totalQuantity} pcs ({ord.stage.replace(/_/g, ' ')})
              </span>
            </button>
          ))}
        </div>
      )}

      {isQuickReplyOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-40 overflow-y-auto space-y-1.5 text-xs">
          <div className="flex items-center justify-between pb-1 text-amber-400 text-[10px] font-bold uppercase">
            <span>Quick Marketing & SOP Reply Snippets:</span>
            <button onClick={() => setIsQuickReplyOpen(false)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {faqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => {
                setInputText(faq.answerEn);
                setIsQuickReplyOpen(false);
              }}
              className="w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left cursor-pointer space-y-0.5"
            >
              <div className="font-bold text-white text-[11px]">{faq.question}</div>
              <div className="text-[10px] text-slate-400 truncate">{faq.answerEn}</div>
            </button>
          ))}
        </div>
      )}

      {/* 6. Private Personal / Invoice Message Bar (For Owner, Manager & Dept Heads) */}
      {canSendPrivate && (
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
          <button
            type="button"
            data-testid="toggle-private-msg-btn"
            onClick={() => setIsPrivateMode(!isPrivateMode)}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 border transition cursor-pointer ${
              isPrivateMode
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-slate-900 text-purple-300 border-purple-500/30 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>
              {isPrivateMode
                ? 'Private Personal / Invoice Message ON'
                : 'Send Private Invoice Message to Employee'}
            </span>
          </button>

          {isPrivateMode && (
            <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-end">
              <select
                data-testid="private-recipient-select"
                value={privateRecipientId}
                onChange={(e) => setPrivateRecipientId(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-purple-500/40 text-purple-200 font-bold text-[11px] cursor-pointer"
              >
                {staffList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    To: {emp.name} ({emp.designation})
                  </option>
                ))}
              </select>

              <select
                data-testid="private-invoice-select"
                value={privateInvoiceNumber}
                onChange={(e) => setPrivateInvoiceNumber(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] cursor-pointer"
              >
                <option value="">No Specific Invoice</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.invoiceNumber}>
                    #{inv.invoiceNumber} • {inv.customerName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Quick Mention Suggestions Chips */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
        <button
          type="button"
          data-testid="open-mention-person-btn"
          onClick={() => {
            setIsPersonMentionOpen(!isPersonMentionOpen);
            setIsOrderMentionOpen(false);
            setIsInvoiceMentionOpen(false);
            setIsQuickReplyOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/60 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <AtSign className="w-3 h-3" />
          <span>@Mention Person</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsInvoiceMentionOpen(!isInvoiceMentionOpen);
            setIsPersonMentionOpen(false);
            setIsOrderMentionOpen(false);
            setIsQuickReplyOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          <span>#Invoice</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsOrderMentionOpen(!isOrderMentionOpen);
            setIsPersonMentionOpen(false);
            setIsInvoiceMentionOpen(false);
            setIsQuickReplyOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <Layers className="w-3 h-3" />
          <span>#Job Card</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsQuickReplyOpen(!isQuickReplyOpen);
            setIsPersonMentionOpen(false);
            setIsInvoiceMentionOpen(false);
            setIsOrderMentionOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Quick Q&A</span>
        </button>
      </div>

      {/* Active Reply-To Quote Banner */}
      {replyingTo && (
        <div
          data-testid="active-reply-banner"
          className="px-3 py-1.5 bg-slate-950 border-t border-emerald-500/40 flex items-center justify-between gap-2 text-xs shrink-0"
        >
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-bold text-emerald-300">
                Replying to {replyingTo.senderName}:
              </span>{' '}
              <span className="text-[11px] text-slate-400 italic">
                "{replyingTo.contentSnippet}"
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staged Screenshot / Image Attachment Preview Bar */}
      {(selectedAttachment || pasteNotice) && (
        <div className="px-3 py-2 bg-slate-950/95 border-t border-emerald-500/40 flex items-center justify-between gap-2 text-xs shrink-0">
          {selectedAttachment ? (
            <div className="flex items-center gap-2.5 truncate">
              {selectedAttachment.type === 'image' && (
                <img
                  src={selectedAttachment.url}
                  alt={selectedAttachment.name}
                  className="w-10 h-10 rounded-lg object-cover border border-emerald-500/50 shrink-0"
                />
              )}
              <div className="truncate">
                <div className="text-[11px] font-bold text-emerald-300 truncate">
                  {selectedAttachment.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  Ready to send • Press Enter or Send
                </div>
              </div>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-emerald-300">{pasteNotice}</span>
          )}
          {selectedAttachment && (
            <button
              type="button"
              onClick={() => setSelectedAttachment(null)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer shrink-0"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Input Composer with Upload & Paste Screenshot */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUploadChange}
            className="hidden"
          />

          <button
            type="button"
            title="Upload image or design file"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
          </button>

          <button
            type="button"
            title="Paste Screenshot from Clipboard (or press Ctrl+V)"
            onClick={handlePasteScreenshotClick}
            className="px-2.5 py-1.5 text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-700 border border-emerald-500/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shrink-0"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          <button
            type="button"
            title={isRecordingVoice ? 'Stop recording' : 'Hold / click to record voice note'}
            onClick={() => setIsRecordingVoice(!isRecordingVoice)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isRecordingVoice
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isRecordingVoice ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            data-testid="chat-message-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={handleChatPaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              isPrivateMode
                ? `Private message to selected staff (hidden from others)...`
                : `Message #${activeChannel.name}, @mention person, or Ctrl+V screenshot...`
            }
            className={`flex-1 bg-slate-950 border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
              isPrivateMode
                ? 'border-purple-500/60 focus:ring-purple-500'
                : 'border-slate-700/80 focus:ring-emerald-500'
            }`}
          />

          <button
            type="button"
            data-testid="chat-send-btn"
            onClick={handleSendMessage}
            className={`btn-press p-2 text-white rounded-xl shadow-md transition-colors cursor-pointer ${
              isPrivateMode
                ? 'bg-purple-600 hover:bg-purple-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
