'use client';

import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Mic, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

export default function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative px-2 md:px-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-[#1e1f20] border border-[#444746] rounded-2xl md:rounded-3xl transition-all shadow-2xl"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask SuperNova..."
          className="w-full bg-transparent text-[#e3e3e3] px-4 md:px-6 py-4 pr-24 md:pr-32 outline-none resize-none min-h-[56px] max-h-[200px] text-[15px] md:text-[16px] placeholder-[#8e918f]"
          rows={1}
        />
        <div className="absolute right-2 bottom-2 md:right-3 md:bottom-3 flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`group relative p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[#c4c7c5] hover:bg-white/10'
              }`}
            title="Voice input"
          >
            <Mic size={20} />
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block px-3 py-1 bg-[#e3e3e3] text-black text-xs font-medium rounded shadow-lg whitespace-nowrap z-50">
              {isListening ? 'Stop' : 'Voice input'}
            </div>
          </button>
          
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="group relative p-2.5 bg-white text-black rounded-full hover:bg-[#e3e3e3] transition-all shadow-lg"
            >
              <Square size={20} fill="currentColor" />
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block px-3 py-1 bg-[#e3e3e3] text-black text-xs font-medium rounded shadow-lg whitespace-nowrap z-50">
                Stop
              </div>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="group relative p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-lg"
            >
              <SendHorizontal size={20} />
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block px-3 py-1 bg-[#e3e3e3] text-black text-xs font-medium rounded shadow-lg whitespace-nowrap z-50">
                Submit
              </div>
            </button>
          )}
        </div>
      </form>
      <p className="text-center text-[11px] text-[#8e918f] mt-3 tracking-wide">
        SuperNova can make mistakes. Verify important medical information.
      </p>
    </div>
  );
}
