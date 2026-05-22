import { useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { BRAND } from '../theme';

let _show = null;
export const toast = {
  success: (msg) => _show?.({ msg, type: 'success' }),
  error: (msg) => _show?.({ msg, type: 'error' }),
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  _show = useCallback(({ msg, type }) => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(({ id, msg, type }) => (
        <div key={id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 10, minWidth: 260, maxWidth: 380,
          background: type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: type === 'success' ? '#065F46' : '#991B1B',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.2s ease',
        }}>
          {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{msg}</span>
          <button onClick={() => setToasts(t => t.filter(x => x.id !== id))} style={{ color: 'inherit', opacity: 0.6 }}>
            <X size={14} />
          </button>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}
