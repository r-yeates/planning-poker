'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  timestamp: number;
}

interface RoomChatProps {
  roomId: string;
  userId: string;
  userName: string;
  /** Rendered inside a tab: no collapse header; `active` says whether the tab is showing. */
  embedded?: boolean;
  active?: boolean;
  /** Reports the number of messages that arrived while the chat wasn't being viewed. */
  onUnreadChange?: (count: number) => void;
}

export default function RoomChat({ roomId, userId, userName, embedded = false, active = true, onUnreadChange }: RoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSeenCountRef = useRef(0);
  const messageCountRef = useRef(0);

  // The chat is being looked at when its tab is active, or (standalone) when it isn't collapsed
  const isViewing = embedded ? active : !isCollapsed;
  const isViewingRef = useRef(isViewing);
  isViewingRef.current = isViewing;
  const onUnreadChangeRef = useRef(onUnreadChange);
  onUnreadChangeRef.current = onUnreadChange;

  useEffect(() => {
    onUnreadChangeRef.current?.(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      setMessages(msgs);
      messageCountRef.current = msgs.length;

      if (isViewingRef.current) {
        lastSeenCountRef.current = msgs.length;
        setUnreadCount(0);
      } else {
        setUnreadCount(Math.max(0, msgs.length - lastSeenCountRef.current));
      }
    });

    return unsub;
  }, [roomId]);

  // Opening the chat (expanding it or switching to its tab) marks everything as read
  useEffect(() => {
    if (isViewing) {
      lastSeenCountRef.current = messageCountRef.current;
      setUnreadCount(0);
    }
  }, [isViewing]);

  // Scroll to bottom when new messages arrive (when the chat is showing)
  useEffect(() => {
    if (isViewing) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isViewing]);

  const handleExpand = () => {
    setIsCollapsed(false);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        userId,
        name: userName,
        text,
        timestamp: Date.now(),
      });
    } catch {
      setInputText(text); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-[#212121] rounded-lg border border-slate-200 dark:border-[#303030] shadow flex flex-col">
      {!embedded && (
        <>
      {/* Header */}
        <button
          onClick={isCollapsed ? handleExpand : () => setIsCollapsed(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] rounded-t-lg transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500 dark:text-[#aaaaaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm font-medium text-slate-800 dark:text-[#cccccc]">Chat</span>
            {isCollapsed && unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        </>
      )}

      {(embedded || !isCollapsed) && (
        <>
          {/* Messages */}
          <div className="overflow-y-auto px-3 py-2 space-y-2 max-h-64 min-h-[220px] border-t border-slate-200 dark:border-[#303030]">
            {messages.length === 0 && (
              <p className="flex min-h-[180px] items-center justify-center text-center text-xs text-slate-600 dark:text-[#aaaaaa]">
                No messages yet. Start the conversation!
              </p>
            )}
            {messages.map((msg) => {
              const isOwn = msg.userId === userId;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`text-xs text-slate-400 dark:text-[#666666] mb-0.5 ${isOwn ? 'text-right' : ''}`}>
                    {isOwn ? 'You' : msg.name} · {formatTime(msg.timestamp)}
                  </div>
                  <div
                    className={`px-2.5 py-1.5 rounded-lg text-sm max-w-[85%] break-words ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-[#f1f1f1]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-[#303030] flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#181818] text-slate-900 dark:text-[#f1f1f1] placeholder:text-slate-400 dark:placeholder:text-[#666666] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
