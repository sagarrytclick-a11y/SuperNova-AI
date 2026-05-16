'use client';

import { 
  History, 
  MessageSquare, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Settings
} from 'lucide-react';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onNewChat?: () => void;
}

export default function Sidebar({ isExpanded, setIsExpanded, onNewChat }: SidebarProps) {

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
          {isExpanded && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation / History */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          <NavItem 
            icon={<History size={20} />} 
            label="History" 
            isExpanded={isExpanded} 
            isActive 
          />
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Messages" 
            isExpanded={isExpanded} 
          />
        </div>

        {isExpanded && (
          <div className="mt-8">
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Recent Chats
            </h3>
            <div className="mt-2 space-y-1">
              {['Project Setup', 'API Integration', 'UI Components'].map((chat, i) => (
                <button
                  key={i}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <MessageSquare size={16} />
                  <span className="truncate">{chat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className={`flex items-center gap-3 ${!isExpanded && 'justify-center'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <User size={20} />
          </div>
          {isExpanded && (
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                John Doe
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Pro Plan
              </p>
            </div>
          )}
          {isExpanded && (
            <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ 
  icon, 
  label, 
  isExpanded, 
  isActive = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isExpanded: boolean;
  isActive?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
      } ${!isExpanded && 'justify-center px-0'}`}
    >
      <div className="shrink-0">{icon}</div>
      {isExpanded && <span>{label}</span>}
    </button>
  );
}
