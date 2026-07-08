import React from 'react';
import { MessageSquare, Plus, Clock, X, Bot } from 'lucide-react';

/**
 * Sidebar — shows branding, a "Start Chat" button, and the full thread list.
 *
 * Props:
 *   isOpen         : boolean  — whether the sidebar is visible
 *   onClose        : () => void — close the sidebar (mobile overlay click)
 *   threadIds      : string[] — all thread IDs, newest first
 *   activeThreadId : string   — currently active thread ID
 *   getThreadTitle : (id: string) => string — returns human label for a thread
 *   onNewChat      : () => void — start a fresh conversation
 *   onSwitchThread : (id: string) => void — load an existing conversation
 */
export default function Sidebar({
  isOpen,
  onClose,
  threadIds,
  activeThreadId,
  getThreadTitle,
  onNewChat,
  onSwitchThread,
}) {
  const handleThreadClick = (id) => {
    onSwitchThread(id);
    // On mobile, auto-close after selection
    if (window.innerWidth < 768) onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* ---------- Mobile backdrop ---------- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* ---------- Sidebar panel ---------- */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-40
          bg-zinc-900 border-r border-zinc-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
          ${!isOpen ? 'md:hidden' : ''}
        `}
      >
        {/* ── Header / Branding ── */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100 leading-tight">AI Assistant</p>
              <p className="text-[10px] text-zinc-500 leading-tight">LangGraph Workflow</p>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── New Chat Button ── */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-purple-600 hover:bg-purple-500 active:scale-95
                       text-white text-sm font-medium
                       transition-all duration-200 shadow-lg shadow-purple-900/30
                       cursor-pointer"
          >
            <Plus size={16} />
            Start Chat
          </button>
        </div>

        {/* ── Conversation List ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {/* Section label */}
          <div className="flex items-center gap-2 px-2 py-3">
            <Clock size={12} className="text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              My Conversations
            </span>
          </div>

          {threadIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <MessageSquare size={28} className="text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-600">No conversations yet.<br />Start chatting!</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {threadIds.map((id) => {
                const isActive = id === activeThreadId;
                const title = getThreadTitle(id);
                return (
                  <li key={id}>
                    <button
                      onClick={() => handleThreadClick(id)}
                      title={title}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-sm
                        flex items-center gap-2.5 group
                        transition-all duration-150 cursor-pointer
                        ${
                          isActive
                            ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent'
                        }
                      `}
                    >
                      {/* Active indicator dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                          isActive ? 'bg-purple-400' : 'bg-zinc-700 group-hover:bg-zinc-500'
                        }`}
                      />
                      <span className="truncate leading-snug">{title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-600 text-center">
            Conversations stored locally
          </p>
        </div>
      </aside>
    </>
  );
}
