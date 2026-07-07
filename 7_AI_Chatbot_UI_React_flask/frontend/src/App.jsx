import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

const API_URL = 'http://localhost:5000/chat';

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
    // 1. Add human message to the view
    const userMessage = {
      id: 'msg_' + Date.now() + '_user',
      text,
      sender: 'user',
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 2. Call local Flask backend API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 3. Add bot reply to state
      const botMessage = {
        id: 'msg_' + Date.now() + '_bot',
        text: data.response,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: 'msg_' + Date.now() + '_error',
        text: 'Sorry, I encountered an error. Please make sure the Flask backend server is running and try again.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
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
