"use client";

import {
  Menu,
  Edit,
  Star,
  ChevronRight,
  Plus,
  Settings,
  MessageSquare,
  Trash2,
} from "lucide-react";

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
  isHistoryLoading?: boolean;
  onDeleteChat: (chatId: string) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  isExpanded,
  setIsExpanded,
  onNewChat,
  onSelectChat,
  chatHistory,
  activeChatId,
  isHistoryLoading,
  onDeleteChat,
  onOpenSettings,
}: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-full bg-[#1e1f20] transition-all duration-300 ease-in-out 
        ${isExpanded ? "w-64 translate-x-0" : "w-[68px] -translate-x-full md:translate-x-0"} 
        flex flex-col shadow-2xl md:shadow-none`}
    >
      {/* Sidebar Toggle - Hidden on mobile, controlled by header hamburger */}
      <div className="pt-4 px-4 pb-2 hidden md:block">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 text-[#e3e3e3] transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 flex flex-col gap-1 text-[#e3e3e3]">
        {/* New Chat */}
        <button
          onClick={onNewChat}
          className={`mt-2 flex h-10 items-center rounded-full transition-colors ${isExpanded
              ? "bg-[#1a1a1c] hover:bg-[#282a2c] w-full px-3 gap-3 justify-start"
              : "hover:bg-white/10 w-10 justify-center"
            }`}
        >
          <Edit size={18} />
          {isExpanded && <span className="text-sm">New chat</span>}
        </button>

        {isExpanded && (
          <>
            {/* Nav Items */}

            {/* Chats History */}
            <div className="mt-4 flex-1">
              <h3 className="px-3 py-1.5 text-xs font-medium text-[#c4c7c5]">
                Chats
              </h3>
              <div className="mt-1 space-y-0.5">
                {isHistoryLoading ? (
                  <div className="px-3 py-2 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-6 bg-[#282a2c] rounded-full animate-pulse w-full"
                      ></div>
                    ))}
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-zinc-500 italic">
                    No history yet
                  </p>
                ) : (
                  chatHistory.map((chat) => (
                    <div
                      key={chat._id}
                      className="group relative flex items-center"
                    >
                      <button
                        onClick={() => onSelectChat(chat._id)}
                        className={`group relative flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors text-left ${
                          activeChatId === chat._id
                            ? "bg-[#282a2c] text-white font-medium"
                            : "text-[#e3e3e3] hover:bg-white/10"
                        }`}
                      >
                        <span className="truncate pr-8">{chat.title}</span>
                        {/* Tooltip for full title */}
                        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block px-3 py-1 bg-[#e3e3e3] text-black text-xs font-medium rounded shadow-lg whitespace-nowrap z-50">
                          {chat.title}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat._id);
                        }}
                        className={`absolute right-3 p-1.5 rounded-full text-[#c4c7c5] hover:bg-white/10 hover:text-red-400 transition-all ${
                          activeChatId === chat._id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        title="Delete chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Settings & Help Section */}
      <div className="p-3">
        <button
          onClick={onOpenSettings}
          className={`flex h-10 items-center rounded-full text-[#e3e3e3] hover:bg-white/10 transition-colors ${isExpanded
              ? "w-full px-3 gap-3 justify-start"
              : "w-10 justify-center"
            }`}
        >
          <div className="relative flex items-center justify-center">
            <Settings size={20} />
            {/* Blue notification dot */}
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#1e1f20]" />
          </div>
          {isExpanded && <span className="text-sm">Settings & help</span>}
        </button>
      </div>
    </aside>
  );
}
