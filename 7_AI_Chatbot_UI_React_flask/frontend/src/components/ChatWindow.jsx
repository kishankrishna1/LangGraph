import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Bot, Sparkles } from 'lucide-react';

export default function ChatWindow({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 bg-zinc-950 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-start">
        {messages.length === 0 ? (
          /* Welcome State */
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto px-4 py-20 select-none">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 animate-bounce">
              <Bot size={32} />
            </div>
            <h2 className="text-xl font-medium text-zinc-200 mb-2">How can I help you today?</h2>
            <p className="text-sm text-zinc-500 max-w-sm">
              Start chatting below. Your conversation history is saved for this thread.
            </p>
          </div>
        ) : (
          /* Message List */
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex w-full gap-3 my-4 justify-start">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 select-none">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-none text-sm flex items-center gap-2">
              <Sparkles size={14} className="animate-spin text-purple-400" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        {/* Anchor for Auto-scroll */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
