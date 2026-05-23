import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Loader,
  Brain,
  MessageSquare
} from 'lucide-react';

const AIChat = () => {
  const { getHeaders, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const messageText = input;
    setInput('');
    setSending(true);

    // Optimistically add user message to state
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: messageText })
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic message and append response
        setMessages(prev => {
          // Remove last (optimistic) and replace with official from DB
          const filtered = prev.slice(0, prev.length - 1);
          return [...filtered, data.userMessage, data.aiResponse];
        });
      } else {
        throw new Error('Failed to reach assistant');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I'm having trouble connecting to my cognitive processing network. Please verify your internet connection or try again." 
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all conversation logs with FINCE AI?')) return;
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error clearing chat history:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col justify-between glass-panel border border-darkborder overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center pulse-ring">
            <Brain className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              FINCE AI Assistant <Sparkles className="w-4 h-4 text-secondary fill-secondary" />
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">Powered by Gemini AI Engine</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-lg text-slate-400 hover:text-error hover:bg-error/10 transition-colors"
            title="Clear Chat Logs"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
        {loading ? (
          <div className="h-full flex flex-col justify-center items-center gap-2">
            <Loader className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-slate-400">Retrieving chat memories...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-secondary">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">Ask anything about your expenses</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                "How much did I spend on groceries this month?" or "What was my highest transaction at Amazon?" - FINCE AI will scan your ledger history and reply.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => {
              const isAI = msg.role === 'model';
              return (
                <div 
                  key={msg._id || idx} 
                  className={`flex gap-3 max-w-[85%] ${!isAI ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-semibold select-none ${
                    isAI 
                      ? 'bg-gradient-to-tr from-primary/10 to-secondary/10 border-primary/20 text-primary' 
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {isAI ? 'AI' : (user?.username?.substring(0, 2).toUpperCase() || 'U')}
                  </div>

                  {/* Message bubble */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-sans shadow-sm ${
                    isAI 
                      ? 'bg-white border border-slate-200 text-slate-800 font-medium' 
                      : 'bg-gradient-to-r from-primary to-secondary text-slate-900 font-bold shadow-glow-primary/10'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {/* Thinking status */}
            {sending && (
              <div className="flex gap-3 max-w-[85%] mr-auto text-left animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary/10 to-secondary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-1.5 font-mono shadow-sm">
                  <Loader className="w-3.5 h-3.5 animate-spin text-primary" /> FINCE AI is compiling response context...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your budgets or ledger spends..."
          disabled={sending}
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary text-slate-800 placeholder-slate-400 shadow-sm disabled:opacity-50 font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold glow-button flex items-center justify-center disabled:opacity-50 shrink-0 shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default AIChat;
