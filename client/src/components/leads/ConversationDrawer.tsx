import { useEffect, useRef, useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendReplyWhatsApp } from '../../api/leads';
import Spinner from '../ui/Spinner';
import type { Lead, WhatsAppMessage } from '../../types/lead';

interface Props {
  lead: Lead | null;
  messages: WhatsAppMessage[];
  loading: boolean;
  onClose: () => void;
  onMessageSent: (msg: WhatsAppMessage) => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-BD', {
    timeZone: 'Asia/Dhaka',
    dateStyle: 'short',
    timeStyle: 'short',
  });

export default function ConversationDrawer({ lead, messages, loading, onClose, onMessageSent }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = async () => {
    if (!lead || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendReplyWhatsApp(lead.id, text.trim());
      onMessageSent(msg);
      setText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const open = lead !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={16} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{lead?.shopName ?? ''}</p>
              <p className="text-xs text-gray-500 truncate">
                {lead?.whatsappNumber ?? lead?.phoneNumber ?? 'No number'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageCircle size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            messages
            .filter((msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i)
            .map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                    msg.direction === 'OUTBOUND'
                      ? 'bg-green-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-snug">{msg.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.direction === 'OUTBOUND' ? 'text-green-100' : 'text-gray-400'
                    }`}
                  >
                    {fmt(msg.sentAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        <div className="border-t border-gray-200 px-3 py-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={1000}
              disabled={!lead || sending}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!lead || !text.trim() || sending}
              className="p-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">{text.length}/1000</p>
        </div>
      </div>
    </>
  );
}
