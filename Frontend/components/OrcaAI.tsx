import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2
} from 'lucide-react';
import { chatAPI, ChatMessage } from '../services/api';

// ============================================
// MARKDOWN RENDERER FOR CODE BLOCKS
// ============================================
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const lines = part.slice(3, -3).split('\n');
          const language = lines[0] || 'code';
          const code = lines.slice(1).join('\n');

          return (
            <div key={index} className="bg-slate-900 rounded-xl overflow-hidden my-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-xs text-slate-400">
                <span>{language}</span>
              </div>
              <pre className="p-3 overflow-x-auto text-sm">
                <code className="text-green-400 font-mono">{code}</code>
              </pre>
            </div>
          );
        }

        // Handle inline code with backticks
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <p key={index} className="leading-relaxed whitespace-pre-wrap">
            {inlineParts.map((inlinePart, i) => {
              if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                return (
                  <code key={i} className="bg-slate-200 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">
                    {inlinePart.slice(1, -1)}
                  </code>
                );
              }
              // Handle bold text
              const boldParts = inlinePart.split(/(\*\*[^*]+\*\*)/g);
              return boldParts.map((boldPart, j) => {
                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                  return <strong key={`${i}-${j}`} className="font-bold">{boldPart.slice(2, -2)}</strong>;
                }
                return boldPart;
              });
            })}
          </p>
        );
      })}
    </div>
  );
};

// ============================================
// MAIN ORCA AI COMPONENT
// ============================================
const OrcaAI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages container only (not the page)
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens (without scrolling the page)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use preventScroll to avoid page jumping
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(userMessage.content, messages);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response || 'Sorry, I could not process your request.',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle input focus without page scroll
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.focus({ preventScroll: true });
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            isExpanded
              ? 'inset-4 md:inset-auto md:bottom-6 md:right-6 md:w-[550px] md:h-[calc(100vh-100px)] md:max-h-[700px]'
              : 'bottom-24 right-4 w-[360px] h-[500px] md:bottom-6 md:right-6 md:w-[400px] md:h-[520px]'
          }`}
          style={{ isolation: 'isolate' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0060A9] to-[#00A0E3] p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  OrcaAI
                  <Sparkles size={14} className="text-yellow-300" />
                </h3>
                <p className="text-blue-100 text-xs font-medium">Your AI Learning Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Clear chat"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={toggleExpand}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white hidden md:block"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area - with isolated scroll */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 overscroll-contain"
            style={{ overscrollBehavior: 'contain' }}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Bot size={40} className="text-[#00A0E3]" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">Welcome to OrcaAI!</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  I'm here to help you learn AI & ML concepts, debug code, and guide you through your projects.
                </p>
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                  {[
                    "Explain what is RAG?",
                    "How do I train a model?",
                    "What is prompt engineering?"
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputValue(suggestion);
                        inputRef.current?.focus({ preventScroll: true });
                      }}
                      className="text-left px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-[#00A0E3] hover:text-[#00A0E3] transition-colors shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-[#00A0E3] to-[#0060A9]'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <MessageContent content={message.content} />
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00A0E3] to-[#0060A9] flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 border-2 border-transparent focus-within:border-[#00A0E3] focus-within:bg-white transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Ask me anything about AI/ML..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="w-9 h-9 bg-gradient-to-r from-[#00A0E3] to-[#0060A9] rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Responses may not always be accurate.
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-r from-[#0060A9] to-[#00A0E3] rounded-full shadow-lg shadow-blue-300/50 flex items-center justify-center text-white hover:shadow-xl hover:scale-110 transition-all group"
        >
          <MessageCircle size={26} className="group-hover:scale-110 transition-transform" />
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-[#00A0E3] animate-ping opacity-20"></span>
        </button>
      )}
    </>
  );
};

export default OrcaAI;
