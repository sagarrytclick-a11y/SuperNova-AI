'use client';

import { useState } from 'react';
import { Sparkles, User, Copy, Check, Pencil, ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';
import ThreeDots from '@/components/ThreeDots';
import { cleanMessageContent, parseSuggestions } from '@/lib/chat-utils';

interface MessageItemProps {
  msg: {
    role: 'user' | 'assistant';
    content: string;
  };
  user: any;
  onSuggestionClick: (suggestion: string) => void;
  onEditClick?: (content: string) => void;
  onRegenerate?: () => void;
  onFeedback?: (feedback: 'up' | 'down') => void;
  isLoading?: boolean;
  isLast?: boolean;
}

const ActionButton = ({ icon: Icon, tooltip, onClick }: { icon: any, tooltip: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="group relative p-1.5 hover:bg-white/10 rounded-full text-white transition-all"
    title={tooltip}
  >
    <Icon size={18} />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1 bg-white text-black text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50">
      {tooltip}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
    </div>
  </button>
);

export default function MessageItem({ msg, user, onSuggestionClick, onEditClick, onRegenerate, onFeedback, isLoading, isLast }: MessageItemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const suggestions = msg.role === 'assistant' ? parseSuggestions(msg.content) : [];
  const displayContent = cleanMessageContent(msg.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`flex gap-2 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${msg.role === 'user'
        ? 'bg-[#ab47bc] text-white'
        : 'bg-transparent text-blue-400'
        }`}>
        {msg.role === 'user' ? (
          user?.profilePicture ? (
            <Image width={100} height={100} src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] md:text-xs font-medium">
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User size={14} />}
            </span>
          )
        ) : (
          <Sparkles size={20} className="md:w-6 md:h-6" />
        )}
      </div>
      <div className={`flex flex-col max-w-[92%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
        <div className={`px-3 py-2 md:px-4 md:py-3 ${msg.role === 'user'
          ? 'bg-[#282a2c] text-[#e3e3e3] rounded-2xl md:rounded-3xl rounded-tr-sm'
          : 'bg-transparent text-[#e3e3e3] rounded-none'
          }`}>
          {msg.role === 'assistant' && !msg.content.trim() && isLoading ? (
            <div className="py-2">
              <ThreeDots />
            </div>
          ) : (
            <div className="prose prose-invert prose-pre:p-0 max-w-none text-[15px] leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock as any,
                  p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="px-4 py-2 bg-[#1e1f20] border border-[#444746] rounded-full text-sm text-[#e3e3e3] hover:bg-[#282a2c] transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Action Tray: Handles Copy Prompt, Edit Prompt, and Assistant Actions */}
        <div className={`flex items-center gap-3 mt-1.5 px-1 text-[#94A3B8] transition-opacity duration-200`}>
          {msg.role === 'user' ? (
            <>
              {onEditClick && (
                <button
                  onClick={() => onEditClick(msg.content)}
                  className="flex items-center gap-1 text-xs hover:text-[#e3e3e3] transition-colors"
                  title="Edit prompt"
                >
                  <Pencil size={13} />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs hover:text-[#e3e3e3] transition-colors"
                title="Copy prompt"
              >
                {isCopied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span className={isCopied ? 'text-green-400' : ''}>
                  {isCopied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </>
          ) : (
            (!isLoading || msg.content.trim()) && (
              <div className="flex items-center gap-2">
                <ActionButton 
                  icon={ThumbsUp} 
                  tooltip="Good response" 
                  onClick={() => onFeedback?.('up')} 
                />
                <ActionButton 
                  icon={ThumbsDown} 
                  tooltip="Bad response" 
                  onClick={() => onFeedback?.('down')} 
                />
                <ActionButton 
                  icon={RotateCcw} 
                  tooltip="Regenerate" 
                  onClick={onRegenerate} 
                />
                <ActionButton 
                  icon={Copy} 
                  tooltip="Copy response" 
                  onClick={handleCopy} 
                />
                <ActionButton 
                  icon={MoreHorizontal} 
                  tooltip="More" 
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}