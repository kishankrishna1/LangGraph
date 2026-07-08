import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

const STREAM_URL = 'http://localhost:5000/chat/stream';

// Helper to generate a unique random thread ID
const generateThreadId = () => {
  return 'thread_' + Math.random().toString(36).substring(2, 15);
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize or restore conversation thread
  useEffect(() => {
    let activeThreadId = localStorage.getItem('chat_thread_id');
    const storedMessages = localStorage.getItem('chat_messages');

    if (!activeThreadId) {
      activeThreadId = generateThreadId();
      localStorage.setItem('chat_thread_id', activeThreadId);
    }

    setThreadId(activeThreadId);

    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        console.error('Failed to parse cached chat messages:', e);
      }
    }
  }, []);

  // Sync messages with localStorage when state changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = async (text) => {
    // 1. Add human message to the view immediately
    const userMessage = {
      id: 'msg_' + Date.now() + '_user',
      text,
      sender: 'user',
    };

    // Reserve an ID for the bot bubble — it will be added on first token
    const botMessageId = 'msg_' + (Date.now() + 1) + '_bot';
    let botBubbleAdded = false;

    // Only add user message now; bot bubble appears on first token
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. POST to the SSE streaming endpoint
      const response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, thread_id: threadId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Keep isLoading=true ("Thinking...") until the first token arrives

      // 3. Read the SSE byte stream and parse line-by-line
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the incomplete last line in the buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice('data: '.length).trim();

          // [DONE] signals the end of the stream
          if (raw === '[DONE]') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMessageId ? { ...m, streaming: false } : m
              )
            );
            return;
          }

          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.token) {
              if (!botBubbleAdded) {
                // First token: create the bubble and hide the "Thinking..." spinner atomically
                botBubbleAdded = true;
                setIsLoading(false);
                setMessages((prev) => [
                  ...prev,
                  { id: botMessageId, text: parsed.token, sender: 'bot', streaming: true },
                ]);
              } else {
                // Subsequent tokens: append to the existing bubble
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMessageId
                      ? { ...m, text: m.text + parsed.token }
                      : m
                  )
                );
              }
            }
          } catch (parseErr) {
            console.warn('SSE parse error:', parseErr, 'raw:', raw);
          }
        }
      }

      // Fallback: remove cursor if stream ends without [DONE]
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId ? { ...m, streaming: false } : m
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
        // If bubble was never added (error before first token), add it now with error text
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

  const handleResetConversation = () => {
    const newThreadId = generateThreadId();
    localStorage.setItem('chat_thread_id', newThreadId);
    localStorage.removeItem('chat_messages');
    setThreadId(newThreadId);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Header */}
      <Header onReset={handleResetConversation} />

      {/* Main Chat Window */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Bottom Text Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
