/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  TeamMessage,
  TeamChannel,
  TeamChannelId,
  UserRole,
  Order,
  Invoice,
  ROLE_CONFIGS,
} from '../types/erp';
import { INITIAL_TEAM_CHANNELS } from '../services/seedData';
import { ErpStorageService } from '../services/erpStorageService';
import { playDelegationChime, playShortageAlertSound } from '../utils/soundEffects';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
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
  AtSign,
  FileText,
  Play,
  Square,
  CheckCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface InternalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentUserName: string;
  orders: Order[];
  invoices: Invoice[];
  onOpenOrder: (order: Order) => void;
  onNavigateTab: (tab: any) => void;
  messages: TeamMessage[];
}

export const InternalChatDrawer: React.FC<InternalChatDrawerProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentUserName,
  orders,
  invoices,
  onOpenOrder,
  onNavigateTab,
  messages,
}) => {
  const [activeChannelId, setActiveChannelId] = useState<TeamChannelId>('all-factory');
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    type: 'image' | 'file' | 'audio';
    name: string;
    url: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Filter channels based on RBAC: management-board only for owner & accountant
  const channels = INITIAL_TEAM_CHANNELS.filter((ch) => {
    if (ch.id === 'management-board') {
      return currentRole === 'owner' || currentRole === 'accountant';
    }
    return true;
  });

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const channelMessages = messages.filter((m) => m.channelId === activeChannelId);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length, isOpen, activeChannelId]);

  // Voice note simulator timer
  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setVoiceRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecordingVoice]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text && !selectedAttachment && !isRecordingVoice) return;

    // Detect tags in message
    const orderMatches = text.match(/#SW-\d{4}-\d+/gi) || [];
    const taggedOrders = orderMatches.map((m) => m.replace('#', '').toUpperCase());

    const invoiceMatches = text.match(/#INV-\d{4}-\d+/gi) || [];
    const taggedInvoices = invoiceMatches.map((m) => m.replace('#', '').toUpperCase());

    const deptMatches = text.match(/@(PrintFactory|SewingFactory|DesignTeam|Marketing|Accounts|All)/gi) || [];
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
      content: text || (finalAttachment?.type === 'audio' ? '🎤 Sent a voice note' : '📎 Sent an attachment'),
      taggedOrders,
      taggedInvoices,
      taggedDepartments,
      attachment: finalAttachment ? {
        type: finalAttachment.type,
        name: finalAttachment.name,
        url: finalAttachment.url,
      } : undefined,
      createdAt: new Date().toISOString(),
    };

    await ErpStorageService.sendTeamMessage(newMessage);

    if (activeChannelId === 'urgent-shortages') {
      playShortageAlertSound();
    } else {
      playDelegationChime();
    }

    setInputText('');
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
    onNavigateTab('accounting');
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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Multi-Department Team Comms
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Live inter-factory messaging with tag linking & voice notes
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Channel Selector Horizontal Scroll */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {channels.map((ch) => {
          const isActive = ch.id === activeChannelId;
          const count = messages.filter((m) => m.channelId === ch.id).length;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {getChannelIcon(ch.icon)}
              <span>{ch.name}</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80 text-slate-300">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Channel Sub-Bar */}
      <div className="px-5 py-2 bg-slate-800/30 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-200">{activeChannel.name}</span>
          <span className="text-slate-500">•</span>
          <span className="truncate">{activeChannel.description}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {activeChannel.departmentTag}
        </span>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
        {channelMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-xs">No messages yet in #{activeChannel.name}.</p>
            <p className="text-[11px] text-slate-600">
              Type a message below or use quick action chips to alert factory departments.
            </p>
          </div>
        ) : (
          channelMessages.map((msg) => {
            const isMe = msg.senderRole === currentRole;
            const senderConfig = ROLE_CONFIGS[msg.senderRole];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Sender Title Bar */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span className="font-semibold text-slate-300">{msg.senderName}</span>
                  <span className="text-slate-600">•</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] ${senderConfig?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {senderConfig?.shortLabel || msg.senderRole}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md border ${
                    isMe
                      ? 'bg-emerald-600/20 border-emerald-500/40 text-slate-100 rounded-tr-none'
                      : 'bg-slate-800/90 border-slate-700 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Content with highlighted tag mentions */}
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

                  {/* Attachment Preview */}
                  {msg.attachment && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60">
                      {msg.attachment.type === 'image' ? (
                        <div className="rounded-lg overflow-hidden border border-slate-700">
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="w-full max-h-48 object-cover"
                          />
                          <div className="p-1.5 bg-slate-900/90 text-[10px] text-slate-300 flex items-center justify-between">
                            <span className="truncate">{msg.attachment.name}</span>
                            <span className="text-slate-500">Image</span>
                          </div>
                        </div>
                      ) : msg.attachment.type === 'audio' ? (
                        <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                          <button
                            onClick={() => playDelegationChime()}
                            className="p-1.5 bg-emerald-600 rounded-full text-white hover:bg-emerald-500"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1 h-3">
                              {[4, 12, 8, 16, 6, 14, 10, 18, 12, 6, 14, 8].map((h, idx) => (
                                <div
                                  key={idx}
                                  className="w-1 bg-emerald-400/80 rounded-full"
                                  style={{ height: `${h}px` }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400">{msg.attachment.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-700">
                          <FileText className="w-4 h-4 text-sky-400" />
                          <span className="text-xs text-slate-200 truncate">{msg.attachment.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{msg.attachment.size || 'PDF'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Mention Suggestions Chips */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0">Mention:</span>
        <button
          onClick={() => insertMention('@PrintFactory')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 whitespace-nowrap"
        >
          @PrintFactory
        </button>
        <button
          onClick={() => insertMention('@SewingFactory')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 whitespace-nowrap"
        >
          @SewingFactory
        </button>
        <button
          onClick={() => insertMention('@DesignTeam')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 whitespace-nowrap"
        >
          @DesignTeam
        </button>
        <button
          onClick={() => insertMention('@Accounts')}
          className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 whitespace-nowrap"
        >
          @Accounts
        </button>
        {orders.slice(0, 3).map((o) => (
          <button
            key={o.id}
            onClick={() => insertMention(`#${o.orderNumber}`)}
            className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 whitespace-nowrap font-mono"
          >
            #{o.orderNumber}
          </button>
        ))}
        {invoices.slice(0, 2).map((inv) => (
          <button
            key={inv.id}
            onClick={() => insertMention(`#${inv.invoiceNumber}`)}
            className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 whitespace-nowrap font-mono"
          >
            #{inv.invoiceNumber}
          </button>
        ))}
      </div>

      {/* Pending Attachment / Voice Note Indicator */}
      {(selectedAttachment || isRecordingVoice) && (
        <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs">
          {isRecordingVoice ? (
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Recording Voice Note... ({voiceRecordSeconds}s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{selectedAttachment?.name}</span>
            </div>
          )}
          <button
            onClick={() => {
              setSelectedAttachment(null);
              setIsRecordingVoice(false);
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {/* Attachment buttons */}
          <button
            title="Attach mockup or proof photo"
            onClick={() =>
              setSelectedAttachment({
                type: 'image',
                name: 'sublimation_proof_roll_01.jpg',
                url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
              })
            }
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            title="Attach pattern spec sheet"
            onClick={() =>
              setSelectedAttachment({
                type: 'file',
                name: 'Pattern_Nesting_Specs_Roll160.pdf',
                url: '#',
              })
            }
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice recorder button */}
          <button
            title={isRecordingVoice ? 'Stop recording' : 'Hold / click to record voice note'}
            onClick={() => setIsRecordingVoice(!isRecordingVoice)}
            className={`p-2 rounded-xl transition-colors ${
              isRecordingVoice
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isRecordingVoice ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={`Message #${activeChannel.name}... Mention @Dept or #SW-Order`}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
