import React from 'react';
import { Bot, User } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex w-full gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Icon */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 select-none">
          <Bot size={16} />
        </div>
      )}

      {/* Bubble Box */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${
          isUser
            ? 'bg-purple-600 text-white rounded-tr-none'
            : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.text}</div>
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 select-none">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
