'use client';

import { Sparkles, User } from 'lucide-react';
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
  isLoading?: boolean;
  isLast?: boolean;
}

export default function MessageItem({ msg, user, onSuggestionClick, isLoading, isLast }: MessageItemProps) {
  const suggestions = msg.role === 'assistant' ? parseSuggestions(msg.content) : [];
  const displayContent = cleanMessageContent(msg.content);

  return (
    <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${msg.role === 'user'
        ? 'bg-[#ab47bc] text-white'
        : 'bg-transparent text-blue-400'
        }`}>
        {msg.role === 'user' ? (
          user?.profilePicture ? (
            <Image width={100} height={100} src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-medium">
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <User size={16} />}
            </span>
          )
        ) : (
          <Sparkles size={24} />
        )}
      </div>
      <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
        <div className={`px-4 py-3 ${msg.role === 'user'
          ? 'bg-[#282a2c] text-[#e3e3e3] rounded-3xl rounded-tr-sm'
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
      </div>
    </div>
  );
}
