import React from 'react';
import { MessageSquare, RotateCcw, Shield } from 'lucide-react';

export default function Header({ onReset }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            AI Assistant
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </h1>
          <p className="text-xs text-zinc-400">LangGraph Workflow API</p>
        </div>
      </div>
      
      <button
        onClick={onReset}
        title="Reset conversation"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer"
      >
        <RotateCcw size={14} />
        <span>New Thread</span>
      </button>
    </header>
  );
}
