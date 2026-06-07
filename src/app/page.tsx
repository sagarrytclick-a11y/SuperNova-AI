'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  User, Bot, Check, Sparkles, LayoutGrid, Circle,
  Download, X, Mic, SendHorizontal, Square, Pencil, Copy,
  Menu
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import copy from 'copy-to-clipboard';

import Sidebar from '@/components/Sidebar';
import HealthProfileModal from '@/components/HealthProfileModal';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import SearchDashboard from '@/components/chat/SearchDashboard';
import { useUser } from '@/hooks/useUser';
import { useChat, useChatDetails } from '@/hooks/useChat';
import { formatChatForExport, downloadChatExport } from '@/lib/chat-utils';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Default false for mobile
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isHealthProfileModalOpen, setIsHealthProfileModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Standard');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatSwitching, setIsChatSwitching] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'search'>('chat');
  const lastChatIdRef = useRef<string | null>(null);

  // Data fetching hooks (Refactored from TanStack Query)
  const { user, updateProfile } = useUser(token);
  const { history, isHistoryLoading, deleteChat, clearAllChats, refreshHistory } = useChat(token);
  const { data: activeChatDetails, refreshDetails, isLoading: isDetailsLoading } = useChatDetails(token, activeChatId);
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Click outside listener for profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Auth check
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !token) {
      router.push('/login');
    }
  }, [token, isCheckingAuth, router]);

  // Load chat details
  // Screen size check for initial sidebar state
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarExpanded(true);
    }
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setActiveView((prev) => prev === 'search' ? 'chat' : 'search');
      }
      if (e.key === 'Escape' && activeView === 'search') {
        setActiveView('chat');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeView]);

  // Sync messages from server
  useEffect(() => {
    // 1. Handle "New Chat" state (activeChatId is null)
    if (!activeChatId) {
      if (messages.length > 0 && !isLoading) {
        setMessages([]);
      }
      setIsChatSwitching(false);
      lastChatIdRef.current = null;
      return;
    }

    const isChatSwitch = activeChatId !== lastChatIdRef.current;

    // 2. Handle Chat Switch (user clicked a different chat)
    if (isChatSwitch) {
      setIsChatSwitching(true);
      // If the details we have match the active chat ID, sync them
      if (activeChatDetails?._id === activeChatId) {
        setMessages(activeChatDetails.messages || []);
        lastChatIdRef.current = activeChatId;
        setIsChatSwitching(false);
      } else {
        // We switched IDs but don't have the data for the new ID yet.
        // Clear local messages unless we are currently streaming a response for this new ID.
        if (!isLoading) {
          if (messages.length > 0) {
            setMessages([]);
          }
          // Note: We don't update lastChatIdRef.current here yet. 
          // We wait until data arrives or stream starts to consider the switch "complete".
        } else {
          // We are streaming. This happens when a new chat is started.
          // Acknowledge the switch so we don't keep hitting this block.
          lastChatIdRef.current = activeChatId;
          setIsChatSwitching(false);
        }
      }
      return;
    }

    // 3. Handle Background/Final Sync (same ID, data updated)
    if (activeChatDetails?._id === activeChatId && !isLoading && !isDetailsLoading) {
      setIsChatSwitching(false);
      // Only sync if the server data is as long or longer than local state (not stale)
      if (activeChatDetails.messages?.length >= messages.length) {
        if (JSON.stringify(activeChatDetails.messages) !== JSON.stringify(messages)) {
          setMessages(activeChatDetails.messages);
        }
      }
    }
  }, [activeChatId, activeChatDetails, isLoading, isDetailsLoading, messages.length]);

  const handleUpdateHealthProfile = async (healthData: any) => {
    try {
      await updateProfile({ healthProfile: healthData });
      setIsHealthProfileModalOpen(false);
    } catch (err) {
      console.error('Failed to update health profile', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);
      queryClient.invalidateQueries({ queryKey: ['chatsHistory'] });
      if (activeChatId === chatId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const handleClearAllChats = async () => {
    try {
      await clearAllChats();
      queryClient.invalidateQueries({ queryKey: ['chatsHistory'] });
      setMessages([]);
      setActiveChatId(null);
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error('Failed to clear all chats', err);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const content = formatChatForExport(messages);
    downloadChatExport(content);
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateProfile({ profilePicture: base64String });
        setIsProfileMenuOpen(false);
      } catch (err) {
        console.error('Upload failed', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    
    // Remove the last assistant response before regenerating
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'assistant') {
        newMsgs.pop();
      }
      return newMsgs;
    });
    
    await handleSend(lastUserMsg.content);
  };

  const handleFeedback = (feedback: 'up' | 'down') => {
    console.log(`Feedback received: ${feedback}`);
    // Implement feedback API call here
  };

  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !token) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const newMessage = { role: 'user', content: userMessage };
    const assistantPlaceholder = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, newMessage, assistantPlaceholder]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messageContent: userMessage,
          chatId: activeChatId,
          mode: selectedMode
        }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error('Failed to send message');

      const returnedChatId = response.headers.get('X-Chat-Id');
      if (returnedChatId && !activeChatId) {
        setActiveChatId(returnedChatId);
        refreshHistory();
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get stream reader');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          // Find the LAST assistant message in the array to update it
          // This is safer than just using length - 1
          let found = false;
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'assistant') {
              newMessages[i].content = assistantMessage;
              found = true;
              break;
            }
          }
          // Fallback if the placeholder was somehow removed (e.g. by a background sync)
          if (!found) {
            return [...newMessages, { role: 'assistant', content: assistantMessage }];
          }
          return newMessages;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
            newMessages[newMessages.length - 1].content = 'Sorry, I encountered an error. Please try again.';
          }
          return newMessages;
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);

      refreshHistory();
      if (activeChatId) {
        refreshDetails();
      }
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setActiveView('chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setMessages([]);
    setActiveChatId(null);
    router.push('/login');
  };

  if (isCheckingAuth || !token) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden relative">
      {/* Sidebar Backdrop - visible only on mobile when expanded */}
      {isSidebarExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarExpanded(false)}
        />
      )}

      <Sidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        onNewChat={handleNewChat}
        onSelectChat={(id) => setActiveChatId(id)}
        chatHistory={history}
        activeChatId={activeChatId}
        onLogout={handleLogout}
        isHistoryLoading={isHistoryLoading}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className={`flex-1 flex flex-col transition-all duration-300 w-full ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-[68px]'}`}>
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-[#131314] z-10 border-b border-[#444746]/30 md:border-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2 -ml-2 text-[#c4c7c5] hover:text-[#e3e3e3] md:hidden"
            >
              <Menu size={24} />
            </button>
            <Image src="/logo-2.png" alt="AI" width={30} height={30} />
            <h1 className="text-xl md:text-[22px] font-medium text-[#e3e3e3]">SuperNova</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative hidden sm:block">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="appearance-none w-full bg-[#1E212B] border border-[#444746] rounded-full pl-4 pr-10 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#4A90E2] hover:bg-[#282a2c] transition-all cursor-pointer"
              >
                <option value="Standard">Standard Mode</option>
                <option value="Supportive">Supportive Coach</option>
                <option value="Strict">Drill Sergeant</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8]">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="p-2 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-white/10 rounded-full transition-all"
                title="Export chat"
              >
                <Download size={20} />
              </button>
            )}
            <Link href="/pricing" className="flex items-center gap-2 bg-[#004a77] hover:bg-[#005c94] text-[#c2e7ff] text-sm font-medium px-4 py-2 rounded-full transition-colors">
              <Sparkles size={16} />
              <span className="hidden sm:inline">Upgrade</span>
            </Link>

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-8 h-8 rounded-full bg-[#ab47bc] overflow-hidden flex items-center justify-center text-sm font-medium text-white hover:opacity-90 transition-opacity"
                title="Account menu"
              >
                {user?.profilePicture ? (
                  <Image width={100} height={100} src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User size={16} />
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#282a2c] rounded-2xl shadow-xl border border-[#444746] overflow-hidden z-50">
                  <div className="p-4 border-b border-[#444746]">
                    <div className="font-medium text-[#e3e3e3] truncate">{user?.username || 'User'}</div>
                    <div className="text-sm text-[#c4c7c5] truncate">{user?.email}</div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsHealthProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[#e3e3e3] hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Health Profile
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left px-3 py-2 text-sm text-[#e3e3e3] hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Upload Picture
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'search' ? (
            <SearchDashboard
              token={token}
              onSelectChat={(id) => setActiveChatId(id)}
              setActiveView={setActiveView}
              onDeleteChat={handleDeleteChat}
            />
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                  <div className="flex flex-col items-center gap-6 mb-12 animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-[#131314] flex items-center justify-center shadow-2xl">
                      <Image src="/logo-2.png" alt="AI" width={70} height={70} />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl md:text-4xl font-semibold mb-3 ">
                        Hello, {user?.username || 'Wellness Explorer'}
                      </h2>
                      <p className="text-[#c4c7c5] text-base md:text-lg max-w-md mx-auto">
                        How can I help you reach your health and fitness goals today?
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
                    {[
                      { icon: <Bot className="text-blue-400" />, title: "Meal Planning", desc: "Create a 7-day personalized diet plan." },
                      { icon: <LayoutGrid className="text-purple-400" />, title: "Workout Routine", desc: "Build a strength training program." },
                      { icon: <Circle className="text-green-400" />, title: "Health Analysis", desc: "Calculate your BMR and TDEE metrics." }
                    ].map((card, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(card.desc)}
                        className="p-5 bg-[#1e1f20] border border-[#444746] rounded-2xl text-left hover:bg-[#282a2c] transition-all group hover:scale-[1.02] duration-300 shadow-lg"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#131314] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          {card.icon}
                        </div>
                        <h3 className="text-[#e3e3e3] font-medium mb-1">{card.title}</h3>
                        <p className="text-[#8e918f] text-sm leading-relaxed">{card.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8">
                  {(isChatSwitching || (isDetailsLoading && activeChatId && messages.length === 0)) ? (
                    <div className="max-w-4xl mx-auto space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#282a2c] animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-[#282a2c] rounded animate-pulse w-3/4" />
                              <div className="h-4 bg-[#282a2c] rounded animate-pulse w-1/2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <MessageList
                      messages={messages}
                      user={user}
                      onSuggestionClick={handleSend}
                      onRegenerate={handleRegenerate}
                      onFeedback={handleFeedback}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
                <ChatInput
                  onSend={handleSend}
                  isLoading={isLoading}
                  onStop={handleStop}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#1e1f20] border border-[#444746] rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-4">
              <User size={24} />
            </div>
            <h3 className="text-xl font-semibold text-[#e3e3e3] mb-2">Are you sure?</h3>
            <p className="text-[#c4c7c5] mb-6 text-sm">Do you really want to log out of SuperNova?</p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#444746] text-[#e3e3e3] hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  handleLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors font-medium"
              >
                Yes, Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Profile Modal */}
      <HealthProfileModal
        isOpen={isHealthProfileModalOpen}
        onClose={() => setIsHealthProfileModalOpen(false)}
        initialData={user?.healthProfile as any}
        onSave={handleUpdateHealthProfile}
      />

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#1e1f20] border border-[#444746] rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#444746]">
              <h3 className="text-lg font-semibold text-[#e3e3e3]">Settings & Help</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-[#c4c7c5]">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Data Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[#c4c7c5] uppercase tracking-wider">Data Management</h4>
                <div className="p-4 bg-[#131314] rounded-xl border border-[#444746] flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#e3e3e3] font-medium">Clear Chat History</p>
                    <p className="text-xs text-[#8e918f]">Delete all your conversations forever</p>
                  </div>
                  <button
                    onClick={handleClearAllChats}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Help Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[#c4c7c5] uppercase tracking-wider">Quick Help</h4>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start text-sm text-[#e3e3e3]">
                    <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                    <p><span className="font-bold text-blue-400">Personalization:</span> Set your profile in the top-right menu for better AI advice.</p>
                  </div>
                  <div className="flex gap-3 items-start text-sm text-[#e3e3e3]">
                    <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                    <p><span className="font-bold text-blue-400">Voice:</span> Use the mic icon to talk to SuperNova hands-free.</p>
                  </div>
                  <div className="flex gap-3 items-start text-sm text-[#e3e3e3]">
                    <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                    <p><span className="font-bold text-blue-400">Shortcuts:</span> Press <kbd className="bg-[#282a2c] px-1 rounded border border-[#444746]">Enter</kbd> to send, <kbd className="bg-[#282a2c] px-1 rounded border border-[#444746]">Shift+Enter</kbd> for new line.</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 text-center border-t border-[#444746]/50">
                <p className="text-[10px] text-[#8e918f] uppercase tracking-widest">SuperNova v1.2.0 • Created with Love</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
