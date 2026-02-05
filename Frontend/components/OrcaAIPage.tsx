import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
  Code,
  Copy,
  Check,
  Lightbulb,
  BookOpen,
  Zap
} from 'lucide-react';
import { chatAPI, ChatMessage } from '../services/api';

// ============================================
// MARKDOWN RENDERER FOR CODE BLOCKS
// ============================================
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
            <div key={index} className="bg-slate-900 rounded-lg overflow-hidden my-2 group">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-[10px] md:text-xs text-slate-400">
                <span className="font-medium">{language}</span>
                <button
                  onClick={() => handleCopy(code, index)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-700 transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={12} className="text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] md:text-xs">
                <code className="text-green-400 font-mono">{code}</code>
              </pre>
            </div>
          );
        }

        // Handle inline code with backticks
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <p key={index} className="leading-relaxed whitespace-pre-wrap text-slate-700 text-xs md:text-sm">
            {inlineParts.map((inlinePart, i) => {
              if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                return (
                  <code key={i} className="bg-slate-200 text-pink-600 px-1 py-0.5 rounded text-[11px] md:text-xs font-mono">
                    {inlinePart.slice(1, -1)}
                  </code>
                );
              }
              // Handle bold text
              const boldParts = inlinePart.split(/(\*\*[^*]+\*\*)/g);
              return boldParts.map((boldPart, j) => {
                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                  return <strong key={`${i}-${j}`} className="font-bold text-slate-800">{boldPart.slice(2, -2)}</strong>;
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
// MAIN ORCA AI PAGE COMPONENT
// ============================================
const OrcaAIPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of messages container only
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

  const quickPrompts = [
    { icon: <Code size={14} />, text: "Write Python code for linear regression", color: "from-blue-500 to-cyan-500" },
    { icon: <Lightbulb size={14} />, text: "Explain RAG architecture simply", color: "from-amber-500 to-orange-500" },
    { icon: <BookOpen size={14} />, text: "How to fine-tune a model with Unsloth?", color: "from-purple-500 to-pink-500" },
    { icon: <Zap size={14} />, text: "Debug my PyTorch training loop", color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex-shrink-0 mb-3 md:mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#00A0E3] to-[#0060A9] rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                <Bot size={18} className="text-white" />
              </div>
              OrcaAI Assistant
              <Sparkles size={16} className="text-yellow-500" />
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5 ml-10 md:ml-11">Your AI coding companion - Get help with projects, debug code, and learn concepts</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl md:rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-0">
        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4"
          style={{ overscrollBehavior: 'contain' }}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-3 md:px-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-md">
                <Bot size={28} className="text-[#00A0E3] md:hidden" />
                <Bot size={32} className="text-[#00A0E3] hidden md:block" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1.5">How can I help you today?</h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mb-5">
                I can help you write code, explain AI/ML concepts, debug errors, and guide you through your projects.
              </p>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(prompt.text);
                      inputRef.current?.focus({ preventScroll: true });
                    }}
                    className="flex items-center gap-2.5 p-2.5 md:p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-[#00A0E3] hover:shadow-sm transition-all group"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${prompt.color} rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform flex-shrink-0`}>
                      {prompt.icon}
                    </div>
                    <span className="text-slate-600 font-medium text-xs leading-snug">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 md:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-[#00A0E3] to-[#0060A9]'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User size={14} className="text-white md:hidden" />
                    ) : (
                      <Bot size={14} className="text-white md:hidden" />
                    )}
                    {message.role === 'user' ? (
                      <User size={16} className="text-white hidden md:block" />
                    ) : (
                      <Bot size={16} className="text-white hidden md:block" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] md:max-w-[75%] rounded-xl md:rounded-2xl px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm'
                        : 'bg-slate-50 border border-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MessageContent content={message.content} />
                    ) : (
                      <p className="leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#00A0E3] to-[#0060A9] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot size={14} className="text-white md:hidden" />
                    <Bot size={16} className="text-white hidden md:block" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl rounded-tl-sm px-3 py-2.5 md:px-4 md:py-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm">
                      <Loader2 size={16} className="animate-spin text-[#00A0E3]" />
                      <span className="font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-2.5 md:p-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-end gap-2 bg-white rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-2.5 border-2 border-slate-200 focus-within:border-[#00A0E3] transition-colors shadow-sm">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about AI, ML, or your projects..."
              className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-700 placeholder-slate-400 resize-none min-h-[22px] max-h-[100px]"
              rows={1}
              disabled={isLoading}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-r from-[#00A0E3] to-[#0060A9] rounded-lg md:rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 mt-1.5 text-center">
            Press Enter to send, Shift+Enter for new line. Responses may not always be accurate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrcaAIPage;
