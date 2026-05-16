'use client';

import { 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  LogOut,
  User
} from 'lucide-react';

interface ChatHistoryItem {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  chatHistory: ChatHistoryItem[];
  activeChatId: string | null;
  onLogout: () => void;
}

export default function Sidebar({ 
  isExpanded, 
  setIsExpanded, 
  onNewChat, 
  onSelectChat, 
  chatHistory, 
  activeChatId,
  onLogout
}: SidebarProps) {

  return (
    <aside 
      className={`fixed left-0 top-0 z-20 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-20'
      } flex flex-col`}
    >
      {/* Sidebar Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-blue-400"
      >
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Top Section: New Chat */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 ${
            !isExpanded && 'px-0 justify-center'
          }`}
        >
          <Plus size={20} />
          {isExpanded && <span>New Consultation</span>}
        </button>
      </div>

      {/* Navigation / History */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isExpanded && (
          <div className="mt-4">
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recent History
            </h3>
            <div className="mt-2 space-y-1">
              {chatHistory.length === 0 ? (
                <p className="px-4 text-xs text-zinc-400 italic mt-4">No history yet</p>
              ) : (
                chatHistory.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => onSelectChat(chat._id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors ${
                      activeChatId === chat._id 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <MessageSquare size={16} />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        {!isExpanded && (
          <div className="flex flex-col items-center gap-4 mt-4">
            {chatHistory.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                title={chat.title}
                className={`p-2 rounded-lg transition-colors ${
                  activeChatId === chat._id 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <MessageSquare size={20} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Logout Section */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button
          onClick={onLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors ${
            !isExpanded && 'justify-center px-0'
          }`}
        >
          <LogOut size={20} />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
