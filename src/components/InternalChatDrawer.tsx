/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  TeamMessage,
  TeamChannelId,
  UserRole,
  Order,
  Invoice,
  ROLE_CONFIGS,
  MarketingFaqItem,
} from '../types/erp';
import { INITIAL_TEAM_CHANNELS, INITIAL_MARKETING_FAQS } from '../services/seedData';
import { ErpStorageService } from '../services/erpStorageService';
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
  Hash,
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
  Zap,
  HelpCircle,
} from 'lucide-react';

interface InternalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentUserName: string;
  orders: Order[];
  invoices: Invoice[];
  faqs?: MarketingFaqItem[];
  onOpenOrder: (order: Order) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
  onNavigateTab: (tab: any) => void;
  messages: TeamMessage[];
  onSendPhoneNotification?: (phone: string, message: string) => void;
}

export const InternalChatDrawer: React.FC<InternalChatDrawerProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentUserName,
  orders,
  invoices,
  faqs = INITIAL_MARKETING_FAQS,
  onOpenOrder,
  onOpenInvoice,
  onNavigateTab,
  messages,
  onSendPhoneNotification,
}) => {
  if (!isOpen) return null;

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

  // Fast search, pinned & reaction states
  const [chatWidth, setChatWidth] = useState<'normal' | 'wide' | 'max'>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>({});
  const [isInvoiceMentionOpen, setIsInvoiceMentionOpen] = useState(false);
  const [isOrderMentionOpen, setIsOrderMentionOpen] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [isSimulatedTyping, setIsSimulatedTyping] = useState(false);
  const [phoneAlertSent, setPhoneAlertSent] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Active Team Members Roster
  const teamMembers = [
    { name: 'Tanvir Ahmed', role: 'marketing', dept: 'Sales & CRM', status: 'online', phone: '+880 1711-234567' },
    { name: 'Farhana Sultana', role: 'design_mockup', dept: 'Design 1', status: 'online', phone: '+880 1722-345678' },
    { name: 'Shafiqul Alam', role: 'design_pattern', dept: 'Design 2', status: 'idle', phone: '+880 1733-456789' },
    { name: 'Jahangir Alam', role: 'print_factory', dept: 'Tongi Print', status: 'online', phone: '+880 1744-567890' },
    { name: 'Rony Mia', role: 'sewing_factory', dept: 'Mirpur Sewing', status: 'online', phone: '+880 1755-678901' },
    { name: 'Rafiqul Islam', role: 'accountant', dept: 'Accounts', status: 'online', phone: '+880 1766-789012' },
    { name: 'Kamrul Islam', role: 'hr_manager', dept: 'HR & Ops', status: 'offline', phone: '+880 1777-890123' },
  ];

  const channels = INITIAL_TEAM_CHANNELS.filter((ch) => {
    if (ch.id === 'management-board') {
      return currentRole === 'owner' || currentRole === 'accountant';
    }
    return true;
  });

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const channelMessages = useMemo(() => {
    return messages
      .filter((m) => m.channelId === activeChannelId)
      .filter((m) => {
        if (showPinnedOnly && !pinnedMessageIds.includes(m.id)) return false;
        if (
          searchQuery.trim() &&
          !m.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [messages, activeChannelId, showPinnedOnly, pinnedMessageIds, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length, activeChannelId]);

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
    const timer = setTimeout(() => {
      setIsSimulatedTyping(true);
      setTimeout(() => setIsSimulatedTyping(false), 3000);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeChannelId]);

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

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text && !selectedAttachment && !isRecordingVoice) return;

    const orderMatches = text.match(/#SW-\d{4}-\d+/gi) || [];
    const taggedOrders = orderMatches.map((m) => m.replace('#', '').toUpperCase());

    const invoiceMatches = text.match(/#INV-\d{4}-\d+/gi) || [];
    const taggedInvoices = invoiceMatches.map((m) => m.replace('#', '').toUpperCase());

    const deptMatches =
      text.match(/@(PrintFactory|SewingFactory|DesignTeam|Marketing|Accounts|All)/gi) || [];
    const taggedDepartments = deptMatches.map((d) => d);

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
      senderId: `user-${currentRole}`,
      senderName: currentUserName || ROLE_CONFIGS[currentRole]?.shortLabel || 'Operator',
      senderRole: currentRole,
      content:
        text ||
        (finalAttachment?.type === 'audio' ? '🎤 Sent a voice note' : '📎 Sent an attachment'),
      status: 'read',
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

    clearChatDraft();
    setSelectedAttachment(null);
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

  const handleSendOfflinePhoneAlert = (member: typeof teamMembers[0]) => {
    const alertMsg = `[Sportswear OS Alert] Urgent handoff in #${activeChannel.name}. Please check ERP terminal or reply.`;
    onSendPhoneNotification?.(member.phone, alertMsg);
    setPhoneAlertSent(member.name);
    setTimeout(() => setPhoneAlertSent(null), 3500);
  };

  const getWidthClass = () => {
    if (chatWidth === 'max') return 'w-full sm:w-[860px]';
    if (chatWidth === 'wide') return 'w-full sm:w-[660px]';
    return 'w-full sm:w-[500px]';
  };

  const getChannelIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'DollarSign':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'Printer':
        return <Printer className="w-4 h-4 text-amber-400" />;
      case 'Scissors':
        return <Scissors className="w-4 h-4 text-indigo-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <Building2 className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 ${getWidthClass()} bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-right-4`}
    >
      {/* 1. Resizable Floating Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              Fast Multi-Department Team Comms
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400">
              Instant #JobCard & #Invoice deep-links, reactions, search & Marketing Q&A snippets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setChatWidth((prev) => (prev === 'normal' ? 'wide' : prev === 'wide' ? 'max' : 'normal'))
            }
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            title={`Resize width (Current: ${chatWidth})`}
          >
            {chatWidth === 'max' ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Team Member Active Status Roster Bar */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Staff:
        </span>
        {teamMembers.map((m) => {
          const isOnline = m.status === 'online';
          const isIdle = m.status === 'idle';
          return (
            <div
              key={m.name}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] shrink-0 font-medium"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : isIdle ? 'bg-amber-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 font-bold">{m.name.split(' ')[0]}</span>
              <span className="text-slate-500 text-[9px]">({m.dept})</span>
              {!isOnline && (
                <button
                  onClick={() => handleSendOfflinePhoneAlert(m)}
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
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {channels.map((ch) => {
          const isActive = ch.id === activeChannelId;
          const count = messages.filter((m) => m.channelId === ch.id).length;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Fast Search & Pinned Filter Sub-Bar */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in #${activeChannel.name} (#SW, #INV, staff)...`}
            className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-[11px] focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={() => setShowPinnedOnly(!showPinnedOnly)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer ${
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
        {channelMessages.map((msg) => {
          const isMe = msg.senderRole === currentRole;
          const senderConfig = ROLE_CONFIGS[msg.senderRole];
          const isPinned = pinnedMessageIds.includes(msg.id);
          const msgReactions = reactionsMap[msg.id] || {};

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 group`}
            >
              {/* Sender Title Bar */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                <span className="font-bold text-slate-300">{msg.senderName}</span>
                <span className="text-slate-600">•</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                    senderConfig?.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {senderConfig?.shortLabel || msg.senderRole}
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  onClick={() => togglePinMessage(msg.id)}
                  className={`ml-1 p-0.5 rounded hover:text-amber-400 cursor-pointer ${
                    isPinned ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 text-slate-500'
                  }`}
                  title="Pin / Unpin Message"
                >
                  <Pin className="w-3 h-3" />
                </button>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs shadow-md border ${
                  isPinned
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : isMe
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-slate-100 rounded-tr-none'
                    : 'bg-slate-800/90 border-slate-700 text-slate-200 rounded-tl-none'
                }`}
              >
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
                          className="mx-0.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium"
                        >
                          {word}
                        </span>
                      );
                    }
                    return word + ' ';
                  })}
                </div>

                {/* Direct Action Link Cards for tagged invoices */}
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
                                • {inv.customerName} (${inv.totalAmount.toLocaleString()})
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

                {/* Quick Reactions & Delivery Receipt Bar */}
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

                  <div className="flex items-center gap-1">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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
            <span>Farhana Sultana (Design 1) is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Quick Mention & Marketing Playbook Trays */}
      {isInvoiceMentionOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-44 overflow-y-auto space-y-1 text-xs">
          <div className="flex items-center justify-between pb-1 text-slate-400 text-[10px] font-bold uppercase">
            <span>Select Invoice to Mention:</span>
            <button onClick={() => setIsInvoiceMentionOpen(false)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => {
                insertMention(`#${inv.invoiceNumber}`);
                setIsInvoiceMentionOpen(false);
              }}
              className="w-full p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left cursor-pointer"
            >
              <div>
                <span className="font-mono font-bold text-emerald-400">{inv.invoiceNumber}</span>
                <span className="text-white text-xs block">{inv.customerName}</span>
              </div>
              <div className="text-right font-mono text-[11px]">
                <span className="text-white font-bold">${inv.totalAmount.toLocaleString()}</span>
                <span className="text-amber-400 block text-[10px]">
                  Due: ${inv.dueAmount.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOrderMentionOpen && (
        <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-44 overflow-y-auto space-y-1 text-xs">
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
        <div className="p-3 bg-slate-900 border-t border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-xs">
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

      {/* Quick Mention Suggestions Chips */}
      <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar shrink-0">
        <button
          onClick={() => {
            setIsOrderMentionOpen(!isOrderMentionOpen);
            setIsInvoiceMentionOpen(false);
            setIsQuickReplyOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <Layers className="w-3 h-3" />
          <span>#Job Card</span>
        </button>

        <button
          onClick={() => {
            setIsInvoiceMentionOpen(!isInvoiceMentionOpen);
            setIsOrderMentionOpen(false);
            setIsQuickReplyOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          <span>#Invoice</span>
        </button>

        <button
          onClick={() => {
            setIsQuickReplyOpen(!isQuickReplyOpen);
            setIsInvoiceMentionOpen(false);
            setIsOrderMentionOpen(false);
          }}
          className="btn-press px-2 py-0.5 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 font-bold whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Quick Q&A Script</span>
        </button>

        <button
          onClick={() => insertMention('@PrintFactory')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 whitespace-nowrap cursor-pointer"
        >
          @PrintFactory
        </button>
        <button
          onClick={() => insertMention('@SewingFactory')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 whitespace-nowrap cursor-pointer"
        >
          @SewingFactory
        </button>
        <button
          onClick={() => insertMention('@DesignTeam')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 whitespace-nowrap cursor-pointer"
        >
          @DesignTeam
        </button>
      </div>

      {/* Input Composer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            title="Attach mockup or proof photo"
            onClick={() =>
              setSelectedAttachment({
                type: 'image',
                name: 'sublimation_proof_roll_01.jpg',
                url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
              })
            }
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={`Fast message #${activeChannel.name}... (Auto-draft saved)`}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={handleSendMessage}
            className="btn-press p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
