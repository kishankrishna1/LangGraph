import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';

const STREAM_URL = 'http://localhost:5000/chat/stream';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique random thread ID */
const generateThreadId = () => 'thread_' + Math.random().toString(36).substring(2, 15);

/** localStorage keys */
const KEY_THREAD_IDS    = 'chat_thread_ids';
const KEY_ACTIVE_THREAD = 'chat_active_thread';
const threadMessagesKey = (id) => `chat_messages_${id}`;
const threadTitleKey    = (id) => `chat_title_${id}`;

/** Load thread IDs from localStorage (array, newest first) */
const loadThreadIds = () => {
  try {
    const raw = localStorage.getItem(KEY_THREAD_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** Save thread IDs to localStorage */
const saveThreadIds = (ids) =>
  localStorage.setItem(KEY_THREAD_IDS, JSON.stringify(ids));

/** Load messages for a specific thread */
const loadMessages = (threadId) => {
  try {
    const raw = localStorage.getItem(threadMessagesKey(threadId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** Save messages for a specific thread */
const saveMessages = (threadId, messages) =>
  localStorage.setItem(threadMessagesKey(threadId), JSON.stringify(messages));

/** Get a human-readable title for a thread */
const getThreadTitle = (threadId) => {
  const title = localStorage.getItem(threadTitleKey(threadId));
  return title || 'New Chat';
};

/** Save first-message title for a thread (once) */
const saveThreadTitle = (threadId, text) => {
  if (!localStorage.getItem(threadTitleKey(threadId))) {
    const truncated = text.length > 45 ? text.slice(0, 42) + '…' : text;
    localStorage.setItem(threadTitleKey(threadId), truncated);
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [threadIds, setThreadIds]           = useState([]);      // all thread IDs
  const [activeThreadId, setActiveThreadId] = useState('');      // currently active
  const [messages, setMessages]             = useState([]);      // messages in view
  const [isLoading, setIsLoading]           = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]   = useState(true);   // sidebar open by default

  // ── On mount: restore or create the first thread ──────────────────────────
  useEffect(() => {
    // Migrate legacy single-thread data if present
    const legacyId   = localStorage.getItem('chat_thread_id');
    const legacyMsgs = localStorage.getItem('chat_messages');
    if (legacyId) {
      localStorage.removeItem('chat_thread_id');
      localStorage.removeItem('chat_messages');
      if (legacyMsgs) {
        localStorage.setItem(threadMessagesKey(legacyId), legacyMsgs);
      }
      // Inject legacy thread at the top
      const existingIds = loadThreadIds();
      if (!existingIds.includes(legacyId)) {
        saveThreadIds([legacyId, ...existingIds]);
      }
    }

    let ids = loadThreadIds();

    if (ids.length === 0) {
      // Brand-new user — create an initial thread
      const newId = generateThreadId();
      ids = [newId];
      saveThreadIds(ids);
      localStorage.setItem(KEY_ACTIVE_THREAD, newId);
    }

    const storedActive = localStorage.getItem(KEY_ACTIVE_THREAD);
    const activeId = storedActive && ids.includes(storedActive)
      ? storedActive
      : ids[0];

    setThreadIds(ids);
    setActiveThreadId(activeId);
    setMessages(loadMessages(activeId));

    // Default sidebar closed on mobile
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  // ── Sync messages to localStorage whenever they change ────────────────────
  useEffect(() => {
    if (activeThreadId) {
      saveMessages(activeThreadId, messages);
    }
  }, [messages, activeThreadId]);

  // ── Start a new chat ──────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    const newId = generateThreadId();
    setThreadIds((prev) => {
      const updated = [newId, ...prev];
      saveThreadIds(updated);
      return updated;
    });
    localStorage.setItem(KEY_ACTIVE_THREAD, newId);
    setActiveThreadId(newId);
    setMessages([]);
  }, []);

  // ── Switch to an existing thread ──────────────────────────────────────────
  const handleSwitchThread = useCallback((threadId) => {
    if (threadId === activeThreadId) return;
    localStorage.setItem(KEY_ACTIVE_THREAD, threadId);
    setActiveThreadId(threadId);
    setMessages(loadMessages(threadId));
  }, [activeThreadId]);

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSendMessage = async (text) => {
    // Save thread title from first user message
    saveThreadTitle(activeThreadId, text);

    const userMessage = {
      id: 'msg_' + Date.now() + '_user',
      text,
      sender: 'user',
    };

    const botMessageId = 'msg_' + (Date.now() + 1) + '_bot';
    let botBubbleAdded = false;

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, thread_id: activeThreadId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice('data: '.length).trim();

          if (raw === '[DONE]') {
            setMessages((prev) =>
              prev.map((m) => (m.id === botMessageId ? { ...m, streaming: false } : m))
            );
            return;
          }

          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) {
              if (!botBubbleAdded) {
                botBubbleAdded = true;
                setIsLoading(false);
                setMessages((prev) => [
                  ...prev,
                  { id: botMessageId, text: parsed.token, sender: 'bot', streaming: true },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMessageId ? { ...m, text: m.text + parsed.token } : m
                  )
                );
              }
            }
          } catch (parseErr) {
            console.warn('SSE parse error:', parseErr, 'raw:', raw);
          }
        }
      }

      // Fallback: mark done if stream ends without [DONE]
      setMessages((prev) =>
        prev.map((m) => (m.id === botMessageId ? { ...m, streaming: false } : m))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === botMessageId);
        const errorMsg = {
          id: botMessageId,
          text: 'Sorry, I encountered an error. Please make sure the Flask backend server is running and try again.',
          sender: 'bot',
          streaming: false,
        };
        return exists
          ? prev.map((m) => (m.id === botMessageId ? { ...m, ...errorMsg } : m))
          : [...prev, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        threadIds={threadIds}
        activeThreadId={activeThreadId}
        getThreadTitle={getThreadTitle}
        onNewChat={handleNewChat}
        onSwitchThread={handleSwitchThread}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
        />
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
