'use client';

import { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  user: any;
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export default function MessageList({ messages, user, onSuggestionClick, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-2 md:px-4">
      {messages.map((msg, i) => (
        <MessageItem
          key={i}
          msg={msg}
          user={user}
          onSuggestionClick={onSuggestionClick}
          isLoading={isLoading}
          isLast={i === messages.length - 1}
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
