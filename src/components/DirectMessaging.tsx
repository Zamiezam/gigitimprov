import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { api, supabase } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DirectMessagingProps {
  initialPartnerId?: string;
  initialPartnerName?: string;
}

export default function DirectMessaging({ initialPartnerId, initialPartnerName }: DirectMessagingProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<{ id: string; name: string; avatar?: string } | null>(
    initialPartnerId ? { id: initialPartnerId, name: initialPartnerName ?? 'Employer' } : null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations for demo
  const mockConvos = [
    { partner_id: 'mock-1', partner_name: 'Damai Bistro', partner_avatar: '', last_message: 'Are you available this Saturday?', last_message_time: new Date(Date.now() - 3600000).toISOString() },
    { partner_id: 'mock-2', partner_name: 'ICC KK Events', partner_avatar: '', last_message: 'Great work last time! We have another event.', last_message_time: new Date(Date.now() - 86400000).toISOString() },
  ];

  const mockMessages: Record<string, Message[]> = {
    'mock-1': [
      { id: '1', sender_id: 'mock-1', receiver_id: user?.id ?? '', content: 'Hi! Are you available this Saturday for a barista shift?', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: '2', sender_id: user?.id ?? '', receiver_id: 'mock-1', content: 'Yes, I am! What time does the shift start?', created_at: new Date(Date.now() - 5400000).toISOString() },
      { id: '3', sender_id: 'mock-1', receiver_id: user?.id ?? '', content: 'Great! 9 AM to 3 PM. Rate is RM12/hour.', created_at: new Date(Date.now() - 3600000).toISOString() },
    ],
    'mock-2': [
      { id: '4', sender_id: 'mock-2', receiver_id: user?.id ?? '', content: 'Great work last time! We have another event coming up.', created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
  };

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    if (activeConvo) loadMessages();
  }, [activeConvo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await api.getConversations(user!.id);
      setConversations(data.length > 0 ? data : mockConvos);
    } catch {
      setConversations(mockConvos);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeConvo || !user) return;
    try {
      const data = await api.getMessages(user.id, activeConvo.id);
      if (data.length > 0) {
        setMessages(data);
      } else {
        // Use mock data for demo
        setMessages(mockMessages[activeConvo.id] ?? []);
      }
    } catch {
      setMessages(mockMessages[activeConvo.id] ?? []);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!activeConvo || !user) return;
    const channel = supabase
      .channel(`messages:${user.id}:${activeConvo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === activeConvo.id || msg.receiver_id === activeConvo.id) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [activeConvo, user]);

  const handleSend = async () => {
    if (!input.trim() || !user || !activeConvo || sending) return;
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: activeConvo.id,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);
    await api.sendMessage(user.id, activeConvo.id, optimistic.content);
    setSending(false);
  };

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatConvoTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-220px)] min-h-[500px] flex rounded-2xl border border-outline-variant overflow-hidden bg-surface shadow-sm">
      
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-80 border-r border-outline-variant flex flex-col bg-surface-container-lowest shrink-0 ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-outline-variant">
          <h2 className="font-display font-bold text-base text-on-surface">Messages</h2>
          <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">Conversations with employers</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <MessageSquare size={36} className="text-on-surface-variant" />
            <p className="text-xs font-bold text-on-surface">No messages yet</p>
            <p className="text-[10px] text-on-surface-variant leading-normal">When employers message you about a gig, they'll appear here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30">
            {conversations.map(convo => (
              <button
                key={convo.partner_id}
                onClick={() => setActiveConvo({ id: convo.partner_id, name: convo.partner_name, avatar: convo.partner_avatar })}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-surface-container transition-colors cursor-pointer ${activeConvo?.id === convo.partner_id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  {convo.partner_avatar ? (
                    <img src={convo.partner_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={18} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-on-surface truncate">{convo.partner_name}</p>
                    <p className="text-[9px] text-on-surface-variant shrink-0 ml-2">{formatConvoTime(convo.last_message_time)}</p>
                  </div>
                  <p className="text-[10px] text-on-surface-variant truncate mt-0.5 font-medium">{convo.last_message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      {activeConvo ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-outline-variant flex items-center gap-3 bg-surface shrink-0">
            <button onClick={() => setActiveConvo(null)} className="md:hidden p-1 hover:bg-surface-container rounded-full cursor-pointer">
              <ArrowLeft size={18} className="text-on-surface-variant" />
            </button>
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{activeConvo.name}</p>
              <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
                Active
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
                        isMine
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-surface border border-outline-variant text-on-surface rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <p className="text-[9px] text-on-surface-variant px-1">{formatTime(msg.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-outline-variant bg-surface flex gap-2 items-end shrink-0">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary resize-none font-medium"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 bg-surface-container-lowest">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare size={28} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-on-surface">Select a conversation</p>
            <p className="text-xs text-on-surface-variant mt-1">Choose from the list on the left</p>
          </div>
        </div>
      )}
    </div>
  );
}
