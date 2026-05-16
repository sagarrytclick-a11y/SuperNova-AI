'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Copy, Check, ArrowUp  } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import copy from 'copy-to-clipboard';

import Sidebar from '@/components/Sidebar';
import AuthForm from '@/components/AuthForm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistoryItem {
  _id: string;
  title: string;
  updatedAt: string;
}

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

function CodeBlock({ className, children, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copy(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match) {
    return (
      <code className="bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 font-mono text-xs" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {match[1]}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          backgroundColor: 'transparent',
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
}

function ThreeDots() {
  return (
    <div className="flex space-x-1 items-center h-4">
      <div className="h-1.5 w-1.5 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-1.5 w-1.5 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-1.5 w-1.5 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce"></div>
    </div>
  );
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    if (!token) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch('/api/chat', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchChatDetails = async (chatId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat?chatId=${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveChatId(chatId);
      }
    } catch (err) {
      console.error('Failed to fetch chat details', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !token) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
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
          chatId: activeChatId
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const returnedChatId = response.headers.get('X-Chat-Id');
      if (returnedChatId && !activeChatId) {
        setActiveChatId(returnedChatId);
        fetchHistory(); // Refresh history to show new chat
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantMessage += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantMessage;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setMessages([]);
    setActiveChatId(null);
    setChatHistory([]);
  };

  if (!token) {
    return <AuthForm onAuthSuccess={(t, u) => setToken(t)} />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded}
        onNewChat={handleNewChat}
        onSelectChat={fetchChatDetails}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onLogout={handleLogout}
      />

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">🩺</span>
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-white">Health Assistant</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                AI Agent Online
              </p>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-4xl animate-bounce">
                🌱
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome to your Health Portal</h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                  I'm your AI wellness assistant. Ask me anything about diet, exercise, or healthy living.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {[
                  "What's a balanced meal plan for energy?",
                  "Easy 15-minute home workouts",
                  "How to improve my sleep quality?",
                  "Healthy snack alternatives"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-4 text-sm text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.role === 'user' 
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} className="text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {msg.role === 'assistant' && !msg.content.trim() ? (
                        <div className="py-2">
                          <ThreeDots />
                        </div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: CodeBlock,
                            p: ({ children }: { children?: React.ReactNode }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc ml-4 mb-4 space-y-2">{children}</ul>,
                            ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal ml-4 mb-4 space-y-2">{children}</ol>,
                            h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                            h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
                            h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Fallback loader if the assistant message hasn't even been added to the array yet */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30">
                    <Bot size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col max-w-[80%]">
                    <div className="rounded-2xl px-4 py-3 shadow-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none">
                      <div className="py-2">
                        <ThreeDots />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl w-full flex mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about health, diet, or exercise..."
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 pr-14 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[60px] max-h-[200px] transition-all text-zinc-900 dark:text-white"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={20} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-400 mt-3 uppercase tracking-widest font-medium">
            Powered by OpenRouter AI • Health & Wellness Specialist
          </p>
        </div>
      </main>
    </div>
  );
}
