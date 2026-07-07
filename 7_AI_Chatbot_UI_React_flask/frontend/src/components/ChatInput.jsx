import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize the input text area
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 pb-8 bg-zinc-950 border-t border-zinc-900 sticky bottom-0"
    >
      <div className="max-w-3xl mx-auto relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 shadow-lg focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all duration-200">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none resize-none max-h-40 py-1 pr-12 overflow-y-auto"
          style={{ height: 'auto' }}
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className={`absolute right-3 p-1.5 rounded-lg transition-all duration-150 ${
            text.trim() && !disabled
              ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer hover:scale-105 active:scale-95'
              : 'text-zinc-600 bg-zinc-800/20'
          }`}
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
