import { useState, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

const ToastCtx = createContext(null);

const TYPES = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: 'check',   color: '#166534' },
  error:   { bg: '#fff5f5', border: '#fca5a5', icon: 'x',       color: '#991b1b' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'info',    color: '#1e40af' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: 'warning', color: '#92400e' },
};

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        style={{ position: 'fixed', bottom: '88px', left: '50%', transform: 'translateX(-50%)', zIndex: 9000, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px', width: 'calc(100% - 2rem)', pointerEvents: 'none' }}
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const s = TYPES[t.type] ?? TYPES.info;
            return (
              <motion.div
                key={t.id}
                role="alert"
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.88, transition: { duration: 0.18, ease: 'easeIn' } }}
                transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                onClick={() => dismiss(t.id)}
                style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '14px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', pointerEvents: 'auto', cursor: 'pointer', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
              >
                <Icon name={s.icon} size={20} color={s.color} strokeWidth={2.2} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: s.color, lineHeight: 1.45, flex: 1 }}>{t.message}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                  aria-label="Dismiss notification"
                  style={{ background: 'none', border: 'none', color: s.color, opacity: 0.5, cursor: 'pointer', fontSize: '1rem', padding: 0, flexShrink: 0 }}
                >✕</button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
