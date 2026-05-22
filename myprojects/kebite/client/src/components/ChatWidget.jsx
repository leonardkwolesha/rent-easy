import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import KebiteLogo from './KebiteLogo';
import Icon from './Icon';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const FONT = "'Segoe UI', system-ui, sans-serif";

const QUICK_REPLIES = [
  'Track my order 🛵',
  'I have a problem with my order',
  'Find restaurants near me',
  "My promo code isn't working",
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const panelVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 16, transformOrigin: 'bottom right' },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 32 } },
  exit: { opacity: 0, scale: 0.88, y: 16, transition: { duration: 0.2, ease: 'easeIn' } },
};

const bubbleVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 480, damping: 26 } },
};

export default function ChatWidget() {
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: 'Karibu! How can I help you today? 🍽️', ts: Date.now() },
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [unread, setUnread]       = useState(0);
  const [lastUserMsg, setLastUserMsg] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const { user }  = useAuth();
  const location  = useLocation();

  const orderIdMatch = location.pathname.match(/\/orders\/([^/]+)\/track/);
  const orderId = orderIdMatch?.[1] ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setUnread(0);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLastUserMsg(trimmed);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
      const { data } = await api.post('/ai/chat', {
        message: trimmed,
        conversationHistory: history,
        userId: user?._id,
        orderId,
      });
      const reply = { role: 'assistant', content: data.reply, ts: Date.now() };
      setMessages((prev) => [...prev, reply]);
      if (!isOpen) setUnread((n) => n + 1);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Samahani — I\'m having trouble connecting right now. Please try again in a moment. 🙏';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errMsg, ts: Date.now(), isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isFirstMessage = messages.length === 1;

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 999 }}>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden" animate="visible" exit="exit"
            style={{ width: '340px', height: '480px', background: '#fff', borderRadius: '18px 18px 0 0', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', marginBottom: '8px', overflow: 'hidden', fontFamily: FONT }}
          >
            {/* Header */}
            <div style={{ background: GRADIENT, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <KebiteLogo variant="white" size="sm" />
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '38px' }}>
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }}
                  />
                  Online
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronDown />
              </motion.button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f8f8f8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    variants={bubbleVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? GRADIENT : m.isError ? '#fff5f5' : '#fff', color: m.role === 'user' ? '#fff' : m.isError ? '#e63946' : '#1a1a2e', fontSize: '0.88rem', lineHeight: 1.55, border: m.role === 'user' ? 'none' : m.isError ? '1px solid #fcc' : '1px solid #f0f0f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.content}
                      </div>
                      {m.isError && (
                        <button
                          type="button"
                          onClick={() => sendMessage(lastUserMsg)}
                          style={{ background: 'none', border: 'none', color: '#ff6b00', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '2px 0', fontFamily: FONT }}
                        >
                          Try again →
                        </button>
                      )}
                    </div>
                    <div style={{ textAlign: m.role === 'user' ? 'right' : 'left', fontSize: '10px', color: '#aaa', marginTop: '2px', paddingLeft: m.role === 'assistant' ? '4px' : 0, paddingRight: m.role === 'user' ? '4px' : 0 }}>
                      {formatTime(m.ts)}
                    </div>

                    {i === 0 && isFirstMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, staggerChildren: 0.06 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}
                      >
                        {QUICK_REPLIES.map((q, qi) => (
                          <motion.button
                            key={q}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + qi * 0.07 }}
                            whileHover={{ scale: 1.03, backgroundColor: '#fff5f5' }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => sendMessage(q)}
                            style={{ alignSelf: 'flex-start', background: '#fff', border: '1.5px solid #e63946', color: '#e63946', borderRadius: '999px', padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
                          >
                            {q}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                  >
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                          style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ccc', display: 'inline-block' }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: '8px', padding: '0.75rem', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0, alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={loading}
                style={{ flex: 1, padding: '9px 14px', borderRadius: '999px', border: '1.5px solid #e0e0e0', outline: 'none', fontSize: '0.88rem', fontFamily: FONT }}
              />
              <motion.button
                whileHover={!loading && input.trim() ? { scale: 1.1 } : {}}
                whileTap={!loading && input.trim() ? { scale: 0.9 } : {}}
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', background: loading || !input.trim() ? '#e0e0e0' : GRADIENT, border: 'none', cursor: loading || !input.trim() ? 'default' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="send" size={18} color="#fff" strokeWidth={2.2} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB trigger button */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Close chat' : 'Open Kebite Assistant'}
        animate={!isOpen ? { boxShadow: ['0 6px 24px rgba(230,57,70,0.35)', '0 8px 32px rgba(230,57,70,0.55)', '0 6px 24px rgba(230,57,70,0.35)'] } : {}}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ width: '52px', height: '52px', borderRadius: '50%', background: GRADIENT, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(230,57,70,0.35)', fontSize: '22px', marginLeft: 'auto', position: 'relative', willChange: 'transform' }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: 'inline-flex' }}>
              <Icon name="x" size={22} color="#fff" strokeWidth={2.4} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: 'inline-flex' }}>
              <Icon name="chat" size={22} color="#fff" strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {!isOpen && unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              style={{ position: 'absolute', top: '-3px', right: '-3px', background: '#e63946', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '50%', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
