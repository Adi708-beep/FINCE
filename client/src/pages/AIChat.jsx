import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Plus, 
  MessageSquare, 
  Edit2, 
  Check, 
  Sparkles, 
  User, 
  Trash2, 
  Loader2, 
  Brain 
} from 'lucide-react';

const AIChat = () => {
  const { getHeaders, user } = useAuth();
  
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem('fince_chat_threads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'copilot', title: 'Financial Copilot', date: 'Persistent', system: true }
    ];
  });
  
  const [activeThreadId, setActiveThreadId] = useState('copilot');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');
  
  const messagesEndRef = useRef(null);

  const fetchPersistentHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(msg => ({
          id: msg._id,
          sender: msg.role === 'model' ? 'ai' : 'user',
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Error fetching persistent chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeThreadId === 'copilot') {
      fetchPersistentHistory();
    } else {
      const thread = threads.find(t => t.id === activeThreadId);
      if (thread) {
        setMessages(thread.messages || []);
      }
      setLoading(false);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewChat = () => {
    const newThread = {
      id: Date.now(),
      title: "New Conversation",
      date: "Today",
      messages: []
    };
    const updated = [newThread, ...threads];
    setThreads(updated);
    localStorage.setItem('fince_chat_threads', JSON.stringify(updated));
    setActiveThreadId(newThread.id);
  };

  const saveTitle = (id) => {
    if (editTitleText.trim()) {
      const updated = threads.map(t => t.id === id ? { ...t, title: editTitleText.trim() } : t);
      setThreads(updated);
      localStorage.setItem('fince_chat_threads', JSON.stringify(updated));
    }
    setEditingThreadId(null);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const messageText = input;
    setInput('');
    setSending(true);

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      time: timeString
    };

    // Optimistically add message
    setMessages(prev => [...prev, userMsg]);

    if (activeThreadId === 'copilot') {
      try {
        const res = await fetch(`${API_URL}/api/ai/chat`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ message: messageText })
        });

        if (res.ok) {
          const data = await res.json();
          setMessages(prev => {
            const filtered = prev.slice(0, prev.length - 1);
            return [
              ...filtered,
              {
                id: data.userMessage._id,
                sender: 'user',
                text: data.userMessage.content,
                time: new Date(data.userMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              },
              {
                id: data.aiResponse._id,
                sender: 'ai',
                text: data.aiResponse.content,
                time: new Date(data.aiResponse.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ];
          });
        } else {
          throw new Error('Failed to reach assistant');
        }
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I'm having trouble connecting to my cognitive processing network. Please verify your internet connection or try again.",
          time: timeString
        }]);
      } finally {
        setSending(false);
      }
    } else {
      // Offline/Sandbox thread simulation
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 2,
          sender: 'ai',
          text: `I have received your scenario simulation query: **"${messageText}"**.\n\nIn this offline sandbox mode, you can map out financial projections or test budget rules. For full intelligence parsing with your actual ledger database context, please switch to the **Financial Copilot** channel.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => {
          const updated = [...prev, aiResponse];
          setThreads(currentThreads => {
            const newThreads = currentThreads.map(t => {
              if (t.id === activeThreadId) {
                let newTitle = t.title;
                if (t.title === "New Conversation" && (t.messages || []).length === 0) {
                  const words = messageText.trim().split(' ');
                  newTitle = words.length > 3 ? words.slice(0, 3).join(' ') + '...' : messageText.trim();
                }
                return {
                  ...t,
                  title: newTitle,
                  messages: [...(t.messages || []), userMsg, aiResponse]
                };
              }
              return t;
            });
            localStorage.setItem('fince_chat_threads', JSON.stringify(newThreads));
            return newThreads;
          });
          return updated;
        });
        setSending(false);
      }, 1000);
    }
  };

  const handleClearHistory = async () => {
    if (activeThreadId === 'copilot') {
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
    } else {
      if (!window.confirm('Delete this conversation?')) return;
      const updated = threads.filter(t => t.id !== activeThreadId);
      setThreads(updated);
      localStorage.setItem('fince_chat_threads', JSON.stringify(updated));
      setActiveThreadId('copilot');
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let content = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const cleanContent = line.replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mb-1 text-slate-700 font-medium">
            {boldRegex.test(line) ? parts : cleanContent}
          </li>
        );
      }
      
      if (line.startsWith('###')) {
        return <h5 key={idx} className="text-xs font-bold text-slate-900 mt-3 mb-1">{line.replace(/^###\s+/, '')}</h5>;
      }
      if (line.startsWith('##')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-950 mt-4 mb-1.5">{line.replace(/^##\s+/, '')}</h4>;
      }
      if (line.startsWith('#')) {
        return <h3 key={idx} className="text-base font-bold text-slate-950 mt-5 mb-2">{line.replace(/^#\s+/, '')}</h3>;
      }

      if (line.trim() === '') return <div key={idx} className="h-1.5" />;

      return <p key={idx} className="mb-1 text-slate-700 font-medium">{parts.length > 0 ? parts : content}</p>;
    });
  };

  const activeChat = threads.find(t => t.id === activeThreadId) || threads[0];

  return (
    <div className="flex h-[80vh] overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm animate-fade-in font-sans">
      
      {/* Chat History Inner Sidebar */}
      <div className="w-64 bg-[#F8FAFC]/65 border-r border-slate-100 flex flex-col h-full flex-shrink-0 hidden md:flex">
        <div className="p-4 border-b border-slate-100">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <Plus size={14} />
            New Scenario Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">CHANNELS</h3>
            <div className="space-y-1">
              {threads.map(chat => (
                <div key={chat.id} className="relative group">
                  {editingThreadId === chat.id ? (
                    <div className="flex items-center gap-2 px-2.5 py-2 bg-white shadow-sm border border-blue-200 rounded-xl mb-1">
                      <input
                        type="text"
                        className="flex-1 w-full bg-transparent text-xs font-semibold outline-none text-slate-900"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(chat.id);
                        }}
                        onBlur={() => saveTitle(chat.id)}
                        autoFocus
                      />
                      <button onClick={() => saveTitle(chat.id)} className="text-green-500 hover:text-green-600 flex-shrink-0">
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveThreadId(chat.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left ${
                        activeThreadId === chat.id 
                          ? 'bg-white shadow-sm border border-slate-200/50 text-slate-900' 
                          : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                      }`}
                    >
                      <MessageSquare size={14} className={activeThreadId === chat.id ? 'text-blue-500 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
                      <div className="flex-1 truncate pr-5">
                        <p className="text-xs font-semibold truncate">{chat.title}</p>
                      </div>
                    </button>
                  )}
                  
                  {!chat.system && editingThreadId !== chat.id && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingThreadId(chat.id);
                        setEditTitleText(chat.title);
                      }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all ${
                        activeThreadId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-[#F8FAFC]/10">
        
        {/* Chat Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-650 flex items-center justify-center text-white shadow-sm shadow-blue-500/10">
              <Brain size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">{activeChat.title}</h1>
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                FINCE INTEL ENGINE
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title={activeThreadId === 'copilot' ? "Clear persistent chat history" : "Delete sandbox conversation"}
          >
            <Trash2 size={16} />
          </button>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/20">
          {loading ? (
            <div className="h-full flex flex-col justify-center items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs text-slate-400 font-mono">Retrieving financial memories...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-150 flex items-center justify-center text-blue-500 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">Ask FINCE AI anything</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  "Analyze my latest grocery spends" or "Am I on track with my monthly budget limit?" - ask about subscriptions, transactions, or financial insights.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${!isAI ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-[10px] font-bold select-none ${
                      isAI 
                        ? 'bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border-blue-100 text-blue-600' 
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {isAI ? 'AI' : (user?.username?.substring(0, 2).toUpperCase() || 'U')}
                    </div>

                    {/* Message bubble */}
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans shadow-sm ${
                      isAI 
                        ? 'bg-white border border-slate-200 text-slate-800 font-medium' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold'
                    }`}>
                      {isAI ? renderMarkdown(msg.text) : msg.text}
                      <span className={`text-[9px] block mt-2 font-medium opacity-50 ${isAI ? 'text-slate-400' : 'text-blue-100'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Thinking status */}
              {sending && (
                <div className="flex gap-3 max-w-[85%] mr-auto text-left animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border border-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    AI
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-1.5 font-mono shadow-sm">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> compiling response context...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative flex items-center bg-[#F8FAFC] border border-slate-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
              <button type="button" className="p-2.5 text-slate-400 hover:text-blue-500 transition-colors rounded-xl">
                <Paperclip size={16} />
              </button>
              
              <input 
                type="text"
                placeholder="Ask about your expenses, budgets, or savings..."
                className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-3 text-xs text-slate-700 placeholder-slate-400 font-semibold outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              
              <button 
                type="submit"
                disabled={!input.trim() || sending}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all flex-shrink-0 disabled:opacity-50"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </form>
            <p className="text-center text-[9px] text-slate-400 mt-2 font-medium">
              FINCE AI can make mistakes. Verify important financial events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
