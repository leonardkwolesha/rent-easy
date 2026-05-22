import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PageWrapper from '../components/PageWrapper';
import { stagger, fadeUp, slideInLeft, scaleIn } from '../animations/variants';
import LanguageToggle from '../components/LanguageToggle';
import Icon from '../components/Icon';

const GRADIENT = 'linear-gradient(135deg, #ff6b00, #e63946)';
const CARD = { background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' };
const FONT = "'Segoe UI', system-ui, sans-serif";
const DARK = '#1a1a2e';

function getInitials(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function memberSince(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-TZ', { month: 'short', year: 'numeric' });
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      style={{ width: 44, height: 24, borderRadius: 999, background: value ? GRADIENT : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 38 }}
        style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
      />
    </div>
  );
}

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const IconCamera = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconGallery = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconFlipCamera = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

function CameraModal({ onCapture, onClose, onFallback }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [ready,  setReady]  = useState(false);
  const [facing, setFacing] = useState('user');
  const [error,  setError]  = useState('');

  useEffect(() => {
    let active = true;

    async function startStream() {
      try {
        streamRef.current?.getTracks().forEach(t => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        if (!active) return;
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
          setTimeout(() => { onFallback?.(); onClose(); }, 1500);
        } else {
          onFallback?.(); onClose();
        }
      }
    }

    startStream();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [facing]);

  function capture() {
    const v = videoRef.current;
    if (!v || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width  = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    streamRef.current?.getTracks().forEach(t => t.stop());
    canvas.toBlob(blob => { if (blob) onCapture(blob); }, 'image/jpeg', 0.92);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Viewfinder */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={() => setReady(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}>
          <button
            onClick={onClose}
            aria-label="Close camera"
            style={{ background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.02em' }}>Take Photo</span>
          <div style={{ width: '40px' }} />
        </div>

        {/* Error overlay */}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'rgba(0,0,0,0.75)' }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📵</div>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{error}</div>
              <button onClick={onClose} style={{ marginTop: '1.25rem', background: GRADIENT, border: 'none', color: '#fff', borderRadius: '999px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Close</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ background: '#111', padding: '1.5rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Spacer */}
        <div style={{ width: '52px' }} />

        {/* Shutter */}
        <button
          onClick={capture}
          disabled={!ready}
          aria-label="Capture photo"
          style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'transparent', border: '4px solid rgba(255,255,255,0.7)', cursor: ready ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', flexShrink: 0 }}
        >
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: ready ? '#fff' : '#555', transition: 'background 0.2s' }} />
        </button>

        {/* Flip camera */}
        <button
          onClick={() => { setReady(false); setFacing(f => f === 'user' ? 'environment' : 'user'); }}
          aria-label="Flip camera"
          style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconFlipCamera />
        </button>
      </div>
    </div>
  );
}

const sheetVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 34 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

function Sheet({ onClose, title, children }) {
  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        variants={sheetVariants}
        initial="hidden" animate="visible" exit="exit"
        style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '1.75rem', width: '100%', maxWidth: '480px', fontFamily: FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a1a2e' }}>{title}</div>
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.88 }}
            style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function AnimatedWalletBalance({ target }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, (v) => 'TSh ' + Math.round(v).toLocaleString());

  useEffect(() => { mv.set(target); }, [target, mv]);

  return <motion.span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ff6b00' }}>{display}</motion.span>;
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);

  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [orderCount, setOrderCount]           = useState(0);
  const [editing, setEditing]                 = useState(null);
  const [editValue, setEditValue]             = useState('');
  const [editLoading, setEditLoading]         = useState(false);
  const [editError, setEditError]             = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showTopUp, setShowTopUp]             = useState(false);

  const [avatarLoading, setAvatarLoading]     = useState(false);
  const [avatarError, setAvatarError]         = useState('');
  const [showCamera, setShowCamera]           = useState(false);

  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [currentPw, setCurrentPw]                 = useState('');
  const [newPw, setNewPw]                         = useState('');
  const [confirmPw, setConfirmPw]                 = useState('');
  const [pwLoading, setPwLoading]                 = useState(false);
  const [pwError, setPwError]                     = useState('');
  const [pwSuccess, setPwSuccess]                 = useState(false);
  const [showCurrentPw, setShowCurrentPw]         = useState(false);
  const [showNewPw, setShowNewPw]                 = useState(false);
  const [showConfirmPw, setShowConfirmPw]         = useState(false);
  const [topUpPhone, setTopUpPhone]           = useState('');
  const [topUpAmount, setTopUpAmount]         = useState('');
  const [topUpLoading, setTopUpLoading]       = useState(false);
  const [topUpSuccess, setTopUpSuccess]       = useState(false);
  const [topUpReceipt, setTopUpReceipt]       = useState(null);
  const [topUpError, setTopUpError]           = useState('');
  const [prefs, setPrefs]                     = useState({
    smsNotifications: true,
    emailPromos: false,
    whatsappUpdates: true,
  });

  useEffect(() => {
    api.get('/orders/my')
      .then((res) => setOrderCount(res.data.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: '/profile' }, replace: true });
  }, [user]);

  if (!user) return null;

  function startEdit(field) {
    setEditing(field);
    setEditValue(user[field] ?? '');
    setEditError('');
  }

  async function saveEdit() {
    if (!editValue.trim()) { setEditError('This field cannot be empty.'); return; }
    setEditLoading(true);
    setEditError('');
    try {
      await api.patch('/users/profile', { [editing]: editValue.trim() });
      setEditing(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleTopUp(e) {
    e.preventDefault();
    if (!topUpPhone || !topUpAmount) return;
    setTopUpLoading(true);
    setTopUpError('');
    try {
      const phoneFormatted = '+255' + topUpPhone.replace(/^0/, '');
      const amountNum = parseInt(topUpAmount);
      const { data } = await api.post('/payments/wallet/topup', {
        phone: phoneFormatted,
        amount: amountNum,
      });
      setTopUpReceipt({
        amount: amountNum,
        phone: phoneFormatted,
        reference: data?.payment?.reference || '—',
        balance: data?.walletBalance ?? null,
        timestamp: new Date(),
        instant: !!data?.walletBalance,
      });
      setTopUpSuccess(true);
      await refreshUser();
    } catch (err) {
      setTopUpError(err.response?.data?.message || 'Top-up failed. Please try again.');
    } finally {
      setTopUpLoading(false);
    }
  }

  function closeTopUp() {
    setShowTopUp(false);
    setTopUpSuccess(false);
    setTopUpReceipt(null);
    setTopUpPhone('');
    setTopUpAmount('');
    setTopUpError('');
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be under 5 MB.'); return; }
    setAvatarError('');
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  }

  async function handleCameraCapture(blob) {
    setShowCamera(false);
    setAvatarError('');
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', blob, 'photo.jpg');
    try {
      await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    if (!currentPw) { setPwError('Enter your current password.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setTimeout(() => {
        setShowPasswordSheet(false);
        setPwSuccess(false);
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      }, 2000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not update password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  }

  const INFO_FIELDS = [
    { key: 'name',  label: 'Name',  value: user.name  ?? '—' },
    { key: 'email', label: 'Email', value: user.email ?? '—' },
    { key: 'phone', label: 'Phone', value: user.phone ?? '—' },
  ];

  const PREF_ROWS = [
    { key: 'smsNotifications', title: 'SMS Notifications', sub: 'Order updates via SMS' },
    { key: 'emailPromos',      title: 'Email Promotions',  sub: 'Deals, offers, and new restaurants' },
    { key: 'whatsappUpdates',  title: 'WhatsApp Updates',  sub: 'Order status via WhatsApp' },
  ];

  const LINK_ROWS = [
    { icon: 'receipt', label: 'My Orders',      sub: null,          action: () => navigate('/orders') },
    { icon: 'ticket',  label: 'My Promo Codes', sub: 'Coming soon', action: null },
    { icon: 'chat',    label: 'Help & Support', sub: null,          action: () => window.open('https://wa.me/255700000000') },
  ];

  return (
    <>
      {/* CameraModal is outside PageWrapper so it truly covers the full screen */}
      <AnimatePresence>
        {showCamera && (
          <motion.div key="camera-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <CameraModal
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
              onFallback={() => cameraInputRef.current?.click()}
            />
          </motion.div>
        )}
      </AnimatePresence>

    <PageWrapper>
      <div style={{ minHeight: '100vh', background: '#f8f8f8', fontFamily: FONT, paddingBottom: '96px', color: '#1a1a2e' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Modals */}
        <AnimatePresence>
          {showLogoutModal && (
            <Sheet title="" onClose={() => setShowLogoutModal(false)}>
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ textAlign: 'center', paddingBottom: '0.5rem' }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.15 }}
                  style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: 16, background: GRADIENT, color: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}
                ><Icon name="wave" size={30} color="#fff" strokeWidth={2.2} /></motion.div>
                <div style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sign out?</div>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>You'll need to sign back in to order.</div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setShowLogoutModal(false)}
                    style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{ flex: 1, background: '#fff0f0', color: '#e63946', border: '1.5px solid #fcc', borderRadius: '999px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
                  >
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            </Sheet>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTopUp && (
            <Sheet title="Top Up Wallet" onClose={closeTopUp}>
              <AnimatePresence mode="wait">
                {topUpSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  >
                    <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.1 }}
                        style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}
                      ><Icon name="check" size={36} color="#fff" strokeWidth={3} /></motion.div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a7a45' }}>
                        {topUpReceipt?.instant ? 'Wallet credited!' : 'Payment request sent!'}
                      </div>
                      <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                        {topUpReceipt?.instant
                          ? 'TSh ' + topUpReceipt.amount.toLocaleString() + ' has been added to your wallet.'
                          : 'Check ' + (topUpReceipt?.phone || 'your phone') + ' for the M-Pesa prompt — you’ll receive an SMS confirmation once paid.'}
                      </div>
                    </div>

                    {topUpReceipt && (
                      <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '1rem', fontFamily: FONT, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e8e8e8' }}>
                          <span style={{ color: '#888' }}>Amount</span>
                          <span style={{ fontWeight: 700, color: DARK }}>TSh {topUpReceipt.amount.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e8e8e8' }}>
                          <span style={{ color: '#888' }}>Phone</span>
                          <span style={{ fontWeight: 600, color: DARK }}>{topUpReceipt.phone}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e8e8e8' }}>
                          <span style={{ color: '#888' }}>Reference</span>
                          <span style={{ fontWeight: 600, color: DARK, fontFamily: 'monospace', fontSize: '0.8rem' }}>{topUpReceipt.reference}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: topUpReceipt.balance != null ? '1px dashed #e8e8e8' : 'none' }}>
                          <span style={{ color: '#888' }}>Time</span>
                          <span style={{ fontWeight: 600, color: DARK }}>{topUpReceipt.timestamp.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {topUpReceipt.balance != null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0.2rem', marginTop: '0.2rem' }}>
                            <span style={{ color: '#888', fontWeight: 600 }}>New balance</span>
                            <span style={{ fontWeight: 800, color: '#1a7a45' }}>TSh {topUpReceipt.balance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={closeTopUp}
                      style={{ width: '100%', marginTop: '1rem', background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: FONT }}>
                      Done
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleTopUp}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '6px', fontWeight: 600 }}>M-Pesa Phone Number</label>
                      <div style={{ display: 'flex', border: '1.5px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
                        <span style={{ padding: '0.7rem 0.75rem', background: '#f8f8f8', color: '#555', fontSize: '0.9rem', borderRight: '1px solid #e0e0e0', fontWeight: 600, flexShrink: 0 }}>+255</span>
                        <input
                          value={topUpPhone}
                          onChange={(e) => setTopUpPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="7XX XXX XXX"
                          maxLength={9}
                          style={{ flex: 1, border: 'none', outline: 'none', padding: '0.7rem 0.75rem', fontSize: '0.9rem', fontFamily: FONT, minWidth: 0 }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '6px', fontWeight: 600 }}>Amount (TSh)</label>
                      <input
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 5000"
                        style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: '12px', padding: '0.7rem 0.75rem', fontSize: '0.9rem', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
                      />
                    </div>
                    <AnimatePresence>
                      {topUpError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ color: '#e63946', fontSize: '0.82rem', marginBottom: '0.75rem', overflow: 'hidden' }}
                        >{topUpError}</motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button
                      type="submit"
                      disabled={topUpLoading || !topUpPhone || !topUpAmount}
                      whileHover={!topUpLoading && topUpPhone && topUpAmount ? { scale: 1.02 } : {}}
                      whileTap={!topUpLoading && topUpPhone && topUpAmount ? { scale: 0.97 } : {}}
                      style={{ width: '100%', background: topUpLoading || !topUpPhone || !topUpAmount ? '#e0e0e0' : GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: topUpLoading || !topUpPhone || !topUpAmount ? 'default' : 'pointer', fontFamily: FONT }}
                    >
                      {topUpLoading ? 'Sending request…' : 'Top Up Now'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </Sheet>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAvatarOptions && (
            <Sheet title="Profile Photo" onClose={() => setShowAvatarOptions(false)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem' }}>

                {/* Take Photo — click() must be called synchronously inside the handler */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowAvatarOptions(false); setShowCamera(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '16px', padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: FONT, width: '100%', textAlign: 'left' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff6b0022, #e6394622)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff6b00' }}>
                    <IconCamera />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>Take Photo</div>
                    <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '2px' }}>Open camera and snap a selfie</div>
                  </div>
                </motion.button>

                {/* Choose from Gallery */}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { fileInputRef.current?.click(); setShowAvatarOptions(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '16px', padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: FONT, width: '100%', textAlign: 'left' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#4361ee' }}>
                    <IconGallery />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>Choose from Gallery</div>
                    <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '2px' }}>Pick an existing photo from your device</div>
                  </div>
                </motion.button>

                {/* Remove Photo — only shown when avatar exists */}
                {user.avatar && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      setShowAvatarOptions(false);
                      setAvatarLoading(true);
                      try {
                        await api.delete('/users/me/avatar');
                        await refreshUser();
                      } catch (err) {
                        setAvatarError(err.response?.data?.message || 'Could not remove photo.');
                      } finally { setAvatarLoading(false); }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff5f5', border: '1.5px solid #fcc', borderRadius: '16px', padding: '1rem 1.25rem', cursor: 'pointer', fontFamily: FONT, width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#e63946' }}>
                      <IconTrash />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e63946' }}>Remove Photo</div>
                      <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '2px' }}>Revert to initials avatar</div>
                    </div>
                  </motion.button>
                )}
              </div>
            </Sheet>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPasswordSheet && (
            <Sheet title="Change Password" onClose={() => { setShowPasswordSheet(false); setPwError(''); setPwSuccess(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>
              <AnimatePresence mode="wait">
                {pwSuccess ? (
                  <motion.div
                    key="pw-success"
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    style={{ textAlign: 'center', padding: '1.5rem 0' }}
                  >
                    <div style={{ display: 'inline-flex', width: 60, height: 60, borderRadius: 16, background: GRADIENT, color: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <Icon name="lock" size={32} color="#fff" strokeWidth={2.2} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a7a45' }}>Password updated!</div>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>Your new password is active.</div>
                  </motion.div>
                ) : (
                  <motion.form key="pw-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleChangePassword}>
                    {[
                      { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                      { label: 'New Password',     val: newPw,     set: setNewPw,     show: showNewPw,     toggle: () => setShowNewPw(v => !v) },
                      { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showConfirmPw, toggle: () => setShowConfirmPw(v => !v) },
                    ].map(({ label, val, set, show, toggle }) => (
                      <div key={label} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '6px', fontWeight: 600 }}>{label}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={show ? 'text' : 'password'}
                            value={val}
                            onChange={e => set(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: '12px', padding: '0.7rem 2.5rem 0.7rem 0.85rem', fontSize: '0.9rem', outline: 'none', fontFamily: FONT, boxSizing: 'border-box' }}
                          />
                          <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={toggle}
                            style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0, display: 'flex', alignItems: 'center' }}>
                            {show ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    <AnimatePresence>
                      {pwError && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ color: '#e63946', fontSize: '0.82rem', marginBottom: '0.75rem', overflow: 'hidden', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                          {pwError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button
                      type="submit"
                      disabled={pwLoading}
                      whileHover={!pwLoading ? { scale: 1.02 } : {}}
                      whileTap={!pwLoading ? { scale: 0.97 } : {}}
                      style={{ width: '100%', background: pwLoading ? '#e0e0e0' : GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.8rem', fontWeight: 700, fontSize: '0.95rem', cursor: pwLoading ? 'default' : 'pointer', fontFamily: FONT }}
                    >
                      {pwLoading ? 'Saving…' : 'Change Password'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </Sheet>
          )}
        </AnimatePresence>

        {/* Header */}
        <div style={{ background: GRADIENT, padding: '2rem 1.5rem 3rem', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', width: '200px', height: '200px', top: '-60px', right: '-60px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', pointerEvents: 'none' }} />
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div style={{ position: 'relative', width: '88px', margin: '0 auto 1rem' }}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 480, damping: 28, delay: 0.1 }}
                onClick={() => !avatarLoading && setShowAvatarOptions(true)}
                style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#fff', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  avatarLoading ? (
                    <div style={{ width: '22px', height: '22px', border: '3px solid rgba(255,255,255,0.4)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  ) : getInitials(user.name)
                )}
                {/* camera overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', color: '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  {avatarLoading
                    ? <div style={{ width: '20px', height: '20px', border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <IconCamera />}
                </div>
              </motion.div>
              <input ref={fileInputRef}   type="file" accept="image/*"               onChange={handleAvatarChange} style={{ display: 'none' }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleAvatarChange} style={{ display: 'none' }} />
              {avatarError && (
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.7rem', color: '#ffd0d0', marginTop: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '2px 8px' }}>{avatarError}</div>
              )}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '0.25rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', marginBottom: '0.75rem' }}>{user.email}</div>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 26 }}
              style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '999px', padding: '0.3rem 1rem', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.35)' }}
            >
              Kebite Member 🇹🇿
            </motion.span>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          variants={stagger} initial="hidden" animate="visible"
          style={{ display: 'flex', gap: '0.75rem', margin: '-1.25rem 1rem 0', position: 'relative', zIndex: 1 }}
        >
          {[
            { value: String(orderCount),                                  label: 'Orders',       size: '1.5rem' },
            { value: user.walletBalance ?? 0,                             label: 'Wallet',       size: '1rem', isWallet: true },
            { value: memberSince(user.createdAt),                         label: 'Member Since', size: '0.95rem' },
          ].map(({ value, label, size, isWallet }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '1rem 0.75rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              {isWallet ? (
                <AnimatedWalletBalance target={value} />
              ) : (
                <div style={{ fontSize: size, fontWeight: 900, color: '#ff6b00', lineHeight: 1.2 }}>{value}</div>
              )}
              <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Wallet card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.2 }}
          style={{ ...CARD, margin: '1rem', padding: '1.25rem 1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>My Wallet</div>
              <AnimatedWalletBalance target={user.walletBalance ?? 0} />
            </div>
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={() => setShowTopUp(true)}
              style={{ background: GRADIENT, color: '#fff', border: 'none', borderRadius: '999px', padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: FONT }}
            >
              Top Up +
            </motion.button>
          </div>
        </motion.div>

        {/* Personal info card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.28 }}
          style={{ ...CARD, margin: '0 1rem', padding: '1.25rem 1.5rem' }}
        >
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>Personal Info</div>

          {INFO_FIELDS.map(({ key, label, value }) => (
            <div key={key}>
              <AnimatePresence mode="wait">
                {editing === key ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '6px' }}>{label}</div>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null); }}
                      style={{ width: '100%', borderRadius: '12px', border: '1.5px solid #ff6b00', padding: '0.6rem 1rem', fontSize: '0.95rem', outline: 'none', marginBottom: '8px', fontFamily: FONT, boxSizing: 'border-box' }}
                    />
                    <AnimatePresence>
                      {editError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          style={{ color: '#e63946', fontSize: '0.78rem', marginBottom: '8px', overflow: 'hidden' }}
                        >{editError}</motion.div>
                      )}
                    </AnimatePresence>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditing(null)} style={{ flex: 1, padding: '0.5rem', borderRadius: '999px', border: '1.5px solid #ddd', color: '#888', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: FONT }}>Cancel</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={saveEdit} disabled={editLoading} style={{ flex: 1, padding: '0.5rem', borderRadius: '999px', border: 'none', color: '#fff', background: editLoading ? '#e0e0e0' : GRADIENT, cursor: editLoading ? 'default' : 'pointer', fontWeight: 700, fontFamily: FONT }}>
                        {editLoading ? 'Saving…' : 'Save'}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1a1a2e' }}>{value}</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.15, color: '#ff6b00' }} whileTap={{ scale: 0.88 }}
                      onClick={() => startEdit(key)}
                      aria-label={`Edit ${label}`}
                      style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '4px', borderRadius: '8px' }}
                    >
                      <PencilIcon />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Password row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '2px' }}>Password</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#1a1a2e', letterSpacing: '0.15em' }}>●●●●●●●●</div>
            </div>
            <motion.button
              whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setPwError(''); setShowPasswordSheet(true); }}
              style={{ background: 'none', border: 'none', color: '#ff6b00', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              Change →
            </motion.button>
          </div>
        </motion.div>

        {/* Language card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.32 }}
          style={{ ...CARD, margin: '1rem', padding: '0.5rem 1.5rem' }}
        >
          <LanguageToggle />
        </motion.div>

        {/* Preferences card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.34 }}
          style={{ ...CARD, margin: '1rem', padding: '1.25rem 1.5rem' }}
        >
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>Notifications</div>
          {PREF_ROWS.map(({ key, title, sub }, i) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < PREF_ROWS.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1a1a2e' }}>{title}</div>
                <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '2px' }}>{sub}</div>
              </div>
              <Toggle
                value={prefs[key]}
                onChange={(v) => {
                  setPrefs((p) => ({ ...p, [key]: v }));
                  api.patch('/users/preferences', { [key]: v }).catch(() => {});
                }}
              />
            </div>
          ))}
        </motion.div>

        {/* Quick links card */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.4 }}
          style={{ ...CARD, margin: '0 1rem', padding: '0.5rem 1.5rem' }}
        >
          {LINK_ROWS.map(({ icon, label, sub, action }, i) => (
            <motion.div
              key={label}
              onClick={action ?? undefined}
              whileHover={action ? { x: 4, backgroundColor: '#fafafa' } : {}}
              whileTap={action ? { scale: 0.98 } : {}}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: i < LINK_ROWS.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: action ? 'pointer' : 'default', opacity: action ? 1 : 0.55, borderRadius: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 10, background: '#fff7f0', color: '#ff6b00', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} size={18} color="#ff6b00" strokeWidth={2} />
                </span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a2e' }}>{label}</div>
                  {sub && <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '1px' }}>{sub}</div>}
                </div>
              </div>
              <span style={{ color: '#ccc' }}><ChevronRight /></span>
            </motion.div>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.button
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.46 }}
          whileHover={{ scale: 1.02, backgroundColor: '#ffe8ea' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLogoutModal(true)}
          style={{ width: 'calc(100% - 2rem)', margin: '1rem', display: 'block', padding: '0.9rem', background: '#fff5f5', color: '#e63946', border: '1.5px solid #fcc', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: FONT }}
        >
          Sign Out
        </motion.button>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#ccc', marginTop: '-0.25rem', paddingBottom: '1rem' }}>
          Kebite v1.0 · Tanzania 🇹🇿
        </div>
      </div>
    </PageWrapper>
    </>
  );
}
