'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ArrowLeft, MessageSquare } from 'lucide-react';

interface ChatItem {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SearchDashboardProps {
  token: string | null;
  onSelectChat: (chatId: string) => void;
  setActiveView: (view: 'chat' | 'search') => void;
  onDeleteChat: (chatId: string) => void;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const dStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowStart.getTime() - dStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7 && diffDays > 0) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export default function SearchDashboard({
  token,
  onSelectChat,
  setActiveView,
  onDeleteChat,
}: SearchDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryClient = useQueryClient();

  // Debounce the search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Use TanStack Query to fetch the chat history
  const { data: chats = [], isLoading, refetch } = useQuery<ChatItem[]>({
    queryKey: ['chatsHistory'],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch chat history');
      return res.json();
    },
    enabled: !!token,
  });

  // Filter the chats based on the debounced query
  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await onDeleteChat(chatId);
      // Invalidate the react-query cache so it updates instantly
      queryClient.setQueryData(['chatsHistory'], (old: ChatItem[] | undefined) => {
        return old ? old.filter((c) => c._id !== chatId) : [];
      });
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#131314] text-[#e3e3e3] p-4 md:p-8 overflow-y-auto">
      {/* Header and Back Button for Mobile */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <button
          onClick={() => setActiveView('chat')}
          className="p-2 rounded-full hover:bg-white/10 text-[#c4c7c5] hover:text-white transition-colors md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl md:text-2xl font-semibold text-white">Search Conversations</h2>
      </div>

      {/* Main Search Input Box */}
      <div className="max-w-3xl w-full mx-auto mb-8 relative">
        <div className="relative flex items-center bg-[#1e1f20] border border-[#444746] rounded-2xl md:rounded-3xl px-5 py-4 shadow-xl transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Search size={22} className="text-[#8e918f] mr-4 shrink-0" />
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-base md:text-lg text-[#e3e3e3] w-full outline-none placeholder-[#8e918f] font-normal"
            autoFocus
          />
        </div>
      </div>

      {/* Results Container */}
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#444746]/30 pb-3 mb-4">
          <h3 className="text-sm font-medium text-[#c4c7c5] tracking-wider uppercase">
            {searchQuery ? 'Search Results' : 'Recent Conversations'}
          </h3>
          <span className="text-xs text-[#8e918f]">
            {filteredChats.length} {filteredChats.length === 1 ? 'chat' : 'chats'} found
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-[#1e1f20]/50 rounded-2xl animate-pulse border border-[#444746]/10"
              />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-16 h-16 bg-[#1e1f20] rounded-full flex items-center justify-center text-[#8e918f] mb-4">
              <Search size={24} />
            </div>
            <p className="text-[#c4c7c5] font-medium text-base mb-1">
              {searchQuery ? 'No matching chats found' : 'No chats yet'}
            </p>
            <p className="text-sm text-[#8e918f] max-w-xs">
              {searchQuery
                ? "Try searching for different keywords or starting a new conversation."
                : "Ask SuperNova a question to start your first wellness chat."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => {
                  onSelectChat(chat._id);
                  setActiveView('chat');
                }}
                className="group flex items-center justify-between bg-[#1e1f20] hover:bg-[#282a2c] border border-[#444746]/30 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:translate-x-1"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="p-2 bg-[#131314] text-blue-400 rounded-xl group-hover:text-blue-300 transition-colors shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <span className="text-[#e3e3e3] font-medium text-sm md:text-base truncate">
                    {chat.title}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs md:text-sm text-[#8e918f]">
                    {formatRelativeDate(chat.updatedAt)}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, chat._id)}
                    className="p-2 rounded-full text-[#c4c7c5] hover:bg-[#131314] hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                    title="Delete chat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
