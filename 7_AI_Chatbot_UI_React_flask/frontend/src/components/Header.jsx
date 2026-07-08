import React from 'react';
import { MessageSquare, Menu, X } from 'lucide-react';

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-50">
      {/* Left: hamburger + branding */}
      <div className="flex items-center gap-3">
        {/* Hamburger / Close toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-700/50 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Brand icon + title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              AI Assistant
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-zinc-400">LangGraph Workflow API</p>
          </div>
        </div>
      </div>
    </header>
  );
}
